#!/usr/bin/env node
/**
 * Set production Resend variables for the linked mes-adresses-api Railway service
 * and optionally trigger a deploy.
 *
 * Usage from the repo root:
 *   export RAILWAY_TOKEN=...
 *   export RESEND_API_KEY=...
 *   export RESEND_FROM=noreply@example.com
 *   export SMTP_BCC=audit@example.com
 *   node scripts/railway-configure-email.mjs
 *
 * Optional env vars:
 *   DRY_RUN=1                  Print the target service and variables without mutating Railway
 *   TRIGGER_DEPLOY=0           Update variables without triggering a deploy
 *   RAILWAY_PROJECT_ID=...     Override the linked Railway project
 *   RAILWAY_ENVIRONMENT_ID=... Override the linked Railway environment
 *   RAILWAY_SERVICE_ID=...     Override the linked Railway service
 *   RAILWAY_LINK_PATH=...      Override which local path to resolve in ~/.railway/config.json
 */

import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

const RAILWAY_GRAPHQL = 'https://backboard.railway.app/graphql/v2';

function getEnv(name) {
  const value = process.env[name];
  return value?.trim() || undefined;
}

function requireEnv(name, value = getEnv(name)) {
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }

  return value;
}

function isTruthy(value) {
  return ['1', 'true', 'yes', 'on'].includes((value || '').toLowerCase());
}

function readRailwayConfig() {
  const configPath = path.join(homedir(), '.railway', 'config.json');
  if (!existsSync(configPath)) {
    return null;
  }

  return JSON.parse(readFileSync(configPath, 'utf8'));
}

function resolveLinkedService(config) {
  if (!config?.projects) {
    return null;
  }

  const candidatePaths = [
    getEnv('RAILWAY_LINK_PATH'),
    path.resolve(process.cwd(), 'mes-adresses-api'),
    process.cwd(),
  ]
    .filter(Boolean)
    .map((candidatePath) => path.resolve(candidatePath));

  for (const candidatePath of candidatePaths) {
    const linkedProject = config.projects[candidatePath];
    if (linkedProject) {
      return {
        linkedPath: candidatePath,
        ...linkedProject,
      };
    }
  }

  return null;
}

async function gql(token, query, variables = {}) {
  const response = await fetch(RAILWAY_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Railway API ${response.status}: ${errorText}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '));
  }

  return payload.data;
}

async function getProjectMetadata(token, projectId) {
  const data = await gql(
    token,
    `
      query project($id: String!) {
        project(id: $id) {
          id
          name
          environments {
            edges {
              node {
                id
                name
              }
            }
          }
          services {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    `,
    { id: projectId },
  );

  return data.project;
}

