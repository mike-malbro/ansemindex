# Publish `ansem-node` as its own GitHub repo

Mike creates the empty repo (e.g. `mike-malbro/ansem-node`), then:

## Option A — copy

```bash
cd /path/to/ansemindex/packages/ansem-node
# create remote first on GitHub
git init
git add .
git commit -m "Initial ansem-node — pull index, deposit independently, run fee ticks"
git branch -M main
git remote add origin https://github.com/mike-malbro/ansem-node.git
git push -u origin main
```

## Option B — subtree from hub (keeps history)

```bash
cd /path/to/ansemindex
git subtree split -P packages/ansem-node -b ansem-node-publish
git push https://github.com/mike-malbro/ansem-node.git ansem-node-publish:main
```

## After publish

1. Set hub env `NEXT_PUBLIC_NODE_REPO_URL=https://github.com/mike-malbro/ansem-node` (optional; default already points there).
2. Railway: new service from the **node** repo, secrets only, `DRY_RUN=true` until ready.
3. Join page `/join` links to the node repo.

**Do not** put Mike’s private keys in the published repo. Influence LP pubkey in docs is fine.
