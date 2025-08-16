'use client';

import { cn } from '@lib/utils';
import { createPortal } from 'react-dom';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// Context to provide closeMenu function to items
interface DropdownMenuV2ContextType {
  closeMenu: () => void;
}
const DropdownMenuV2Context = createContext<DropdownMenuV2ContextType | null>(
  null
);

// Custom Item component
interface DropdownMenuV2ItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const Item: React.FC<DropdownMenuV2ItemProps> = ({
  children,
  onClick,
  disabled = false,
  danger = false,
  icon,
  className,
}) => {
  const context = useContext(DropdownMenuV2Context);

  const handleItemClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    if (context) {
      context.closeMenu();
    }

    setTimeout(() => {
      onClick?.();
    }, 0);
  };

  return (
    <button
      onClick={handleItemClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left font-serif text-sm',
        'transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        !disabled && 'hover:bg-stone-100/80 dark:hover:bg-stone-600/40',
        danger
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
          : 'text-stone-600 dark:text-stone-300',
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

// Divider component
const Divider: React.FC = () => {
  return (
    <div className={cn('my-1 h-px', 'bg-stone-300/40 dark:bg-stone-500/40')} />
  );
};

// Main DropdownMenuV2 component
interface DropdownMenuV2Props {
  trigger: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  minWidth?: number;
  popoverContainerClassName?: string;
  alignToTriggerBottom?: boolean;
  preventScroll?: boolean; // whether to prevent background scroll
  isOpen?: boolean; // external controlled open state
  onOpenChange?: (isOpen: boolean) => void; // state change callback
}

export function DropdownMenuV2({
  trigger,
  children,
  contentClassName,
  placement = 'bottom',
  minWidth = 160,
  popoverContainerClassName,
  preventScroll = true, // default to prevent scroll
  isOpen: externalIsOpen,
  onOpenChange,
}: DropdownMenuV2Props) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // use external state or internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  // 🎯 client mount detection
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🎯 calculate trigger position for portal positioning
  const updateTriggerRect = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTriggerRect(rect);
    }
  };

  // 🎯 update position when menu is opened
  useEffect(() => {
    if (isOpen) {
      updateTriggerRect();
      // listen to scroll and resize events
      const handleUpdate = () => updateTriggerRect();
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isOpen]);

  // 🎯 global click listener: close menu when clicking outside the component
  // this ensures that clicking anywhere on the page can close the menu
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalClick = (event: MouseEvent) => {
      // 🎯 fix: check the clicked element, if it is the dropdown content area, do not close
      // this ensures that clicking on the menu item will not be interfered with by the global listener
      const target = event.target as Node;

      // if the clicked element is inside the component, do not close the menu
      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }

      // if the clicked element is the dropdown content in the portal, do not close the menu
      // check if the clicked element contains the dropdown related class to determine
      const clickedElement = event.target as Element;
      if (
        clickedElement.closest &&
        clickedElement.closest('[data-dropdown-content="true"]')
      ) {
        return;
      }

      // click outside the component, close the menu
      setIsOpen(false);
    };

    // 🎯 use setTimeout to delay adding the listener to avoid conflict with the current click event
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleGlobalClick);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [isOpen, setIsOpen]);

  // prevent background scroll: when the dropdown menu is opened
  useEffect(() => {
    if (!preventScroll) return;

    if (isOpen) {
      // prevent scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        // restore scroll
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, preventScroll]);

  const closeMenu = () => {
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // prevent trigger click event from bubbling
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  };

  // 🎯 calculate the fixed position of the dropdown
  const getDropdownStyle = (): React.CSSProperties => {
    if (!triggerRect) return {};

    const style: React.CSSProperties = {};

    if (placement === 'bottom') {
      style.top = triggerRect.bottom + 4; // 4px gap
      style.left = triggerRect.right - minWidth; // right aligned
    } else {
      style.bottom = window.innerHeight - triggerRect.top + 4; // 4px gap
      style.left = triggerRect.right - minWidth; // right aligned
    }

    // ensure it does not exceed the viewport boundary
    if (style.left && typeof style.left === 'number' && style.left < 8) {
      style.left = 8;
    }

    return style;
  };

  // 🎯 Dropdown content - rendered to body using Portal
  const dropdownContent = isOpen && triggerRect && (
    <div
      className={cn('fixed z-[9999]', popoverContainerClassName)}
      style={getDropdownStyle()}
    >
      <div
        className={cn(
          'rounded-md border shadow-lg backdrop-blur-sm',
          // 🎯 use darker colors to distinguish from sidebar background
          'border-stone-300/80 bg-white/95 dark:border-stone-600/80 dark:bg-stone-800/95',
          'py-1',
          contentClassName
        )}
        style={{ minWidth: `${minWidth}px` }}
        data-dropdown-content="true"
      >
        {children}
      </div>
    </div>
  );

  return (
    <DropdownMenuV2Context.Provider value={{ closeMenu }}>
      <div className="relative" ref={containerRef}>
        {/* Trigger */}
        <div ref={triggerRef} onClick={handleTriggerClick}>
          {trigger}
        </div>

        {/* Dropdown Menu - rendered to body using Portal, completely avoid stacking context problem */}
        {mounted &&
          dropdownContent &&
          createPortal(dropdownContent, document.body)}
      </div>
    </DropdownMenuV2Context.Provider>
  );
}

DropdownMenuV2.Item = Item;
DropdownMenuV2.Divider = Divider;
