import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export function MessageRenderer({ content }: { content: string }) {
  return (
    <div className="w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              style={atomDark}
              language={match[1]}
              PreTag="div"
              className="rounded-md my-4"
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className={`${className} bg-muted px-1.5 py-0.5 rounded-sm font-mono text-sm`} {...props}>
              {children}
            </code>
          );
        },
        h1: ({ children }) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-2xl font-bold mt-5 mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>,
        p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-primary hover:underline underline-offset-4" target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse border border-border">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border border-border bg-muted p-2 text-left">{children}</th>,
        td: ({ children }) => <td className="border border-border p-2">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
