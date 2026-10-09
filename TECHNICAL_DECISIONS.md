# Technical Decisions — Workshop Registration Service

## Goal

Build a simple full-stack system for a training centre. The main priorities are correct staff permissions, no overbooking, and a clear history of registrations and cancellations.

## Stack and reasons

- **Node.js, Express, JavaScript:** a small REST API using familiar tools, suitable for a time-limited task.
- **PostgreSQL + Sequelize:** relational data for users, workshops and registrations. PostgreSQL supports transactions and row locks.
- **Zod:** validates input before it is saved.
- **JWT + bcryptjs:** JWT protects API requests; bcrypt hashes staff passwords.
- **React + Vite + Ant Design:** a working UI built quickly with reusable pages, forms and tables.
- **Docker Compose:** runs the frontend, backend and database with a repeatable setup.

## Main design decisions

**Backend permissions:** Three roles are enforced by API middleware. Admin creates users and changes roles but cannot access workshop endpoints. Manager can manage workshops and registrations. Staff can view workshops and manage registrations, but cannot edit workshops. There is no public sign-up.

**Database:** Users have staff accounts. Workshops include a unique code, title, instructor, date/time, capacity, status and location. Registrations hold the attendee name/email, workshop, status, timestamps and references to the staff who registered or cancelled them. Attendees do not have accounts.

**Cancellation history:** Cancelling changes a registration from `ACTIVE` to `CANCELLED`; it does not delete the record. The system saves `cancelledBy` and `cancelledAt`. Only active registrations take up seats.

## How overbooking is prevented

Each registration runs inside a **PostgreSQL transaction**. The API first locks the relevant workshop row using `SELECT ... FOR UPDATE` through Sequelize. It then counts active registrations and creates a new registration only if a seat is free. Another request for the same workshop must wait for the lock, so two staff members cannot both take the last seat.

Workshop capacity changes and cancellations also lock the workshop row. A Manager cannot lower capacity below the number of active registrations. The project includes tests for concurrent registrations, capacity changes and role permissions.

## Assumptions and trade-offs

- The seeded Admin is used only for local demonstration. Admin creates all other staff accounts.
- One registration represents one attendee; attendee login and payment are not needed.
- Workshops can be `SCHEDULED`, `CANCELLED` or `COMPLETED`. Registration is allowed only for scheduled workshops.
- The frontend stores JWT in local storage for simplicity. A production system would use a more secure session design.
- Sequelize `sync()` is used for first-time setup rather than migrations, to keep the project small.
- Docker runs the Vite development server, not a production web server.

## Not included

The optional **waitlist**, audit trail for workshop edits/user-role changes, and **live deployment** were not implemented. Registration and cancellation history **is** implemented. The focus was a connected application with correct permissions and safe seat allocation.
