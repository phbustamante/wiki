import { useCallback, useRef, useState } from "react";

/** Copia texto para a área de transferência com feedback temporário. */
export function useCopy(resetMs = 1800) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const copiar = useCallback(
    async (texto: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(texto);
        } else {
          // Fallback para contextos sem Clipboard API.
          const ta = document.createElement("textarea");
          ta.value = texto;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopiado(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopiado(false), resetMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetMs]
  );

  return { copiado, copiar };
}
