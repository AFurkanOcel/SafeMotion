# SafeMotion Roadmap

This roadmap records the original 22 ordered implementation phases. Each phase is completed, checked, and committed before the next phase starts. Final README work is intentionally handled last after screenshots are available.

## 1. Documentation and planning

- Work to do: create README and planning docs.
- Expected output: complete documentation-only project plan.
- Suggested commit: `Initialize SafeMotion planning and documentation`
- Codex task boundary: documentation files only; no application code.
- Tests: review docs for completeness.
- Type: mandatory planning.

## 2. Backend Express TypeScript setup

- Work to do: create backend project structure, TypeScript config, Express app entry points, and health route.
- Expected output: backend starts locally and returns health status.
- Suggested commit: `Set up Express TypeScript backend`
- Codex task boundary: backend skeleton only.
- Tests: run backend type check and health route check.
- Type: mandatory.

## 3. PostgreSQL and Prisma setup

- Work to do: add Prisma, database connection config, environment example, and initial migration workflow.
- Expected output: backend can connect to PostgreSQL through Prisma.
- Suggested commit: `Configure PostgreSQL and Prisma`
- Codex task boundary: database setup without full domain models.
- Tests: run Prisma validation and connection check.
- Type: mandatory.

## 4. Core data models

- Work to do: implement Prisma models for users, monitored persons, devices, readings, detection events, alerts, and confirmations.
- Expected output: database schema matches the planned data model.
- Suggested commit: `Add SafeMotion core data models`
- Codex task boundary: schema and migrations only.
- Tests: run migration and Prisma client generation.
- Type: mandatory.

## 5. Authentication and authorization

- Work to do: implement JWT login, bcrypt password hashing, auth middleware, and role checks.
- Expected output: dashboard users can log in and protected routes enforce `ADMIN` and `CAREGIVER`.
- Suggested commit: `Implement authentication and role authorization`
- Codex task boundary: user auth only; no device token flow yet.
- Tests: auth and role authorization tests.
- Type: mandatory.

## 6. Device pairing workflow

- Work to do: implement pairing code creation, pairing code validation, device token issuing, and token hashing.
- Expected output: mobile device can pair and receive a device token.
- Suggested commit: `Implement device pairing workflow`
- Codex task boundary: pairing and device auth only.
- Tests: pairing success, expired code, reused code, invalid token.
- Type: mandatory.

## 7. Sensor reading ingestion API

- Work to do: implement single and batch sensor upload with accelerometer and gyroscope validation.
- Expected output: paired devices can upload timestamped readings.
- Suggested commit: `Add sensor reading ingestion API`
- Codex task boundary: ingestion and persistence only.
- Tests: validation, device token, timestamp, and persistence tests.
- Type: mandatory.

## 8. Fall and inactivity detection service

- Work to do: implement threshold-based fall suspicion and inactivity detection.
- Expected output: suspicious motion creates detection events.
- Suggested commit: `Implement fall and inactivity detection`
- Codex task boundary: backend service logic only.
- Tests: fall threshold, normal movement, inactivity window, no duplicate event tests.
- Type: mandatory.

## 9. Alert and confirmation workflow

- Work to do: implement confirmation response endpoints, safe closure, no-response escalation, and alert creation.
- Expected output: suspected falls can be confirmed safe or escalated to critical alerts.
- Suggested commit: `Implement alert and confirmation workflow`
- Codex task boundary: backend workflow only.
- Tests: safe response, no response, alert resolve, duplicate close prevention.
- Type: mandatory.

## 10. Socket.IO real-time events

- Work to do: add Socket.IO server, auth for JWT and device tokens, and live event publishing.
- Expected output: dashboard receives live readings, status updates, detection events, and alerts.
- Suggested commit: `Add Socket.IO real-time events`
- Codex task boundary: real-time backend only.
- Tests: socket authentication and event emission tests.
- Type: mandatory plus planned bonus quality.

## 11. React dashboard setup

- Work to do: create React + Vite + TypeScript dashboard project.
- Expected output: dashboard app starts and can call the backend health endpoint.
- Suggested commit: `Set up React dashboard`
- Codex task boundary: frontend setup and base layout only.
- Tests: dashboard build check.
- Type: mandatory.

## 12. Live monitoring and alerts dashboard

