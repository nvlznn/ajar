/** Phase 1 is single-user: only these Google accounts may sign in. The first one owns agent-supplied fit scores. */
export function allowedEmails(): string[] {
  return (process.env.OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
