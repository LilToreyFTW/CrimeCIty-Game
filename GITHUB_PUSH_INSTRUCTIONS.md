# Instructions to Push to GitHub

## Step 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Sign in to your GitHub account (or create one if you don't have one)
3. Repository name: `battlegamewebsite` (or any name you prefer)
4. Description: "Crime City - Next.js Battle Game"
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

## Step 2: Push Your Code

### Option A: Using the Script (Windows)
Run one of these scripts:
- `push-to-github.bat` (double-click or run in command prompt)
- `push-to-github.ps1` (run in PowerShell)

### Option B: Manual Commands
Copy the commands from GitHub after creating the repo, or use:

```bash
# Add your GitHub repository as remote (replace with your actual URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 3: Authenticate

When you push, GitHub will ask for authentication:
- **Personal Access Token** (recommended): Create one at https://github.com/settings/tokens
  - Select scopes: `repo` (full control)
  - Copy the token and use it as your password when pushing
- **OR** use GitHub Desktop app for easier authentication

## Your Repository is Ready!

After pushing, your code will be available at:
`https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`

## Next Steps

1. Connect to Vercel:
   - Go to https://vercel.com
   - Import your GitHub repository
   - Vercel will automatically detect Next.js and deploy

2. Set Environment Variables in Vercel:
   - Go to Project Settings > Environment Variables
   - Add: `JWT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `BASE_URL`