- Work to do: implement login, monitored person view, live chart/table, alert list, and resolve action.
- Expected output: caregiver can monitor live data and manage alerts.
- Suggested commit: `Build live monitoring dashboard`
- Codex task boundary: dashboard user workflow only.
- Tests: manual dashboard tests and API integration checks.
- Type: mandatory.

## 13. Expo mobile setup

- Work to do: create Expo + React Native + TypeScript mobile project.
- Expected output: mobile app starts and shows initial screen.
- Suggested commit: `Set up Expo mobile app`
- Codex task boundary: mobile setup only.
- Tests: Expo start check.
- Type: mandatory.

## 14. Mobile device pairing

- Work to do: implement pairing code entry, device token storage, and paired status screen.
- Expected output: mobile app can pair with backend.
- Suggested commit: `Implement mobile device pairing`
- Codex task boundary: mobile pairing flow only.
- Tests: manual pairing tests.
- Type: mandatory.

## 15. Mobile accelerometer and gyroscope upload

- Work to do: collect accelerometer and gyroscope readings and upload them with timestamps.
- Expected output: backend receives live mobile sensor data.
- Suggested commit: `Upload mobile motion sensor readings`
- Codex task boundary: mobile sensor upload only.
- Tests: manual sensor upload and backend ingestion checks.
- Type: mandatory.

## 16. Mobile fall confirmation screen

- Work to do: implement English confirmation UI with `Are you okay?`, `I'm safe`, and `Need help`.
- Expected output: mobile user can respond to suspected fall events.
- Suggested commit: `Add mobile fall confirmation screen`
- Codex task boundary: mobile confirmation UI and API calls.
- Tests: manual confirmation response tests.
- Type: mandatory.

## 17. Swagger documentation

- Work to do: add OpenAPI specification and Swagger UI route.
- Expected output: API documentation is visible from the backend.
- Suggested commit: `Add Swagger API documentation`
- Codex task boundary: API docs only.
- Tests: open Swagger page and validate main endpoint groups.
- Type: bonus.

## 18. Logging

- Work to do: add Pino logging, request logs, error logs, and key workflow logs.
- Expected output: backend logs authentication, ingestion, detection, and alert events safely.
- Suggested commit: `Add backend logging`
- Codex task boundary: logging only.
- Tests: run backend and verify logs without sensitive data.
- Type: bonus.

## 19. Automated tests

- Work to do: add Vitest and Supertest coverage for core backend workflows.
- Expected output: automated tests cover auth, pairing, ingestion, detection, alerts, and authorization.
- Suggested commit: `Add automated backend tests`
- Codex task boundary: tests and test utilities only.
- Tests: run full automated test suite.
- Type: bonus and quality.

## 20. CSV export

- Work to do: implement alert CSV export endpoint and dashboard download action.
- Expected output: caregiver can export alert history as CSV.
- Suggested commit: `Implement alert CSV export`
- Codex task boundary: CSV export only.
- Tests: endpoint response headers and CSV content tests.
- Type: bonus.

## 21. Docker Compose

- Work to do: add Docker Compose for PostgreSQL, backend, and dashboard.
- Expected output: database, backend, and dashboard can run with Docker Compose.
- Suggested commit: `Add Docker Compose setup`
- Codex task boundary: local container setup only.
- Tests: run Docker Compose config, image build, and backend/dashboard health checks.
- Type: bonus.

## 22. README, setup guide and final demo documentation

- Work to do: update README, setup guide, test scenarios, and demo flow with final implementation details.
- Expected output: final deliverable is ready for jury review.
- Suggested commit: `Finalize README setup guide and demo docs`
- Codex task boundary: final documentation only.
- Tests: run final checklist and demo rehearsal.
- Type: final polish.

## Additional Finalization Steps

After the original 22 phases, the project received a focused finalization pass:

- Monitored person backend API and dashboard management.
- Dashboard pairing workflow.
- Dashboard live demo polish.
- Mobile branding, LAN preparation, and demo fall trigger.
- Alert and confirmation demo hardening.
- Backend workflow test expansion.
- Optional bonus packaging with dashboard Docker Compose support.
- Final documentation update without README.

## Next implementation step

Finalize the README and screenshot pass after the user adds final screenshots.
