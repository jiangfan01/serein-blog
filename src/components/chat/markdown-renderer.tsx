"use client";

import { memo, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
}: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-[var(--text-strong)]">
            {children}
          </strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children, className }) => {
          const codeText = getCodeText(children);
          const isBlock = className?.includes("language-") || codeText.includes("\n");

          if (isBlock) {
            return <CodeBlock value={codeText} className={className} />;
          }

          return (
            <code className="rounded bg-[var(--accent-soft)] px-1 py-0.5 font-mono text-xs text-[var(--accent-strong)]">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
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
        table: ({ children }) => (
          <div className="my-3 max-w-full overflow-x-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]">
            <table className="w-full min-w-[520px] border-collapse text-left text-xs">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-[var(--border-default)] bg-[var(--surface-secondary)]/70">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {children}
          </tbody>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 font-semibold text-[var(--text-strong)] whitespace-nowrap">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 align-top text-[var(--text-secondary)]">
            {children}
          </td>
        ),
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

function CodeBlock({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "").trim();

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="chat-code-block group">
      {language && <span className="chat-code-lang">{language}</span>}
      <button
        type="button"
        className="chat-code-copy"
        onClick={handleCopy}
        aria-label={copied ? "已复制代码" : "复制代码"}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
      <pre className="chat-code-pre">
        <code className={className}>{value}</code>
      </pre>
    </div>
  );
}

function getCodeText(children: ReactNode) {
  return String(children).replace(/\n$/, "");
}
