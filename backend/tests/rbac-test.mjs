const API = "http://localhost:5000/api";

async function login(email, password) {
  const response = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${email}`);
  }

  const data = await response.json();
  return data.token;
}

async function request(method, path, token, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  return response.status;
}

const admin = await login(
  "admin@workshop.local",
  "Admin@12345"
);

const manager = await login(
  "manager@workshop.local",
  "Manager@12345"
);

const staff = await login(
  "staff@workshop.local",
  "Staff@12345"
);

const tests = [
  {
    name: "Admin can view workshops",
    method: "GET",
    path: "/workshops",
    token: admin,
    expected: 403
  },
  {
    name: "Manager can view workshops",
    method: "GET",
    path: "/workshops",
    token: manager,
    expected: 200
  },
  {
    name: "Staff can view workshops",
    method: "GET",
    path: "/workshops",
    token: staff,
    expected: 200
  },
  {
    name: "Staff cannot create workshops",
    method: "POST",
    path: "/workshops",
    token: staff,
    body: {},
    expected: 403
  },
  {
    name: "Admin cannot create workshops",
    method: "POST",
    path: "/workshops",
    token: admin,
    body: {},
    expected: 403
  },
  {
    name: "Manager cannot create users",
    method: "POST",
    path: "/users",
    token: manager,
    body: {},
    expected: 403
  },
  {
    name: "Staff cannot create users",
    method: "POST",
    path: "/users",
    token: staff,
    body: {},
    expected: 403
  },
  {
    name: "Staff cannot edit workshops",
    method: "PUT",
    path: "/workshops/1",
    token: staff,
    body: { title: "Unauthorized update" },
    expected: 403
  },
  {
    name: "Admin cannot register attendees",
    method: "POST",
    path: "/workshops/1/registrations",
    token: admin,
    body: {},
    expected: 403
  },
  {
    name: "Admin cannot view registration history",
    method: "GET",
    path: "/workshops/1/registrations",
    token: admin,
    expected: 403
  }
];

let passed = 0;

for (const test of tests) {
  const actual = await request(
    test.method,
    test.path,
    test.token,
    test.body
  );

  const success = actual === test.expected;

  console.log(
    `${success ? "PASS" : "FAIL"}: ${test.name} ` +
    `(expected ${test.expected}, got ${actual})`
  );

  if (success) passed++;
}

console.log(`\nResults: ${passed}/${tests.length} passed`);

if (passed !== tests.length) {
  process.exitCode = 1;
}