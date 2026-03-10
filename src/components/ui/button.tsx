import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[16px] font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Strict global button style (no extra colors).
        default:
          "h-10 px-4 border border-[hsl(var(--button-border))] bg-[hsl(var(--button-bg))] text-[hsl(var(--button-fg))] hover:opacity-90",
        destructive:
          "h-10 px-4 border border-[hsl(var(--button-border))] bg-[hsl(var(--button-bg))] text-[hsl(var(--button-fg))] hover:opacity-90",
        outline:
          "h-10 px-4 border border-[hsl(var(--button-border))] bg-[hsl(var(--button-bg))] text-[hsl(var(--button-fg))] hover:opacity-90",
        secondary:
          "h-10 px-4 border border-[hsl(var(--button-border))] bg-[hsl(var(--button-bg))] text-[hsl(var(--button-fg))] hover:opacity-90",
        ghost:
          "h-10 px-4 border border-[hsl(var(--button-border))] bg-[hsl(var(--button-bg))] text-[hsl(var(--button-fg))] hover:opacity-90",
        link:
          "h-10 px-4 border border-[hsl(var(--button-border))] bg-[hsl(var(--button-bg))] text-[hsl(var(--button-fg))] hover:opacity-90",
      },
      // Keep API compatible, but enforce one size.
      size: {
        default: "",
        sm: "",
        lg: "",
        icon: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
