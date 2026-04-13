"use client";

import { ReactNode, useState } from "react";
import { ArrowUpRight } from "lucide-react";

type ButtonVariant = "slide" | "magnetic" | "shine" | "ripple";
type SlideDirection = "left" | "right" | "top" | "bottom";

interface AnimatedButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  slideDirection?: SlideDirection;
  className?: string;
  showIcon?: boolean;
  primary?: boolean;
}

export function AnimatedButton({
  children,
  href,
  onClick,
  variant = "slide",
  slideDirection = "left",
  className = "",
  showIcon = false,
  primary = false,
}: AnimatedButtonProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (variant === "magnetic" || variant === "ripple") {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const baseStyles = primary
    ? "relative inline-flex items-center gap-2 rounded-full bg-[var(--text-strong)] px-8 py-4 text-base font-medium text-[var(--text-inverse)] overflow-hidden"
    : "relative inline-flex items-center gap-2 rounded-full border-2 border-[var(--border-strong)] px-8 py-4 text-base font-medium text-[var(--text-primary)] overflow-hidden";

  const getSlideStyles = () => {
    const directions = {
      left: "left-0 top-0 h-full w-0 group-hover:w-full",
      right: "right-0 top-0 h-full w-0 group-hover:w-full",
      top: "left-0 top-0 w-full h-0 group-hover:h-full",
      bottom: "left-0 bottom-0 w-full h-0 group-hover:h-full",
    };
    return directions[slideDirection];
  };

  const renderSlideButton = () => (
    <div
      className={`group ${baseStyles} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 滑动背景 */}
      <span
        className={`absolute ${getSlideStyles()} bg-[var(--accent)] transition-all duration-500 ease-out`}
      />
      
      {/* 内容 */}
      <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
        {children}
      </span>
      {showIcon && (
        <ArrowUpRight className="relative z-10 h-5 w-5 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white" />
      )}
    </div>
  );

  const renderMagneticButton = () => (
    <div
      className={`group ${baseStyles} ${className} transition-transform duration-300`}
      style={{
        transform: isHovered
          ? `translate(${(mousePosition.x - 100) * 0.1}px, ${(mousePosition.y - 25) * 0.1}px)`
          : "translate(0, 0)",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 磁吸光晕 */}
      <span
        className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-30"
      />
      
      <span className="relative z-10 transition-colors duration-300 group-hover:text-[var(--accent)]">
        {children}
      </span>
      {showIcon && (
        <ArrowUpRight className="relative z-10 h-5 w-5 transition-all duration-300 group-hover:rotate-45 group-hover:scale-110" />
      )}
    </div>
  );

  const renderShineButton = () => (
    <div className={`group ${baseStyles} ${className}`}>
      {/* 光泽扫过效果 */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <span className="relative z-10 transition-colors duration-300 group-hover:text-[var(--accent)]">
        {children}
      </span>
      {showIcon && (
        <ArrowUpRight className="relative z-10 h-5 w-5 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
      )}
    </div>
  );

  const renderRippleButton = () => (
    <div
      className={`group ${baseStyles} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 涟漪效果 */}
      {isHovered && (
        <span
          className="absolute rounded-full bg-[var(--accent)] opacity-0 animate-ripple"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
            width: "20px",
            height: "20px",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
      
      <span className="relative z-10 transition-colors duration-300 group-hover:text-[var(--accent)]">
        {children}
      </span>
      {showIcon && (
        <ArrowUpRight className="relative z-10 h-5 w-5 transition-all duration-300 group-hover:scale-125" />
      )}
    </div>
  );

  const renderButton = () => {
    switch (variant) {
      case "slide":
        return renderSlideButton();
      case "magnetic":
        return renderMagneticButton();
      case "shine":
        return renderShineButton();
      case "ripple":
        return renderRippleButton();
      default:
        return renderSlideButton();
    }
  };

  const content = renderButton();

  if (href) {
    return (
      <a href={href} onClick={onClick} className="inline-block">
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className="inline-block">
      {content}
    </button>
  );
}
