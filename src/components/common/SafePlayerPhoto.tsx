import React, { useState } from 'react';

interface SafePlayerPhotoProps {
  src?: string;
  name: string;
  className?: string;
  monogramClassName?: string;
  size?: number | string;
}

export default function SafePlayerPhoto({
  src,
  name,
  className = 'w-10 h-10 rounded-full object-cover',
  monogramClassName = '',
  size,
}: SafePlayerPhotoProps) {
  const [hasError, setHasError] = useState(false);

  // Generate 2-letter monogram from player name
  const getMonogram = (fullName: string): string => {
    if (!fullName) return '??';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const monogram = getMonogram(name);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/60 font-mono text-zinc-300 font-bold uppercase select-none shrink-0 ${className} ${monogramClassName}`}
        style={size ? { width: size, height: size } : undefined}
        title={name}
      >
        <span className="text-[0.8em] tracking-tight">{monogram}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`shrink-0 border border-zinc-800/80 bg-zinc-900 object-cover select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
    />
  );
}
