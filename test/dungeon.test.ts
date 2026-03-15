import { describe, it, expect, beforeAll } from "vitest";
import { env, SELF } from "cloudflare:test";
import { hashPassword } from "../src/lib/auth";

const ADMIN_USER = "testadmin";
const ADMIN_PASS = "testpassword123";
const ADMIN_EMAIL = "testadmin@spirit-bar.cz";

describe("Dungeon (Admin) API", () => {
  let sessionCookie: string;

  beforeAll(async () => {
    // Create admin user with hashed password and email
    const hash = await hashPassword(ADMIN_PASS);
    await env.DB.prepare(
      "INSERT INTO admins (username, password_hash, role, email) VALUES (?, ?, 'admin', ?)"
    )
      .bind(ADMIN_USER, hash, ADMIN_EMAIL)
      .run();
  });

  function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return { Cookie: sessionCookie, ...extra };
  }

  // ── Auth ──

  // Helper to perform login request
  async function doLogin(username: string, password: string, remember?: boolean) {
    return SELF.fetch("http://localhost/dungeon/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, remember }),
    });
  }

  it("POST /dungeon/api/login → 400 when username is missing", async () => {
    const res = await SELF.fetch("http://localhost/dungeon/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: ADMIN_PASS }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /dungeon/api/login → 400 when password is missing", async () => {
    const res = await SELF.fetch("http://localhost/dungeon/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: ADMIN_USER }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /dungeon/api/login → 401 with wrong password (username)", async () => {
    const res = await doLogin(ADMIN_USER, "wrong");
    expect(res.status).toBe(401);
  });

  it("POST /dungeon/api/login → 401 with wrong password (email)", async () => {
    const res = await doLogin(ADMIN_EMAIL, "wrong");
    expect(res.status).toBe(401);
  });

  it("POST /dungeon/api/login → 401 with non-existent username", async () => {
    const res = await doLogin("nonexistent", ADMIN_PASS);
    expect(res.status).toBe(401);
  });

  it("POST /dungeon/api/login → 401 with non-existent email", async () => {
    const res = await doLogin("nobody@spirit-bar.cz", ADMIN_PASS);
    expect(res.status).toBe(401);
  });

  it("POST /dungeon/api/login → 200 with username", async () => {
    const res = await doLogin(ADMIN_USER, ADMIN_PASS);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.username).toBe(ADMIN_USER);
  });

  it("POST /dungeon/api/login → 200 with email", async () => {
    const res = await doLogin(ADMIN_EMAIL, ADMIN_PASS);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.username).toBe(ADMIN_USER);
  });

  it("POST /dungeon/api/login → 200 with uppercase username (case-insensitive)", async () => {
    const res = await doLogin("TestAdmin", ADMIN_PASS);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.username).toBe(ADMIN_USER);
  });

  it("POST /dungeon/api/login → 200 with uppercase email (case-insensitive)", async () => {
    const res = await doLogin("TestAdmin@Spirit-Bar.CZ", ADMIN_PASS);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.username).toBe(ADMIN_USER);
  });

  it("POST /dungeon/api/login → 200 with whitespace-padded input", async () => {
    const res = await doLogin("  testadmin  ", ADMIN_PASS);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.username).toBe(ADMIN_USER);
  });

  it("POST /dungeon/api/login → sets session cookie", async () => {
    const res = await doLogin(ADMIN_USER, ADMIN_PASS);
    expect(res.status).toBe(200);

    const setCookie = res.headers.get("set-cookie") || "";
    const match = setCookie.match(/session=([^\s;]+)/);
    expect(match).toBeTruthy();
    sessionCookie = `session=${match![1]}`;
  });

  it("GET /dungeon/api/me → 401 without cookie", async () => {
    const res = await SELF.fetch("http://localhost/dungeon/api/me");
    expect(res.status).toBe(401);
  });

  it("GET /dungeon/api/me → 200 with session cookie", async () => {
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

  it("POST /dungeon/api/galleries → 401 without cookie", async () => {
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
