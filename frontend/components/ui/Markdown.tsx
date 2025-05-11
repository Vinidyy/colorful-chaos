import React from 'react';
import ReactMarkdown from 'react-markdown';

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        a: ({ node, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600 hover:text-blue-800"
          />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
