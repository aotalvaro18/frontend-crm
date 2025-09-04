// src/components/ui/Dropdown.tsx
// Dropdown enterprise component siguiendo tu guía arquitectónica
// Mobile-first + TypeScript strict + Headless UI integration

import React, { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  ChevronDown, 
  Check, 
  ChevronRight,
  type LucideIcon 
} from 'lucide-react';
import { cn } from '@/utils/cn';

// ============================================
// DROPDOWN TYPES
// ============================================

export interface DropdownItem {
  id?: string;
  label: string;
  description?: string;
  icon?: LucideIcon | React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  selected?: boolean;
  onClick?: () => void;
  href?: string;
  target?: string;
}

export interface DropdownItemSeparator {
  type: 'separator';
  id?: string;
}

export interface DropdownItemGroup {
  type: 'group';
  id?: string;
  label?: string;
  items: (DropdownItem | DropdownItemSeparator)[];
}

export type DropdownMenuItems = (DropdownItem | DropdownItemSeparator | DropdownItemGroup)[];

export interface DropdownProps {
  // Trigger element
  trigger: React.ReactNode;
  
  // Menu items
  items: DropdownMenuItems;
  
  // Positioning
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
  offset?: number;
  
  // Styling
  variant?: 'default' | 'bordered' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  
  // Behavior
  closeOnItemClick?: boolean;
  disabled?: boolean;
  
  // Events
  onOpenChange?: (open: boolean) => void;
  
  // Classes
  className?: string;
  menuClassName?: string;
  triggerClassName?: string;
}

// ============================================
// DROPDOWN VARIANTS
// ============================================

const dropdownVariants = {
  variants: {
    variant: {
      default: {
        menu: 'bg-app-dark-800 border border-app-dark-600 shadow-lg',
        item: 'text-app-gray-200 hover:bg-app-dark-700 hover:text-white',
        itemDestructive: 'text-red-400 hover:bg-red-500/10 hover:text-red-300',
        itemDisabled: 'text-app-gray-500 cursor-not-allowed opacity-50',
        separator: 'bg-app-dark-600',
        groupLabel: 'text-app-gray-400 bg-app-dark-750',
      },
      bordered: {
        menu: 'bg-app-dark-800 border-2 border-app-dark-500 shadow-xl',
        item: 'text-app-gray-200 hover:bg-app-dark-700 hover:text-white',
        itemDestructive: 'text-red-400 hover:bg-red-500/10 hover:text-red-300',
        itemDisabled: 'text-app-gray-500 cursor-not-allowed opacity-50',
        separator: 'bg-app-dark-500',
        groupLabel: 'text-app-gray-400 bg-app-dark-750',
      },
      minimal: {
        menu: 'bg-app-dark-900 border border-app-dark-700 shadow-sm',
        item: 'text-app-gray-300 hover:bg-app-dark-800 hover:text-white',
        itemDestructive: 'text-red-400 hover:bg-red-500/10 hover:text-red-300',
        itemDisabled: 'text-app-gray-600 cursor-not-allowed opacity-50',
        separator: 'bg-app-dark-700',
        groupLabel: 'text-app-gray-500 bg-app-dark-850',
      },
    },
    size: {
      sm: {
        menu: 'min-w-32 text-xs',
        item: 'px-2 py-1.5',
        groupLabel: 'px-2 py-1 text-xs',
        icon: 'h-3 w-3',
      },
      md: {
        menu: 'min-w-40 text-sm',
        item: 'px-3 py-2',
        groupLabel: 'px-3 py-1.5 text-xs',
        icon: 'h-4 w-4',
      },
      lg: {
        menu: 'min-w-48 text-base',
        item: 'px-4 py-3',
        groupLabel: 'px-4 py-2 text-sm',
        icon: 'h-5 w-5',
      },
    },
  },
};

// ============================================
// MENU ITEM COMPONENT
// ============================================

