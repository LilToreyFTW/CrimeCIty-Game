# Quick Setup Instructions

## ✅ Local Development Setup Complete

Your `.env.local` file has been created with your Clerk keys. This file is gitignored and will NOT be committed.

## 🔧 Vercel Environment Variables Setup

The CLI requires interactive input. Please add your environment variables via the Vercel Dashboard:

### Steps:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select project: `battlegamewebsite`

2. **Add Environment Variables**
   - Go to **Settings** → **Environment Variables**
   - Click **Add New**

3. **Add First Variable:**
   - Key: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Value: `pk_test_cHJlbWl1bS1hZGRlci0yNC5jbGVyay5hY2NvdW50cy5kZXYk`
   - Environments: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

4. **Add Second Variable:**
   - Key: `CLERK_SECRET_KEY`
   - Value: `sk_test_7WXxtIo4s8ce16dalblk0vgpZjMbeBN6IoVcu4cKmf`
   - Environments: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

5. **Redeploy**
   - After saving, Vercel will automatically trigger a new deployment
   - Or manually go to **Deployments** → Click **Redeploy** on latest deployment

### Alternative: Use Vercel CLI (Interactive)

If you prefer CLI, run these commands and paste the values when prompted:

```bash
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
# Paste: pk_test_cHJlbWl1bS1hZGRlci0yNC5jbGVyay5hY2NvdW50cy5kZXYk

vercel env add CLERK_SECRET_KEY production
# Paste: sk_test_7WXxtIo4s8ce16dalblk0vgpZjMbeBN6IoVcu4cKmf

vercel --prod --yes
```

## ✅ Verification

After adding variables and redeploying:
- Check deployment logs - should show successful build
- Visit your production URL
- You should see Sign In/Sign Up buttons working

