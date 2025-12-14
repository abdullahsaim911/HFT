import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'active' | 'error';
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', variant = 'default', hover = false, onClick, style }: CardProps) {
  const baseClasses = 'rounded-xl p-5 transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-[#1a1a1a] border border-[#2a2a2a]',
    active: 'bg-[#1a1a1a] border-2 border-[#00d4ff] shadow-[0_0_20px_rgba(0,212,255,0.3)]',
    error: 'bg-[#1a1a1a] border-2 border-[#ff0055] shadow-[0_0_20px_rgba(255,0,85,0.3)]'
  };
  
  const hoverClasses = hover ? 'hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:-translate-y-1 cursor-pointer' : '';
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}
