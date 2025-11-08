'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gameHtmlLoaded, setGameHtmlLoaded] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/auth');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('authToken');
          router.push('/auth');
        }
      } catch (error) {
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined' && !gameHtmlLoaded) {
      // Load game HTML content
      fetch('/index.html')
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to load game HTML');
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
              const script = document.createElement('script');
              script.src = '/html/css/script.js';
              script.async = true;
              script.onerror = () => {
                console.error('Failed to load game script');
              };
              document.body.appendChild(script);

              // Load game styles
              const existingLink = document.querySelector('link[href="/html/css/style.css"]');
              if (!existingLink) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/html/css/style.css';
                document.head.appendChild(link);
              }
            }
          }
        })
        .catch(error => {
          console.error('Error loading game HTML:', error);
          // Fallback: create basic game container
          const container = document.getElementById('game-container');
          if (container) {
            container.innerHTML = '<div style="padding: 20px; color: white;"><h1>Crime City</h1><p>Game loading...</p></div>';
          }
        });
    }
  }, [isAuthenticated, gameHtmlLoaded]);

  if (loading) {
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div id="game-container" style={{ minHeight: '100vh' }} />
  );
}