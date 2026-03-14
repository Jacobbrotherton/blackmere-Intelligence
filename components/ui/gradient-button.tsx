'use client';
import type { HTMLAttributes } from 'react';

interface GradientButtonProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  width?: string;
  height?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const GradientButton = ({
  children,
  width = '200px',
  height = '48px',
  className = '',
  onClick,
  disabled = false,
  ...props
}: GradientButtonProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={`
        relative rounded-full cursor-pointer flex items-center justify-center
        bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500
        p-[2px] transition-all duration-300 hover:scale-105 hover:shadow-lg
        hover:shadow-indigo-500/30
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      style={{ minWidth: width, height }}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
      {...props}
    >
      <span className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center px-6 text-white font-semibold text-sm tracking-wide">
        {children}
      </span>
    </div>
  );
};

export default GradientButton;
