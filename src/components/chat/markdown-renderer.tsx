"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
}: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-[var(--text-strong)]">
            {children}
          </strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block my-2 p-2 rounded-md bg-black/10 dark:bg-white/10 text-xs font-mono overflow-x-auto whitespace-pre">
                {children}
              </code>
            );
          }
          return (
            <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-xs font-mono">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="my-0">{children}</pre>,
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li className="text-sm">{children}</li>,
        h1: ({ children }) => (
          <h1 className="text-base font-bold mb-1">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-bold mb-1">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mb-1">{children}</h3>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[var(--accent)] pl-3 my-2 text-[var(--text-secondary)] italic">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-2 border-[var(--border-default)]" />,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] underline underline-offset-2"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
});
