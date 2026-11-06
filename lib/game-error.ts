export class GameError extends Error {
  constructor(
    public code:
      | "unauthorized"
      | "not_active"
      | "no_word"
      | "not_today"
      | "bonus_closed"
      | "bonus_not_eligible"
      | "internal",
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
