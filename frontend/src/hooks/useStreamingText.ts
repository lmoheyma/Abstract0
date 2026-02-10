import { useState, useCallback, useRef } from "react";

interface UseStreamingTextOptions {
  /** Vitesse de frappe en ms par caractère */
  charDelay?: number;
  /** Délai initial avant de commencer à taper */
  initialDelay?: number;
}

interface UseStreamingTextResult {
  /** Texte actuellement affiché */
  displayedText: string;
  /** Est-ce que le streaming est en cours */
  isStreaming: boolean;
  /** Démarre le streaming d'un nouveau texte */
  startStreaming: (fullText: string) => void;
  /** Arrête le streaming et affiche tout le texte */
  skipToEnd: () => void;
  /** Réinitialise le texte */
  reset: () => void;
}

export function useStreamingText(options: UseStreamingTextOptions = {}): UseStreamingTextResult {
  const { charDelay = 15, initialDelay = 300 } = options;
  
  const [displayedText, setDisplayedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  
  const fullTextRef = useRef("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const streamNextChunk = useCallback(() => {
    const fullText = fullTextRef.current;
    const currentIndex = currentIndexRef.current;
    
    if (currentIndex >= fullText.length) {
      setIsStreaming(false);
      return;
    }

    // Ajouter plusieurs caractères à la fois pour une vitesse plus naturelle
    // Plus de caractères si c'est un espace ou ponctuation (effet de "burst")
    let charsToAdd = 1;
    const nextChar = fullText[currentIndex];
    
    if (nextChar === " " || nextChar === "." || nextChar === "," || nextChar === "!") {
      charsToAdd = Math.min(3, fullText.length - currentIndex);
    }
    
    const newIndex = Math.min(currentIndex + charsToAdd, fullText.length);
    currentIndexRef.current = newIndex;
    setDisplayedText(fullText.slice(0, newIndex));

    // Calculer le délai pour le prochain chunk
    let delay = charDelay;
    if (nextChar === "." || nextChar === "!" || nextChar === "?") {
      delay = charDelay * 8; // Pause plus longue après une phrase
    } else if (nextChar === ",") {
      delay = charDelay * 3; // Petite pause après une virgule
    }

    timeoutRef.current = setTimeout(streamNextChunk, delay);
  }, [charDelay]);

  const startStreaming = useCallback((fullText: string) => {
    clearTimer();
    fullTextRef.current = fullText;
    currentIndexRef.current = 0;
    setDisplayedText("");
    setIsStreaming(true);
    
    // Délai initial avant de commencer
    timeoutRef.current = setTimeout(streamNextChunk, initialDelay);
  }, [clearTimer, streamNextChunk, initialDelay]);

  const skipToEnd = useCallback(() => {
    clearTimer();
    setDisplayedText(fullTextRef.current);
    setIsStreaming(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    fullTextRef.current = "";
    currentIndexRef.current = 0;
    setDisplayedText("");
    setIsStreaming(false);
  }, [clearTimer]);

  return {
    displayedText,
    isStreaming,
    startStreaming,
    skipToEnd,
    reset,
  };
}
