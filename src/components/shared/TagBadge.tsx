// src/components/shared/TagBadge.tsx
// Badge reutilizable para tags en toda la aplicación

import React from 'react';
import { Tag } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface TagData {
  id: number | string;
  name: string;
  color?: string;
}

interface TagBadgeProps {
  tag: TagData;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const TagBadge: React.FC<TagBadgeProps> = ({ 
  tag, 
  size = 'sm',
  showIcon = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: tag.color ? `${tag.color}20` : '#374151',
        color: tag.color || '#9CA3AF',
        border: `1px solid ${tag.color ? `${tag.color}40` : '#4B5563'}`
      }}
    >
      {showIcon && <Tag className={`${iconSizes[size]} mr-1`} />}
      {tag.name}
    </span>
  );
};

// ============================================
// TAGS DISPLAY COMPONENT
// ============================================

interface TagsDisplayProps {
  tags: TagData[];
  emptyMessage?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const TagsDisplay: React.FC<TagsDisplayProps> = ({ 
  tags, 
  emptyMessage = 'Sin etiquetas',
  size = 'sm',
  showIcon = true,
  className = ''
}) => {
  if (!tags || tags.length === 0) {
    return <span className="text-app-gray-500">{emptyMessage}</span>;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <TagBadge
          key={tag.id}
          tag={tag}
          size={size}
          showIcon={showIcon}
        />
      ))}
    </div>
  );
};