import React from 'react';

interface StatusDotProps {
  status: 'active' | 'idle' | 'warning' | 'error';
  pulse?: boolean;
  className?: string;
}

export function StatusDot({ status, pulse = false, className = '' }: StatusDotProps) {
  const statusClasses = {
    active: 'bg-[#00ff41]',
    idle: 'bg-gray-500',
    warning: 'bg-yellow-500',
    error: 'bg-[#ff0055]'
  };
  
  const pulseClass = pulse ? 'animate-pulse' : '';
  
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusClasses[status]} ${pulseClass} ${className}`} />
  );
}
