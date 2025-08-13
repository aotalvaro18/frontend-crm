// src/components/forms/TagSelector.tsx
// TagSelector siguiendo tu guía arquitectónica
// Mobile-first + Multi-select + Autocomplete + Create inline

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Tag as TagIcon, 
  ChevronDown
} from 'lucide-react';
import { Badge, TagBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';

// ============================================
// TYPES
// ============================================

export interface Tag {
  id: number;
  name: string;
  color?: string;
  description?: string;
  usageCount?: number;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
  description?: string;
}

export interface TagSelectorProps {
  // Data
  selectedTags: Tag[];
  availableTags: Tag[];
  
  // Events
  onTagsChange: (tags: Tag[]) => void;
  onCreateTag?: (tag: CreateTagRequest) => Promise<Tag>;
  onSearchTags?: (query: string) => Promise<Tag[]>;
  
  // Behavior
  allowCreate?: boolean;
  maxTags?: number;
  placeholder?: string;
  
  // Validation
  error?: string;
  required?: boolean;
  
  // UI
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'inline';
  disabled?: boolean;
  loading?: boolean;
  
  // Classes
  className?: string;
  tagClassName?: string;
  dropdownClassName?: string;
}

// ============================================
// PREDEFINED TAG COLORS
// ============================================

const DEFAULT_TAG_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

const getRandomColor = (): string => {
  return DEFAULT_TAG_COLORS[Math.floor(Math.random() * DEFAULT_TAG_COLORS.length)];
};

const normalizeTagName = (name: string): string => {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
};

const isValidTagName = (name: string): boolean => {
  const normalized = normalizeTagName(name);
  return normalized.length >= 2 && normalized.length <= 50 && /^[a-zA-Z0-9\s\-_áéíóúñü]+$/i.test(normalized);
};

// ============================================
// TAG SELECTOR COMPONENT
// ============================================

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  availableTags,
  onTagsChange,
  onCreateTag,
  onSearchTags,
  allowCreate = true,
  maxTags,
  placeholder = "Buscar o crear tags...",
  error,
  size = 'md',
  variant = 'default',
  disabled = false,
  loading = false,
  className,
  tagClassName,
  dropdownClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tag[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Filter available tags excluding already selected
  const filteredAvailableTags = useMemo(() => {
    const selectedIds = new Set(selectedTags.map(tag => tag.id));
    return availableTags.filter(tag => !selectedIds.has(tag.id));
  }, [availableTags, selectedTags]);
  
  // Filter tags based on search query
  const displayTags = useMemo(() => {
    if (!searchQuery.trim()) {
      return searchResults.length > 0 ? searchResults : filteredAvailableTags.slice(0, 20);
    }
    
    const query = normalizeTagName(searchQuery);
    return (searchResults.length > 0 ? searchResults : filteredAvailableTags)
      .filter(tag => normalizeTagName(tag.name).includes(query))
      .slice(0, 10);
  }, [searchQuery, searchResults, filteredAvailableTags]);
  
  // Check if we can create a new tag
  const canCreateTag = useMemo(() => {
    if (!allowCreate || !onCreateTag || !searchQuery.trim()) return false;
    
    const query = normalizeTagName(searchQuery);
    const exists = [...selectedTags, ...availableTags].some(
      tag => normalizeTagName(tag.name) === query
    );
    
    return !exists && isValidTagName(searchQuery) && (!maxTags || selectedTags.length < maxTags);
  }, [allowCreate, onCreateTag, searchQuery, selectedTags, availableTags, maxTags]);
  
  // Handle search with debouncing
  useEffect(() => {
    if (!onSearchTags || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await onSearchTags(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching tags:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearchTags]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle tag selection
  const handleSelectTag = (tag: Tag) => {
    if (maxTags && selectedTags.length >= maxTags) {
      return;
    }
    
    const newTags = [...selectedTags, tag];
    onTagsChange(newTags);
    setSearchQuery('');
    inputRef.current?.focus();
  };
  
  // Handle tag removal
  const handleRemoveTag = (tagToRemove: Tag) => {
    const newTags = selectedTags.filter(tag => tag.id !== tagToRemove.id);
    onTagsChange(newTags);
  };
  
  // Handle tag creation
  const handleCreateTag = async () => {
    if (!canCreateTag || !onCreateTag || createLoading) return;
    
    setCreateLoading(true);
    try {
      const newTag = await onCreateTag({
        name: searchQuery.trim(),
        color: getRandomColor(),
      });
      
      handleSelectTag(newTag);
    } catch (error) {
      console.error('Error creating tag:', error);
    } finally {
      setCreateLoading(false);
    }
  };
  
  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
  };
  
  // Handle input key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'Enter':
        e.preventDefault();
        if (canCreateTag) {
          handleCreateTag();
        } else if (displayTags.length === 1) {
          handleSelectTag(displayTags[0]);
        }
        break;
      case 'Backspace':
        if (!searchQuery && selectedTags.length > 0) {
          handleRemoveTag(selectedTags[selectedTags.length - 1]);
        }
        break;
    }
  };
  
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'min-h-[32px] text-xs',
      input: 'text-xs',
      tag: 'text-xs px-2 py-1',
      dropdown: 'text-xs',
    },
    md: {
      container: 'min-h-[40px] text-sm',
      input: 'text-sm',
      tag: 'text-xs px-2.5 py-1',
      dropdown: 'text-sm',
    },
    lg: {
      container: 'min-h-[48px] text-base',
      input: 'text-base',
      tag: 'text-sm px-3 py-1.5',
      dropdown: 'text-base',
    },
  };
  
  const currentSize = sizeConfig[size];
  
  // Compact variant (inline style)
  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap items-center gap-1', className)} ref={containerRef}>
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag.name}
            color={tag.color}
            removable={!disabled}
            onRemove={() => handleRemoveTag(tag)}
            className={cn('text-xs', tagClassName)}
          />
        ))}
        
        {(!maxTags || selectedTags.length < maxTags) && !disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
        
        {/* Compact dropdown */}
        {isOpen && (
          <div className={cn(
            'absolute z-50 mt-1 max-h-48 w-64 overflow-auto',
            'bg-app-dark-800 border border-app-dark-600 rounded-lg shadow-lg',
            dropdownClassName
          )}>
            <div className="p-2">
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                size="sm"
                autoFocus
              />
            </div>
            {/* Rest of dropdown content */}
          </div>
        )}
      </div>
    );
  }
  
  // Inline variant (minimal styling)
  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap items-center gap-1', className)}>
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            size="sm"
            removable={!disabled}
            onRemove={() => handleRemoveTag(tag)}
            className={tagClassName}
          >
            {tag.name}
          </Badge>
        ))}
        
        {(!maxTags || selectedTags.length < maxTags) && !disabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Tag
          </Button>
        )}
      </div>
    );
  }
  
  // Default variant (full featured)
  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Main container */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 p-3 border rounded-lg transition-colors',
          'bg-app-dark-700 border-app-dark-600',
          'focus-within:ring-2 focus-within:ring-app-accent-500 focus-within:border-transparent',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500 focus-within:ring-red-500',
          currentSize.container
        )}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Selected tags */}
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag.name}
            color={tag.color}
            removable={!disabled}
            onRemove={() => handleRemoveTag(tag)}
            className={cn(currentSize.tag, tagClassName)}
          />
        ))}
        
        {/* Input */}
        <div className="flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? placeholder : ''}
            disabled={!!(disabled || (maxTags && selectedTags.length >= maxTags))}
            className={cn(
              'w-full bg-transparent border-0 outline-none text-white placeholder-app-gray-400',
              currentSize.input
            )}
          />
        </div>
        
        {/* Dropdown indicator */}
        <ChevronDown className={cn(
          'h-4 w-4 text-app-gray-400 transition-transform',
          isOpen && 'transform rotate-180'
        )} />
        
        {/* Loading spinner */}
        {(loading || searchLoading) && (
          <LoadingSpinner size="sm" />
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
      
      {/* Helper text */}
      {maxTags && (
        <p className="mt-1 text-xs text-app-gray-500">
          {selectedTags.length}/{maxTags} tags seleccionados
        </p>
      )}
      
      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className={cn(
          'absolute z-50 mt-1 w-full max-h-64 overflow-auto',
          'bg-app-dark-800 border border-app-dark-600 rounded-lg shadow-lg',
          currentSize.dropdown,
          dropdownClassName
        )}>
          {/* Search results */}
          {displayTags.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-app-gray-500 mb-2 px-2">
                Tags disponibles
              </div>
              {displayTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleSelectTag(tag)}
                  disabled={!!(disabled || (maxTags && selectedTags.length >= maxTags))}
                  className={cn(
                    'w-full flex items-center justify-between p-2 rounded-md transition-colors',
                    'hover:bg-app-dark-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color || '#6b7280' }}
                    />
                    <span className="text-app-gray-200 truncate">{tag.name}</span>
                    {tag.description && (
                      <span className="text-xs text-app-gray-500 truncate">
                        {tag.description}
                      </span>
                    )}
                  </div>
                  {tag.usageCount && (
                    <Badge variant="outline" size="sm" className="flex-shrink-0 ml-2">
                      {tag.usageCount}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Create new tag option */}
          {canCreateTag && (
            <div className="border-t border-app-dark-600 p-2">
              <button
                onClick={handleCreateTag}
                disabled={createLoading}
                className={cn(
                  'w-full flex items-center gap-2 p-2 rounded-md transition-colors',
                  'hover:bg-app-dark-700 text-app-accent-400'
                )}
              >
                {createLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Crear "{searchQuery}"</span>
              </button>
            </div>
          )}
          
          {/* No results */}
          {displayTags.length === 0 && !canCreateTag && searchQuery && (
            <div className="p-4 text-center text-app-gray-500">
              <TagIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No se encontraron tags</p>
              {!allowCreate && (
                <p className="text-xs mt-1">Intenta con otros términos</p>
              )}
            </div>
          )}
          
          {/* Empty state */}
          {displayTags.length === 0 && !searchQuery && (
            <div className="p-4 text-center text-app-gray-500">
              <TagIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay tags disponibles</p>
              {allowCreate && (
                <p className="text-xs mt-1">Escribe para crear uno nuevo</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// SPECIALIZED TAG SELECTOR VARIANTS
// ============================================

/**
 * Simple Tag Selector - Para formularios básicos
 */
export const SimpleTagSelector: React.FC<{
  selectedTags: Tag[];
  availableTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}> = ({ selectedTags, availableTags, onTagsChange, placeholder, maxTags, className }) => (
  <TagSelector
    selectedTags={selectedTags}
    availableTags={availableTags}
    onTagsChange={onTagsChange}
    placeholder={placeholder}
    maxTags={maxTags}
    allowCreate={false}
    variant="default"
    size="md"
    className={className}
  />
);

/**
 * Inline Tag Editor - Para edición rápida
 */
export const InlineTagEditor: React.FC<{
  selectedTags: Tag[];
  availableTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onCreateTag?: (tag: CreateTagRequest) => Promise<Tag>;
  className?: string;
}> = ({ selectedTags, availableTags, onTagsChange, onCreateTag, className }) => (
  <TagSelector
    selectedTags={selectedTags}
    availableTags={availableTags}
    onTagsChange={onTagsChange}
    onCreateTag={onCreateTag}
    variant="inline"
    size="sm"
    allowCreate={!!onCreateTag}
    className={className}
  />
);

/**
 * Compact Tag Selector - Para espacios reducidos
 */
export const CompactTagSelector: React.FC<{
  selectedTags: Tag[];
  availableTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  maxTags?: number;
  className?: string;
}> = ({ selectedTags, availableTags, onTagsChange, maxTags, className }) => (
  <TagSelector
    selectedTags={selectedTags}
    availableTags={availableTags}
    onTagsChange={onTagsChange}
    variant="compact"
    size="sm"
    maxTags={maxTags}
    allowCreate={false}
    className={className}
  />
);

export default TagSelector; 
