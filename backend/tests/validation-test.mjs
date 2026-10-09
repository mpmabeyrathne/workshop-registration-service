
const API = "http://localhost:5000/api";

async function login(email, password) {
  const response = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) throw new Error(`Login failed: ${email}`);

  return (await response.json()).token;
}

async function request(method, path, token, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {})
  });

  return {
    status: response.status,
    data: await response.json()
  };
}

async function main() {
  const manager = await login(
    "manager@workshop.local",
    "Manager@12345"
  );

  const staff = await login(
    "staff@workshop.local",
    "Staff@12345"
  );

  const code = `VAL-${Date.now()}`;

  const validWorkshop = {
    code,
    title: "Validation Test Workshop",
    instructor: "Test Instructor",
    startsAt: "2026-11-15T09:00:00+05:30",
    capacity: 1,
    location: "Colombo",
    status: "SCHEDULED"
  };

  const results = [];

  async function check(name, actual, expected) {
    const passed = actual === expected;

    console.log(
      `${passed ? "PASS" : "FAIL"}: ${name} ` +
      `(expected ${expected}, got ${actual})`
    );

    results.push(passed);
  }

  // 1. Reject zero capacity
  const zeroCapacity = await request(
    "POST", "/workshops", manager,
    { ...validWorkshop, capacity: 0 }
  );
  await check("Reject zero capacity", zeroCapacity.status, 400);

  // 2. Reject negative capacity
  const negativeCapacity = await request(
    "POST", "/workshops", manager,
    { ...validWorkshop, capacity: -5 }
  );
  await check("Reject negative capacity", negativeCapacity.status, 400);

  // 3. Reject decimal capacity
  const decimalCapacity = await request(
    "POST", "/workshops", manager,
    { ...validWorkshop, capacity: 2.5 }
  );
  await check("Reject decimal capacity", decimalCapacity.status, 400);

  // 4. Create valid workshop
  const created = await request(
    "POST", "/workshops", manager, validWorkshop
  );
  await check("Create valid workshop", created.status, 201);

  if (created.status !== 201) {
    throw new Error("Cannot continue without test workshop");
  }

  const id = created.data.id;

  // 5. Reject duplicate workshop code
  const duplicate = await request(
    "POST", "/workshops", manager, validWorkshop
  );
  await check("Reject duplicate code", duplicate.status, 409);

  // 6. Reject invalid attendee email
  const invalidEmail = await request(
    "POST", `/workshops/${id}/registrations`, staff,
    {
      attendeeName: "Test Person",
      attendeeEmail: "not-an-email"
    }
  );
  await check("Reject invalid email", invalidEmail.status, 400);

  // 7. Register first attendee
  const registered = await request(
    "POST", `/workshops/${id}/registrations`, staff,
    {
      attendeeName: "Test Person",
      attendeeEmail: "test@example.com"
    }
  );
  await check("Register first attendee", registered.status, 201);

  if (registered.status !== 201) {
    throw new Error("Cannot continue without registration");
  }

  const registrationId = registered.data.registration.id;

  // 8. Reject registration when workshop is full
  const full = await request(
    "POST", `/workshops/${id}/registrations`, staff,
    {
      attendeeName: "Another Person",
      attendeeEmail: "another@example.com"
    }
  );
  await check("Reject full workshop", full.status, 409);

  // 9. Cancel registration
  const cancelled = await request(
    "PATCH", `/registrations/${registrationId}/cancel`, staff
  );
  await check("Cancel registration", cancelled.status, 200);

  // 10. Reject repeated cancellation
  const repeated = await request(
    "PATCH", `/registrations/${registrationId}/cancel`, staff
  );
  await check("Reject repeated cancellation", repeated.status, 409);

  // 11. Seat can be reused after cancellation
  const reused = await request(
    "POST", `/workshops/${id}/registrations`, staff,
    {
      attendeeName: "New Attendee",
      attendeeEmail: "new@example.com"
    }
  );
  await check("Reuse cancelled seat", reused.status, 201);

  // 12. History retains cancelled registration
  const history = await request(
    "GET", `/workshops/${id}/registrations`, staff
  );

  const historyPreserved =
    history.status === 200 &&
    Array.isArray(history.data) &&
    history.data.some(
      (r) =>
        r.id === registrationId &&
        r.status === "CANCELLED" &&
        r.cancelledBy === 3 &&
        r.cancelledAt
    );

  await check(
    "Cancelled registration remains in history",
    Boolean(historyPreserved),
    true
  );

  const passed = results.filter(Boolean).length;

  console.log(`\nResults: ${passed}/${results.length} passed`);

  if (passed !== results.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("TEST FAILED:", error);
  process.exitCode = 1;
});
