import { test } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { createApp, checklist } from "../src/app.js";

test("MERN booking lifecycle, login requirement, ownership, validation, and slot conflicts", async () => {
  const mongo = await MongoMemoryServer.create();
  const client = new MongoClient(mongo.getUri());
  await client.connect();
  const app = await createApp(client.db("test"), "test-key");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = "http://127.0.0.1:" + server.address().port + "/api";
  const request = async (path, method = "GET", body, headers = {}) => {
    const r = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, data: await r.json() };
  };
  const admin = { Authorization: "Bearer test-key" };
  const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const input = {
    name: "Dwight Demo",
    contact: "demo@example.test",
    room: "Demo Dorm 204",
    size: "small",
    date,
    time: "09:00",
  };
  try {
    // Admin routes stay protected.
    assert.equal((await request("/admin/bookings")).status, 401);

    // Login is required to book.
    assert.equal((await request("/bookings", "POST", input)).status, 401);
    assert.equal((await request("/account/bookings")).status, 401);

    // Sign up and get a session cookie.
    const signup = await fetch(base + "/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Dwight Demo",
        email: "dwight@example.test",
        password: "DemoPassword123!",
      }),
    });
    assert.equal(signup.status, 201);
    const cookie = signup.headers.get("set-cookie").split(";")[0];
    const account = await signup.json();
    assert.equal(account.user.passwordHash, undefined);
    assert.ok(signup.headers.get("set-cookie").includes("HttpOnly"));
    assert.equal(
      (await request("/auth/me", "GET", undefined, { Cookie: cookie })).data
        .user.name,
      "Dwight Demo",
    );
    assert.equal(
      (
        await request("/auth/signup", "POST", {
          name: "Other Demo",
          email: "DWIGHT@example.test",
          password: "DemoPassword123!",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await request("/auth/login", "POST", {
          email: "dwight@example.test",
          password: "incorrect",
        })
      ).status,
      401,
    );

    const paymentOptions = (await request("/config")).data.paymentMethods;
    assert.deepEqual(
      paymentOptions.map((p) => p.id),
      ["cash", "gcash"],
    );
    assert.equal(
      (
        await request(
          "/bookings",
          "POST",
          { ...input, paymentMethod: "card" },
          { Cookie: cookie },
        )
      ).status,
      400,
    );

    // Validation (logged in).
    assert.equal(
      (
        await request(
          "/bookings",
          "POST",
          { ...input, date: "2026-02-30" },
          { Cookie: cookie },
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          "/bookings",
          "POST",
          { ...input, size: "mansion" },
          { Cookie: cookie },
        )
      ).status,
      400,
    );

    // Booking belongs to the logged-in account.
    const signed = await request(
      "/bookings",
      "POST",
      { ...input, time: "11:00" },
      { Cookie: cookie },
    );
    assert.equal(signed.status, 201);
    assert.equal(signed.data.token, undefined);
    assert.equal(signed.data.userId, undefined);
    assert.equal(
      (await request("/account/bookings", "GET", undefined, { Cookie: cookie }))
        .data.length,
      1,
    );
    assert.equal(
      (
        await request("/bookings/" + signed.data.id, "GET", undefined, {
          Cookie: cookie,
        })
      ).status,
      200,
    );
    assert.equal((await request("/bookings/" + signed.data.id)).status, 401);

    // Logout and log back in.
    assert.equal(
      (await request("/auth/logout", "POST", {}, { Cookie: cookie })).status,
      200,
    );
    assert.equal(
      (await request("/auth/me", "GET", undefined, { Cookie: cookie })).data
        .user,
      null,
    );
    assert.equal(
      (await request("/bookings", "POST", input, { Cookie: cookie })).status,
      401,
    );
    const login = await fetch(base + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "dwight@example.test",
        password: "DemoPassword123!",
      }),
    });
    assert.equal(login.status, 200);
    const me = { Cookie: login.headers.get("set-cookie").split(";")[0] };
    assert.equal(
      (await request("/account/bookings", "GET", undefined, me)).data.length,
      1,
    );

    // A different user cannot see or change this booking.
    const other = await fetch(base + "/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Other Demo",
        email: "other@example.test",
        password: "OtherPassword123!",
      }),
    });
    assert.equal(other.status, 201);
    const otherCookie = {
      Cookie: other.headers.get("set-cookie").split(";")[0],
    };
    assert.equal(
      (
        await request(
          "/bookings/" + signed.data.id,
          "GET",
          undefined,
          otherCookie,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await request(
          "/bookings/" + signed.data.id + "/cancel",
          "POST",
          {},
          otherCookie,
        )
      ).status,
      404,
    );
    assert.equal(
      (await request("/account/bookings", "GET", undefined, otherCookie)).data
        .length,
      0,
    );

    // Passwords are stored hashed.
    const storedUser = await client
      .db("test")
      .collection("users")
      .findOne({ email: "dwight@example.test" });
    assert.notEqual(storedUser.passwordHash, "DemoPassword123!");
    assert.equal(storedUser.password, undefined);

    // Server calculates the price; client-supplied price is ignored.
    const a = await request("/bookings", "POST", { ...input, price: 1 }, me);
    assert.equal(a.status, 201);
    assert.equal(a.data.price, 300);
    assert.equal(a.data.status, "pending");
    const id = a.data.id;
    const b = await request("/bookings", "POST", input, me);
    assert.equal(b.status, 201);

    const makeCleaner = async (email) => {
      const r = await fetch(base + "/admin/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...admin },
        body: JSON.stringify({
          name: "Demo Cleaner",
          email,
          password: "DemoPassword123!",
        }),
      });
      assert.equal(r.status, 201);
      const created = (await r.json()).user;
      assert.equal(created.role, "cleaner");
      assert.equal(created.passwordHash, undefined);
      assert.equal(r.headers.get("set-cookie"), null);
      const login = await fetch(base + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "DemoPassword123!",
          role: "cleaner",
        }),
      });
      assert.equal(login.status, 200);
      return { Cookie: login.headers.get("set-cookie").split(";")[0] };
    };
    const pilotWorker = await makeCleaner("pilot@example.test");
    const proof =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jH3sAAAAASUVORK5CYII=";
    // Feedback and status rules.
    assert.equal(
      (
        await request(
          "/bookings/" + id + "/feedback",
          "POST",
          { rating: 5 },
          me,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await request(
          "/admin/bookings/" + id,
          "PATCH",
          { status: "completed", completedChecklist: checklist },
          admin,
        )
      ).status,
      409,
    );

    // Slot conflicts.
    assert.equal(
      (
        await request(
          "/admin/bookings/" + id,
          "PATCH",
          { status: "confirmed", cleaner: "Demo Cleaner" },
          admin,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await request(
          "/cleaner/bookings/" + id + "/accept",
          "POST",
          {},
          pilotWorker,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await request(
          "/admin/bookings/" + b.data.id,
          "PATCH",
          { status: "confirmed", cleaner: "Demo Cleaner" },
          admin,
        )
      ).status,
      409,
    );
    assert.equal((await request("/bookings", "POST", input, me)).status, 409);
    const available = await request("/availability?date=" + date);
    assert.equal(available.status, 200);
    assert.ok(!available.data.slots.includes("09:00"));
    assert.equal((await request("/availability?date=bad")).status, 400);

    // Completion.
    assert.equal(
      (
        await request(
          "/admin/bookings/" + id,
          "PATCH",
          { status: "completed", completedChecklist: [] },
          admin,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await request(
          "/cleaner/bookings/" + id + "/progress",
          "PATCH",
          { completedChecklist: checklist },
          pilotWorker,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await request(
          "/cleaner/bookings/" + id + "/proof",
          "POST",
          { image: proof, task: 0 },
          pilotWorker,
        )
      ).status,
      200,
    );
    for (let task = 1; task < checklist.length; task++)
      assert.equal(
        (
          await request(
            "/cleaner/bookings/" + id + "/proof",
            "POST",
            { image: proof, task },
            pilotWorker,
          )
        ).status,
        200,
      );
    assert.equal(
      (
        await request(
          "/cleaner/bookings/" + id + "/complete",
          "POST",
          {},
          pilotWorker,
        )
      ).status,
      200,
    );
    assert.ok(
      !(await request("/availability?date=" + date)).data.slots.includes(
        "09:00",
      ),
    );
    assert.equal(
      (await request("/bookings/" + id + "/cancel", "POST", {}, me)).status,
      409,
    );

    // Feedback.
    assert.equal(
      (
        await request(
          "/bookings/" + id + "/feedback",
          "POST",
          { rating: 5 },
          otherCookie,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await request(
          "/bookings/" + id + "/feedback",
          "POST",
          { rating: 6 },
          me,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          "/bookings/" + id + "/feedback",
          "POST",
          { rating: 5, comment: "Saved time" },
          me,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await request(
          "/bookings/" + id + "/feedback",
          "POST",
          { rating: 4 },
          me,
        )
      ).status,
      409,
    );

    // Cleaner roles, private job previews, atomic acceptance, and assigned-only completion.
    assert.equal(
      (
        await request("/auth/signup", "POST", {
          name: "Invalid Role",
          email: "invalid@example.test",
          password: "DemoPassword123!",
          role: "admin",
        })
      ).status,
      400,
    );
    assert.equal((await request("/admin/workers")).status, 401);
    assert.equal(
      (await request("/admin/workers", "GET", undefined, me)).status,
      401,
    );
    assert.equal(
      (await request("/admin/workers", "GET", undefined, admin)).data.length,
      1,
    );
    const workerInput = {
      name: "Denied Worker",
      email: "denied@example.test",
      password: "DemoPassword123!",
      role: "cleaner",
    };
    assert.equal(
      (await request("/auth/signup", "POST", workerInput)).status,
      403,
    );
    assert.equal(
      (await request("/admin/workers", "POST", workerInput)).status,
      401,
    );
    assert.equal(
      (await request("/admin/workers", "POST", workerInput, me)).status,
      401,
    );
    assert.equal(
      (
        await request(
          "/admin/workers",
          "POST",
          { ...workerInput, password: "short" },
          admin,
        )
      ).status,
      400,
    );
    const worker = await makeCleaner("cleaner@example.test"),
      worker2 = await makeCleaner("cleaner2@example.test");
    assert.equal(
      (
        await request(
          "/admin/workers",
          "POST",
          { ...workerInput, email: "cleaner@example.test" },
          admin,
        )
      ).status,
      409,
    );
    assert.equal(
      (await request("/admin/workers", "GET", undefined, worker)).status,
      401,
    );
    const directory = await request("/admin/workers", "GET", undefined, admin);
    assert.equal(directory.status, 200);
    assert.equal(directory.data.length, 3);
    assert.deepEqual(directory.data.map((w) => w.email).sort(), [
      "cleaner2@example.test",
      "cleaner@example.test",
      "pilot@example.test",
    ]);
    for (const w of directory.data) {
      assert.equal(w.name, "Demo Cleaner");
      assert.equal(w.role, "cleaner");
      assert.deepEqual(Object.keys(w).sort(), ["email", "id", "name", "role"]);
    }

    assert.equal(
      (await request("/auth/me", "GET", undefined, me)).data.user.role,
      "customer",
    );
    assert.equal((await request("/cleaner/bookings")).status, 401);
    assert.equal(
      (await request("/cleaner/bookings", "GET", undefined, me)).status,
      403,
    );
    assert.equal(
      (await request("/bookings", "POST", input, worker)).status,
      403,
    );
    assert.equal(
      (
        await request("/auth/login", "POST", {
          email: "cleaner@example.test",
          password: "DemoPassword123!",
          role: "customer",
        })
      ).status,
      403,
    );
    const workerLogin = await fetch(base + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "cleaner2@example.test",
        password: "DemoPassword123!",
        role: "cleaner",
      }),
    });
    assert.equal(workerLogin.status, 200);
    const previews = (
      await request("/cleaner/bookings", "GET", undefined, worker)
    ).data;
    assert.ok(previews.some((x) => x.id === signed.data.id));
    assert.equal(
      previews.find((x) => x.id === signed.data.id).contact,
      undefined,
    );
    assert.equal(previews.find((x) => x.id === signed.data.id).name, undefined);
    const path = "/cleaner/bookings/" + signed.data.id;
    assert.equal((await request(path + "/accept", "POST", {}, me)).status, 403);
    const claims = await Promise.all([
      request(path + "/accept", "POST", {}, worker),
      request(path + "/accept", "POST", {}, worker2),
    ]);
    assert.deepEqual(claims.map((x) => x.status).sort(), [200, 409]);
    const winner = claims[0].status === 200 ? worker : worker2,
      loser = claims[0].status === 200 ? worker2 : worker;
    const visible = await request(
      "/bookings/" + signed.data.id,
      "GET",
      undefined,
      me,
    );
    assert.equal(visible.data.cleaner, "Demo Cleaner");
    assert.equal(visible.data.status, "confirmed");
    assert.equal(
      (
        await request(
          path + "/complete",
          "POST",
          { completedChecklist: checklist },
          loser,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await request(
          path + "/complete",
          "POST",
          { completedChecklist: [] },
          winner,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await request(
          path + "/progress",
          "PATCH",
          { completedChecklist: checklist },
          me,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await request(
          path + "/progress",
          "PATCH",
          { completedChecklist: checklist },
          loser,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await request(
          path + "/progress",
          "PATCH",
          { completedChecklist: ["invented"] },
          winner,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          path + "/progress",
          "PATCH",
          { completedChecklist: [checklist[0]] },
          winner,
        )
      ).status,
      200,
    );
    assert.deepEqual(
      (await request("/admin/bookings", "GET", undefined, admin)).data.find(
        (b) => b.id === signed.data.id,
      ).completedChecklist,
      [checklist[0]],
    );
    assert.equal(
      (await request(path + "/proof", "POST", { image: proof, task: 0 }, loser))
        .status,
      409,
    );
    assert.equal(
      (
        await request(
          path + "/proof",
          "POST",
          { image: "data:image/png;base64,YmFk", task: 0 },
          winner,
        )
      ).status,
      400,
    );
    assert.equal(
      (await request(path + "/complete", "POST", {}, winner)).status,
      409,
    );
    assert.equal(
      (
        await request(
          path + "/progress",
          "PATCH",
          { completedChecklist: checklist },
          winner,
        )
      ).status,
      200,
    );
    assert.equal(
      (await request(path + "/complete", "POST", {}, winner)).status,
      409,
    );
    assert.equal(
      (
        await request(
          path + "/proof",
          "POST",
          { image: proof, task: 0 },
          winner,
        )
      ).status,
      200,
    );
    assert.equal(
      (await request("/admin/bookings", "GET", undefined, admin)).data.find(
        (b) => b.id === signed.data.id,
      ).taskProofs[0].image,
      proof,
    );
    assert.equal(
      (
        await request(
          path + "/proof",
          "POST",
          { image: proof, task: 99 },
          winner,
        )
      ).status,
      400,
    );
    assert.equal(
      (await request(path + "/proof", "POST", { image: proof }, winner)).status,
      400,
    );
    assert.equal(
      (await request(path + "/complete", "POST", {}, winner)).status,
      409,
    );
    for (let task = 1; task < checklist.length; task++)
      assert.equal(
        (await request(path + "/proof", "POST", { image: proof, task }, winner))
          .status,
        200,
      );
    const persisted = (
      await request("/admin/bookings", "GET", undefined, admin)
    ).data.find((b) => b.id === signed.data.id);
    assert.equal(Object.keys(persisted.taskProofs).length, checklist.length);
    assert.equal(
      (
        await request(
          path + "/proof",
          "POST",
          { image: proof, task: 0 },
          winner,
        )
      ).status,
      200,
    );
    assert.equal(
      Object.keys(
        (await request("/admin/bookings", "GET", undefined, admin)).data.find(
          (b) => b.id === signed.data.id,
        ).taskProofs,
      ).length,
      checklist.length,
    );
    assert.equal(
      (
        await request(
          path + "/complete",
          "POST",
          { completedChecklist: checklist },
          winner,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await request(
          path + "/proof",
          "POST",
          { image: proof, task: 0 },
          winner,
        )
      ).status,
      409,
    );

    assert.equal(
      (
        await request(
          path + "/progress",
          "PATCH",
          { completedChecklist: [] },
          winner,
        )
      ).status,
      409,
    );
    assert.equal(
      (await request(path + "/accept", "POST", {}, loser)).status,
      409,
    );
    assert.equal(
      (
        await request(
          "/bookings/" + signed.data.id + "/feedback",
          "POST",
          { rating: 5 },
          me,
        )
      ).status,
      200,
    );

    // Cancel the other pending booking.
    assert.equal(
      (await request("/bookings/" + b.data.id + "/cancel", "POST", {}, me))
        .status,
      200,
    );
    assert.equal(
      (await request("/admin/bookings", "GET", undefined, admin)).data.length,
      3,
    );
    assert.equal(
      (await client.db("test").collection("bookings").findOne({ id })).feedback
        .rating,
      5,
    );
  } finally {
    await new Promise((r) => server.close(r));
    await client.close();
    await mongo.stop();
  }
});