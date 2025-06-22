'use client';

import React, { useEffect, useRef } from 'react';
import { useLayoutStore } from '@/lib/agents/layoutAgent';

interface ResizeObserverComponentProps {
  children: React.ReactNode;
}

const ResizeObserverComponent: React.FC<ResizeObserverComponentProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { updateEnv } = useLayoutStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Update viewport information
        const viewport = {
          w: Math.round(width),
          h: Math.round(height),
          dpr: window.devicePixelRatio || 1
        };

        // Get all pane elements and their dimensions
        const paneElements = containerRef.current?.querySelectorAll('[data-pane-id]');
        const panes = Array.from(paneElements || []).map((element) => {
          const rect = element.getBoundingClientRect();
          const paneId = element.getAttribute('data-pane-id') || 'unknown';
          const widget = element.getAttribute('data-widget') || 'unknown';
          
          return {
            id: paneId,
            box: {
              w: Math.round(rect.width),
              h: Math.round(rect.height)
            },
            widget,
            minW: 320, // Default minimum width
            minH: 240  // Default minimum height
          };
        });

        // Update environment snapshot
        updateEnv({
          viewport,
          panes
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateEnv]);

  return (
    <div ref={containerRef} className="h-full w-full">
      {children}
    </div>
  );
};

export default ResizeObserverComponent;
