import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'yes' | 'no'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-primary-900 disabled:opacity-50 disabled:pointer-events-none',
          {
            // Variants
            'gradient-button text-white hover:scale-105': variant === 'primary',
            'bg-gray-700 text-white hover:bg-gray-600': variant === 'secondary',
            'border border-gray-600 text-white hover:bg-gray-800': variant === 'outline',
            'text-gray-300 hover:text-white hover:bg-gray-800': variant === 'ghost',
            'bg-green-600 text-white hover:bg-green-700': variant === 'yes',
            'bg-red-600 text-white hover:bg-red-700': variant === 'no',
            // Sizes
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }