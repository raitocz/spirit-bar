import { describe, it, expect, beforeAll } from "vitest";
import { env, SELF } from "cloudflare:test";
import { hashPassword } from "../src/lib/auth";

const ADMIN_USER = "testadmin";
const ADMIN_PASS = "testpassword123";

describe("Dungeon (Admin) API", () => {
  let token: string;

  beforeAll(async () => {
    // Create admin user with hashed password
    const hash = await hashPassword(ADMIN_PASS);
    await env.DB.prepare(
      "INSERT INTO admins (username, password_hash, role) VALUES (?, ?, 'admin')"
    )
      .bind(ADMIN_USER, hash)
      .run();
  });

  function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return { Authorization: "Bearer " + token, ...extra };
  }

  // ── Auth ──

  it("POST /dungeon/api/login → 401 with wrong credentials", async () => {
    const res = await SELF.fetch("http://localhost/dungeon/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: ADMIN_USER, password: "wrong" }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /dungeon/api/login → 200 with correct credentials + returns token", async () => {
    const res = await SELF.fetch("http://localhost/dungeon/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.username).toBe(ADMIN_USER);
    expect(body.token).toBeTruthy();
    token = body.token;
  });

  it("GET /dungeon/api/me → 401 without token", async () => {
    const res = await SELF.fetch("http://localhost/dungeon/api/me");
    expect(res.status).toBe(401);
  });

  it("GET /dungeon/api/me → 200 with Bearer token", async () => {
    const res = await SELF.fetch("http://localhost/dungeon/api/me", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.username).toBe(ADMIN_USER);
  });

  // ── Gallery CRUD ──

  let galleryId: number;

  it("POST /dungeon/api/galleries → 201 creates gallery", async () => {
    const res = await SELF.fetch("http://localhost/dungeon/api/galleries", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        title: "Admin Gallery",
        description: "Test desc",
        date_from: "2025-06-01",
      }),
    });
    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.title).toBe("Admin Gallery");
    galleryId = body.id;
  });

  it("GET /dungeon/api/galleries → lists galleries", async () => {
    const res = await SELF.fetch("http://localhost/dungeon/api/galleries", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((g: any) => g.id === galleryId)).toBe(true);
  });

  it("PUT /dungeon/api/galleries/:id → updates gallery", async () => {
    const res = await SELF.fetch(
      `http://localhost/dungeon/api/galleries/${galleryId}`,
      {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          title: "Updated Gallery",
          description: "Updated",
          date_from: "2025-06-15",
        }),
      }
    );
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.title).toBe("Updated Gallery");
  });

  it("DELETE /dungeon/api/galleries/:id → deletes gallery", async () => {
    const res = await SELF.fetch(
      `http://localhost/dungeon/api/galleries/${galleryId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  // ── Quiz CRUD ──

  let quizId: number;

  it("POST /dungeon/api/quizzes → 201 creates quiz", async () => {
    const res = await SELF.fetch("http://localhost/dungeon/api/quizzes", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        quiz_number: 50,
        date: "2025-01-15",
        max_participants: 8,
        price: 400,
      }),
    });
    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.quiz_number).toBe(50);
    quizId = body.id;
  });

  it("GET /dungeon/api/quizzes → lists quizzes", async () => {
    const res = await SELF.fetch("http://localhost/dungeon/api/quizzes", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((q: any) => q.id === quizId)).toBe(true);
  });

  it("PUT /dungeon/api/quizzes/:id → updates quiz", async () => {
    const res = await SELF.fetch(
      `http://localhost/dungeon/api/quizzes/${quizId}`,
      {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          quiz_number: 51,
          date: "2025-01-20",
          max_participants: 10,
          price: 500,
        }),
      }
    );
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.quiz_number).toBe(51);
  });

  // ── Quiz Results ──

  it("PUT /dungeon/api/quizzes/:id/results → saves results for past quiz", async () => {
    // Seed a team for this quiz (which is in the past: 2025-01-20)
    const team = await env.DB.prepare(
      "INSERT INTO quiz_teams (quiz_id, team_name, icon, email, payment_status) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(quizId, "Winners", "\uD83C\uDFC6", "win@test.cz", "cash")
      .run();
    const teamId = team.meta.last_row_id;

    const res = await SELF.fetch(
      `http://localhost/dungeon/api/quizzes/${quizId}/results`,
      {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          teams: [{ id: teamId, placement: 1, score: 42 }],
        }),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });

    // Verify via DB
    const row = await env.DB.prepare(
      "SELECT placement, score FROM quiz_teams WHERE id = ?"
    )
      .bind(teamId)
      .first<{ placement: number; score: number }>();
    expect(row?.placement).toBe(1);
    expect(row?.score).toBe(42);
  });

  it("DELETE /dungeon/api/quizzes/:id → deletes quiz", async () => {
    const res = await SELF.fetch(
      `http://localhost/dungeon/api/quizzes/${quizId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  // ── Auth protection ──

  it("POST /dungeon/api/galleries → 401 without token", async () => {
    const res = await SELF.fetch("http://localhost/dungeon/api/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "No Auth",
        date_from: "2025-01-01",
      }),
    });
    expect(res.status).toBe(401);
  });
});
