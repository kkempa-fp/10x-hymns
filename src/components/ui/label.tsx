/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/prop-types */
import * as React from "react";

import { cn } from "@/lib/utils";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        "text-[0.9375rem] font-medium leading-[1.3] tracking-[0.02em] text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
});

Label.displayName = "Label";

export { Label };
