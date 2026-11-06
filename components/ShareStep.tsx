"use client";

import { useEffect, useState } from "react";

interface ShareStepProps {
  /** URL of the PNG to show/share. */
  src: string;
  /** Downloaded / shared file name. */
  fileName: string;
  won: boolean;
  /** Called after sharing, saving or skipping. */
  onDone: () => void;
}

type Loaded = { file: File; url: string; canShare: boolean };

/**
 * Shows the result image (generated on the server) with buttons to share it through the
 * phone's share sheet (Instagram, WhatsApp, etc.), save it, or skip.
 */
export function ShareStep({ src, fileName, won, onDone }: ShareStepProps) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Prefetch the PNG so navigator.share() runs right inside the tap (required by iOS).
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    fetch(src, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const file = new File([blob], fileName, {
          type: "image/png",
        });
        objectUrl = URL.createObjectURL(blob);
        const canShare =
          typeof navigator !== "undefined" &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] });
        setLoaded({ file, url: objectUrl, canShare });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, fileName]);

  async function handleShare() {
    if (!loaded) return;
    try {
      await navigator.share({ files: [loaded.file] });
      onDone();
    } catch (err) {
      // The user closed the share sheet: stay here so they can try again or save.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setNotice("No se pudo abrir el menú de compartir. Usa “Guardar imagen”.");
    }
  }

  function handleSave() {
    if (!loaded) return;
    const a = document.createElement("a");
    a.href = loaded.url;
    a.download = loaded.file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    onDone();
  }

  return (
    <section
      aria-label="Comparte tu resultado"
      className="animate-enter w-full flex flex-col items-center gap-3"
    >
      <h1 className="font-display text-lg font-extrabold text-primary-dark text-center">
        {won ? "¡Comparte tu logro!" : "Comparte tu resultado"}
      </h1>

      <div className="w-[62%] max-w-[260px] aspect-[9/16] overflow-hidden rounded-2xl border border-line bg-warm shadow-soft">
        {loaded ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={loaded.url}
            alt="Imagen de tu resultado de hoy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-xs font-semibold text-muted">
            {failed ? "No pudimos crear tu imagen." : "Creando tu imagen…"}
          </div>
        )}
      </div>

      {loaded && (
        <p className="text-center text-[11px] font-medium text-muted">
          También puedes mantener presionada la imagen para guardarla.
        </p>
      )}

      {notice && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-center text-xs font-bold text-danger">
          {notice}
        </p>
      )}

      <div className="flex w-full flex-col gap-2">
        {loaded?.canShare && (
          <button
            type="button"
            onClick={handleShare}
            className="w-full rounded-2xl bg-cta px-4 py-3 font-display text-sm font-extrabold uppercase tracking-wide text-white shadow-soft active:translate-y-0.5"
          >
            Compartir
          </button>
        )}
        {loaded && (
          <button
            type="button"
            onClick={handleSave}
            className={`w-full rounded-2xl px-4 py-3 font-display text-sm font-extrabold uppercase tracking-wide shadow-soft active:translate-y-0.5 ${
              loaded.canShare
                ? "border border-line bg-white text-primary-dark"
                : "bg-cta text-white"
            }`}
          >
            Guardar imagen
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-2xl px-4 py-2.5 text-sm font-bold text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Omitir
        </button>
      </div>
    </section>
  );
}
