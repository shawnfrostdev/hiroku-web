"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import * as React from "react";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className = "", ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm ${className}`}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    isOpen?: boolean;
  }
>(({ className = "", children, isOpen = true, ...props }, ref) => (
  <DialogPortal>
    <AnimatePresence>
      {isOpen && (
        <>
          <DialogOverlay />
          <DialogPrimitive.Content ref={ref} asChild {...props}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: "-45%", x: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, y: "-48%", x: "-50%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg gap-4 border border-border bg-card p-6 shadow-2xl rounded-lg duration-200 focus-visible:outline-none ${className}`}
            >
              {children}
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </motion.div>
          </DialogPrimitive.Content>
        </>
      )}
    </AnimatePresence>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className = "", ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={`text-xl font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className = "", ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={`text-sm text-muted-foreground ${className}`}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
