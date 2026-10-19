import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border border-transparent bg-primary/20 text-primary',
        secondary: 'border border-border bg-surface-secondary text-foreground-muted',
        success: 'border border-transparent bg-emerald-500/20 text-emerald-400',
        danger: 'border border-transparent bg-red-500/20 text-red-400',
        warning: 'border border-transparent bg-amber-500/20 text-amber-400',
        outline: 'border border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
