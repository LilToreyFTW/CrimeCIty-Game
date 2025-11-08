'use client';

import { SignIn, SignUp } from '@clerk/nextjs';

export default function AuthPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '2rem'
    }}>
      <div style={{
        display: 'flex',
        gap: '2rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '2rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#1a1a2e' }}>
            Sign In
          </h2>
          <SignIn 
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-none',
              }
            }}
          />
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '2rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#1a1a2e' }}>
            Sign Up
          </h2>
          <SignUp 
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-none',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
