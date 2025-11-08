# Next.js + Vite Setup for Vercel

This project has been migrated from Express.js to Next.js App Router for optimal Vercel deployment.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── game/          # Game endpoints
│   ├── auth/              # Auth page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/                    # Utility libraries
│   ├── database.ts        # Database functions
│   ├── ipUtils.ts         # IP/VPN detection
│   └── emailService.ts    # Email service
├── public/                 # Static assets (auto-served)
│   ├── html/              # Game HTML/CSS/JS
│   └── src/               # Auth HTML/JS
├── next.config.js         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
└── vercel.json            # Vercel configuration
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   BASE_URL=http://localhost:3000
   ```

3. **Development**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

5. **Deploy to Vercel**
   ```bash
   vercel
   ```
   Or connect your GitHub repository to Vercel for automatic deployments.

## Key Features

- ✅ Next.js App Router
- ✅ TypeScript support
- ✅ API Routes for backend logic
- ✅ Static file serving
- ✅ Vercel-optimized deployment
- ✅ Authentication system
- ✅ Game data persistence
- ✅ Email verification
- ✅ VPN/Proxy detection

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/verify-email` - Email verification
- `POST /api/auth/resend-verification` - Resend verification email
- `GET /api/game/data` - Get game data
- `POST /api/game/data` - Save game data

## Notes

- The database file (`database.sqlite`) will be created automatically
- Static files in `public/` are automatically served by Next.js
- API routes use the App Router format (`route.ts` files)
- Client components use `'use client'` directive
