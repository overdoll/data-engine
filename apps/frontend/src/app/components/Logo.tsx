import { clx } from "@/utils/clx"
import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  href?: string
  size?: number
  className?: string
}

export function Logo({ href, size = 36, className }: LogoProps) {
  const logoContent = (
    <div className={clx("flex items-center gap-1", className)}>
      <Image src="/icons/basic/logo.svg" alt="wispbit Logo" width={size} height={size} />
      <span className="font-medium">wispbit</span>
    </div>
  )

  if (href) {
    return <Link href={href}>{logoContent}</Link>
  }

  return logoContent
}
