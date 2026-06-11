# SafeMotion Setup Guide

## Requirements

- Node.js LTS.
- npm.
- Git.
- Docker Desktop with Docker Compose.
- Expo Go on a physical phone for mobile testing.
- A browser for the dashboard.

## Environment Files

Backend environment example:

```text
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/safemotion
JWT_SECRET=replace-with-local-secret
JWT_EXPIRES_IN=1d
DEVICE_TOKEN_SECRET=replace-with-local-device-secret
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

Dashboard environment example:

```text
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

Mobile environment for emulator/local web:

```text
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
```

Mobile environment for a physical phone:

```text
EXPO_PUBLIC_API_BASE_URL=http://PC_LOCAL_IP:3000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://PC_LOCAL_IP:3000
```

Replace `PC_LOCAL_IP` with the computer's Wi-Fi IP address. The computer and phone must be on the same Wi-Fi network.

## Docker Demo Setup

From the project root:

```bash
docker compose config
docker compose up --build
```

Services:

- Backend: `http://localhost:3000`
- Dashboard: `http://localhost:5173`
- Swagger: `http://localhost:3000/api-docs`
- PostgreSQL: `localhost:5432`

Docker Compose starts PostgreSQL first, waits for backend health, and then serves the dashboard.

## Backend Development

```bash
cd backend
npm run typecheck
npm run build
npm run test
npm audit --audit-level=moderate
```

Useful commands:

```bash
npm run dev
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
```

## Dashboard Development

```bash
cd dashboard
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

To run the development server:

```bash
npm run dev
```

Development dashboard URL:

```text
http://localhost:5173
```

## Mobile Development

```bash
cd mobile
npm run typecheck
npm audit --audit-level=moderate
```

Start Expo in LAN mode:

```bash
npm run start -- --host lan
```

For physical phone testing:

1. Start Docker Compose or the backend manually.
2. Configure the mobile `.env` with the computer's Wi-Fi IP.
3. Start Expo with LAN mode.
4. Scan the QR code with Expo Go.
5. Pair the phone using a dashboard-generated pairing code.

## Demo Workflow

1. Open the dashboard.
2. Sign up or log in as a caregiver.
3. Create or select a monitored person.
4. Generate a pairing code.
5. Pair the mobile device.
6. Start sensor monitoring on the phone.
7. Watch live readings on the dashboard.
8. Use `Send test fall reading` on mobile for a safe demo trigger.
9. Respond with `I'm safe` or `Need help`.
10. Resolve alerts from the dashboard.
11. Export alert history as CSV.

## Common Problems

- Docker command is not found: start Docker Desktop and verify `docker --version`.
- Dashboard cannot reach backend: verify backend is running on port `3000`.
- Mobile cannot reach backend: use the computer's Wi-Fi IP, not `localhost`.
- Pairing fails: generate a fresh pairing code; codes expire and are single-use.
- Socket events do not appear: verify `VITE_SOCKET_URL` or `EXPO_PUBLIC_SOCKET_URL`.
- Login fails: verify seeded demo credentials or use public caregiver signup.

## Next implementation step

Finalize the README and screenshot pass after the user adds final screenshots.
