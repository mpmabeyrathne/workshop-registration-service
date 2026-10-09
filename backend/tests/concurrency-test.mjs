
const API = "http://localhost:5000/api";

// Reusable login function
async function login(email, password) {
  const response = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed for ${email}: ${response.status}`);
  }

  const data = await response.json();
  return data.token;
}

async function main() {
  // 1. Login as Manager and Staff
  const managerToken = await login(
    "manager@workshop.local",
    "Manager@12345"
  );

  const staffToken = await login(
    "staff@workshop.local",
    "Staff@12345"
  );

  console.log("PASS: Manager and Staff authentication");

  // 2. Create a fresh workshop with one available seat
  const workshopCode = `RACE-${Date.now()}`;

  const createResponse = await fetch(`${API}/workshops`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managerToken}`,
    },
    body: JSON.stringify({
      code: workshopCode,
      title: "Automated Concurrency Test",
      instructor: "Test Instructor",
      startsAt: "2026-11-01T09:00:00+05:30",
      capacity: 1,
      location: "Colombo",
      status: "SCHEDULED",
    }),
  });

  if (!createResponse.ok) {
    throw new Error(
      `Workshop creation failed: ${createResponse.status} - ` +
      await createResponse.text()
    );
  }

  const workshop = await createResponse.json();
  const workshopId = workshop.id;

  console.log(`Created test workshop: ${workshopCode}`);
  console.log(`Workshop ID: ${workshopId}`);
  console.log(`Capacity: ${workshop.capacity}`);

  // 3. Send 10 simultaneous registration requests
  const totalRequests = 10;

  console.log(`Sending ${totalRequests} concurrent requests...`);

  const requests = Array.from(
    { length: totalRequests },
    (_, i) =>
      fetch(`${API}/workshops/${workshopId}/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          attendeeName: `Test User ${i + 1}`,
          attendeeEmail: `race${i + 1}@example.com`,
        }),
      })
  );

  const responses = await Promise.all(requests);

  // 4. Count HTTP response codes
  const counts = {};

  for (const response of responses) {
    counts[response.status] =
      (counts[response.status] ?? 0) + 1;
  }

  console.log("\nHTTP response summary:");
  console.table(counts);

  // 5. Verify registrations saved in database via API
  const historyResponse = await fetch(
    `${API}/workshops/${workshopId}/registrations`,
    {
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
    }
  );

  if (!historyResponse.ok) {
    throw new Error("Could not retrieve registration history");
  }

  const registrations = await historyResponse.json();

  const activeRegistrations = registrations.filter(
    (registration) => registration.status === "ACTIVE"
  );

  console.log(`Active registrations: ${activeRegistrations.length}`);
  console.log(`Workshop capacity: ${workshop.capacity}`);

  // 6. Assert concurrency safety
  const statusCheck =
    counts[201] === 1 &&
    counts[409] === totalRequests - 1;

  const databaseCheck =
    activeRegistrations.length === 1 &&
    activeRegistrations.length <= workshop.capacity;

  if (statusCheck && databaseCheck) {
    console.log("\nPASS: Concurrency test successful");
    console.log("PASS: 1 registration accepted");
    console.log("PASS: 9 registrations rejected");
    console.log("PASS: No overbooking");
  } else {
    console.error("\nFAIL: Concurrency test failed");
    console.error("Expected: 1 success and 9 conflicts");
    console.error("Actual:", counts);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("TEST FAILED:", error.message);
  process.exitCode = 1;
});
