import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--md-sys-shape-corner-large)] px-[var(--md-sys-spacing-24)] py-[var(--md-sys-spacing-12)] text-[0.9375rem] font-medium leading-[1.3] tracking-[0.02em] transition-all duration-200 ease-out cursor-pointer disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:[box-shadow:var(--md-sys-focus-ring)] active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--md-sys-elevation-level-1)] hover:bg-primary/92 hover:shadow-[var(--md-sys-elevation-level-2)] active:bg-primary/88",
        destructive:
          "bg-destructive text-primary-foreground shadow-[var(--md-sys-elevation-level-1)] hover:bg-destructive/90 hover:shadow-[var(--md-sys-elevation-level-2)]",
        outline:
          "border border-border bg-transparent text-foreground shadow-[var(--md-sys-elevation-level-0)] hover:bg-primary/10 dark:hover:bg-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[var(--md-sys-elevation-level-1)] hover:shadow-[var(--md-sys-elevation-level-2)] hover:bg-secondary/90",
        tonal:
          "bg-accent text-accent-foreground shadow-[var(--md-sys-elevation-level-1)] hover:shadow-[var(--md-sys-elevation-level-2)]",
        ghost: "bg-transparent text-primary hover:bg-primary/10 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: [
          "min-h-10",
          "px-[var(--md-sys-spacing-24)]",
          "py-[var(--md-sys-spacing-12)]",
          "has-[>svg]:px-[var(--md-sys-spacing-16)]",
        ].join(" "),
        sm: "min-h-9 rounded-[var(--md-sys-shape-corner-medium)] px-[var(--md-sys-spacing-16)] py-[var(--md-sys-spacing-8)] text-[0.875rem] leading-[1.25] gap-1.5",
        lg: "min-h-11 rounded-[var(--md-sys-shape-corner-large)] px-[var(--md-sys-spacing-32)] py-[var(--md-sys-spacing-16)] text-[1rem]",
        icon: "size-10 rounded-[var(--md-sys-shape-corner-medium)] px-0",
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

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
