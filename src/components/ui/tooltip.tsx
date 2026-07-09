"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    isOpen?: boolean;
  }
>(({ className = "", sideOffset = 4, isOpen = true, ...props }, ref) => (
  <AnimatePresence>
    {isOpen && (
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        asChild
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 5 }}
          transition={{ duration: 0.15 }}
          className={`z-50 overflow-hidden rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md ${className}`}
        />
      </TooltipPrimitive.Content>
    )}
  </AnimatePresence>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
