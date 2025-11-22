#!/bin/bash

# GitHub Sync Script for SaasDashKit_V1
# This script helps sync your local changes to GitHub

set -e

echo "🔄 Starting GitHub sync for SaasDashKit_V1..."

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository. Please run 'git init' first."
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Verify remote is set correctly
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ "$REMOTE_URL" != *"tristan1944/SaasDashKit_V1"* ]]; then
    echo "⚠️  Warning: Remote URL doesn't match expected repository"
    echo "   Current: $REMOTE_URL"
    echo "   Expected: https://github.com/tristan1944/SaasDashKit_V1.git"
    read -p "Do you want to update the remote? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin https://github.com/tristan1944/SaasDashKit_V1.git
        echo "✅ Remote updated"
    fi
fi

# Show status
echo ""
echo "📊 Current git status:"
git status --short

# Ask for confirmation
read -p "Do you want to commit and push these changes? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Sync cancelled"
    exit 0
fi

# Stage all changes
echo ""
echo "📦 Staging changes..."
git add .

# Commit
echo ""
read -p "Enter commit message (or press Enter for default): " COMMIT_MSG
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update project files"
fi

echo "💾 Committing changes..."
git commit -m "$COMMIT_MSG"

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
git push origin $CURRENT_BRANCH

echo ""
echo "✅ Successfully synced to GitHub!"
echo "   Repository: https://github.com/tristan1944/SaasDashKit_V1"
echo "   Branch: $CURRENT_BRANCH"

