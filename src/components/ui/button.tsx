import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "accent" | "danger" | "link";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium " +
  "transition-[background-color,color,box-shadow,border-color,transform] duration-150 " +
  "disabled:pointer-events-none disabled:opacity-50 active:translate-y-px " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] " +
  "[&_svg]:shrink-0 [&_svg]:size-4";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-fg)] shadow-card hover:bg-[var(--primary-hover)]",
  secondary:
    "bg-[var(--bg-muted)] text-[var(--fg)] hover:bg-[var(--border)]",
  outline:
    "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--fg)] hover:bg-[var(--bg-subtle)]",
  ghost: "text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]",
  accent: "bg-[var(--accent)] text-[var(--accent-fg)] shadow-card hover:brightness-110",
  danger: "bg-[var(--error)] text-white shadow-card hover:brightness-110",
  link: "text-[var(--accent)] underline-offset-4 hover:underline p-0 h-auto",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], variant !== "link" && sizes[size], className)}
      {...props}
    />
  );
});

export interface ButtonLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, variants[variant], variant !== "link" && sizes[size], className)}
      {...props}
    />
  );
}

export const buttonClasses = (variant: Variant = "primary", size: Size = "md") =>
  cn(base, variants[variant], variant !== "link" && sizes[size]);
