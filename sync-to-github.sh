#!/bin/bash
cd ~/Cursor/gamefunnels-hub
echo "Committing changes..."
git add .
read -p "Enter commit message: " message
git commit -m "$message"
echo "Pushing changes to GitHub..."
git push origin main
echo "Done! Your changes have been pushed to GitHub."