const DropdownMenuItem: React.FC<{
  item: DropdownItem;
  variant: 'default' | 'bordered' | 'minimal';
  size: 'sm' | 'md' | 'lg';
  closeMenu?: () => void;
  closeOnClick?: boolean;
}> = ({ 
  item, 
  variant, 
  size, 
  closeMenu,
  closeOnClick = true 
}) => {
  const variantStyles = dropdownVariants.variants.variant[variant];
  const sizeStyles = dropdownVariants.variants.size[size];

  const handleClick = (e: React.MouseEvent) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }

    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    }

    if (closeOnClick && closeMenu) {
      closeMenu();
    }
  };

  const ItemContent = () => (
    <div className={cn(
      'flex items-center justify-between w-full',
      sizeStyles.item,
      'rounded-md transition-colors duration-150',
      item.disabled 
        ? variantStyles.itemDisabled
        : item.destructive 
          ? variantStyles.itemDestructive 
          : variantStyles.item
    )}>
      <div className="flex items-center space-x-2 min-w-0 flex-1">
        {/* Icon */}
        {item.icon && (
          <div className="flex-shrink-0">
            {React.isValidElement(item.icon) ? (
              React.cloneElement(item.icon as React.ReactElement, {
                className: cn(sizeStyles.icon, (item.icon as any)?.props?.className)
              })
            ) : (
              React.createElement(item.icon as LucideIcon, {
                className: sizeStyles.icon
              })
            )}
          </div>
        )}
        
        {/* Label and description */}
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">
            {item.label}
          </div>
          {item.description && (
            <div className="text-xs opacity-75 truncate mt-0.5">
              {item.description}
            </div>
          )}
        </div>
      </div>

      {/* Right side elements */}
      <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
        {/* Selected indicator */}
        {item.selected && (
          <Check className={cn(sizeStyles.icon, 'text-app-accent-500')} />
        )}
        
        {/* Keyboard shortcut */}
        {item.shortcut && (
          <span className="text-xs opacity-60 font-mono">
            {item.shortcut}
          </span>
        )}
        
        {/* Submenu indicator (for future use) */}
        {/* {item.submenu && (
          <ChevronRight className={cn(sizeStyles.icon, 'opacity-60')} />
        )} */}
      </div>
    </div>
  );

  // External link
  if (item.href) {
    return (
      <a
        href={item.href}
        target={item.target}
        className={cn(
          'block no-underline',
          item.disabled && 'pointer-events-none'
        )}
        onClick={handleClick}
      >
        <ItemContent />
      </a>
    );
  }

  // Button
  return (
    <button
      type="button"
      className={cn(
        'w-full text-left',
        item.disabled && 'cursor-not-allowed'
      )}
      disabled={item.disabled}
      onClick={handleClick}
    >
      <ItemContent />
    </button>
  );
};

// ============================================
// SEPARATOR COMPONENT
// ============================================

const DropdownSeparator: React.FC<{
  variant: 'default' | 'bordered' | 'minimal';
}> = ({ variant }) => {
  const variantStyles = dropdownVariants.variants.variant[variant];
  
  return (
    <div className={cn('my-1 h-px', variantStyles.separator)} />
  );
};

// ============================================
// GROUP COMPONENT
// ============================================

