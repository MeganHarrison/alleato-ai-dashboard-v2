import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef, type ReactElement } from "react";

export interface LuxuryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const LuxuryButton = forwardRef<HTMLButtonElement, LuxuryButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-neutral-900";
    
    const variants = {
      primary: "bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-700",
      secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300",
      outline: "border border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100",
      ghost: "bg-transparent text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200"
    };
    
    const sizes = {
      sm: "px-4 py-2 text-sm rounded-md",
      md: "px-6 py-3 text-base rounded-md",
      lg: "px-8 py-4 text-lg rounded-lg"
    };
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

LuxuryButton.displayName = "LuxuryButton";

export { LuxuryButton };