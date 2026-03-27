import React from 'react';

const Spinner = ({ size = 'sm', color = 'white', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const borderStyles = {
    white: 'border-white/30 border-t-white',
    red: 'border-red-200 border-t-red-600',
    slate: 'border-slate-200 border-t-slate-600',
    blue: 'border-blue-200 border-t-blue-600',
    purple: 'border-purple-200 border-t-purple-600'
  };

  return (
    <div 
      className={`inline-block animate-spin rounded-full border-2 border-solid ${sizeClasses[size]} ${borderStyles[color]} ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