const DropdownGroup: React.FC<{
  group: DropdownItemGroup;
  variant: 'default' | 'bordered' | 'minimal';
  size: 'sm' | 'md' | 'lg';
  closeMenu?: () => void;
  closeOnClick?: boolean;
}> = ({ 
  group, 
  variant, 
  size, 
  closeMenu,
  closeOnClick 
}) => {
  const variantStyles = dropdownVariants.variants.variant[variant];
  const sizeStyles = dropdownVariants.variants.size[size];

  return (
    <div className="py-1">
      {/* Group label */}
      {group.label && (
        <div className={cn(
          'font-medium uppercase tracking-wider',
          sizeStyles.groupLabel,
          variantStyles.groupLabel
        )}>
          {group.label}
        </div>
      )}
      
      {/* Group items */}
      <div className="space-y-0.5">
        {group.items.map((item, index) => {
          const key = 'id' in item && item.id ? item.id : `${group.id}-item-${index}`;
          
          if ('type' in item && item.type === 'separator') {
            return <DropdownSeparator key={key} variant={variant} />;
          }
          
          return (
            <DropdownMenuItem
              key={key}
              item={item as DropdownItem}
              variant={variant}
              size={size}
              closeMenu={closeMenu}
              closeOnClick={closeOnClick}
            />
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MAIN DROPDOWN COMPONENT
// ============================================

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'start',
  side = 'bottom',
  offset = 4,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  closeOnItemClick = true,
  disabled = false,
  onOpenChange,
  className,
  menuClassName,
  triggerClassName,
}) => {
  // ✅ ELIMINAMOS useState - Headless UI maneja su propio estado
  const variantStyles = dropdownVariants.variants.variant[variant];
  const sizeStyles = dropdownVariants.variants.size[size];

  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      {({ open }) => ( // ✅ USAR EL ESTADO DE HEADLESS UI
        <>
          {/* Trigger */}
          <Menu.Button 
            className={cn(
              'cursor-pointer focus:outline-none', // ✅ AGREGAMOS focus:outline-none
              disabled && 'cursor-not-allowed opacity-50 pointer-events-none',
              triggerClassName
            )}
            disabled={disabled}
            onClick={() => { // ✅ AGREGAMOS onClick handler
              console.log('🔍 Dropdown trigger clicked, open:', open);
              onOpenChange?.(!open);
            }}
          >
            {trigger}
          </Menu.Button>

          {/* Menu */}
          <Transition
            as={Fragment}
            show={open} // ✅ USAR EL ESTADO DE HEADLESS UI
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
            afterEnter={() => onOpenChange?.(true)} // ✅ CAMBIAR beforeEnter por afterEnter
            afterLeave={() => onOpenChange?.(false)}
          >
            <Menu.Items
              className={cn(
                // Base styles
                'absolute z-50 mt-1 rounded-lg focus:outline-none',
                
                // Size
                sizeStyles.menu,
                fullWidth && 'w-full',
                
                // Variant
                variantStyles.menu,
                
                // Positioning
                align === 'end' ? 'right-0' : 'left-0',
                side === 'top' && 'bottom-full mb-1 mt-0',
                
                // Custom classes
                menuClassName
              )}
              style={{
                marginTop: side === 'bottom' ? offset : undefined,
                marginBottom: side === 'top' ? offset : undefined,
              }}
            >
              <div className="py-1">
                {items.map((item, index) => {
                  const key = 'id' in item && item.id ? item.id : `item-${index}`;
                  
                  // Separator
                  if ('type' in item && item.type === 'separator') {
                    return <DropdownSeparator key={key} variant={variant} />;
                  }
                  
                  // Group
                  if ('type' in item && item.type === 'group') {
                    return (
                      <DropdownGroup
                        key={key}
                        group={item as DropdownItemGroup}
                        variant={variant}
                        size={size}
                        closeMenu={() => {}} // ✅ NO NECESARIO CON HEADLESS UI
                        closeOnClick={closeOnItemClick}
                      />
                    );
                  }
                  
                  // Regular item
                  return (
                    <Menu.Item key={key}>
                      {({ close }) => ( // ✅ USAR close DE HEADLESS UI
                        <DropdownMenuItem
                          item={item as DropdownItem}
                          variant={variant}
                          size={size}
                          closeMenu={closeOnItemClick ? close : undefined} // ✅ PASAR close
                          closeOnClick={closeOnItemClick}
                        />
                      )}
                    </Menu.Item>
                  );
                })}
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
};

// ============================================
// SPECIALIZED DROPDOWN COMPONENTS
// ============================================

/**
 * Action Dropdown - Para actions buttons
 */
export const ActionDropdown: React.FC<{
  trigger?: React.ReactNode;
  items: DropdownMenuItems;
  disabled?: boolean;
  className?: string;
}> = ({ 
  trigger, 
  items, 
  disabled = false, 
  className 
}) => (
  <Dropdown
    trigger={trigger || (
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center w-8 h-8',
          'text-app-gray-400 hover:text-white',
          'hover:bg-app-dark-700 rounded-md',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-app-accent-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        disabled={disabled}
      >
        <span className="sr-only">Abrir menú</span>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
    )}
    items={items}
    align="end"
    size="sm"
    disabled={disabled}
    className={className}
  />
);

/**
 * Select Dropdown - Para selección de opciones
 */
export const SelectDropdown: React.FC<{
  value?: string;
  placeholder?: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    icon?: LucideIcon;
  }>;
  onChange?: (value: string) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}> = ({ 
  value, 
  placeholder = 'Seleccionar...', 
  options, 
  onChange, 
  disabled = false,
  fullWidth = true,
  className 
}) => {
  const selectedOption = options.find(opt => opt.value === value);
  
  const items: DropdownMenuItems = options.map(option => ({
    id: option.value,
    label: option.label,
    description: option.description,
    icon: option.icon,
    selected: option.value === value,
    onClick: () => onChange?.(option.value),
  }));

  return (
    <Dropdown
      trigger={
        <div className={cn(
          'flex items-center justify-between',
          'px-3 py-2 text-sm',
          'bg-app-dark-700 border border-app-dark-600',
          'rounded-lg transition-colors',
          'hover:border-app-dark-500',
          'focus-within:ring-2 focus-within:ring-app-accent-500',
          disabled && 'opacity-50 cursor-not-allowed',
          fullWidth && 'w-full',
          className
        )}>
          <span className={cn(
            selectedOption ? 'text-app-gray-200' : 'text-app-gray-400'
          )}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-app-gray-400" />
        </div>
      }
      items={items}
      fullWidth={fullWidth}
      disabled={disabled}
      variant="default"
      size="md"
    />
  );
};

/**
 * Context Menu - Para click derecho
 */
export const ContextMenu: React.FC<{
  children: React.ReactNode;
  items: DropdownMenuItems;
  disabled?: boolean;
}> = ({ children, items, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setPosition({ x: e.pageX, y: e.pageY });
    setIsOpen(true);
  };

  const handleClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu} onClick={handleClick}>
        {children}
      </div>
      
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        >
          <div
            className={cn(
              'fixed z-50 min-w-40 text-sm',
              'bg-app-dark-800 border border-app-dark-600',
              'rounded-lg shadow-lg py-1'
            )}
            style={{
              left: position.x,
              top: position.y,
            }}
          >
            {items.map((item, index) => {
              if ('type' in item && item.type === 'separator') {
                return (
                  <div 
                    key={index} 
                    className="my-1 h-px bg-app-dark-600" 
                  />
                );
              }
              
              const menuItem = item as DropdownItem;
              return (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    'w-full text-left px-3 py-2',
                    'text-app-gray-200 hover:bg-app-dark-700',
                    'transition-colors duration-150',
                    menuItem.destructive && 'text-red-400 hover:bg-red-500/10',
                    menuItem.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={menuItem.disabled}
                  onClick={() => {
                    if (!menuItem.disabled && menuItem.onClick) {
                      menuItem.onClick();
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    {menuItem.icon && React.createElement(menuItem.icon as LucideIcon, {
                      className: 'h-4 w-4'
                    })}
                    <span>{menuItem.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Dropdown;
