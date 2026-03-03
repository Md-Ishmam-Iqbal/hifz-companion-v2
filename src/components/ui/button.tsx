import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[transform,box-shadow,background-color,border-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:translate-y-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:-translate-y-px hover:bg-primary/90 hover:shadow-[0_14px_40px_rgba(0,0,0,0.28)]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-px hover:bg-secondary/75 hover:shadow-[0_14px_40px_rgba(0,0,0,0.22)]',
        outline:
          'border border-input bg-background/40 shadow-sm hover:-translate-y-px hover:border-ring hover:bg-accent hover:text-accent-foreground hover:shadow-[0_14px_40px_rgba(0,0,0,0.18)]',
        ghost:
          'hover:-translate-y-px hover:bg-accent hover:text-accent-foreground hover:shadow-sm',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
