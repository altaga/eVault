git checkout --orphan latest_branch
git add .
git commit -m "first commit"
git branch -D main
git branch -m main
git push -f origin main

