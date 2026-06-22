import { useEffect, useRef, useState } from "react";
import { FileVideo, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface VideoSelecionado {
  url: string;
  nome: string;
  tamanho: string;
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload de vídeo do processo de atualização.
 *
 * Nesta fase (sem backend) o vídeo é apenas pré-visualizado localmente nesta
 * sessão. O envio definitivo ao servidor entra na fase 2 (API + storage).
 */
export function VideoUpload() {
  const [video, setVideo] = useState<VideoSelecionado | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Libera o object URL ao trocar/desmontar para evitar vazamento de memória.
  useEffect(() => {
    return () => {
      if (video) URL.revokeObjectURL(video.url);
    };
  }, [video]);

  const selecionar = (file: File | undefined) => {
    if (!file || !file.type.startsWith("video/")) return;
    setVideo((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior.url);
      return {
        url: URL.createObjectURL(file),
        nome: file.name,
        tamanho: formatarTamanho(file.size),
      };
    });
  };

  const remover = () => {
    setVideo((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior.url);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  if (video) {
    return (
      <div className="space-y-3">
        <video
          src={video.url}
          controls
          className="w-full rounded-xl border border-border bg-black"
        />
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5">
          <FileVideo className="h-4 w-4 shrink-0 text-emerald-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{video.nome}</p>
            <p className="text-xs text-muted-foreground">{video.tamanho}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={remover}>
            <Trash2 className="h-4 w-4" /> Remover
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Pré-visualização local. O envio ao servidor será habilitado com o
          backend (fase 2).
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          selecionar(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200",
          arrastando
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-accent/40"
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-foreground">
          <UploadCloud className="h-6 w-6" />
        </span>
        <span className="text-sm font-medium">
          Arraste um vídeo ou clique para selecionar
        </span>
        <span className="text-xs text-muted-foreground">
          MP4, MOV ou WebM
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => selecionar(e.target.files?.[0])}
      />
    </div>
  );
}
