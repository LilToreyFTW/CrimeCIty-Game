'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

export default function GamePage() {
  const { isLoaded, userId } = useAuth();
  const [gameHtmlLoaded, setGameHtmlLoaded] = useState(false);

  useEffect(() => {
    if (isLoaded && userId && typeof window !== 'undefined' && !gameHtmlLoaded) {
      // Load game HTML content from public folder
      fetch('/index.html')
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.text();
        })
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const gameContainer = doc.getElementById('game-container');
          
          if (gameContainer) {
            const container = document.getElementById('game-container');
            if (container) {
              container.innerHTML = gameContainer.innerHTML;
              setGameHtmlLoaded(true);
              
              // Load game script after HTML is loaded
              const existingScript = document.querySelector('script[src="/html/css/script.js"]');
              if (!existingScript) {
                const script = document.createElement('script');
                script.src = '/html/css/script.js';
                script.async = true;
                script.onerror = () => {
                  console.error('Failed to load game script from /html/css/script.js');
                };
                document.body.appendChild(script);
              }

              // Load game styles
              const existingLink = document.querySelector('link[href="/html/css/style.css"]');
              if (!existingLink) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/html/css/style.css';
                link.onerror = () => {
                  console.error('Failed to load game styles from /html/css/style.css');
                };
                document.head.appendChild(link);
              }
            }
          } else {
            console.error('Game container not found in HTML');
          }
        })
        .catch(error => {
          console.error('Error loading game HTML:', error);
          // Fallback: show error message
          const container = document.getElementById('game-container');
          if (container) {
            container.innerHTML = `
              <div style="padding: 40px; color: white; text-align: center;">
                <h1>Crime City</h1>
                <p>Error loading game. Please refresh the page.</p>
                <p style="color: #ff6b6b; margin-top: 20px;">Error: ${error.message}</p>
                <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 5px; cursor: pointer;">
                  Reload Page
                </button>
              </div>
            `;
          }
        });
    }
  }, [isLoaded, userId, gameHtmlLoaded]);

  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#fff',
        fontSize: '1.5rem'
      }}>
        Loading Crime City...
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div id="game-container" style={{ minHeight: '100vh' }} />
      </SignedIn>
    </>
  );
}
