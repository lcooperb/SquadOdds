import type { CSSProperties } from 'react'
// Utility to generate a deterministic gradient based on a string (e.g., user id or email)
// Returns a tailwind-compatible inline style object for background.

export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function hslColor(seed: number, offset = 0) {
  const h = (seed * 37 + offset) % 360
  const s = 70
  const l = 78
  return `hsl(${h}, ${s}%, ${l}%)`
}

export function gradientFromString(str: string) {
  const seed = hashString(str || 'default')
  const c1 = hslColor(seed, 0)
  const c2 = hslColor(seed, 120)
  const c3 = hslColor(seed, 240)
  return {
    backgroundImage: `linear-gradient(135deg, ${c1}, ${c2}, ${c3})`
  } as CSSProperties
}

export function initialsFromName(name?: string) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const second = parts[1]?.[0] || ''
  return (first + second).toUpperCase()
}
