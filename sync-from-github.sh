#!/bin/bash
cd ~/Cursor/gamefunnels-hub
echo "Pulling latest changes from GitHub..."
git fetch origin
git reset --hard origin/main
echo "Done! Your Cursor workspace is now in sync with GitHub."
