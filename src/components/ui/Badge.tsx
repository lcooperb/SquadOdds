import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'primary'
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          {
            'bg-blue-600/20 text-white border border-blue-500/30': variant === 'default',
            'bg-gray-600/20 text-white border border-gray-500/30': variant === 'secondary',
            'bg-green-600/20 text-white border border-green-500/30': variant === 'success',
            'bg-yellow-600/20 text-white border border-yellow-500/30': variant === 'warning',
            'bg-red-600/20 text-white border border-red-500/30': variant === 'error',
            'bg-blue-600 text-white border border-blue-500': variant === 'primary',
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