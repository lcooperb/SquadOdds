'use client'

import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  isBottomSheet?: boolean
}

export function Modal({ isOpen, onClose, title, children, className, isBottomSheet = false }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className={cn(
      "fixed inset-0 z-50",
      isBottomSheet
        ? "flex items-end justify-center md:items-center md:justify-center"
        : "flex items-center justify-center"
    )}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'relative z-10 w-full bg-gray-800 border border-gray-700 shadow-xl transition-all duration-300 ease-out',
        isBottomSheet
          ? 'max-w-full rounded-t-2xl md:max-w-md md:mx-4 md:rounded-lg transform animate-slide-up md:animate-none'
          : 'max-w-md mx-4 rounded-lg transform animate-fade-in',
        className
      )}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className={cn(
          "p-6",
          isBottomSheet && "pb-8 max-h-[80vh] overflow-y-auto"
        )}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}