const API = "http://localhost:5000/api";

const loginResponse = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "staff@workshop.local",
    password: "Staff@12345"
  })
});

if (!loginResponse.ok) {
  throw new Error("Staff login failed");
}

const { token } = await loginResponse.json();

// Use the ID returned when RACE001 was created.
const workshopId = process.argv[2];

if (!workshopId) {
  throw new Error("Pass the concurrency-test workshop ID");
}

const requests = Array.from({ length: 10 }, (_, i) =>
  fetch(`${API}/workshops/${workshopId}/registrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      attendeeName: `Test User ${i + 1}`,
      attendeeEmail: `race${i + 1}@example.com`
    })
  })
);

const responses = await Promise.all(requests);

const counts = {};

for (const response of responses) {
  counts[response.status] = (counts[response.status] ?? 0) + 1;
}

console.table(counts);

if (counts[201] === 1 && counts[409] === 9) {
  console.log("PASS: No overbooking");
} else {
  console.error("FAIL: Unexpected registration results");
  process.exitCode = 1;
}