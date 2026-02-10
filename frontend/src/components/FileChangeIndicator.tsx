import { FileChange } from "@/hooks/useFileStreaming";
import { Check, FileCode, Loader2 } from "lucide-react";

interface FileChangeIndicatorProps {
  changes: FileChange[];
  currentFile: string | null;
}

const FileChangeIndicator = ({ changes, currentFile }: FileChangeIndicatorProps) => {
  if (changes.length === 0) return null;

  const getDiff = (change: FileChange): { lines: number; sign: "+" | "-" | "=" } => {
    const diff = change.newLines - change.oldLines;
    if (diff > 0) return { lines: diff, sign: "+" };
    if (diff < 0) return { lines: Math.abs(diff), sign: "-" };
    return { lines: 0, sign: "=" };
  };

  const getStatusIcon = (change: FileChange) => {
    switch (change.status) {
      case "pending":
        return <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />;
      case "writing":
        return <Loader2 className="w-3 h-3 text-primary animate-spin" />;
      case "complete":
        return <Check className="w-3 h-3 text-green-500" />;
    }
  };

  const getFileName = (path: string) => path.split("/").pop() || path;
  const getFileDir = (path: string) => {
    const parts = path.split("/");
    return parts.length > 1 ? parts.slice(0, -1).join("/") + "/" : "";
  };

  return (
    <div className="space-y-1.5">
      {changes.map((change) => {
        const diff = getDiff(change);
        const isActive = change.path === currentFile;
        
        return (
          <div
            key={change.path}
            className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-md transition-all ${
              isActive 
                ? "bg-primary/10 border border-primary/20" 
                : change.status === "complete"
                  ? "bg-accent/50"
                  : "bg-transparent"
            }`}
          >
            {/* Status icon */}
            <div className="flex-shrink-0">
              {getStatusIcon(change)}
            </div>

            {/* File icon */}
            <FileCode className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />

            {/* File path */}
            <div className="flex-1 min-w-0 flex items-center gap-0.5">
              <span className="text-muted-foreground/60 truncate">
                {getFileDir(change.path)}
              </span>
              <span className={`font-medium truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                {getFileName(change.path)}
              </span>
            </div>

            {/* Progress bar (when writing) */}
            {change.status === "writing" && (
              <div className="w-12 h-1 bg-muted rounded-full overflow-hidden flex-shrink-0">
                <div 
                  className="h-full bg-primary transition-all duration-150 ease-out"
                  style={{ width: `${change.progress}%` }}
                />
              </div>
            )}

            {/* Line diff */}
            {change.status === "complete" && (
              <span className={`font-mono text-[11px] flex-shrink-0 ${
                diff.sign === "+" 
                  ? "text-green-500" 
                  : diff.sign === "-" 
                    ? "text-red-500" 
                    : "text-muted-foreground"
              }`}>
                {diff.sign}{diff.lines} {diff.lines === 1 ? "ligne" : "lignes"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FileChangeIndicator;
