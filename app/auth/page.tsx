'use client';

import { useEffect } from 'react';

export default function AuthPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load auth HTML
      fetch('/src/auth.html')
        .then(res => res.text())
        .then(html => {
          const container = document.getElementById('auth-container');
          if (container) {
            container.innerHTML = html;
          }

          // Load auth script
          const script = document.createElement('script');
          script.src = '/src/auth.js';
          script.type = 'module';
          document.body.appendChild(script);
        });
    }
  }, []);

  return (
    <div id="auth-container" style={{ minHeight: '100vh' }} />
  );
}
