"use client";

import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/RegisterForm";

/** Email login/registration; reloads the server page once the session exists. */
export function LoginGate({ intro }: { intro?: string }) {
  const router = useRouter();
  return (
    <div className="space-y-3">
      {intro && <p className="text-center text-sm font-semibold text-ink">{intro}</p>}
      <RegisterForm variant="event" onAuthenticated={() => router.refresh()} />
    </div>
  );
}
