"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

type FillDirection = "left" | "right" | "top" | "bottom";
type ButtonTone = "default" | "accent";
type ButtonSize = "default" | "compact";

type EditorialButtonProps = {
  href: string;
  children: ReactNode;
  icon?: ComponentType<LucideProps>;
  fillDirection?: FillDirection;
  tone?: ButtonTone;
  size?: ButtonSize;
  className?: string;
  target?: "_blank";
};

export function EditorialButton({
  href,
  children,
  icon: Icon,
  fillDirection = "left",
  tone = "default",
  size = "default",
  className = "",
  target,
}: EditorialButtonProps) {
  const isExternal = href.startsWith("http");
  const content = (
    <>
      <span className="editorial-button-label">{children}</span>
      {Icon && <Icon className="editorial-button-icon" aria-hidden="true" />}
    </>
  );
  const sharedProps = {
    className: `editorial-button ${className}`,
    "data-fill": fillDirection,
    "data-tone": tone,
    "data-size": size,
  };

  if (isExternal) {
    return (
      <a
        {...sharedProps}
        href={href}
        target={target ?? "_blank"}
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <Link {...sharedProps} href={href}>
      {content}
    </Link>
  );
}
