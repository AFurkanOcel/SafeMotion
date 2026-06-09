# SafeMotion Setup Guide

This setup guide is a planning skeleton. Exact commands will be completed during implementation phases.

## Requirements

Planned local requirements:

- Node.js LTS.
- npm.
- PostgreSQL.
- Git.
- Expo tooling for mobile development.
- A modern browser for the dashboard.
- Optional Docker and Docker Compose for the bonus deployment phase.

## Backend Setup

Planned steps:

1. Enter the `backend` directory.
2. Install backend dependencies.
3. Configure environment variables.
4. Start the Express development server.
5. Verify the health endpoint.

No backend code or package manifest is created in the current documentation phase.

## Database Setup

Planned steps:

1. Create a local PostgreSQL database.
2. Set the database URL in the backend environment file.
3. Run Prisma migrations.
4. Verify Prisma can connect to the database.

## Prisma Migration

Planned steps:

1. Define the Prisma schema.
2. Run the initial migration.
3. Generate the Prisma client.
4. Optionally seed demo users and monitored persons.

## Dashboard Setup

Planned steps:

1. Enter the `dashboard` directory.
2. Install dashboard dependencies.
3. Configure the backend API URL.
4. Start the Vite development server.
5. Log in with a demo caregiver account.

No dashboard code or package manifest is created in the current documentation phase.

## Mobile Setup

Planned steps:

1. Enter the `mobile` directory.
2. Install mobile dependencies.
3. Configure the backend API URL.
4. Start Expo.
5. Pair the mobile device using a dashboard-generated pairing code.

No mobile code or package manifest is created in the current documentation phase.

## Environment Variables

Planned backend variables:

```text
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/safemotion
JWT_SECRET=replace-with-local-secret
JWT_EXPIRES_IN=1d
DEVICE_TOKEN_SECRET=replace-with-local-device-secret
CORS_ORIGIN=http://localhost:5173
```

Planned dashboard variables:

```text
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

Planned mobile variables:

```text
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
```

## Running the Project

Planned order:

1. Start PostgreSQL.
2. Start the backend.
3. Start the dashboard.
4. Start the mobile app.
5. Pair the mobile device.
6. Start sensor monitoring.

## Running Tests

Planned test commands:

```bash
npm test
npm run test:watch
npm run test:coverage
```

Exact commands may differ after package scripts are implemented.

## Docker Setup

Docker Compose is planned as a bonus phase. It should include:

- PostgreSQL service.
- Backend service.
- Environment variable configuration.
- Persistent database volume.

Dashboard and mobile can remain development-server based for the course demo unless a later phase adds containerization.

## Common Problems

- PostgreSQL connection fails: verify `DATABASE_URL`, database name, user, and password.
- JWT errors: verify `JWT_SECRET` is set and the token is sent in the `Authorization` header.
- Device upload fails: verify the mobile app uses a valid device token from pairing.
- Dashboard does not update live: verify Socket.IO URL, CORS settings, and server logs.
- Mobile cannot reach backend: verify local network address and firewall settings.

## Next implementation step

Create the backend Express TypeScript setup after user approval.

