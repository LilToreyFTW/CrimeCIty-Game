// Clerk middleware for Express
import { clerkClient } from '@clerk/clerk-sdk-node';

export const clerkMiddleware = async (req, res, next) => {
  try {
    // Get the session token from headers or cookies
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                        req.cookies?.__session;
    
    if (sessionToken) {
      // Verify the session token with Clerk
      const clerk = clerkClient();
      try {
        const session = await clerk.sessions.verifyToken(sessionToken);
        req.clerkSession = session;
        req.clerkUserId = session.userId;
      } catch (error) {
        // Invalid token, continue without Clerk auth
        req.clerkSession = null;
        req.clerkUserId = null;
      }
    }
    
    next();
  } catch (error) {
    console.error('Clerk middleware error:', error);
    next();
  }
};

export const requireClerkAuth = async (req, res, next) => {
  if (!req.clerkUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};
