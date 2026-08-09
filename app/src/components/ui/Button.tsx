import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "quiet";
  size?: "small" | "medium" | "large";
}

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "medium",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`g-button ${className}`.trim()}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  );
}
