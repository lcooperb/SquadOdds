"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

type BrandProps = {
  size?: number; // height in px for the logomark
  showWordmark?: boolean;
  className?: string;
};

// Centralized brand lockup: logomark + wordmark
// Usage: <Brand /> or <Brand size={28} />
export default function Brand({ size = 32, showWordmark = true, className = "" }: BrandProps) {
  return (
    <Link href="/" className={`flex items-center space-x-2 ${className}`}>
      {/* Logomark */}
      <Image
        src="/brand/logomark.svg"
        alt="SquadOdds"
        width={size}
        height={size}
        priority
      />
      {showWordmark && (
        <span className="text-xl font-bold">
          <span className="text-white">Squad</span>
          <span className="text-purple-500">Odds</span>
        </span>
      )}
    </Link>
  );
}
