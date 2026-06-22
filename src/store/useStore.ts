import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ComandoGerado } from "@/types";

export type Theme = "light" | "dark" | "system";

const HISTORICO_MAX = 30;

interface AppState {
  theme: Theme;
  setTheme: (t: Theme) => void;

  historico: ComandoGerado[];
  favoritos: ComandoGerado[];

  registrarHistorico: (item: Omit<ComandoGerado, "id" | "criadoEm">) => void;
  limparHistorico: () => void;

  alternarFavorito: (item: Omit<ComandoGerado, "id" | "criadoEm">) => void;
  isFavorito: (resultado: string) => boolean;
  removerFavorito: (id: string) => void;
}

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),

      historico: [],
      favoritos: [],

      registrarHistorico: (item) =>
        set((s) => {
          // Evita duplicar a entrada mais recente idêntica.
          const semDuplicado = s.historico.filter(
            (h) => h.resultado !== item.resultado
          );
          const novo: ComandoGerado = {
            ...item,
            id: uid(),
            criadoEm: Date.now(),
          };
          return { historico: [novo, ...semDuplicado].slice(0, HISTORICO_MAX) };
        }),

      limparHistorico: () => set({ historico: [] }),

      isFavorito: (resultado) =>
        get().favoritos.some((f) => f.resultado === resultado),

      alternarFavorito: (item) =>
        set((s) => {
          const existente = s.favoritos.find(
            (f) => f.resultado === item.resultado
          );
          if (existente) {
            return {
              favoritos: s.favoritos.filter((f) => f.id !== existente.id),
            };
          }
          const novo: ComandoGerado = {
            ...item,
            id: uid(),
            criadoEm: Date.now(),
          };
          return { favoritos: [novo, ...s.favoritos] };
        }),

      removerFavorito: (id) =>
        set((s) => ({ favoritos: s.favoritos.filter((f) => f.id !== id) })),
    }),
    {
      name: "aceq-store",
      partialize: (s) => ({
        theme: s.theme,
        historico: s.historico,
        favoritos: s.favoritos,
      }),
    }
  )
);
