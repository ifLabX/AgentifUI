"use client"

import React, { useState, createContext, useContext } from "react"
import { cn } from "@lib/utils"
import {
  Popover as BasePopover,
  PopoverItem as BasePopoverItem,
  PopoverDivider as BasePopoverDivider,
} from "./popover"

// Define props for BasePopover, ensuring it includes alignToTriggerBottom
interface InternalBasePopoverProps {
  children: React.ReactNode
  trigger: React.ReactNode
  className?: string
  contentClassName?: string
  placement?: "top" | "bottom"
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  minWidth?: number
  alignToTriggerBottom?: boolean // Ensure this is part of what BasePopover expects
}

// Context to provide closeMenu function to items
interface DropdownMenuV2ContextType {
  closeMenu: () => void
}
const DropdownMenuV2Context = createContext<DropdownMenuV2ContextType | null>(null)

// Custom Item component
interface DropdownMenuV2ItemProps extends React.ComponentProps<typeof BasePopoverItem> {}

const Item: React.FC<DropdownMenuV2ItemProps> = ({ onClick, ...props }) => {
  const context = useContext(DropdownMenuV2Context);

  const handleItemClick = () => { 
    onClick?.(); 
    if (context) { 
      context.closeMenu();
    }
  };

  return <BasePopoverItem {...props} onClick={handleItemClick} />;
}

// Divider
const Divider = BasePopoverDivider

// Main DropdownMenuV2 component
interface DropdownMenuV2Props {
  trigger: React.ReactNode
  children: React.ReactNode
  contentClassName?: string
  placement?: "top" | "bottom" | "left" | "right"
  minWidth?: number
  popoverContainerClassName?: string
  alignToTriggerBottom?: boolean // Added prop
}

export function DropdownMenuV2({
  trigger,
  children,
  contentClassName,
  placement = "bottom",
  minWidth = 160,
  popoverContainerClassName,
  alignToTriggerBottom = false, // Added to destructuring with default
}: DropdownMenuV2Props) {
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => {
    setIsOpen(false)
  }

  const popoverProps: InternalBasePopoverProps = {
    trigger: trigger,
    isOpen: isOpen,
    onOpenChange: setIsOpen,
    placement: placement as "top" | "bottom",
    minWidth: minWidth,
    contentClassName: cn(
      contentClassName
    ),
    className: popoverContainerClassName,
    children: children,
    alignToTriggerBottom: alignToTriggerBottom, // Pass prop to BasePopover
  }

  return (
    <DropdownMenuV2Context.Provider value={{ closeMenu }}>
      <BasePopover {...popoverProps} />
    </DropdownMenuV2Context.Provider>
  )
}

DropdownMenuV2.Item = Item
DropdownMenuV2.Divider = Divider