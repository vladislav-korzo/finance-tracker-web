import * as React from "react"

import { cn } from "@/shared/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-border bg-card px-3.5 py-1 text-base shadow-xs transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 hover:border-muted-foreground/35 focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
