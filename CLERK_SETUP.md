# Clerk Authentication Setup Guide

## Overview
This application now uses Clerk for authentication instead of the previous JWT-based system.

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Clerk

Clerk will automatically generate keys when you first run the app. However, for production, you should:

1. **Create a Clerk account** at https://clerk.com
2. **Create a new application** in the Clerk Dashboard
3. **Get your API keys** from the Dashboard → API Keys section
4. **Add environment variables** to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3. Optional: Customize Auth URLs

You can customize the sign-in/sign-up URLs by adding these to `.env.local`:

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 4. Run the Application

```bash
npm run dev
```

## Features

- **Sign In/Sign Up**: Available in the header or at `/auth`
- **User Profile**: Click the user button in the header to manage your account
- **Protected Routes**: Game pages require authentication
- **Automatic Session Management**: Clerk handles all session management

## Migration Notes

The previous JWT-based authentication system has been replaced with Clerk. The following changes were made:

- ✅ `middleware.ts` - Uses `clerkMiddleware()` from `@clerk/nextjs/server`
- ✅ `app/layout.tsx` - Wrapped with `<ClerkProvider>` and includes auth UI
- ✅ `app/auth/page.tsx` - Uses Clerk `<SignIn>` and `<SignUp>` components
- ✅ `components/GamePage.tsx` - Uses Clerk's `useAuth()` hook instead of JWT tokens

## API Routes

If you need to access user information in API routes, use Clerk's `auth()` function:

```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Your API logic here
}
```

## Documentation

- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Documentation](https://clerk.com/docs)

