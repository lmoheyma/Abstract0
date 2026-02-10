import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useStreamingText } from "@/hooks/useStreamingText";

interface StreamingMessageProps {
  content: string;
  onComplete?: () => void;
}

const StreamingMessage = ({ content, onComplete }: StreamingMessageProps) => {
  const { displayedText, isStreaming, startStreaming } = useStreamingText({
    charDelay: 10,
    initialDelay: 150,
  });
  
  const hasStartedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!hasStartedRef.current && content) {
      hasStartedRef.current = true;
      startStreaming(content);
    }
  }, [content, startStreaming]);

  useEffect(() => {
    if (!isStreaming && displayedText === content && onCompleteRef.current) {
      onCompleteRef.current();
    }
  }, [isStreaming, displayedText, content]);

  return (
    <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-200">
      <div className="max-w-[90%]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground">Abstract0</span>
          {isStreaming && (
            <span className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
            </span>
          )}
        </div>
        <div className="text-sm leading-relaxed text-foreground/90 prose prose-sm prose-invert max-w-none">
          <ReactMarkdown>{displayedText}</ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-0.5 h-[14px] bg-primary ml-0.5 animate-pulse rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamingMessage;
