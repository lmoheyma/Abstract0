import { useState, useCallback, useEffect, useMemo } from "react";
import { 
  Folder,
  FolderOpen,
  ChevronRight,
  X,
  FileCode2,
  FileJson,
  FileType,
  FileText,
  File,
  Palette,
  Globe,
  Settings
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Highlight } from "prism-react-renderer";
import { useSandbox } from "@/contexts/SandboxContext";

// File icon component with actual icons based on extension
const FileIcon = ({ filename }: { filename: string }) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const name = filename.toLowerCase();
  
  // Special files
  if (name === 'package.json' || name === 'tsconfig.json') {
    return <Settings className="h-4 w-4 text-amber-500 flex-shrink-0" />;
  }
  
  const iconConfig: Record<string, { icon: React.ElementType; color: string }> = {
    tsx: { icon: FileCode2, color: "text-blue-400" },
    ts: { icon: FileCode2, color: "text-blue-500" },
    jsx: { icon: FileCode2, color: "text-cyan-400" },
    js: { icon: FileCode2, color: "text-yellow-400" },
    css: { icon: Palette, color: "text-purple-400" },
    json: { icon: FileJson, color: "text-yellow-500" },
    html: { icon: Globe, color: "text-orange-500" },
    md: { icon: FileText, color: "text-slate-400" },
    txt: { icon: FileType, color: "text-slate-400" },
  };

  const config = iconConfig[ext || ""] || { icon: File, color: "text-muted-foreground" };
  const IconComponent = config.icon;

  return <IconComponent className={`h-4 w-4 ${config.color} flex-shrink-0`} />;
};

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  isOpen?: boolean;
}

// Thème sombre style VS Code
const darkTheme = {
  plain: {
    color: "#d4d4d4",
    backgroundColor: "transparent",
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "#6a9955", fontStyle: "italic" as const },
    },
    {
      types: ["namespace"],
      style: { opacity: 0.7 },
    },
    {
      types: ["string", "attr-value", "template-string"],
      style: { color: "#ce9178" },
    },
    {
      types: ["punctuation", "operator"],
      style: { color: "#d4d4d4" },
    },
    {
      types: ["entity", "url", "symbol", "number", "boolean", "variable", "constant", "property", "regex", "inserted"],
      style: { color: "#b5cea8" },
    },
    {
      types: ["atrule", "keyword", "attr-name"],
      style: { color: "#c586c0" },
    },
    {
      types: ["function", "deleted", "tag"],
      style: { color: "#dcdcaa" },
    },
    {
      types: ["function-variable"],
      style: { color: "#dcdcaa" },
    },
    {
      types: ["selector", "keyword"],
      style: { color: "#c586c0" },
    },
    {
      types: ["class-name", "maybe-class-name"],
      style: { color: "#4ec9b0" },
    },
    {
      types: ["builtin", "char"],
      style: { color: "#4ec9b0" },
    },
    {
      types: ["important", "bold"],
      style: { fontWeight: "bold" as const },
    },
    {
      types: ["italic"],
      style: { fontStyle: "italic" as const },
    },
  ],
};

// Convertit les fichiers Sandpack (avec /) en chemins normalisés pour l'éditeur
function sandpackToEditorFiles(sandpackFiles: Record<string, string | { code: string }>): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [path, content] of Object.entries(sandpackFiles)) {
    // Retirer le / initial pour l'affichage dans l'arborescence
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    // Le contenu peut être une string ou un objet { code: string }
    const code = typeof content === "string" ? content : content.code;
    result[normalizedPath] = code;
  }
  
  return result;
}

// Convertit un objet plat de fichiers en arborescence
function buildFileTree(files: Record<string, string>): FileNode[] {
  const root: FileNode[] = [];
  
  const sortedPaths = Object.keys(files).sort();
  
  for (const filePath of sortedPaths) {
    const parts = filePath.split("/");
    let currentLevel = root;
    let currentPath = "";
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1;
      
      let existing = currentLevel.find(n => n.name === part);
      
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          isOpen: i === 0, // Ouvrir le premier niveau
          children: isFile ? undefined : [],
        };
        currentLevel.push(existing);
      }
      
      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    }
  }
  
  return root;
}

