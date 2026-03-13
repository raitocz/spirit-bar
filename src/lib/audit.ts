// Audit log helper — fire-and-forget via waitUntil

interface AuditEntry {
  user_id?: number | null;
  username?: string | null;
  ip?: string | null;
  category: string;
  action: string;
  entity_type?: string | null;
  entity_id?: number | null;
  details?: string | null;
}

export function logAudit(c: any, entry: AuditEntry) {
  const db: D1Database = c.env.DB;
  const promise = db.prepare(
    `INSERT INTO audit_log (user_id, username, ip, category, action, entity_type, entity_id, details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    entry.user_id ?? null,
    entry.username ?? null,
    entry.ip ?? null,
    entry.category,
    entry.action,
    entry.entity_type ?? null,
    entry.entity_id ?? null,
    entry.details ?? null,
  ).run().catch((err: any) => console.error("audit log failed:", err));

  try { c.executionCtx.waitUntil(promise); } catch { /* no exec ctx */ }
}

export function logAuditFromUser(
  c: any,
  category: string,
  action: string,
  opts?: { entity_type?: string; entity_id?: number; details?: string }
) {
  const user = c.get("user" as never) as { sub: number; username: string } | undefined;
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
  logAudit(c, {
    user_id: user?.sub,
    username: user?.username,
    ip,
    category,
    action,
    ...opts,
  });
}
