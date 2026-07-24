import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

const colorVariants = [
  'from-violet-400 to-purple-500',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-blue-500',
];

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const colorIndex = name.charCodeAt(0) % colorVariants.length;

  return (
    <div className={`${sizeMap[size]} bg-gradient-to-br ${colorVariants[colorIndex]} rounded-full flex items-center justify-center font-bold text-white shadow-sm`}>
      {initial}
    </div>
  );
}