async function main() {
  const railwayConfig = readRailwayConfig();
  const linkedService = resolveLinkedService(railwayConfig);
  const dryRun = isTruthy(getEnv('DRY_RUN'));
  const railwayToken = getEnv('RAILWAY_TOKEN') || railwayConfig?.user?.token;
  const projectId = getEnv('RAILWAY_PROJECT_ID') || linkedService?.project;
  const environmentId =
    getEnv('RAILWAY_ENVIRONMENT_ID') || linkedService?.environment;
  const serviceId = getEnv('RAILWAY_SERVICE_ID') || linkedService?.service;
  const resendApiKey = requireEnv('RESEND_API_KEY');
  const resendFrom = requireEnv('RESEND_FROM');
  const smtpBcc = getEnv('SMTP_BCC');
  const triggerDeploy = !['0', 'false', 'no', 'off'].includes(
    (getEnv('TRIGGER_DEPLOY') || '1').toLowerCase(),
  );

  if (!projectId || !environmentId || !serviceId) {
    throw new Error(
      'Unable to resolve the target Railway project/environment/service. Export RAILWAY_PROJECT_ID, RAILWAY_ENVIRONMENT_ID, and RAILWAY_SERVICE_ID, or run this from the linked repo root.',
    );
  }

  const variables = {
    RESEND_API_KEY: resendApiKey,
    RESEND_FROM: resendFrom,
  };

  if (smtpBcc) {
    variables.SMTP_BCC = smtpBcc;
  }

  if (dryRun) {
    console.log(`Project ID: ${projectId}`);
    console.log(`Environment ID: ${environmentId}`);
    console.log(`Service ID: ${serviceId}`);
    if (linkedService?.name) {
      console.log(`Linked project: ${linkedService.name}`);
    }
    if (linkedService?.environmentName) {
      console.log(`Linked environment: ${linkedService.environmentName}`);
    }
    if (linkedService?.linkedPath) {
      console.log(`Linked path: ${linkedService.linkedPath}`);
    }
    console.log('Variables to upsert:');
    console.log('  RESEND_API_KEY=<set>');
    console.log(`  RESEND_FROM=${resendFrom}`);
    console.log(`  SMTP_BCC=${smtpBcc || '<unset>'}`);
    console.log('DRY_RUN is enabled. No Railway changes were made.');
    return;
  }

  if (!railwayToken) {
    throw new Error(
      'No Railway token found. Run `railway login` or export RAILWAY_TOKEN first.',
    );
  }

  const project = await getProjectMetadata(railwayToken, projectId);
  if (!project) {
    throw new Error(`Railway project ${projectId} was not found.`);
  }

  const environment = project.environments?.edges
    ?.map((edge) => edge.node)
    .find((item) => item.id === environmentId);
  const service = project.services?.edges
    ?.map((edge) => edge.node)
    .find((item) => item.id === serviceId);

  if (!environment) {
    throw new Error(
      `Railway environment ${environmentId} is not part of project ${project.name}.`,
    );
  }

  if (!service) {
    throw new Error(
      `Railway service ${serviceId} is not part of project ${project.name}.`,
    );
  }

  console.log(`Project: ${project.name} (${project.id})`);
  console.log(`Environment: ${environment.name} (${environment.id})`);
  console.log(`Service: ${service.name} (${service.id})`);
  if (linkedService?.linkedPath) {
    console.log(`Linked path: ${linkedService.linkedPath}`);
  }
  console.log('Variables to upsert:');
  console.log('  RESEND_API_KEY=<set>');
  console.log(`  RESEND_FROM=${resendFrom}`);
  console.log(`  SMTP_BCC=${smtpBcc || '<unset>'}`);

  await gql(
    railwayToken,
    `
      mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
        variableCollectionUpsert(input: $input)
      }
    `,
    {
      input: {
        projectId,
        environmentId,
        serviceId,
        variables,
      },
    },
  );
  console.log('Updated Railway variables for the target service.');

  if (triggerDeploy) {
    // Variables are already updated above. The deploy trigger is best-effort:
    // Railway's GraphQL schema for this has changed over time, so on any failure
    // we fall back to instructing a manual redeploy rather than crashing.
    try {
      await gql(
        railwayToken,
        `
          mutation serviceInstanceDeployV2(
            $serviceId: String!
            $environmentId: String!
          ) {
            serviceInstanceDeployV2(
              serviceId: $serviceId
              environmentId: $environmentId
            )
          }
        `,
        { serviceId, environmentId },
      );
      console.log('Triggered a new deploy for the target service.');
    } catch (error) {
      console.warn(
        `Variables were updated, but the deploy could not be triggered via the API (${error.message}).`,
      );
      console.warn('Redeploy manually so the new variables take effect:');
      console.warn('  ( cd mes-adresses-api && railway redeploy )');
    }
  } else {
    console.log('TRIGGER_DEPLOY=0, so no deploy was triggered.');
  }

  console.log('Next steps:');
  console.log('1. Wait for the new deploy to become healthy in Railway.');
  console.log('2. Trigger a BAL recovery email smoke test.');
  console.log('3. Trigger an authorization PIN email smoke test.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
