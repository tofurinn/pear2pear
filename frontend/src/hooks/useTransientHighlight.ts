import { useCallback, useEffect, useRef, useState } from 'react';

export function useTransientHighlight(duration = 2500) {
  const [highlightedID, setHighlightedID] = useState<string | null>(null);
  const clearTimerRef = useRef<number | null>(null);
  const startTimerRef = useRef<number | null>(null);

  const highlightItem = useCallback((id: string) => {
    if (clearTimerRef.current !== null) window.clearTimeout(clearTimerRef.current);
    if (startTimerRef.current !== null) window.clearTimeout(startTimerRef.current);

    setHighlightedID(null);
    startTimerRef.current = window.setTimeout(() => {
      setHighlightedID(id);
      startTimerRef.current = null;
      clearTimerRef.current = window.setTimeout(() => {
        setHighlightedID(null);
        clearTimerRef.current = null;
      }, duration);
    }, 0);
  }, [duration]);

  useEffect(() => () => {
    if (clearTimerRef.current !== null) window.clearTimeout(clearTimerRef.current);
    if (startTimerRef.current !== null) window.clearTimeout(startTimerRef.current);
  }, []);

  return { highlightedID, highlightItem };
}
