# Vercel Environment Variables Setup Guide

## Quick Setup Steps

### Option 1: Using Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `battlegamewebsite`

2. **Navigate to Environment Variables**
   - Click on your project
   - Go to **Settings** → **Environment Variables**

3. **Add Clerk Variables**
   - Click **Add New**
   - Add these two variables:

   **Variable 1:**
   - Key: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Value: `pk_test_...` (from Clerk Dashboard)
   - Environments: Select all (Production, Preview, Development)

   **Variable 2:**
   - Key: `CLERK_SECRET_KEY`
   - Value: `sk_test_...` (from Clerk Dashboard)
   - Environments: Select all (Production, Preview, Development)

4. **Save and Redeploy**
   - Click **Save**
   - Vercel will automatically trigger a new deployment
   - Or manually redeploy from the **Deployments** tab

### Option 2: Using Vercel CLI

If you have your Clerk keys ready, you can set them via CLI:

```bash
# Set Publishable Key
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production

# Set Secret Key
vercel env add CLERK_SECRET_KEY production

# After adding, redeploy
vercel --prod --yes
```

### Getting Your Clerk Keys

1. **Sign up/Login to Clerk**
   - Visit: https://clerk.com
   - Create an account or sign in

2. **Create a New Application**
   - Click "Create Application"
   - Choose a name (e.g., "Crime City Game")
   - Select authentication methods (Email, Google, etc.)

3. **Get API Keys**
   - Go to **API Keys** in the sidebar
   - Copy the **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - Copy the **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Verification

After adding the environment variables:

1. **Check Deployment Logs**
   - Go to your Vercel project → **Deployments**
   - Click on the latest deployment
   - Check the build logs - should show successful build

2. **Test Your Application**
   - Visit your production URL
   - You should see Sign In/Sign Up buttons in the header
   - Click them to test authentication

### Troubleshooting

**If build still fails:**
- Make sure both environment variables are set
- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_`
- Ensure `CLERK_SECRET_KEY` starts with `sk_`
- Check that variables are enabled for Production environment
- Try redeploying manually

**If authentication doesn't work:**
- Verify Clerk application is set up correctly
- Check that your Vercel URL is added to Clerk's allowed origins
- Check browser console for errors
- Verify environment variables are set correctly in Vercel

