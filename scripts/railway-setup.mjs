#!/usr/bin/env node
/**
 * Railway API setup: create project (or use existing), add API + Frontend services from GitHub,
 * set variables, generate domains, trigger first deploy.
 *
 * Prerequisites:
 * - Create a Railway account and add Postgres + Redis in the dashboard (or in the project first).
 * - Create an API token at https://railway.app/account/tokens (Account or Workspace token).
 * - GitHub repo(s) must be connected to Railway (link in Railway dashboard or deploy once from UI).
 *
 * Usage:
 *   RAILWAY_TOKEN=xxx node scripts/railway-setup.mjs [options]
 *
 * Options (env vars):
 *   RAILWAY_TOKEN          (required) Railway API token
 *   RAILWAY_PROJECT_ID     (optional) Existing project ID; if unset, a new project is created
 *   RAILWAY_WORKSPACE_ID   (optional) Workspace to create project in (for new project)
 *   GITHUB_OWNER           (required) GitHub org or user, e.g. "myorg"
 *   GITHUB_REPO_API        (required) API repo name or "owner/repo", e.g. "mes-adresses-api"
 *   GITHUB_REPO_FRONTEND   (required) Frontend repo name or "owner/repo", e.g. "mes-adresses"
 *   GITHUB_BRANCH          (optional) Branch to deploy, default "main"
 *   API_ROOT_DIR           (optional) Monorepo subdir for API, e.g. "mes-adresses-api"
 *   FRONTEND_ROOT_DIR      (optional) Monorepo subdir for frontend, e.g. "mes-adresses"
 *   DRY_RUN                (optional) If set, only print planned actions (no mutations)
 */

const RAILWAY_GRAPHQL = 'https://backboard.railway.app/graphql/v2';

function env(name, required = false) {
  const v = process.env[name];
  if (required && (v === undefined || v === '')) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return v;
}

async function gql(token, query, variables = {}) {
  const res = await fetch(RAILWAY_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Railway API ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`GraphQL: ${json.errors.map((e) => e.message).join('; ')}`);
  }
  return json.data;
}

function parseRepo(repo, owner) {
  if (repo.includes('/')) {
    const [o, r] = repo.split('/');
    return { owner: o, repo: r };
  }
  return { owner: owner || env('GITHUB_OWNER', true), repo };
}

