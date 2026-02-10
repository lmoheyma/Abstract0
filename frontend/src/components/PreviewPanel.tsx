import { useState } from "react";
import { 
  Smartphone, 
  Tablet, 
  Monitor,
  RotateCcw,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSandbox } from "@/contexts/SandboxContext";
import {
  SandpackProvider,
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import { customDarkTheme } from "@/themes/sandpackTheme";

type DeviceType = "mobile" | "tablet" | "desktop";

const PreviewAddressBar = () => {
  return (
    <div className="flex-1 bg-accent rounded-md px-3 py-1">
      <span className="text-xs text-muted-foreground truncate block">
        localhost:3000/
      </span>
    </div>
  );
};

const PreviewPanel = () => {
  const { sandpackFiles, status, error } = useSandbox();
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const deviceWidths = {
    mobile: "375px",
    tablet: "768px", 
    desktop: "100%"
  };

  const devices = [
    { id: "mobile" as DeviceType, icon: Smartphone, label: "Mobile" },
    { id: "tablet" as DeviceType, icon: Tablet, label: "Tablet" },
    { id: "desktop" as DeviceType, icon: Monitor, label: "Desktop" },
  ];

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const isGenerating = status === "generating";

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Preview */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Loading state */}
        {isGenerating && (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <div className="text-center">
              <p className="font-medium">Generating code...</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                The AI is generating your application
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isGenerating && (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-destructive p-8">
            <AlertCircle className="h-8 w-8" />
            <div className="text-center">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Sandpack Preview */}
        {!isGenerating && !error && (
          <SandpackProvider
            key={refreshKey}
            template="react-ts"
            files={sandpackFiles}
            theme={customDarkTheme}
            options={{
              externalResources: [
                "https://cdn.tailwindcss.com",
              ],
            }}
          >
            {/* Toolbar inside provider for navigation access */}
            <div className="h-10 border-b border-border bg-card flex items-center justify-between px-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <PreviewAddressBar />
              </div>
              <div className="flex items-center gap-1">
                {devices.map((d) => (
                  <Tooltip key={d.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${
                          device === d.id 
                            ? "bg-accent text-foreground" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setDevice(d.id)}
                      >
                        <d.icon className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{d.label}</TooltipContent>
                  </Tooltip>
                ))}
                <div className="h-4 w-px bg-border mx-1" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={handleRefresh}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div 
              className="bg-background overflow-hidden transition-all duration-300 border-x border-border animate-fade-in flex flex-col flex-1"
              style={{ 
                width: deviceWidths[device],
                maxWidth: "100%",
                height: device === "desktop" ? "100%" : "667px",
                margin: device !== "desktop" ? "0 auto" : undefined,
              }}
            >
              <SandpackPreview
                style={{ height: "100%", width: "100%", flex: 1 }}
                showNavigator={false}
                showRefreshButton={false}
              />
            </div>
          </SandpackProvider>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
