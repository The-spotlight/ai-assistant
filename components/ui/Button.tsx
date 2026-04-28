import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "bg-[#171717] text-white hover:bg-black shadow-sm",
        secondary:
          "bg-white text-[#171717] border border-black/[0.08] hover:bg-[#fafafa] shadow-sm",
        outline:
          "border border-[#d4d4d4] text-[#525252] hover:bg-[#fafafa] hover:border-[#171717] hover:text-[#171717]",
        ghost: "hover:bg-[#fafafa] text-[#525252] hover:text-[#171717]",
        destructive:
          "bg-[#dc2626] text-white hover:bg-[#b91c1c] shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 text-xs px-3",
        lg: "h-12 px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
