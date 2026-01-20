import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-medium transition-all cursor-pointer disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[#ff8904] text-white hover:bg-[#ff8904]/90 disabled:bg-[#EAEAEA] disabled:text-[#8E8E8E] disabled:hover:bg-[#EAEAEA] dark:bg-[#ff8904] dark:text-white dark:hover:bg-[#ff8904]/90 dark:disabled:bg-white/10 dark:disabled:text-white/40",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 disabled:bg-[#EAEAEA] disabled:text-[#8E8E8E] dark:bg-red-600 dark:text-white dark:hover:bg-red-700 dark:disabled:bg-white/10 dark:disabled:text-white/40",
        outline:
          "border border-[#ff8904] bg-transparent text-[#ff8904] disabled:bg-[#EAEAEA] disabled:text-[#8E8E8E] disabled:border-[#EAEAEA] dark:border-[#ff8904] dark:bg-transparent dark:text-[#ff8904] dark:hover:bg-[#ff8904]/10 dark:disabled:bg-white/5 dark:disabled:text-white/40 dark:disabled:border-white/20",
        secondary:
          "border bg-white hover:bg-accent hover:text-accent-foreground disabled:bg-[#EAEAEA] disabled:text-[#8E8E8E] dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:text-white dark:disabled:bg-white/5 dark:disabled:text-white/40",
        ghost:
          "hover:bg-accent hover:text-accent-foreground disabled:bg-[#EAEAEA] disabled:text-[#8E8E8E] dark:text-white dark:hover:bg-white/10 dark:hover:text-white dark:disabled:bg-transparent dark:disabled:text-white/40",
        link: "text-[#ff8904] underline-offset-4 hover:underline disabled:text-[#8E8E8E] disabled:no-underline dark:text-[#ff8904] dark:hover:underline dark:disabled:text-white/40 dark:disabled:no-underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
