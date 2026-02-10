import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from "react";
import { generateCode, GeneratedFiles, Message } from "@/services/api";
import { mergeWithTemplate } from "@/services/sandpack";
import { useFileStreaming, FileStreamingState } from "@/hooks/useFileStreaming";
import type { SandpackFiles } from "@codesandbox/sandpack-react";
import type { useProjects } from "@/hooks/useProjects";

export type GenerationStatus = "idle" | "generating" | "ready" | "error";

type ProjectsState = ReturnType<typeof useProjects>;

interface SandboxContextType {
  status: GenerationStatus;
  files: GeneratedFiles;
  sandpackFiles: SandpackFiles;
  error: string | null;
  aiMessage: string | null;
  isReady: boolean;
  generate: (prompt: string, context: Message[]) => Promise<void>;
  fileStreaming: FileStreamingState;
}

const SandboxContext = createContext<SandboxContextType | null>(null);

interface SandboxProviderProps {
  children: ReactNode;
  projectsState: ProjectsState;
}

export function SandboxProvider({ children, projectsState }: SandboxProviderProps) {
  const { projectFiles, updateProjectFiles, currentProjectId } = projectsState;
  
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [files, setFiles] = useState<GeneratedFiles>({});
  const [error, setError] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const { state: fileStreaming, startStreaming } = useFileStreaming();

  const generate = useCallback(async (prompt: string, context: Message[]) => {
    setError(null);
    setAiMessage(null);

    const existingFiles: Record<string, string> = {};
    for (const [path, fileOrContent] of Object.entries(projectFiles)) {
      if (typeof fileOrContent === 'string') {
        existingFiles[path] = fileOrContent;
      } else if (fileOrContent && typeof fileOrContent === 'object' && 'code' in fileOrContent) {
        existingFiles[path] = fileOrContent.code;
      }
    }

    try {
      setStatus("generating");
      const response = await generateCode(prompt, context, existingFiles);

      setFiles(response.files);
      setAiMessage(response.message);

      const mergedFiles = mergeWithTemplate(response.files);
      
      const updatedFiles: SandpackFiles = { ...projectFiles };
      for (const [path, content] of Object.entries(mergedFiles)) {
        updatedFiles[path] = content;
      }
      
      updateProjectFiles(updatedFiles);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
      throw err;
    }
  }, [projectFiles, updateProjectFiles]);

  useEffect(() => {
    if (status === "ready" && Object.keys(files).length > 0) {
      startStreaming(files);
    }
  }, [status, files, startStreaming]);

  useEffect(() => {
    setStatus("idle");
    setFiles({});
    setError(null);
    setAiMessage(null);
  }, [currentProjectId]);

  return (
    <SandboxContext.Provider
      value={{
        status,
        files,
        sandpackFiles: projectFiles,
        error,
        aiMessage,
        isReady: true,
        generate,
        fileStreaming,
      }}
    >
      {children}
    </SandboxContext.Provider>
  );
}

export function useSandbox(): SandboxContextType {
  const context = useContext(SandboxContext);
  if (!context) {
    throw new Error("useSandbox must be used within a SandboxProvider");
  }
  return context;
}
