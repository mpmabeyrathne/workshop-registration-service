# Workshop Registration Service

A simple web application for a community training centre with three locations. It helps staff manage workshops and attendee registrations without overbooking.

## Features

- **Admin:** create users and change their roles. Admin cannot manage workshops.
- **Manager:** create and edit workshops, register or cancel attendees, and view history.
- **Staff:** view workshops, register or cancel attendees, and view history.
- Filter workshops by date range, status, and available seats.
- Keep cancelled registrations in the history, including who registered or cancelled them and when.
- Protect the last available seat when multiple staff register attendees at the same time.

All permissions are checked by the backend. Attendees need only a name and email; they do not have user accounts.

## Tech stack

- Frontend: React, Vite, Ant Design, Axios
- Backend: Node.js, Express, JavaScript, Sequelize, Zod, JWT, bcryptjs
- Database: PostgreSQL
- Local environment: Docker Compose

## Run with Docker (recommended)

**Requirements:** Docker Desktop (with Docker Compose) and a web browser. Make sure ports **5000** and **5173** are free.

1. Clone and open the project:

   ```bash
   git clone https://github.com/mpmabeyrathne/workshop-registration-service.git
   cd workshop-registration-service
   ```

2. Create a root environment file by copying `.env.example` to `.env`. Add a long random JWT secret, for example:

   ```env
   JWT_SECRET=replace_with_your_own_long_random_secret
   ```

   Do not commit `.env` to Git.

3. Start the database, backend, and frontend:

   ```bash
   docker compose up -d --build
   ```

4. **Initialize the database** (required on a fresh setup):

   ```bash
   docker compose run --rm backend npm run seed
   ```

   This creates the database tables, the initial Admin user, and three sample workshops. It is safe to run the seed command again; it does not create duplicate Admin or sample workshop records.

5. Open the application:

   - Frontend: http://localhost:5173
   - Backend health check: http://localhost:5000/api/health

### Demo Admin login (local use only)

| Field | Value |
| --- | --- |
| Email | `admin@workshop.local` |
| Password | `Admin@12345` |

Log in as Admin and use **Create User** to add Manager and Staff accounts. Log out and use those new accounts to test workshop and registration features. There is no public sign-up page.

### Sample workshops

The seed command adds:

- `WS001` – JavaScript Basics (Colombo)
- `WS002` – Pottery Workshop (Kandy)
- `WS003` – Fitness Workshop (Galle)

Sample dates are **15–17 October 2026**. These are demo records and may be past events when you run the project.

## Useful Docker commands

```bash
docker compose ps                 # Check services
docker compose logs backend       # View backend logs
docker compose down               # Stop services; keeps database data
```

Do **not** run `docker compose down -v` unless you want to remove the database volume and its data.

## Run tests

With the Docker services running and the database seeded, open a terminal in the `backend` folder. The test scripts use a backend running at `http://localhost:5000`:

```bash
cd backend
npm ci
npm run test:rbac
npm run test:concurrency
npm run test:capacity
npm run test:validation
npm run test:capacity-race
```

Some tests create additional workshops and registrations in the local database.

## Project structure

```text
backend/              Express API, database models, seed script, tests
frontend/             React pages, components, API client
docker-compose.yml    PostgreSQL, backend and frontend services
.env.example          Example Docker environment configuration
TECHNICAL_DECISIONS.md  Design choices and trade-offs
```

## Notes

- The seed script uses Sequelize `sync()` to create tables. This small assessment does not include migration files.
- Docker runs the Vite development server for simple local testing; this is not a production deployment.
- The PostgreSQL port is internal to Docker. The browser uses ports 5173 and 5000.
