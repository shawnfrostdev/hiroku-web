"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    isOpen?: boolean;
  }
>(
  (
    { className = "", children, isOpen = true, sideOffset = 4, ...props },
    ref,
  ) => (
    <DropdownMenuPortal>
      <AnimatePresence>
        {isOpen && (
          <DropdownMenuPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            asChild
            {...props}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15 }}
              className={`z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md ${className}`}
            >
              {children}
            </motion.div>
          </DropdownMenuPrimitive.Content>
        )}
      </AnimatePresence>
    </DropdownMenuPortal>
  ),
);
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className = "", inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={`relative flex cursor-pointer select-none items-center rounded-sm px-2.5 py-1.5 text-sm outline-none transition-colors hover:bg-secondary hover:text-secondary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${
      inset ? "pl-8" : ""
    } ${className}`}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className = "", inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={`px-2 py-1.5 text-sm font-semibold ${
      inset ? "pl-8" : ""
    } ${className}`}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className = "", ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={`-mx-1 my-1 h-px bg-border ${className}`}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
