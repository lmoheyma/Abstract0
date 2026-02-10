import type { SandpackFiles } from "@codesandbox/sandpack-react";

export const baseTemplate: SandpackFiles = {
  "/App.tsx": `export default function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Welcome</h1>
      <p>The workspace is ready. Use the generator to add components.</p>
    </div>
  );
}`,
  "/index.tsx": `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  "/index.css": `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}`,
};

export function convertToSandpackFiles(
  files: Record<string, string>
): SandpackFiles {
  const sandpackFiles: SandpackFiles = {};

  for (const [path, content] of Object.entries(files)) {
    let normalizedPath = path;

    if (normalizedPath.startsWith("src/")) {
      normalizedPath = normalizedPath.slice(4);
    }

    if (!normalizedPath.startsWith("/")) {
      normalizedPath = "/" + normalizedPath;
    }

    sandpackFiles[normalizedPath] = content;
  }

  return sandpackFiles;
}

export function mergeWithTemplate(
  generatedFiles: Record<string, string>
): SandpackFiles {
  const converted = convertToSandpackFiles(generatedFiles);
  
  const result: SandpackFiles = { ...baseTemplate };
  
  for (const path of Object.keys(converted)) {
    const basePath = path.replace(/\.(jsx|tsx|js|ts)$/, "");
    const extensions = [".tsx", ".ts", ".jsx", ".js"];
    
    for (const ext of extensions) {
      const templatePath = basePath + ext;
      if (templatePath !== path && result[templatePath]) {
        delete result[templatePath];
      }
    }
  }
  
  return {
    ...result,
    ...converted,
  };
}
