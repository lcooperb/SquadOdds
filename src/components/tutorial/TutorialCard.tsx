'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface TutorialCardProps {
  title: string
  description: string
  icon: ReactNode
  badge?: string
  badgeVariant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  children?: ReactNode
  className?: string
}

export default function TutorialCard({
  title,
  description,
  icon,
  badge,
  badgeVariant = 'primary',
  children,
  className = ''
}: TutorialCardProps) {
  return (
    <Card className={`bg-gray-800/90 border-0 shadow-lg ${className}`}>
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-purple-400">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-white">{title}</CardTitle>
              {badge && (
                <Badge variant={badgeVariant} className="mt-1 text-xs">
                  {badge}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-gray-300 mb-4 leading-relaxed">
          {description}
        </p>
        {children}
      </CardContent>
    </Card>
  )
}