import { handleError, jsonError, jsonOk, readJson } from "@/lib/http";
import { createPlayerSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { firstIssue, registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid", firstIssue(parsed.error), 400);
  const { email, fullName, phone } = parsed.data;

  try {
    const db = supabaseAdmin();
    // If the email already exists, just log in (never overwrite existing data).
    const { data: inserted, error: insertError } = await db
      .from("participants")
      .upsert(
        { email, full_name: fullName, phone },
        { onConflict: "email", ignoreDuplicates: true },
      )
      .select("id")
      .maybeSingle();
    if (insertError) throw insertError;

    let id = inserted?.id;
    if (!id) {
      const { data: existing, error } = await db
        .from("participants")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("email", email)
        .select("id")
        .single();
      if (error) throw error;
      id = existing.id;
    }

    await createPlayerSession(id);
    return jsonOk({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
