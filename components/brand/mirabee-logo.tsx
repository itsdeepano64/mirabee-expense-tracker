import Image from "next/image";
import { cn } from "@/lib/utils";

// Bump this when replacing public/mirabee-logo.png to bust CDN/browser cache
const LOGO_VERSION = "2";

const sizes = {
  sm: { className: "h-10 w-auto max-w-[140px]" },
  md: { className: "h-14 w-auto max-w-[180px]" },
  lg: { className: "h-24 w-auto max-w-[260px]" },
} as const;

type MirabeeLogoProps = {
  size?: keyof typeof sizes;
  className?: string;
  priority?: boolean;
};

export function MirabeeLogo({
  size = "md",
  className,
  priority = false,
}: MirabeeLogoProps) {
  const { className: sizeClass } = sizes[size];

  return (
    <Image
      src={`/mirabee-logo.png?v=${LOGO_VERSION}`}
      alt="Mirabee Flowers"
      width={512}
      height={512}
      className={cn(sizeClass, className)}
      priority={priority}
      unoptimized
    />
  );
}