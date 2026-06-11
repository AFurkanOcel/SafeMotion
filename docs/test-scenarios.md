# SafeMotion Test Scenarios

This document lists manual and automated tests for the completed MVP and low-risk bonus features.

## Backend Automated Tests

Run:

```bash
cd backend
npm run typecheck
npm run build
npm run test
npm audit --audit-level=moderate
```

Covered areas:

- App health and OpenAPI availability.
- Auth validation and protected route behavior.
- Token generation and hashing.
- Monitored person access rules.
- Device pairing workflow.
- Sensor schema validation.
- Detection threshold behavior.
- Inactivity escalation behavior.
- CSV export escaping and caregiver scoping.

## Auth Tests

- Public signup creates a `CAREGIVER` account.
- Login with valid credentials returns a JWT.
- Login with invalid credentials returns `401`.
- Protected endpoints reject missing JWT.
- `/api/v1/auth/me` returns the authenticated user.
- Admin-only registration rejects caregiver users.

## Role Authorization Tests

- `ADMIN` can access all monitored persons.
- `CAREGIVER` can access only assigned monitored persons.
- A caregiver cannot generate pairing codes for another caregiver's person.
- A caregiver cannot export another caregiver's alert data.

## Device Pairing Tests

- Dashboard generates a six-digit pairing code.
- Pairing code has an expiry timestamp.
- Mobile pairs with a valid code and receives a device token.
- Invalid pairing code returns `INVALID_PAIRING_CODE`.
- Expired pairing code returns `PAIRING_CODE_EXPIRED`.
- Reused pairing code fails because it is cleared after pairing.
- Device token is required for sensor upload.

## Sensor Reading Tests

- Valid accelerometer and gyroscope payload is accepted.
- Valid batch payload is accepted.
- Missing accelerometer values are rejected.
- Missing gyroscope values are rejected.
- Non-numeric values are rejected.
- Future timestamps beyond allowed rules are rejected.
- Accepted readings store both `recordedAt` and `receivedAt`.

## Detection Tests

- Normal motion returns `NORMAL`.
- High acceleration creates `FALL_SUSPECTED`.
- High rotation creates `FALL_SUSPECTED`.
- Existing open fall event prevents duplicate fall windows.
- Low movement after a fall window creates `INACTIVITY_DETECTED`.
- Inactivity escalation records no-response and creates alert behavior through services.

## Confirmation Tests

- `SAFE` closes an open detection event.
- `NEEDS_HELP` escalates to a critical alert.
- `NO_RESPONSE` is recorded by backend escalation logic.
- A mismatched device response is rejected.
- A response for an already closed event is rejected.

## Alert Tests

- Critical alerts appear in the list.
- Active alerts appear in the dashboard banner.
- Alert resolution changes status to `RESOLVED`.
- Resolving an already resolved alert returns a conflict.
- CSV export includes active and resolved alerts.
- CSV export escapes commas, quotes, and newlines.

## Socket.IO Tests

- Dashboard receives `sensor.reading.created`.
- Dashboard receives `device.status.updated`.
- Dashboard receives `detection.fallSuspected`.
- Dashboard receives `detection.inactivityDetected`.
- Dashboard receives `alert.created`.
- Dashboard receives `alert.resolved`.
- Mobile receives or fetches active confirmation state after a fall suspicion.

## Dashboard Manual Tests

- Login and signup screens use English UI text.
- Caregiver can create a monitored person.
- Caregiver can select a monitored person.
- Pairing panel creates a code for the selected person.
- Live readings update after mobile uploads.
- Active alert banner is visible.
- Alert resolve action works.
- CSV export downloads a readable file.
- Docker dashboard opens at `http://localhost:5173`.

## Mobile Manual Tests

- App icon and SafeMotion branding display correctly.
- Backend connection status is visible.
- Pairing screen accepts dashboard-generated code.
- Device token is stored for the MVP session.
- Sensor monitoring can start and stop.
- `Send test fall reading` creates a safe demo fall trigger.
- Confirmation panel shows `I'm safe` and `Need help`.
- Physical phone test works over LAN with the computer's Wi-Fi IP.

## Pre-Demo Checklist

- Docker Desktop is running.
- `docker compose config` passes.
- `docker compose up --build` starts PostgreSQL, backend, and dashboard.
- Swagger opens.
- Caregiver login or signup works.
- Monitored person create/select works.
- Pairing code generation works.
- Mobile pairing works.
- Live readings appear.
- Demo fall trigger works.
- Safe confirmation works.
- Need-help or no-response alert scenario works.
- Alert resolve works.
- CSV export works.
- Backend tests pass.

## Next implementation step

Finalize the README and screenshot pass after the user adds final screenshots.
