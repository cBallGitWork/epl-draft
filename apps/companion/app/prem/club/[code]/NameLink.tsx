import Link from "next/link";
import type { ReactNode } from "react";

/** A man's name linking to his own page, or the same box unlinked when our league does not list him. */
export default function NameLink({
  href,
  className,
  children,
}: {
  href: string | null;
  className: string;
  children: ReactNode;
}) {
  return href === null ? (
    <span className={className}>{children}</span>
  ) : (
    <Link href={href} className={`${className} hover:underline`}>
      {children}
    </Link>
  );
}
