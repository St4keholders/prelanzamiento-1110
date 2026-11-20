import { Card, Shell } from "@/components/hub/Shell";
import { JoinCodeForm } from "@/components/mesa/JoinCodeForm";

export default function UnirmePage() {
  return (
    <Shell back={{ href: "/", label: "Inicio" }}>
      <Card className="space-y-3">
        <h1 className="font-display text-xl font-extrabold text-primary-dark">🔑 Unirme a una mesa</h1>
        <p className="text-sm text-ink">
          Pega el enlace que te pasó tu amigo, o escribe el código de su mesa.
        </p>
        <JoinCodeForm />
      </Card>
    </Shell>
  );
}
