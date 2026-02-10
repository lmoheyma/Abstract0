export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GeneratedFiles {
  [path: string]: string;
}

export interface GenerateCodeResponse {
  files: GeneratedFiles;
  message: string;
}

export const SYSTEM_CONTEXT = `You generate React code for a Sandpack environment.

EXPECTED STRUCTURE (follow these paths exactly):
- /App.tsx : main component (export default)
- /index.tsx : entry point (already provided; do not regenerate unless necessary)
- /index.css : global styles (optional)
- /components/*.tsx : subcomponents

RULES:
- Use .tsx (avoid .jsx)
- Tailwind CSS is available
- Assume automatic React imports
- A single App.tsx is sufficient for simple apps
- For larger apps, create components under /components/
- Return only the files you create or modify

EXISTING FILES (edit only if necessary):`;

export function formatExistingFiles(files: Record<string, string>): string {
  const fileEntries = Object.entries(files)
    .filter(([path]) => !path.includes("node_modules"))
    .map(([path, content]) => `--- ${path} ---\n${content}`)
    .join("\n\n");

  return fileEntries || "(no existing files)";
}

export async function generateCode(
  prompt: string,
  context: Message[] = [],
  existingFiles: Record<string, string> = {},
): Promise<GenerateCodeResponse> {
  const filesContext = formatExistingFiles(existingFiles);
  const fullSystemContext = `${SYSTEM_CONTEXT}\n${filesContext}`;

  const messagesWithContext: Message[] = [
    { role: "system", content: fullSystemContext },
    ...context,
    { role: "user", content: prompt },
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        context: messagesWithContext,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const data: GenerateCodeResponse = await response.json();

    if (!data.files || typeof data.files !== "object") {
      throw new Error("Invalid response: 'files' missing or invalid");
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out after 60 seconds.");
      }

      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        throw new Error(`Backend unreachable: ${API_BASE_URL}`);
      }

      throw error;
    }

    throw new Error("Unknown error during generation");
  }
}
