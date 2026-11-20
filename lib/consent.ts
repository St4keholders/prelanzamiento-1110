import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Guarda la fecha en que el jugador aceptó la Política de Tratamiento de Datos (prueba de
 * la autorización, Ley 1581 de 2012). Solo la primera vez. Si la columna todavía no existe
 * en la base de datos, no rompe el registro ni la reserva: solo deja el aviso en el log.
 */
export async function recordConsent(pid: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("participants")
    .update({ data_consent_at: new Date().toISOString() })
    .eq("id", pid)
    .is("data_consent_at", null);
  if (error) console.warn("[consent] no se pudo guardar la autorización:", error.message);
}
