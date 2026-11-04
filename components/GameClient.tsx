"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { Board } from "@/components/Board";
import { Countdown } from "@/components/Countdown";
import { Hearts } from "@/components/Hearts";
import { Keyboard } from "@/components/Keyboard";
import { RegisterForm } from "@/components/RegisterForm";
import { ShareStep } from "@/components/ShareStep";
import { Timer } from "@/components/Timer";
import { WaitingView } from "@/components/WaitingView";
import type { GameState } from "@/lib/game-types";
import { playSound } from "@/lib/sounds";
import { TOTAL_DAYS, formatLongDate } from "@/lib/time";
import type { Letter } from "@/lib/word";

interface GameClientProps {
  initialState: GameState | null;
}

export function GameClient({ initialState }: GameClientProps) {
  const [state, setState] = useState<GameState | null>(initialState);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  /** True right after finishing a play in this visit: show the share image step first. */
  const [showShare, setShowShare] = useState(false);

  const refreshState = useCallback(async (): Promise<GameState | null> => {
    try {
      const res = await fetch("/api/game/state", { cache: "no-store" });
      if (res.status === 401) {
        setState(null);
        return null;
      }
      if (!res.ok) return null;
      const next: GameState = await res.json();
      setState(next);
      return next;
    } catch {
      // Ignore transient network errors on background refresh.
      return null;
    }
  }, []);

  const backgroundRefresh = useCallback(() => {
    void refreshState();
  }, [refreshState]);

  async function handleStart() {
    if (busy) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/game/start", { method: "POST" });
      if (res.status === 401) {
        setState(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message ?? "No pudimos iniciar la partida.");
        return;
      }
      setState(data as GameState);
    } catch {
      setErrorMsg("No pudimos conectarnos. Revisa tu internet.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGuess(letter: Letter) {
    if (busy) return;
    setBusy(true);
    setErrorMsg(null);
    const prevCorrect =
      state && state.phase === "active" && !state.noWord && state.play
        ? state.play.correctLetters.length
        : 0;
    const prevWrong =
      state && state.phase === "active" && !state.noWord && state.play
        ? state.play.wrongLetters.length
        : 0;

    try {
      const res = await fetch("/api/game/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letter }),
      });
      if (res.status === 401) {
        setState(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message ?? "No se pudo registrar la letra.");
        return;
      }
      const next = data as GameState;
      setState(next);

      if (next.phase === "active" && !next.noWord && next.play) {
        if (next.play.status === "won") {
          playSound("level-success");
          setShowShare(true);
        } else if (next.play.status === "lost") {
          setShakeKey((k) => k + 1);
          playSound("game-over");
          setShowShare(true);
        } else if (next.play.correctLetters.length > prevCorrect) {
          playSound("correct");
        } else if (next.play.wrongLetters.length > prevWrong) {
          setShakeKey((k) => k + 1);
          playSound("incorrect");
        }
      }
    } catch {
      setErrorMsg("No pudimos conectarnos. Revisa tu internet.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setState(null);
    setErrorMsg(null);
  }

  const handleTimerExpire = useCallback(async () => {
    playSound("game-over");
    const next = await refreshState();
    if (next && next.phase === "active" && !next.noWord && next.play?.status === "lost") {
      setShowShare(true);
    }
  }, [refreshState]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between px-3.5 py-3">
      {/* Encabezado compacto */}
      <header className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="11Diez"
            width={34}
            height={34}
            priority
            className="h-8.5 w-8.5 rounded-xl object-contain"
          />
          <span className="font-display text-sm font-extrabold tracking-tight text-primary-dark">
            Ahorcadito Diario
          </span>
        </div>

        {state && (
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-semibold text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            ¿No eres tú? Cambiar correo
          </button>
        )}
      </header>

      {/* Contenido principal */}
      <main className="my-auto flex w-full flex-col items-center justify-center py-1.5">
        {!state ? (
          <RegisterForm onAuthenticated={refreshState} />
        ) : state.phase === "before" ? (
          <BeforeView
            fullName={state.player.fullName}
            startsAt={state.startsAt}
            serverNow={state.serverNow}
            onStartReady={refreshState}
          />
        ) : state.phase === "ended" ? (
          <EndedView fullName={state.player.fullName} />
        ) : state.noWord ? (
          <NoWordView
            serverNow={state.serverNow}
            nextWordAt={state.nextWordAt}
            onReady={refreshState}
          />
        ) : state.play && state.play.status !== "playing" && state.result ? (
          showShare ? (
            <ShareStep
              key={state.play.gameDate}
              date={state.play.gameDate}
              dayNumber={state.day.number}
              won={state.play.status === "won"}
              onDone={() => setShowShare(false)}
            />
          ) : (
            <WaitingView
              day={state.day}
              play={state.play}
              result={state.result}
              serverNow={state.serverNow}
              nextWordAt={state.nextWordAt}
              isToday={state.isToday}
              onShowImage={() => setShowShare(true)}
              onRefresh={backgroundRefresh}
            />
          )
        ) : (
          <ActiveGameView
            state={state}
            busy={busy}
            errorMsg={errorMsg}
            shakeKey={shakeKey}
            onStart={handleStart}
            onGuess={handleGuess}
            onExpire={handleTimerExpire}
          />
        )}
      </main>

      {/* Pie discreto */}
      <footer className="pt-1 text-center text-[11px] font-medium text-muted">
        Hora oficial del reto: Colombia (UTC−5)
      </footer>
    </div>
  );
}

function BeforeView({
  fullName,
  startsAt,
  serverNow,
  onStartReady,
}: {
  fullName: string;
  startsAt: string;
  serverNow: string;
  onStartReady: () => void;
}) {
  return (
    <section className="animate-enter w-full rounded-3xl border border-line bg-warm p-6 shadow-soft flex flex-col items-center text-center gap-4">
      <Image
        src="/mascot-waving.png"
        alt="Mascota 11Diez saludando"
        width={80}
        height={80}
        priority
        className="h-20 w-20 object-contain"
      />
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          ¡Ya estás inscrito!
        </p>
        <h1 className="font-display text-2xl font-extrabold text-primary-dark">
          Hola, {fullName}
        </h1>
        <p className="text-sm text-muted">
          El reto comienza el <strong className="text-ink">4 de noviembre a las 12:00 AM</strong>{" "}
          (hora Colombia).
        </p>
      </div>

      <Countdown
        targetIso={startsAt}
        serverNow={serverNow}
        onReachZero={onStartReady}
        label="Comienza en"
      />

      <p className="rounded-2xl border border-line bg-white px-4 py-2.5 text-xs font-semibold text-ink">
        ✨ Cada día a las 12:00 AM sale una palabra nueva.
      </p>
    </section>
  );
}

function EndedView({ fullName }: { fullName: string }) {
  return (
    <section className="animate-enter w-full rounded-3xl border border-line bg-sage p-6 shadow-soft flex flex-col items-center text-center gap-3.5">
      <Image
        src="/mascot-avatar-happy.png"
        alt="Mascota 11Diez"
        width={80}
        height={80}
        priority
        className="h-20 w-20 object-contain"
      />
      <h1 className="font-display text-2xl font-extrabold text-primary-dark">
        El reto terminó. ¡Gracias por participar!
      </h1>
      <p className="text-sm text-muted">
        Gracias por acompañarnos durante los 11 días del Ahorcadito Diario,{" "}
        <strong className="text-ink">{fullName}</strong>.
      </p>
    </section>
  );
}

function NoWordView({
  serverNow,
  nextWordAt,
  onReady,
}: {
  serverNow: string;
  nextWordAt: string;
  onReady: () => void;
}) {
  return (
    <section className="animate-enter w-full rounded-3xl border border-line bg-warm p-6 shadow-soft flex flex-col items-center text-center gap-3.5">
      <h1 className="font-display text-xl font-extrabold text-primary-dark">
        Preparando la palabra de hoy
      </h1>
      <p className="text-sm text-muted">
        La palabra de hoy aún no está disponible. Intenta actualizar en unos momentos.
      </p>
      <Countdown
        targetIso={nextWordAt}
        serverNow={serverNow}
        onReachZero={onReady}
        label="Siguiente cambio de día"
      />
      <button
        type="button"
        onClick={onReady}
        className="rounded-2xl bg-primary px-4 py-2.5 font-display text-xs font-bold uppercase text-white"
      >
        Actualizar
      </button>
    </section>
  );
}

function ActiveGameView({
  state,
  busy,
  errorMsg,
  shakeKey,
  onStart,
  onGuess,
  onExpire,
}: {
  state: Extract<GameState, { phase: "active"; noWord?: false }>;
  busy: boolean;
  errorMsg: string | null;
  shakeKey: number;
  onStart: () => void;
  onGuess: (letter: Letter) => void;
  onExpire: () => void;
}) {
  const { day, play, serverNow } = state;
  const started = play !== null && play.status === "playing";
  const livesLeft = play ? play.livesLeft : day.maxErrors;

  return (
    <section
      key={shakeKey}
      className={`w-full space-y-2.5 ${shakeKey > 0 ? "animate-shake" : "animate-enter"}`}
      aria-label="Juego del día"
    >
      {/* Encabezado del día + estado */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-white px-3.5 py-2 shadow-soft">
        <div>
          <p className="font-display text-xs font-extrabold uppercase tracking-wide text-primary">
            Día {day.number} de {TOTAL_DAYS}
          </p>
          <p className="text-xs font-semibold text-muted">{formatLongDate(day.date)}</p>
        </div>

        <div className="flex items-center gap-2">
          <Hearts livesLeft={livesLeft} maxLives={day.maxErrors} />
          <Timer
            deadlineAt={play?.deadlineAt ?? null}
            serverNow={serverNow}
            timeLimitSeconds={day.timeLimitSeconds}
            running={started}
            onExpire={onExpire}
          />
        </div>
      </div>

      {/* Categoría */}
      <div className="rounded-2xl border border-[#D4DEAF] bg-sage px-4 py-2.5 text-center shadow-soft">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-primary">
          Categoría
        </p>
        <p className="font-display text-base font-extrabold uppercase text-primary-dark">
          {day.category}
        </p>
      </div>

      {/* Casillas de la palabra */}
      <div className="rounded-3xl border border-line bg-warm px-2.5 py-3 shadow-soft">
        <Board mask={day.mask} />

        {!started && (
          <div className="mt-2 flex flex-col items-center gap-1.5 border-t border-line/70 pt-2.5 text-center">
            <button
              type="button"
              disabled={busy}
              onClick={onStart}
              className="rounded-2xl bg-cta px-6 py-2.5 font-display text-sm font-extrabold uppercase tracking-wide text-white shadow-soft transition hover:brightness-95 active:translate-y-0.5 disabled:opacity-60"
            >
              {busy ? "Iniciando..." : "▶ Iniciar reloj (2:00)"}
            </button>
            <p className="text-[11px] font-medium text-muted">
              El tiempo arranca al pulsar <strong>Iniciar</strong> o al tocar tu primera letra.
            </p>
          </div>
        )}
      </div>

      {errorMsg && (
        <p
          role="alert"
          className="rounded-xl bg-danger/10 px-3 py-2 text-center text-xs font-bold text-danger"
        >
          {errorMsg}
        </p>
      )}

      {/* Teclado de 27 letras */}
      <Keyboard
        correctLetters={play?.correctLetters ?? []}
        wrongLetters={play?.wrongLetters ?? []}
        disabled={busy}
        onSelect={onGuess}
      />
    </section>
  );
}
