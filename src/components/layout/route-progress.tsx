/**
 * 路由切换进度条
 * 
 * 监听路由变化，显示顶部进度条
 * 类似 NProgress 效果，但更轻量
 */
"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 路由变化时开始加载
    const handleStart = () => {
      setIsLoading(true);
      setProgress(0);

      // 模拟进度
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            return prev;
          }
          // 快速到 30%，然后慢慢增加
          const increment = prev < 30 ? 15 : prev < 60 ? 5 : 2;
          return Math.min(prev + increment, 90);
        });
      }, 100);
    };

    const handleComplete = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setProgress(100);

      // 完成后隐藏
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    };

    handleStart();

    // 短暂延迟后完成（模拟加载完成）
    const completeTimeout = setTimeout(handleComplete, 300);

    return () => {
      clearTimeout(completeTimeout);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pathname, searchParams]);

  if (!isLoading && progress === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 pointer-events-none">
      <div
        className="h-full bg-[var(--text-strong)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: isLoading ? 1 : 0,
        }}
      />
    </div>
  );
}
