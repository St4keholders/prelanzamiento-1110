/** Public (client-safe) shapes for the ranking and the teams/mesas flow. */

export interface PublicEvent {
  title: string;
  startsAt: string;
  placeName: string;
  address: string;
  mapsUrl: string;
  reservationsOpenAt: string;
  reservationsCloseAt: string;
  /** Reservations window open right now. */
  reservationsOpen: boolean;
  tableCount: number;
  seatsPerTable: number;
  tablesTaken: number;
  serverNow: string;
}

export interface PublicMember {
  participantId: string;
  name: string;
  squirrel: string;
  isCaptain: boolean;
  isMe: boolean;
}

export interface PublicInvite {
  id: string;
  name: string;
  /** Only sent to the captain. */
  email: string | null;
}

export interface PublicTeam {
  id: string;
  tableNumber: number;
  /** Mesa del equipo 1110 (admins), fuera de las mesas públicas. */
  staff: boolean;
  name: string;
  flag: string;
  color: string;
  motto: string;
  /** Only sent to members. */
  joinCode: string | null;
  members: PublicMember[];
  invites: PublicInvite[];
  seatsUsed: number;
  seatsTotal: number;
  /** All seats filled with members who accepted. */
  confirmed: boolean;
  isCaptain: boolean;
}

export interface PendingInvite {
  teamName: string;
  tableNumber: number;
  flag: string;
  color: string;
  captainName: string;
  invitedName: string;
}

export interface MesaState {
  event: PublicEvent;
  me: { fullName: string };
  team: PublicTeam | null;
  invite: PendingInvite | null;
}

export interface RankingRow {
  position: number;
  name: string;
  won: number;
  played: number;
  totalMs: number;
  bestMs: number | null;
  livesLost: number;
}

export interface MyRanking extends RankingRow {
  totalPlayers: number;
  longestStreak: number;
  days: ("won" | "lost" | "missed")[];
}
