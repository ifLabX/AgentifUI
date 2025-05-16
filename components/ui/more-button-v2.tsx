"use client"

import React from "react"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@lib/utils"

interface MoreButtonV2Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconClassName?: string
}

export const MoreButtonV2 = React.forwardRef<HTMLButtonElement, MoreButtonV2Props>(
  ({ className, iconClassName, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "p-1 rounded-md transition-colors duration-150",
          "hover:bg-black/5 dark:hover:bg-white/10",
          // Added active state for visual feedback when Popover is open
          // This assumes the parent Popover might add a data-state="open" or similar
          // or we can manage an `isActive` prop if needed.
          // For basic visual feedback on click:
          "active:bg-black/10 dark:active:bg-white/20", 
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      >
        <MoreHorizontal className={cn("w-4 h-4", iconClassName)} />
        <span className="sr-only">More options</span>
      </button>
    )
  }
)

MoreButtonV2.displayName = "MoreButtonV2"