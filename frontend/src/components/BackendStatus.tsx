import { useState, useEffect } from "react";
import { Circle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { API_BASE_URL } from "@/services/api";

type ConnectionStatus = "checking" | "connected" | "disconnected" | "mock";

const BackendStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>("checking");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        setStatus(response.ok ? "connected" : "disconnected");
      } catch {
        // Try a simple HEAD request as fallback
        try {
          const response = await fetch(API_BASE_URL, {
            method: "HEAD",
            signal: AbortSignal.timeout(5000),
          });
          setStatus(response.ok ? "connected" : "disconnected");
        } catch {
          setStatus("disconnected");
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    checking: {
      color: "text-muted-foreground",
      label: "Vérification...",
      pulse: true,
    },
    connected: {
      color: "text-green-500",
      label: `Connecté à ${API_BASE_URL}`,
      pulse: false,
    },
    disconnected: {
      color: "text-destructive",
      label: "Backend déconnecté",
      pulse: false,
    },
    mock: {
      color: "text-yellow-500",
      label: "Mode simulation",
      pulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-accent transition-colors">
          <Circle
            className={`h-2 w-2 fill-current ${config.color} ${config.pulse ? "animate-pulse" : ""}`}
          />
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {status === "connected" ? "Code Agent" : status === "checking" ? "..." : "Offline"}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{config.label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default BackendStatus;
