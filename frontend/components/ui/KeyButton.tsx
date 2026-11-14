import React from "react";
import { clsx } from "clsx";

interface KeyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const KeyButton: React.FC<KeyButtonProps> = ({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}) => {
  const variantClass =
    variant === "primary"
      ? "key--primary"
      : variant === "danger"
      ? "key--danger"
      : "";

  const sizeClass =
    size === "sm"
      ? "key--sm"
      : size === "lg"
      ? "key--lg"
      : "";

  return (
    <button
      className={clsx("key", variantClass, sizeClass, className)}
      {...props}
    >
      {children}
    </button>
  );
};
