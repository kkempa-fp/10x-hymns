/* eslint-disable react/prop-types */
import * as React from "react";

import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[140px] w-full rounded-[var(--md-sys-shape-corner-medium)] border border-input bg-background/90 px-4 py-3 text-[0.9375rem] text-foreground shadow-[var(--md-sys-elevation-level-0)] transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:[box-shadow:var(--md-sys-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
