import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "yes" | "no";
  size?: "sm" | "md" | "lg";
  selected?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", selected = false, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:pointer-events-none",
          {
            // Variants - with selected state logic
            "bg-blue-600 text-white": variant === "primary" && !selected,
            "hover:bg-blue-700": variant === "primary" && !selected,

            "bg-gray-700 text-white": variant === "secondary" && !selected,
            "hover:bg-gray-600": variant === "secondary" && !selected,

            "border border-gray-600 text-white": variant === "outline" && !selected,
            "hover:bg-gray-800": variant === "outline" && !selected,

            "text-gray-300": variant === "ghost" && !selected,
            "hover:text-white hover:bg-gray-800": variant === "ghost" && !selected,

            "bg-green-600 text-white": variant === "yes",
            "hover:bg-green-700": variant === "yes" && !selected,

            "bg-red-600 text-white": variant === "no",
            "hover:bg-red-700": variant === "no" && !selected,

            // Sizes
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4": size === "md",
            "h-12 px-6 text-lg": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
