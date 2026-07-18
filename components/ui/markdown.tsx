import { cn } from "@/lib/utils"
import { marked } from "marked"
import { memo, useId, useMemo, useState } from "react"
import ReactMarkdown, { Components } from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from "./code-block"
import { Button } from "./button"
import { Copy01Icon, Tick01Icon } from "hugeicons-react"

export type MarkdownProps = {
  children: string
  id?: string
  className?: string
  components?: Partial<Components>
}

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown)
  return tokens.map((token) => token.raw)
}

function extractLanguage(className?: string): string {
  if (!className) return "plaintext"
  const match = className.match(/language-(\w+)/)
  return match ? match[1] : "plaintext"
}

function CodeBlockWrapper({ className, children, ...props }: any) {
  const isInline =
    !props.node?.position?.start.line ||
    props.node?.position?.start.line === props.node?.position?.end.line

  if (isInline) {
    return (
      <span
        className={cn(
          "bg-primary-foreground rounded-sm px-1 font-mono text-sm",
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }

  const language = extractLanguage(className)
  const code = children as string

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <CodeBlock className={cn("my-4", className)}>
      <CodeBlockGroup className="border-border border-b py-2 pr-2 pl-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary rounded px-2 py-1 text-xs font-medium uppercase tracking-wider">
            {language}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? (
            <Tick01Icon className="h-4 w-4 text-green-500" />
          ) : (
            <Copy01Icon className="h-4 w-4" />
          )}
        </Button>
      </CodeBlockGroup>
      <CodeBlockCode code={code} language={language} />
    </CodeBlock>
  )
}

const INITIAL_COMPONENTS: Partial<Components> = {
  code: CodeBlockWrapper,
  pre: function PreComponent({ children }) {
    return <>{children}</>
  },
}

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = INITIAL_COMPONENTS,
  }: {
    content: string
    components?: Partial<Components>
  }) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    )
  },
  function propsAreEqual(prevProps, nextProps) {
    return prevProps.content === nextProps.content
  }
)

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock"

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
}: MarkdownProps) {
  const generatedId = useId()
  const blockId = id ?? generatedId
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children])

  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock
          key={`${blockId}-block-${index}`}
          content={block}
          components={components}
        />
      ))}
    </div>
  )
}

const Markdown = memo(MarkdownComponent)
Markdown.displayName = "Markdown"

export { Markdown }
