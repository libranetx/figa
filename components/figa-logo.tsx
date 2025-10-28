"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface FigaLogoProps {
  variant?: "default" | "white";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function FigaLogo({ variant = "default", size = "md", className }: FigaLogoProps) {
  const sizeMap: Record<string, { w: number; h: number; textSize: string }> = {
    sm: { w: 38, h: 38, textSize: "text-base" },
    md: { w: 60, h: 60, textSize: "text-xl" },
    lg: { w: 75, h: 75, textSize: "text-2xl" },
    xl: { w: 106, h: 106, textSize: "text-2xl" },
  };

  const sz = sizeMap[size] || sizeMap.md;

  return (
    <div className={cn("flex items-center", className)}>
      <div className="relative rounded">
        <Image
          src="/Outward Facing F Symbol - Fully Transparent (1).png"
          alt="FIGA logo"
          width={sz.w}
          height={sz.h}
          priority={false}
        />
      </div>
      <span className={cn(" font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent", sz.textSize)} style={{ color: variant === 'white' ? '#ffffff' : undefined }}>
        FIGA LLC
      </span>
    </div>
  );
}
