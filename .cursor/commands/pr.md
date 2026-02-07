# Create Pull Request

Create a pull request for the current changes on the active repo.

## Steps

1. Check which repo directory we're in
2. Run `git diff` to see staged and unstaged changes
3. Run `git status` to see untracked files
4. Write a clear commit message based on what changed, following our conventions:
   - `[port]` prefix for porting changes
   - `[us]` prefix for US-specific additions
   - `[fix]` prefix for bug fixes
   - `[i18n]` prefix for translation work
5. Stage relevant files with `git add`
6. Commit with the message
7. Push to origin `us-port` branch
8. Use `gh pr create` to open a PR against the fork's master branch with title and description
9. Return the PR URL
