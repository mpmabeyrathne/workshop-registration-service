
const API = "http://localhost:5000/api";

async function login(email, password) {
  const response = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${email}`);
  }

  return (await response.json()).token;
}

async function request(method, path, token, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
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

  const created = await request("POST", "/workshops", manager, {
    code: `CAPRACE-${Date.now()}`,
    title: "Capacity Race Test",
    instructor: "Test Instructor",
    startsAt: "2026-11-20T09:00:00+05:30",
    capacity: 2,
    location: "Colombo"
  });

  if (created.status !== 201) {
    throw new Error("Could not create workshop");
  }

  const id = created.data.id;

  const initial = await request(
    "POST",
    `/workshops/${id}/registrations`,
    staff,
    {
      attendeeName: "Initial Attendee",
      attendeeEmail: "initial@example.com"
    }
  );

  if (initial.status !== 201) {
    throw new Error("Initial registration failed");
  }

  // Execute both operations concurrently.
  const [capacityUpdate, registration] = await Promise.all([
    request("PUT", `/workshops/${id}`, manager, {
      capacity: 1
    }),
    request("POST", `/workshops/${id}/registrations`, staff, {
      attendeeName: "Concurrent Attendee",
      attendeeEmail: "concurrent@example.com"
    })
  ]);

  console.log("Capacity update:", capacityUpdate.status);
  console.log("Registration:", registration.status);

  const history = await request(
    "GET",
    `/workshops/${id}/registrations`,
    staff
  );

  const workshops = await request("GET", "/workshops", manager);
  const workshop = workshops.data.find((w) => w.id === id);

  if (history.status !== 200 || !workshop) {
    throw new Error("Could not verify final state");
  }

  const activeCount = history.data.filter(
    (r) => r.status === "ACTIVE"
  ).length;

  console.log("Final capacity:", workshop.capacity);
  console.log("Final active registrations:", activeCount);

  const expectedOutcomes =
    (capacityUpdate.status === 200 &&
      registration.status === 409 &&
      workshop.capacity === 1 &&
      activeCount === 1) ||
    (capacityUpdate.status === 409 &&
      registration.status === 201 &&
      workshop.capacity === 2 &&
      activeCount === 2);

  if (expectedOutcomes) {
    console.log("PASS: Concurrent capacity update is safe");
    console.log("PASS: Capacity invariant preserved");
  } else {
    console.error("FAIL: Unexpected concurrent outcome");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("TEST FAILED:", error);
  process.exitCode = 1;
});
