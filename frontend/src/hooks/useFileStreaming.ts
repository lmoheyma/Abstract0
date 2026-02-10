import { useState, useCallback, useRef } from "react";

export interface FileChange {
  path: string;
  status: "pending" | "writing" | "complete";
  oldLines: number;
  newLines: number;
  progress: number;
}

export interface FileStreamingState {
  isStreaming: boolean;
  currentFile: string | null;
  changes: FileChange[];
}

interface UseFileStreamingResult {
  state: FileStreamingState;
  startStreaming: (files: Record<string, string>) => Promise<void>;
  restore: (files: Record<string, string>) => void;
  reset: () => void;
}

export function useFileStreaming(): UseFileStreamingResult {
  const [state, setState] = useState<FileStreamingState>({
    isStreaming: false,
    currentFile: null,
    changes: [],
  });

  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const clearTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimeouts();
    setState({
      isStreaming: false,
      currentFile: null,
      changes: [],
    });
  }, [clearTimeouts]);

  const restore = useCallback((files: Record<string, string>) => {
    clearTimeouts();
    
    const countLines = (content: string) => content.split('\n').length;
    
    const changes: FileChange[] = Object.entries(files).map(([path, content]) => ({
      path,
      status: "complete",
      oldLines: 0,
      newLines: countLines(content),
      progress: 100,
    }));

    setState({
      isStreaming: false,
      currentFile: null,
      changes,
    });
  }, [clearTimeouts]);

  const startStreaming = useCallback(async (files: Record<string, string>) => {
    clearTimeouts();
    
    const filePaths = Object.keys(files);
    const countLines = (content: string) => content.split('\n').length;
    
    const initialChanges: FileChange[] = filePaths.map(path => ({
      path,
      status: "pending",
      oldLines: 0,
      newLines: countLines(files[path]),
      progress: 0,
    }));

    setState({
      isStreaming: true,
      currentFile: null,
      changes: initialChanges,
    });

    let delay = 0;
    
    for (let i = 0; i < filePaths.length; i++) {
      const path = filePaths[i];
      const fileContent = files[path];
      const fileSize = fileContent.length;
      
      const startDelay = delay;
      timeoutRefs.current.push(
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            currentFile: path,
            changes: prev.changes.map(c => 
              c.path === path ? { ...c, status: "writing" } : c
            ),
          }));
        }, startDelay)
      );
      delay += 100;

      const steps = 5;
      const stepDuration = Math.min(300, fileSize / 10);
      
      for (let step = 1; step <= steps; step++) {
        const progressDelay = delay;
        const progressValue = Math.round((step / steps) * 100);
        
        timeoutRefs.current.push(
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              changes: prev.changes.map(c => 
                c.path === path ? { ...c, progress: progressValue } : c
              ),
            }));
          }, progressDelay)
        );
        delay += stepDuration;
      }

      timeoutRefs.current.push(
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            currentFile: i < filePaths.length - 1 ? filePaths[i + 1] : null,
            changes: prev.changes.map(c => 
              c.path === path ? { ...c, status: "complete", progress: 100 } : c
            ),
          }));
        }, delay)
      );
      delay += 150;
    }

    timeoutRefs.current.push(
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isStreaming: false,
          currentFile: null,
        }));
      }, delay + 200)
    );
  }, [clearTimeouts]);

  return {
    state,
    startStreaming,
    restore,
    reset,
  };
}
