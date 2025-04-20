#!/bin/bash

# Initialize Git repository and push to GitHub
# This script assumes you've already created a repository on GitHub named n8n-tdd-framework

# Initialize Git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add GitHub remote
git remote add origin https://github.com/pvdyck/n8n-tdd-framework.git

# Push to GitHub
git push -u origin main

echo "Repository initialized and pushed to GitHub!"
echo "Visit https://github.com/pvdyck/n8n-tdd-framework to see your repository."