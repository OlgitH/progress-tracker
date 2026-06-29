import React from 'react';

interface LogoProps {
  /** Width of the logo in pixels. Defaults to a reasonable 150px. */
  width?: number;
  /** Custom Tailwind CSS classes for color changes, hover states, or margins. */
  className?: string;
}

export default function StudioLogo({ width = 150, className = '' }: LogoProps) {
  // Calculate proportional height based on the original 195x70 aspect ratio
  const height = Math.round((width * 70) / 195);

  return (
    <svg
      xmlns="http://w3.org"
      viewBox="0 0 195 70"
      preserveAspectRatio="xMidYMid meet"
      width={width}
      height={height}
      // text-white provides the base white color, fill-current spreads it to paths
      className={`text-white fill-current ${className}`}
    >
      {/* Main Text Elements */}
      <path d="M0 39h9.4l-.5 1.4H5.4v11.4H3.7V40.4H0V39zm19.1 5.5h-6.7V39h-1.7v12.8h1.7V46h6.7v5.8h1.7V39h-1.7v5.5zm6.2 1.5h4.1v-1.4h-4.1v-4.1h4.2L30 39h-6.4v12.8h6.5v-1.4h-4.8V46zM42 42.4c0-.8.6-1 1.3-1 1 0 2.1.3 3.3.9v-2.7c-.8-.4-2-.7-3.4-.7-2.8 0-4.4 1.8-4.4 3.7 0 3.9 5.4 3.7 5.4 5.8 0 .8-1 1.1-1.8 1.1-1.1 0-2.1-.4-2.9-1l-1.1 2.3c1.1.8 2.7 1.2 4.2 1.2 2.7 0 4.8-1.5 4.8-3.9 0-4-5.4-3.7-5.4-5.7zm6.1-1h3.7v10.4h3V41.4h3.3l.7-2.4H48.1v2.4zM68 46.8c0 .7-.1 1.2-.4 1.7-.4.7-1.3 1.1-2.3 1.1s-1.9-.4-2.3-1.1c-.2-.4-.4-1-.4-1.7V39h-3v7.9c0 1.1.2 2.1.6 2.8.9 1.6 2.6 2.3 5 2.3s4.2-.7 5-2.3c.5-.7.8-1.7.8-2.8V39h-3v7.8zm17-1.5c0 4-3.1 6.5-7.4 6.5h-4.3V39h4.6c4.5 0 7.1 2.4 7.1 6.3zm-3.2.1c0-2.5-1.5-4-4.2-4h-1.4v8h1.4c3 0 4.2-1.9 4.2-4zm5.1 6.4h3V39h-3v12.8zm18.1-6.4c0 3.9-2.7 6.6-6.6 6.6s-6.6-2.7-6.6-6.6 2.7-6.6 6.6-6.6c3.9.1 6.6 2.8 6.6 6.6zm-3.2 0c0-2.7-1.4-4.1-3.4-4.1S95 42.7 95 45.4s1.4 4.1 3.4 4.1 3.4-1.3 3.4-4.1z" />
      
      {/* Right Graphic Graphic Symbol */}
      <path d="M125,0v70h70V0h-70ZM137.78,35.52v14.28h-9.78v-29.58h9.78v15.3ZM141.08,49.82h-2.6v-29.57h2.58c3.95.01,7.15,3.31,7.15,7.38s-3.2,7.37-7.15,7.38h.02v.04c4.04,0,7.31,3.3,7.31,7.38s-3.27,7.38-7.31,7.38ZM159.44,20.24c5.28,0,9.61,4.06,9.99,9.22h-9.99v10.7c-5.53,0-10.02-4.46-10.02-9.96s4.48-9.96,10.02-9.96ZM160.1,49.82c-5.28,0-9.61-4.1-9.99-9.3h9.99v-10.79c5.53,0,10.02,4.49,10.02,10.04s-4.48,10.04-10.02,10.04ZM181.48,49.82c-5.38-.01-9.73-4.42-9.73-9.86v-19.72h9.73v29.58ZM192.01,39.97c0,5.44-4.37,9.86-9.76,9.86h-.03v-29.58h9.79v19.72Z" />
      
      {/* Outline Box Frame (Fixed with explicit border styles) */}
      <path 
        d="M34.5.8h73.7v68.5H34.5z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
      />
    </svg>
  );
}
    