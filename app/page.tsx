'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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
    if (isAuthenticated && typeof window !== 'undefined') {
      // Load game HTML
      fetch('/index.html')
        .then(res => res.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const gameContainer = doc.getElementById('game-container');
          
          if (gameContainer) {
            const container = document.getElementById('game-container');
            if (container) {
              container.innerHTML = gameContainer.innerHTML;
            }
          }

          // Load game script
          const script = document.createElement('script');
          script.src = '/html/css/script.js';
          script.async = true;
          document.body.appendChild(script);

          // Load game styles
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = '/html/css/style.css';
          document.head.appendChild(link);
        });
    }
  }, [isAuthenticated]);

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
    <div id="game-container" />
  );
}
