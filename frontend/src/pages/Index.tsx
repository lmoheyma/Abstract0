import { useEffect, useState } from "react";
import Header from "@/components/Header";
import IconSidebar from "@/components/IconSidebar";
import ChatPanel from "@/components/ChatPanel";
import CodeEditor from "@/components/CodeEditor";
import PreviewPanel from "@/components/PreviewPanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SandboxProvider } from "@/contexts/SandboxContext";
import { useProjects } from "@/hooks/useProjects";

const Index = () => {
  const [rightPanel, setRightPanel] = useState<"code" | "preview">("code");
  const projectsState = useProjects();

  // Start in dark mode by default
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <SandboxProvider projectsState={projectsState}>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header projectsState={projectsState} />
        
        <div className="flex-1 flex overflow-hidden min-h-0">
          <IconSidebar activePanel={rightPanel} onPanelChange={setRightPanel} />
          
          <div className="flex-1 overflow-hidden min-h-0">
            <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
              {/* Chat Panel */}
              <ResizablePanel defaultSize={25} minSize={25} maxSize={45} className="min-h-0">
                <ChatPanel projectId={projectsState.currentProjectId} />
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Right Panel - Code OR Preview */}
              <ResizablePanel defaultSize={70} minSize={55} className="min-h-0">
                {rightPanel === "code" ? <CodeEditor /> : <PreviewPanel />}
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    </SandboxProvider>
  );
};

export default Index;
