import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { width: 80, height: 32, className: "h-8 w-auto" },
  md: { width: 120, height: 48, className: "h-12 w-auto" },
  lg: { width: 180, height: 72, className: "h-[72px] w-auto" },
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
  const { width, height, className: sizeClass } = sizes[size];

  return (
    <Image
      src="/mirabee-logo.png"
      alt="Mirabee Flowers"
      width={width}
      height={height}
      className={cn(sizeClass, className)}
      priority={priority}
    />
  );
}