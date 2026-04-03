import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MirandaMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-table:my-2 prose-pre:my-2 prose-hr:my-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-2 rounded-lg border border-border">
              <table className="w-full text-xs" {...props}>{children}</table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-surface" {...props}>{children}</thead>
          ),
          th: ({ children, ...props }) => (
            <th className="px-3 py-2 text-left font-semibold text-foreground border-b border-border" {...props}>{children}</th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-3 py-1.5 text-muted-foreground border-b border-border" {...props}>{children}</td>
          ),
          code: ({ children, className, ...props }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className={`block bg-surface rounded-lg p-3 text-xs text-foreground overflow-x-auto ${className || ""}`} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-surface text-brand px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="bg-surface rounded-lg overflow-x-auto my-2">{children}</pre>,
          ul: ({ children, ...props }) => <ul className="list-disc pl-4 space-y-0.5" {...props}>{children}</ul>,
          ol: ({ children, ...props }) => <ol className="list-decimal pl-4 space-y-0.5" {...props}>{children}</ol>,
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-3 border-brand pl-3 italic text-muted-foreground my-2" {...props}>{children}</blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
