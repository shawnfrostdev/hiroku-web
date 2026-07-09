"use client";

import { Slot } from "@radix-ui/react-slot";
import { motion } from "framer-motion";
import * as React from "react";

export interface ButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    | "onDrag"
    | "onDragStart"
    | "onDragEnd"
    | "onDragTransition"
    | "onAnimationStart"
  > {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : "button";

    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all disabled:opacity-32 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none";

    const variantStyles = {
      primary:
        "bg-[#FFFFFF] text-[#000000] hover:bg-[#E5E5E5] active:bg-[#CCCCCC] focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black",
      secondary:
        "bg-[#242424] text-[#FFFFFF] hover:bg-[#323232] active:bg-[#1A1A1A] border border-[#282828] focus-visible:border-[#FFFFFF]",
      outline:
        "border border-[#282828] bg-transparent text-[#FFFFFF] hover:bg-[#242424] active:bg-[#1A1A1A] focus-visible:border-[#FFFFFF]",
      ghost:
        "bg-transparent text-[#FFFFFF] hover:bg-[#242424] active:bg-[#1A1A1A] focus-visible:ring-1 focus-visible:ring-white",
      destructive:
        "bg-[#EF4444] text-[#FFFFFF] hover:bg-[#EF4444]/90 active:bg-[#EF4444]/80 focus-visible:ring-2 focus-visible:ring-[#EF4444]",
    };

    const sizeStyles = {
      sm: "h-[32px] px-[16px] text-sm rounded-[4px]", // radius-sm
      md: "h-[40px] px-[24px] py-[12px] text-base rounded-[8px]", // radius-md
      lg: "h-[48px] px-[32px] text-lg rounded-[12px]", // radius-lg
      icon: "h-[40px] w-[40px] rounded-[8px]",
    };

    const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    if (asChild) {
      return (
        <Component
          className={classes}
          ref={ref as React.Ref<HTMLButtonElement>}
          {...props}
        />
      );
    }

    return (
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={classes}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
