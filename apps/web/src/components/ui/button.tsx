import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[transform,filter,background-color,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.95]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[0_10px_28px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)] hover:-translate-y-0.5 hover:brightness-[1.08]",
        accent:
          "bg-accent text-accent-foreground shadow-[0_10px_28px_-10px_color-mix(in_oklab,var(--accent)_75%,transparent)] hover:-translate-y-0.5 hover:brightness-[1.06]",
        outline:
          "border border-border bg-surface/70 text-foreground backdrop-blur-sm hover:-translate-y-0.5 hover:border-primary/45 hover:bg-surface",
        ghost: "text-foreground hover:bg-muted",
        gold: "bg-gold text-foreground shadow-[0_10px_28px_-10px_color-mix(in_oklab,var(--gold)_70%,transparent)] hover:-translate-y-0.5 hover:brightness-[1.05]",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
