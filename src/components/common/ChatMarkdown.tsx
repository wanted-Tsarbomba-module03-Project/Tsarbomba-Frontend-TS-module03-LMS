"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import coy from "react-syntax-highlighter/dist/esm/styles/prism/coy";

SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("py", python);

interface ChatMarkdownProps {
  content: string;
}

export default function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <ReactMarkdown
      components={{
        a: ({ children, ...props }) => (
          <a
            {...props}
            className="font-semibold text-[#1a237e] underline underline-offset-2"
            rel="noreferrer"
            target="_blank"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-4 border-[#1a237e]/35 pl-3 text-text-secondary">
            {children}
          </blockquote>
        ),
        code: ({ children, className, ...props }) => {
          const match = /language-(\w+)/.exec(className ?? "");
          const code = String(children).replace(/\n$/, "");

          if (match) {
            return (
              <SyntaxHighlighter
                PreTag="div"
                customStyle={{
                  borderRadius: 6,
                  fontSize: "0.875rem",
                  margin: "0.5rem 0",
                  padding: "0.75rem",
                }}
                language={match[1]}
                style={coy}
              >
                {code}
              </SyntaxHighlighter>
            );
          }

          return (
            <code
              {...props}
              className="rounded bg-white/70 px-1 py-0.5 font-mono text-[0.92em] text-[#7f1d1d]"
            >
              {children}
            </code>
          );
        },
        ol: ({ children }) => (
          <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
        ),
        p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0">{children}</p>,
        pre: ({ children }) => <>{children}</>,
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-description">
              {children}
            </table>
          </div>
        ),
        td: ({ children }) => (
          <td className="border border-[#8aa4c8] px-2 py-1 align-top">
            {children}
          </td>
        ),
        th: ({ children }) => (
          <th className="border border-[#8aa4c8] bg-white/45 px-2 py-1 font-bold">
            {children}
          </th>
        ),
        ul: ({ children }) => (
          <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
        ),
      }}
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </ReactMarkdown>
  );
}
