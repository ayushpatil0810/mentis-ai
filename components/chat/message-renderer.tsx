import React, { memo, useMemo } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";

export const MessageRenderer = memo(function MessageRenderer({ content }: { content: string }) {
  const components: Components = useMemo(() => ({
    code(props) {
      const { node, className, children, ...rest } = props;
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "text";
      const isInline = !(props as any).inline && match;
      return isInline ? (
        <CodeBlock 
          language={language} 
          value={String(children).replace(/\n$/, "")} 
        />
      ) : (
        <code className={`${className} bg-muted px-1.5 py-0.5 rounded-sm font-mono text-sm`} {...rest}>
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
      <a href={href || "#"} className="text-primary hover:underline underline-offset-4" target="_blank" rel="noreferrer">
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
  }), []);

  return (
    <div className="w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