async function main() {
  const token = env('RAILWAY_TOKEN', true);
  const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
  const projectId = env('RAILWAY_PROJECT_ID');
  const workspaceId = env('RAILWAY_WORKSPACE_ID');
  const githubOwner = env('GITHUB_OWNER', true);
  const repoApi = parseRepo(env('GITHUB_REPO_API', true), githubOwner);
  const repoFrontend = parseRepo(env('GITHUB_REPO_FRONTEND', true), githubOwner);
  const branch = env('GITHUB_BRANCH') || 'main';
  const apiRootDir = env('API_ROOT_DIR');
  const frontendRootDir = env('FRONTEND_ROOT_DIR');

  let projectIdentifier = projectId;
  let environmentId;

  if (dryRun) {
    console.log('DRY RUN: would execute the following.');
    console.log('Project:', projectId || '(create new)');
    console.log('API repo:', `${repoApi.owner}/${repoApi.repo}`, apiRootDir ? ` root: ${apiRootDir}` : '');
    console.log('Frontend repo:', `${repoFrontend.owner}/${repoFrontend.repo}`, frontendRootDir ? ` root: ${frontendRootDir}` : '');
    console.log('Branch:', branch);
    return;
  }

  if (!projectId) {
    console.log('Creating new project...');
    const data = await gql(token, `
      mutation projectCreate($input: ProjectCreateInput!) {
        projectCreate(input: $input) {
          id
          name
        }
      }
    `, {
      input: {
        name: 'nap-us',
        workspaceId: workspaceId || null,
      },
    });
    projectIdentifier = data.projectCreate.id;
    console.log('Created project:', data.projectCreate.name, projectIdentifier);
  }

  // Get default environment
  const proj = await gql(token, `
    query project($id: String!) {
      project(id: $id) {
        id
        name
        environments {
          edges { node { id, name } }
        }
      }
    }
  `, { id: projectIdentifier });
  const project = proj.project;
  if (!project) throw new Error('Project not found');
  const envs = project.environments?.edges?.map((e) => e.node) || [];
  environmentId = envs[0]?.id;
  if (!environmentId) throw new Error('No environment found; create one in the dashboard.');

  // Create API service from GitHub (source: type GITHUB, github: { repo, branch, rootDirectory })
  const apiRepoFull = `${repoApi.owner}/${repoApi.repo}`;
  console.log('Creating API service from GitHub...', apiRepoFull);
  const apiSvc = await gql(token, `
    mutation serviceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }
  `, {
    input: {
      projectId: project.id,
      environmentId,
      name: 'api',
      source: {
        type: 'GITHUB',
        github: {
          repo: apiRepoFull,
          branch,
          rootDirectory: apiRootDir || '/',
        },
      },
    },
  });
  const apiServiceId = apiSvc.serviceCreate?.id;
  if (!apiServiceId) throw new Error('Failed to create API service. Ensure the repo is connected to Railway (install Railway GitHub app / deploy once from UI).');
  console.log('API service:', apiSvc.serviceCreate.name, apiServiceId);

  // Create Frontend service from GitHub
  const frontendRepoFull = `${repoFrontend.owner}/${repoFrontend.repo}`;
  console.log('Creating Frontend service from GitHub...', frontendRepoFull);
  const feSvc = await gql(token, `
    mutation serviceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }
  `, {
    input: {
      projectId: project.id,
      environmentId,
      name: 'frontend',
      source: {
        type: 'GITHUB',
        github: {
          repo: frontendRepoFull,
          branch,
          rootDirectory: frontendRootDir || '/',
        },
      },
    },
  });
  const frontendServiceId = feSvc.serviceCreate?.id;
  if (!frontendServiceId) throw new Error('Failed to create Frontend service.');
  console.log('Frontend service:', feSvc.serviceCreate.name, frontendServiceId);

  // Get service instance IDs (needed for variables and domains)
  const instances = await gql(token, `
    query project($id: String!) {
      project(id: $id) {
        services {
          edges {
            node {
              id
              name
              serviceInstances {
                edges { node { id, environmentId } }
              }
            }
          }
        }
      }
    }
  `, { id: project.id });
  let apiInstanceId;
  let frontendInstanceId;
  for (const edge of instances.project.services.edges) {
    const node = edge.node;
    const inst = node.serviceInstances?.edges?.find((e) => e.node.environmentId === environmentId)?.node;
    if (node.name === 'api') apiInstanceId = inst?.id;
    if (node.name === 'frontend') frontendInstanceId = inst?.id;
  }
  if (!apiInstanceId || !frontendInstanceId) {
    console.warn('Service instances may not be ready yet. Generate domains and set variables in the dashboard.');
    console.log('API service ID:', apiServiceId);
    console.log('Frontend service ID:', frontendServiceId);
    return;
  }

  // Generate Railway domains for both services
  console.log('Generating public domains...');
  const apiDomain = await gql(token, `
    mutation domainCreate($input: ServiceDomainCreateInput!) {
      serviceDomainCreate(input: $input) {
        id
        domain
      }
    }
  `, {
    input: { serviceId: apiServiceId, environmentId },
  });
  const frontendDomain = await gql(token, `
    mutation domainCreate($input: ServiceDomainCreateInput!) {
      serviceDomainCreate(input: $input) {
        id
        domain
      }
    }
  `, {
    input: { serviceId: frontendServiceId, environmentId },
  });
  const apiUrl = apiDomain.serviceDomainCreate?.domain ? `https://${apiDomain.serviceDomainCreate.domain}` : null;
  const frontendUrl = frontendDomain.serviceDomainCreate?.domain ? `https://${frontendDomain.serviceDomainCreate.domain}` : null;
  console.log('API URL:', apiUrl);
  console.log('Frontend URL:', frontendUrl);

  // Set API variables (reference Postgres/Redis by service name; user must have added them in dashboard)
  const apiVars = {
    POSTGRES_URL: '${{Postgres.DATABASE_URL}}',
    REDIS_URL: '${{Redis.REDIS_URL}}',
    API_URL: apiUrl || 'https://api-placeholder.railway.app',
    EDITOR_URL_PATTERN: frontendUrl ? `${frontendUrl}/bal/<id>/<token>` : 'https://frontend-placeholder.railway.app/bal/<id>/<token>',
  };
  await gql(token, `
    mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
  `, {
    input: {
      projectId: project.id,
      environmentId,
      serviceId: apiServiceId,
      variables: apiVars,
    },
  });
  console.log('Set API variables.');

  // Set Frontend variables
  const frontendVars = {
    NEXT_PUBLIC_EDITEUR_URL: frontendUrl || 'https://frontend-placeholder.railway.app',
    NEXT_PUBLIC_BAL_API_URL: apiUrl ? `${apiUrl}/v2` : 'https://api-placeholder.railway.app/v2',
  };
  await gql(token, `
    mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
  `, {
    input: {
      projectId: project.id,
      environmentId,
      serviceId: frontendServiceId,
      variables: frontendVars,
    },
  });
  console.log('Set Frontend variables.');

  // Trigger first deploy
  console.log('Triggering API deploy...');
  await gql(token, `
    mutation deploymentTrigger($input: DeploymentTriggerInput!) {
      deploymentTrigger(input: $input) {
        id
      }
    }
  `, {
    input: { serviceId: apiServiceId, environmentId },
  });
  console.log('Triggering Frontend deploy...');
  await gql(token, `
    mutation deploymentTrigger($input: DeploymentTriggerInput!) {
      deploymentTrigger(input: $input) {
        id
      }
    }
  `, {
    input: { serviceId: frontendServiceId, environmentId },
  });

  console.log('');
  console.log('Done. Next steps:');
  console.log('1. In Railway dashboard, ensure Postgres and Redis services exist and are named "Postgres" and "Redis" (or update variable references in the API service).');
  console.log('2. Run migrations once: railway link (to this project) then railway run --service api yarn typeorm:migration:run');
  if (apiUrl) console.log('3. API:', apiUrl);
  if (frontendUrl) console.log('4. Frontend:', frontendUrl);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
