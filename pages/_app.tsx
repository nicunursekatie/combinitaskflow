import React, { useEffect, useState } from 'react';
import { AppProps } from 'next/app';
import { BrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import '../global.css';
import '../CombiniSetup.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Apply the stored theme on client-side
    const applyTheme = () => {
      try {
        const storedTheme = localStorage.getItem('theme-mode');
        
        if (storedTheme === 'dark') {
          document.body.classList.add('dark');
        } else if (storedTheme === 'auto') {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark');
          }
        }
        // For light theme, no class is needed
      } catch (e) {
        console.error('Error applying theme:', e);
      }
    };
    
    applyTheme();
    setMounted(true);
  }, []);

  // Return a placeholder during SSR
  if (!mounted) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </BrowserRouter>
  );
}