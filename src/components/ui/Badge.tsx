import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error'
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
          {
            'bg-purple-600/20 text-purple-300 border border-purple-500/30': variant === 'default',
            'bg-gray-600/20 text-gray-300 border border-gray-500/30': variant === 'secondary',
            'bg-green-600/20 text-green-300 border border-green-500/30': variant === 'success',
            'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30': variant === 'warning',
            'bg-red-600/20 text-red-300 border border-red-500/30': variant === 'error',
          },
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }