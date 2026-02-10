import type { SandpackTheme } from "@codesandbox/sandpack-react";

/**
 * Thème Sandpack personnalisé - Style ChatGPT/Shadcn
 * Reprend les couleurs du design system (HSL 262 83% 58% pour le violet)
 */
export const customDarkTheme: SandpackTheme = {
  colors: {
    // Surfaces
    surface1: "hsl(0 0% 4%)",      // --background
    surface2: "hsl(0 0% 7%)",      // --card
    surface3: "hsl(0 0% 14%)",     // --accent

    // Boutons et interactions
    clickable: "hsl(0 0% 55%)",    // --muted-foreground
    base: "hsl(0 0% 95%)",         // --foreground
    disabled: "hsl(0 0% 25%)",
    hover: "hsl(0 0% 95%)",
    
    // Accents
    accent: "hsl(262 83% 58%)",    // --primary (violet)
    error: "hsl(0 62% 50%)",       // --destructive
    errorSurface: "hsl(0 62% 15%)",
  },
  
  syntax: {
    // Commentaires
    plain: "hsl(0 0% 83%)",
    comment: {
      color: "hsl(0 0% 45%)",
      fontStyle: "italic",
    },
    
    // Mots-clés (const, let, function, return, etc.)
    keyword: "hsl(262 83% 70%)",   // Violet clair
    
    // Tags JSX et HTML
    tag: "hsl(262 83% 65%)",
    
    // Opérateurs et ponctuation
    punctuation: "hsl(0 0% 60%)",
    
    // Définitions (noms de fonctions, classes)
    definition: "hsl(190 75% 65%)", // Cyan
    
    // Propriétés
    property: "hsl(190 75% 70%)",
    
    // Valeurs statiques (nombres, booléens)
    static: "hsl(35 90% 65%)",     // Orange doré
    
    // Chaînes de caractères
    string: "hsl(140 55% 60%)",    // Vert
  },
  
  font: {
    body: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    size: "13px",
    lineHeight: "1.6",
  },
};

export const customLightTheme: SandpackTheme = {
  colors: {
    surface1: "hsl(0 0% 100%)",
    surface2: "hsl(0 0% 98%)",
    surface3: "hsl(0 0% 96%)",
    clickable: "hsl(0 0% 45%)",
    base: "hsl(0 0% 9%)",
    disabled: "hsl(0 0% 75%)",
    hover: "hsl(0 0% 9%)",
    accent: "hsl(262 83% 58%)",
    error: "hsl(0 84% 60%)",
    errorSurface: "hsl(0 84% 95%)",
  },
  
  syntax: {
    plain: "hsl(0 0% 20%)",
    comment: {
      color: "hsl(0 0% 55%)",
      fontStyle: "italic",
    },
    keyword: "hsl(262 83% 50%)",
    tag: "hsl(262 83% 45%)",
    punctuation: "hsl(0 0% 45%)",
    definition: "hsl(190 75% 35%)",
    property: "hsl(190 75% 40%)",
    static: "hsl(35 90% 40%)",
    string: "hsl(140 55% 35%)",
  },
  
  font: {
    body: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    size: "13px",
    lineHeight: "1.6",
  },
};
