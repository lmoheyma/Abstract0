import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSandbox } from "@/contexts/SandboxContext";
import { Message } from "@/services/api";
import StreamingMessage from "./StreamingMessage";
import FileChangeIndicator from "./FileChangeIndicator";
import { useChatMessages, ChatMessage } from "@/hooks/useChatMessages";

const suggestions = ["Modern landing page", "Contact form", "Interactive counter"] as const;
interface ChatPanelProps {
  projectId: string | null;
}
const ChatPanel = ({
  projectId
}: ChatPanelProps) => {
  const {
    status,
    error,
    aiMessage,
    generate,
    isReady,
    fileStreaming,
    files: generatedFiles,
    restoreFileStreaming
  } = useSandbox();
  const [message, setMessage] = useState("");
  const {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    isLoading
  } = useChatMessages(projectId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProcessing = status === "generating";
  const statusMessage = status === "generating" ? "Generating code..." : null;
  useEffect(() => {
    if (!aiMessage) return;
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg?.type === "ai" && lastMsg.content === aiMessage) {
        return prev;
      }
      return [...prev, {
        id: Date.now(),
        type: "ai",
        content: aiMessage,
        isStreaming: true,
        files: generatedFiles
      }];
    });
  }, [aiMessage, generatedFiles, setMessages]);

  const handleStreamingComplete = useCallback((messageId: number) => {
    updateMessage(messageId, {
      isStreaming: false
    });
  }, [updateMessage]);
  
  // Restore file streaming state when messages are loaded
  useEffect(() => {
    if (isLoading || messages.length === 0) return;
    
    // Find the last AI message with files
    const lastAiMessageWithFiles = [...messages]
      .reverse()
      .find(msg => msg.type === "ai" && msg.files && Object.keys(msg.files).length > 0);
    
    if (lastAiMessageWithFiles && lastAiMessageWithFiles.files) {
      restoreFileStreaming(lastAiMessageWithFiles.files);
    }
  }, [isLoading, messages, restoreFileStreaming]);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);
  const handleSendMessage = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: "user",
      content: trimmed
    };
    addMessage(userMessage);
    setMessage("");

    const context: Message[] = messages.map(m => ({
      role: m.type === "user" ? "user" : "assistant",
      content: m.content
    }));

    try {
      await generate(trimmed, context);
    } catch (err) {
      console.error("Generation error:", err);
    }
  }, [addMessage, generate, isProcessing, message, messages]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setMessage(suggestion);
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const renderMessage = useCallback((msg: ChatMessage) => {
    if (msg.type === "user") {
      return <div className="flex justify-end animate-in slide-in-from-bottom-2 duration-200">
          <div className="max-w-[80%] bg-muted rounded-2xl rounded-br-sm px-4 py-2.5">
            <p className="text-sm text-foreground leading-relaxed">{msg.content}</p>
          </div>
        </div>;
    }
    if (msg.isStreaming) {
      return <StreamingMessage content={msg.content} onComplete={() => handleStreamingComplete(msg.id)} />;
    }
    return <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-200">
        <div className="max-w-[90%]">
          <span className="text-xs font-medium text-muted-foreground mb-1">Abstract0</span>
          <div className="text-sm leading-relaxed text-foreground/90 prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        </div>
      </div>;
  }, [handleStreamingComplete]);
  return <div className="h-full flex flex-col bg-background">
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-6">
          {/* Welcome state */}
          {messages.length === 0 && <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
              <h2 className="text-4xl md:text-5xl text-foreground mb-4 italic" style={{
            fontFamily: "'Cormorant Garamond', serif"
          }}>
                {isReady ? "Let's get started." : "Initializing..."}
              </h2>
              <p className="text-sm text-muted-foreground/70 text-center max-w-[300px] leading-relaxed font-light">
                {isReady ? "Describe your project and I'll handle the rest." : "Preparing workspace..."}
              </p>
            </div>}

          {/* Messages */}
          {messages.map(msg => <div key={msg.id}>{renderMessage(msg)}</div>)}
          
          {/* Processing indicator */}
          {isProcessing && !fileStreaming.isStreaming && <div className="flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2 px-3 py-2 rounded-full">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">{statusMessage}</span>
              </div>
            </div>}

          {/* Error */}
          {error && <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20 animate-in slide-in-from-bottom-2 duration-200">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive/90 leading-relaxed">{error}</p>
            </div>}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        {/* File changes - Above input */}
        {(fileStreaming.isStreaming || fileStreaming.changes.length > 0) && <Collapsible defaultOpen className="px-4 pt-3">
            <CollapsibleTrigger className="w-full group">
              <div className="flex items-center gap-2 mb-2 cursor-pointer">
                <div className="h-px flex-1 bg-border" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {fileStreaming.isStreaming ? "Writing..." : `${fileStreaming.changes.length} file${fileStreaming.changes.length > 1 ? "s" : ""}`}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down pb-2">
              <FileChangeIndicator changes={fileStreaming.changes} currentFile={fileStreaming.currentFile} />
            </CollapsibleContent>
          </Collapsible>}

        <div className="p-4 pt-2">
        {/* Suggestions */}
        {messages.length === 0 && <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-thin">
          {suggestions.map((suggestion) => <button key={suggestion} onClick={() => handleSuggestionClick(suggestion)} disabled={!isReady} className="text-xs px-4 rounded-xl border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground hover:border-primary/30 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed py-[6px]">
            {suggestion}
              </button>)}
          </div>}

        {/* Input field */}
        <div className="relative">
          <div className="relative bg-card rounded-2xl border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-lg shadow-black/5">
            <textarea ref={textareaRef} value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder={isReady ? "Describe what you'd like to create..." : "Initializing..."} disabled={!isReady || isProcessing} className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 resize-none px-4 py-3.5 pr-14 focus:outline-none min-h-[52px] max-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed" rows={1} />
            <button onClick={handleSendMessage} disabled={!message.trim() || !isReady || isProcessing} className={`absolute right-2.5 bottom-2.5 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${message.trim() && isReady && !isProcessing ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 active:scale-95" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>;
};
export default ChatPanel;