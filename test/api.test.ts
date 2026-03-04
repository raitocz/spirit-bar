import { describe, it, expect, beforeAll } from "vitest";
import { env, SELF } from "cloudflare:test";

describe("Public API", () => {
  let quizId: number;
  let galleryId: number;

  beforeAll(async () => {
    // Seed a future quiz
    const q = await env.DB.prepare(
      "INSERT INTO quizzes (quiz_number, date, max_participants, price) VALUES (?, ?, ?, ?)"
    )
      .bind(99, "2099-12-31", 8, 400)
      .run();
    quizId = q.meta.last_row_id as number;

    // Seed a gallery
    const g = await env.DB.prepare(
      "INSERT INTO galleries (title, description, date_from) VALUES (?, ?, ?)"
    )
      .bind("Test Gallery", "A test gallery", "2025-01-01")
      .run();
    galleryId = g.meta.last_row_id as number;
  });

  // ── Health ──

  it("GET /api/health → 200", async () => {
    const res = await SELF.fetch("http://localhost/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  // ── Quizzes ──

  it("GET /api/quizzes → returns array", async () => {
    const res = await SELF.fetch("http://localhost/api/quizzes");
    expect(res.status).toBe(200);
    const data: any[] = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  // ── Quiz registration validation ──

  it("POST /api/quizzes/:id/register → 400 without team_name", async () => {
    const res = await SELF.fetch(
      `http://localhost/api/quizzes/${quizId}/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.cz", members: ["Alice"] }),
      }
    );
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toContain("team_name");
  });

  it("POST /api/quizzes/:id/register → 400 without email", async () => {
    const res = await SELF.fetch(
      `http://localhost/api/quizzes/${quizId}/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_name: "Team A", members: ["Alice"] }),
      }
    );
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toContain("email");
  });

  it("POST /api/quizzes/:id/register → 400 with empty members", async () => {
    const res = await SELF.fetch(
      `http://localhost/api/quizzes/${quizId}/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: "Team B",
          email: "b@b.cz",
          members: [],
        }),
      }
    );
    expect(res.status).toBe(400);
  });

  it("POST /api/quizzes/:id/register → 201 success", async () => {
    const res = await SELF.fetch(
      `http://localhost/api/quizzes/${quizId}/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: "Testers",
          icon: "🧪",
          email: "test@test.cz",
          members: ["Alice", "Bob"],
        }),
      }
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ success: true });
  });

  it("POST /api/quizzes/:id/register → 409 duplicate team name", async () => {
    const res = await SELF.fetch(
      `http://localhost/api/quizzes/${quizId}/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: "Testers",
          icon: "🎯",
          email: "dup@test.cz",
          members: ["Carol"],
        }),
      }
    );
    expect(res.status).toBe(409);
  });

  it("POST /api/quizzes/:id/register → 404 non-existent quiz", async () => {
    const res = await SELF.fetch(
      "http://localhost/api/quizzes/99999/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: "Ghost",
          icon: "👻",
          email: "ghost@test.cz",
          members: ["Casper"],
        }),
      }
    );
    expect(res.status).toBe(404);
  });

  // ── Quiz results ──

  it("GET /api/quizzes/:id/results → returns array", async () => {
    const res = await SELF.fetch(
      `http://localhost/api/quizzes/${quizId}/results`
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  // ── Galleries ──

  it("GET /api/galleries → returns array", async () => {
    const res = await SELF.fetch("http://localhost/api/galleries");
    expect(res.status).toBe(200);
    const data: any[] = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/galleries/:id → returns gallery with photos", async () => {
    const res = await SELF.fetch(
      `http://localhost/api/galleries/${galleryId}`
    );
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.title).toBe("Test Gallery");
    expect(Array.isArray(data.photos)).toBe(true);
  });

  it("GET /api/galleries/99999 → 404", async () => {
    const res = await SELF.fetch("http://localhost/api/galleries/99999");
    expect(res.status).toBe(404);
  });

  // ── 404 catch-all ──

  it("GET /nonexistent → 404", async () => {
    const res = await SELF.fetch("http://localhost/nonexistent");
    expect(res.status).toBe(404);
  });
});
