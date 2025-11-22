/**
 * GA4 Tracking Component
 * 
 * Injects Google Analytics 4 (gtag.js) tracking script when GA4 Measurement ID is configured
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export function GA4Tracking() {
  // Fetch GA4 Measurement ID from project config
  const { data: projectConfig } = useQuery<{ ga4_measurement_id?: string }>({
    queryKey: ['/api/project/config'],
    queryFn: async () => {
      const res = await fetch('/api/project/config', { credentials: 'include' });
      if (!res.ok) return { ga4_measurement_id: undefined };
      return res.json();
    },
  });

  const measurementId = projectConfig?.ga4_measurement_id;

  useEffect(() => {
    if (!measurementId) return;

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(...args: any[]) {
      window.dataLayer.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    // Inject gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script on unmount
      const existingScript = document.querySelector(`script[src*="gtag/js?id=${measurementId}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [measurementId]);

  return null; // This component doesn't render anything
}

