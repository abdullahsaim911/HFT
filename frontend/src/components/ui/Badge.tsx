import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'info', className = '' }: BadgeProps) {
  const variantClasses = {
    success: 'bg-[#00ff41] text-black',
    danger: 'bg-[#ff0055] text-white',
    warning: 'bg-yellow-500 text-black',
    info: 'bg-[#00d4ff] text-white',
    neutral: 'bg-gray-600 text-white'
  };
  
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
