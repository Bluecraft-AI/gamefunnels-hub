#!/bin/bash
cd ~/Cursor/gamefunnels-hub

echo "Checking for remote changes..."
git fetch origin

# Check if there are changes to pull
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  echo "Remote changes detected. Pulling changes from GitHub..."
  git pull origin main --no-edit
  
  # Check if pull was successful
  if [ $? -ne 0 ]; then
    echo "Error: Failed to pull changes. You may have conflicts that need to be resolved manually."
    echo "Please resolve conflicts, then run this script again."
    exit 1
  fi
  echo "Successfully pulled remote changes."
fi

echo "Committing local changes..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  read -p "Enter commit message: " message
  git commit -m "$message"
  
  echo "Pushing changes to GitHub..."
  git push origin main
  
  # Check if push was successful
  if [ $? -ne 0 ]; then
    echo "Error: Failed to push changes. Please try again."
    exit 1
  fi
  echo "Success! Your changes have been pushed to GitHub."
fi
