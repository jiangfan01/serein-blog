/**
 * Chat 页面布局
 *
 * 独立于博客主布局，不需要导航栏和 footer
 * 全屏沉浸式对话体验，类似 ChatGPT / Claude
 */
import { ToastContainer } from "@/components/ui/toast";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
