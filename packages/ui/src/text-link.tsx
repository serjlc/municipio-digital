import type { AnchorHTMLAttributes } from "react";
import { cn } from "./cn";

/** Inline text link: quiet underline that turns brand green on hover. */
export const textLinkClasses =
  "underline decoration-line underline-offset-4 hover:text-brand hover:decoration-brand";

export function TextLink({ className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cn(textLinkClasses, className)} {...props} />;
}
