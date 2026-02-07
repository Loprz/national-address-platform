# Sync Upstream BAN Changes

Pull latest changes from the upstream BaseAdresseNationale repos into our forks.

## Steps

1. For each repo in the workspace (mes-adresses, mes-adresses-api, api-depot, adresse.data.gouv.fr, ban-plateforme, addok-docker):
   a. `cd` into the repo directory
   b. Check if upstream remote exists: `git remote -v | grep upstream`
   c. If not, add it: `git remote add upstream https://github.com/BaseAdresseNationale/{repo}.git`
   d. Fetch upstream: `git fetch upstream`
   e. Check out `us-port` branch
   f. Show what's new: `git log us-port..upstream/master --oneline`
   g. Report changes but do NOT merge automatically (user should review first)
2. Summarize what's changed across all repos
