import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_-5px_var(--color-primary)] hover:shadow-[0_0_25px_-5px_var(--color-primary)] border border-primary/20",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 shadow-[0_0_20px_-5px_var(--color-destructive)]",
        outline:
          "border border-white/10 bg-black/20 text-neutral-200 hover:bg-white/5 hover:text-white hover:border-white/20 backdrop-blur-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-[0_0_15px_-5px_var(--color-secondary)] border border-secondary/20",
        ghost:
          "hover:bg-white/5 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        glass:
          "bg-white/5 border border-white/10 text-white backdrop-blur-md hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_-10px_rgba(255,255,255,0.3)]",
        gradient:
          "bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-[0_0_20px_-5px_var(--color-primary)] hover:shadow-[0_0_30px_-5px_var(--color-secondary)] hover:scale-[1.02]",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 rounded-lg px-8 has-[>svg]:px-4 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={`${cn(
        buttonVariants({ variant, size, className })
      )} cursor-pointer`}
      {...props}
    />
  );
}

export { Button, buttonVariants };

