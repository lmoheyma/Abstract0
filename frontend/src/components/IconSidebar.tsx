import { Code, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface IconSidebarProps {
  activePanel: "code" | "preview";
  onPanelChange: (panel: "code" | "preview") => void;
}

const IconSidebar = ({ activePanel, onPanelChange }: IconSidebarProps) => {
  const mainButtons = [
    { id: "code" as const, icon: Code, label: "Éditeur de code" },
    { id: "preview" as const, icon: Eye, label: "Aperçu" },
  ];

  return (
    <aside className="w-12 border-r border-border bg-sidebar flex flex-col items-center py-3 gap-1">
      <div className="flex flex-col gap-1">
        {mainButtons.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 transition-colors ${
                  activePanel === item.id 
                    ? "bg-accent text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                onClick={() => onPanelChange(item.id)}
              >
                <item.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </aside>
  );
};

export default IconSidebar;
