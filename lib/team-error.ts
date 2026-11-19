/** Errors of the teams/mesas flow, with a Spanish message for the player. */
export class TeamError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const MESSAGES: Record<string, [string, number]> = {
  reservations_closed: ["Las reservas de mesa no están abiertas en este momento.", 409],
  already_in_team: ["Ya perteneces a un team. Sal de él primero si quieres cambiarte.", 409],
  table_taken: ["Esa mesa ya la apartó otro team. Escoge otra.", 409],
  table_invalid: ["Esa mesa no existe. Escoge una de la lista.", 400],
  no_tables: ["Ya no quedan mesas disponibles. Pide a un capitán su código para unirte.", 409],
  team_not_found: ["No encontramos un team con ese código. Revísalo e intenta de nuevo.", 404],
  team_full: ["Este team ya no tiene puestos libres.", 409],
  no_invite: ["No tienes invitaciones pendientes.", 404],
  not_captain: ["Solo el capitán del team puede hacer esto.", 403],
  invitee_in_team: ["Esa persona ya pertenece a un team.", 409],
  invitee_invited: ["Esa persona ya tiene una invitación pendiente.", 409],
  not_in_team: ["No perteneces a ningún team.", 404],
  not_member: ["Esa persona no está en tu team.", 404],
  invite_not_found: ["Esa invitación ya no existe.", 404],
};

/** Maps a Postgres exception name (raised in the team_* functions) to a TeamError. */
export function teamErrorFrom(message: string): TeamError {
  for (const [code, [text, status]] of Object.entries(MESSAGES)) {
    if (message.includes(code)) return new TeamError(code, text, status);
  }
  return new TeamError("internal", "No pudimos completar la acción. Intenta de nuevo.", 500);
}

export function teamError(code: keyof typeof MESSAGES): TeamError {
  const [text, status] = MESSAGES[code];
  return new TeamError(code, text, status);
}
