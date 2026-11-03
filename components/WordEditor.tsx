"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface WordEditorProps {
  date: string;
  dayNumber: number;
  longDate: string;
  initialWord: string;
  initialCategory: string;
  editable: boolean;
  deadlineLabel: string;
}

export function WordEditor({
  date,
  dayNumber,
  longDate,
  initialWord,
  initialCategory,
  editable,
  deadlineLabel,
}: WordEditorProps) {
  const router = useRouter();
  const [word, setWord] = useState(initialWord);
  const [category, setCategory] = useState(initialCategory);
  const [savedWord, setSavedWord] = useState(initialWord);
  const [savedCategory, setSavedCategory] = useState(initialCategory);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const dirty = word.trim() !== savedWord || category.trim() !== savedCategory;
  const loaded = savedWord !== "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, word, category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "error", text: data.message ?? "No se pudo guardar." });
        if (res.status === 401) router.push("/admin/login");
        if (res.status === 403) router.refresh();
        return;
      }
      setWord(data.word.word);
      setCategory(data.word.category);
      setSavedWord(data.word.word);
      setSavedCategory(data.word.category);
      setMessage({ kind: "ok", text: "Guardada." });
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Error de conexión." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border p-4 shadow-soft ${
        editable ? "border-line bg-white" : "border-line bg-bg"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-sm font-extrabold text-primary-dark">
            Día {dayNumber} · <span className="font-semibold text-ink">{longDate}</span>
          </p>
          <p className="text-xs text-muted">
            {editable ? `Editable ${deadlineLabel}` : "Bloqueada: este día ya empezó o ya pasó."}
          </p>
        </div>
        {loaded ? (
          <span className="rounded-lg bg-sage px-2 py-0.5 text-xs font-bold text-primary">
            Cargada
          </span>
        ) : (
          <span className="rounded-lg bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger">
            Sin cargar
          </span>
        )}
      </div>

      {editable ? (
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor={`word-${date}`} className="mb-1 block text-xs font-bold text-ink">
              Palabra o frase
            </label>
            <input
              id={`word-${date}`}
              type="text"
              required
              maxLength={60}
              autoComplete="off"
              spellCheck={false}
              value={word}
              onChange={(e) => setWord(e.target.value.toLocaleUpperCase("es-CO"))}
              placeholder="Ej. RETENCIÓN EN LA FUENTE"
              className="w-full rounded-2xl border border-line bg-white px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-ink"
            />
          </div>
          <div>
            <label htmlFor={`category-${date}`} className="mb-1 block text-xs font-bold text-ink">
              Categoría
            </label>
            <input
              id={`category-${date}`}
              type="text"
              required
              maxLength={40}
              autoComplete="off"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej. Impuestos"
              className="w-full rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !dirty}
            className="rounded-2xl bg-primary px-5 py-2.5 font-display text-xs font-extrabold uppercase tracking-wide text-white shadow-soft hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      ) : (
        <div className="grid gap-1 sm:grid-cols-[2fr_1fr]">
          <p className="font-display text-sm font-bold text-primary-dark">
            {savedWord || <span className="text-muted">—</span>}
          </p>
          <p className="text-sm text-ink">{savedCategory || <span className="text-muted">—</span>}</p>
        </div>
      )}

      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`mt-2 rounded-xl px-3 py-1.5 text-xs font-bold ${
            message.kind === "error" ? "bg-danger/10 text-danger" : "bg-sage text-primary"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
