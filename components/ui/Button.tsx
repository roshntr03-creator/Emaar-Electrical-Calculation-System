import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', size = 'md', ...props }) => {
  const baseClasses = 'rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  };
  
  const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-2.5 text-sm',
      lg: 'px-10 py-4 text-lg',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;