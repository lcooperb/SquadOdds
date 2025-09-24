import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  variant?: 'default' | 'yes' | 'no'
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-gray-700',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full flex-1 transition-all duration-300 ease-in-out',
            {
              'bg-gradient-to-r from-blue-600 to-blue-500': variant === 'default',
              'bg-gradient-to-r from-green-600 to-green-500': variant === 'yes',
              'bg-gradient-to-r from-red-600 to-red-500': variant === 'no',
            }
          )}
          style={{
            transform: `translateX(-${100 - percentage}%)`,
          }}
        />
      </div>
    )
  }
)

Progress.displayName = 'Progress'

export { Progress }