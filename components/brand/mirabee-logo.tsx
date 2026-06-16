import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/mirabee-flowers-logo.png";

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
      src={LOGO_SRC}
      alt="Mirabee Flowers"
      width={512}
      height={512}
      className={cn(sizeClass, className)}
      priority={priority}
      unoptimized
    />
  );
}