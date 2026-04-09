import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * BananaLoader — global page-transition loading screen.
 * Uses useLocation() (compatible with BrowserRouter) to detect route changes
 * and shows the spinning banana for the duration of the transition.
 */
const BananaLoader = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const timerRef = useRef(null);

  useEffect(() => {
    // Skip the very first render (no navigation happened yet)
    if (prevPathRef.current === location.pathname) return;

    prevPathRef.current = location.pathname;

    // Show loader
    setVisible(true);
    clearTimeout(timerRef.current);

    // Hide after 500ms (enough time for page to paint)
    timerRef.current = setTimeout(() => setVisible(false), 500);

    return () => clearTimeout(timerRef.current);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="banana-loader-screen">
      <span className="banana-loader-emoji">🍌</span>
      <span className="banana-loader-text">Cargando...</span>
    </div>
  );
};

export default BananaLoader;
