# GitHub Sync Script for SaasDashKit_V1 (PowerShell)
# This script helps sync your local changes to GitHub

Write-Host "🔄 Starting GitHub sync for SaasDashKit_V1..." -ForegroundColor Cyan

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not a git repository. Please run 'git init' first." -ForegroundColor Red
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Yellow

# Verify remote is set correctly
$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl -notlike "*tristan1944/SaasDashKit_V1*") {
    Write-Host "⚠️  Warning: Remote URL doesn't match expected repository" -ForegroundColor Yellow
    Write-Host "   Current: $remoteUrl" -ForegroundColor Gray
    Write-Host "   Expected: https://github.com/tristan1944/SaasDashKit_V1.git" -ForegroundColor Gray
    $response = Read-Host "Do you want to update the remote? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        git remote set-url origin https://github.com/tristan1944/SaasDashKit_V1.git
        Write-Host "✅ Remote updated" -ForegroundColor Green
    }
}

# Show status
Write-Host ""
Write-Host "📊 Current git status:" -ForegroundColor Cyan
git status --short

# Ask for confirmation
Write-Host ""
$response = Read-Host "Do you want to commit and push these changes? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "❌ Sync cancelled" -ForegroundColor Red
    exit 0
}

# Stage all changes
Write-Host ""
Write-Host "📦 Staging changes..." -ForegroundColor Cyan
git add .

# Commit
Write-Host ""
$commitMsg = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Update project files"
}

Write-Host "💾 Committing changes..." -ForegroundColor Cyan
git commit -m $commitMsg

# Push to GitHub
Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
git push origin $currentBranch

Write-Host ""
Write-Host "✅ Successfully synced to GitHub!" -ForegroundColor Green
Write-Host "   Repository: https://github.com/tristan1944/SaasDashKit_V1" -ForegroundColor Gray
Write-Host "   Branch: $currentBranch" -ForegroundColor Gray