// Détermine le langage Prism à partir de l'extension
function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    tsx: "tsx",
    ts: "typescript",
    jsx: "jsx",
    js: "javascript",
    css: "css",
    json: "json",
    html: "markup",
    md: "markdown",
  };
  return langMap[ext || ""] || "typescript";
}

const CodeEditor = () => {
  const { sandpackFiles } = useSandbox();
  
  // Convertir les fichiers Sandpack au format éditeur
  const allFiles = useMemo(() => {
    return sandpackToEditorFiles(sandpackFiles);
  }, [sandpackFiles]);
  
  const [activeFile, setActiveFile] = useState("App.tsx");
  const [openTabs, setOpenTabs] = useState(["App.tsx"]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set([]));
  
  const fileTree = useMemo(() => buildFileTree(allFiles), [allFiles]);

  // Quand les fichiers changent, s'assurer que le fichier actif existe
  useEffect(() => {
    const fileKeys = Object.keys(allFiles);
    if (fileKeys.length === 0) return;
    
    if (!allFiles[activeFile]) {
      // Prioriser App.tsx, sinon premier fichier
      const defaultFile = fileKeys.find(f => f === "App.tsx" || f.endsWith("/App.tsx")) || fileKeys[0];
      setActiveFile(defaultFile);
      setOpenTabs([defaultFile]);
    }
  }, [allFiles, activeFile]);

  const toggleFolder = useCallback((path: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const currentCode = allFiles[activeFile] || "// Fichier non trouvé";
  const currentLanguage = getLanguage(activeFile);

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 py-1 px-2 text-sm cursor-pointer hover:bg-accent rounded transition-colors ${
            activeFile === node.path ? "bg-accent text-foreground" : "text-muted-foreground"
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === "file") {
              setActiveFile(node.path);
              if (!openTabs.includes(node.path)) {
                setOpenTabs([...openTabs, node.path]);
              }
            } else {
              toggleFolder(node.path);
            }
          }}
        >
          {node.type === "folder" ? (
            <>
              <ChevronRight 
                className={`h-3 w-3 transition-transform duration-200 ${openFolders.has(node.path) ? "rotate-90" : ""}`} 
              />
              {openFolders.has(node.path) ? (
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Folder className="h-4 w-4 text-muted-foreground" />
              )}
            </>
          ) : (
            <>
              <span className="w-3" />
              <FileIcon filename={node.name} />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {node.type === "folder" && node.children && openFolders.has(node.path) && (
          renderFileTree(node.children, depth + 1)
        )}
      </div>
    ));
  };

  const closeTab = (tab: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== tab);
    setOpenTabs(newTabs);
    if (activeFile === tab && newTabs.length > 0) {
      setActiveFile(newTabs[0]);
    }
  };

  // Extraire le nom de fichier du chemin complet
  const getFileName = (path: string) => path.split("/").pop() || path;

  return (
    <div className="h-full flex bg-background">
      {/* Arborescence des fichiers */}
      <div className="w-48 border-r border-border bg-card flex-shrink-0">
        <div className="p-3 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Explorateur
          </span>
        </div>
        <ScrollArea className="h-[calc(100%-41px)]">
          <div className="py-2">
            {renderFileTree(fileTree)}
          </div>
        </ScrollArea>
      </div>

      {/* Zone d'édition */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Onglets */}
        <div className="h-9 border-b border-border bg-card flex items-center overflow-x-auto">
          {openTabs.map((tab) => (
            <div
              key={tab}
              className={`h-full flex items-center gap-2 px-3 border-r border-border cursor-pointer text-sm flex-shrink-0 transition-colors ${
                activeFile === tab 
                  ? "bg-background text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveFile(tab)}
            >
              <FileIcon filename={getFileName(tab)} />
              <span>{getFileName(tab)}</span>
              <button 
                className="hover:bg-accent rounded p-0.5 transition-colors"
                onClick={(e) => closeTab(tab, e)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Code avec Prism */}
        <ScrollArea className="flex-1 bg-background">
          <Highlight
            theme={darkTheme}
            code={currentCode}
            language={currentLanguage as any}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre 
                className={`${className} p-4 font-mono text-sm leading-6`} 
                style={{ ...style, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })} className="flex hover:bg-accent/50">
                    <span className="w-8 text-muted-foreground select-none text-right pr-4 flex-shrink-0">
                      {i + 1}
                    </span>
                    <span>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CodeEditor;
