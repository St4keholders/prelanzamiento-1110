import { handleError, jsonError, jsonOk, readJson } from "@/lib/http";
import { createPlayerSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { firstIssue, identifySchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = identifySchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid", firstIssue(parsed.error), 400);

  try {
    const { data, error } = await supabaseAdmin()
      .from("participants")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("email", parsed.data.email)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return jsonOk({ exists: false });

    await createPlayerSession(data.id);
    return jsonOk({ exists: true });
  } catch (err) {
    return handleError(err);
  }
}
