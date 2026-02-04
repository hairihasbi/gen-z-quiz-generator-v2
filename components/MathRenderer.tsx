import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    MathJax: any;
  }
}

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

const MathRenderer: React.FC<MathRendererProps> = ({ content, className, inline }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.MathJax && ref.current) {
      // Clean previous render
      ref.current.innerHTML = content;
      // Trigger MathJax typeset
      window.MathJax.typesetPromise?.([ref.current]).catch((err: any) => console.log(err));
    }
  }, [content]);

  const Tag = inline ? 'span' : 'div';

  return (
    <Tag ref={ref} className={className}>
      {content}
    </Tag>
  );
};

export default MathRenderer;