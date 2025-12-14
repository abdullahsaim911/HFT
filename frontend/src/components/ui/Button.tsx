import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  children, 
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-[#00d4ff] text-white hover:bg-[#00b8e6] hover:shadow-[0_0_20px_rgba(0,212,255,0.5)]',
    secondary: 'bg-[#0080ff] text-white hover:bg-[#006dd9] hover:shadow-[0_0_20px_rgba(0,128,255,0.5)]',
    danger: 'bg-[#ff0055] text-white hover:bg-[#e6004d] hover:shadow-[0_0_20px_rgba(255,0,85,0.5)]',
    success: 'bg-[#00ff41] text-black hover:bg-[#00e63a] hover:shadow-[0_0_20px_rgba(0,255,65,0.5)]',
    warning: 'bg-yellow-500 text-black hover:bg-yellow-600 hover:shadow-[0_0_20px_rgba(234,179,8,0.5)]',
    outline: 'border-2 border-gray-600 text-white hover:bg-gray-800 hover:border-gray-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : children}
    </button>
  );
}