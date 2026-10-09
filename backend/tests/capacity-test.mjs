
const API = "http://localhost:5000/api";

async function request(path, method, token, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const data = await response.json();
  return { status: response.status, data };
}

async function login(email, password) {
  const response = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) throw new Error("Login failed");

  return (await response.json()).token;
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

  const created = await request("/workshops", "POST", manager, {
    code: `CAP-${Date.now()}`,
    title: "Capacity Validation Test",
    instructor: "Test Instructor",
    startsAt: "2026-11-10T09:00:00+05:30",
    capacity: 2,
    location: "Colombo"
  });

  if (created.status !== 201) {
    throw new Error(`Workshop creation failed: ${created.status}`);
  }

  const id = created.data.id;

  for (let i = 1; i <= 2; i++) {
    const result = await request(
      `/workshops/${id}/registrations`,
      "POST",
      staff,
      {
        attendeeName: `Test Attendee ${i}`,
        attendeeEmail: `capacity${i}@example.com`
      }
    );

    if (result.status !== 201) {
      throw new Error(`Registration ${i} failed`);
    }
  }

  // Manager attempts to reduce capacity below active count.
  const update = await request(
    `/workshops/${id}`,
    "PUT",
    manager,
    { capacity: 1 }
  );

  console.log("Capacity reduction status:", update.status);

  const workshops = await request("/workshops", "GET", manager);

  const workshop = workshops.data.find((item) => item.id === id);

  if (update.status === 409 && workshop?.capacity === 2) {
    console.log("PASS: Capacity reduction correctly rejected");
    console.log("PASS: Original capacity preserved");
  } else {
    console.error("FAIL: Capacity validation");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("TEST FAILED:", error.message);
  process.exitCode = 1;
});
