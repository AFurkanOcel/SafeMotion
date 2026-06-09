# SafeMotion Test Scenarios

This document defines manual and automated test scenarios for the SafeMotion MVP and planned bonus features.

## Auth Tests

- Register a caregiver as an admin and verify the stored user does not expose a password.
- Log in with valid credentials and verify a JWT is returned.
- Log in with an invalid password and verify `401 INVALID_CREDENTIALS`.
- Call a protected endpoint without JWT and verify `401 UNAUTHORIZED`.
- Call `/api/v1/auth/me` with a valid JWT and verify current user data.

## Role Authorization Tests

- Verify `admin` can create users.
- Verify `caregiver` cannot create users.
- Verify a caregiver can access assigned monitored persons.
- Verify a caregiver cannot access another caregiver's monitored person.
- Verify inactive users cannot access protected endpoints.

## Device Pairing Tests

- Generate a pairing code for a monitored person.
- Pair a mobile device with a valid code and receive a device token.
- Try pairing with an invalid code and verify failure.
- Try pairing with an expired code and verify failure.
- Try reusing a pairing code and verify failure.
- Verify device token is required for sensor upload.
- Verify device token authorization is separate from user roles.

## Sensor Reading Validation Tests

- Upload a valid accelerometer and gyroscope reading.
- Upload a valid batch of readings.
- Reject missing accelerometer fields.
- Reject missing gyroscope fields.
- Reject non-numeric sensor values.
- Reject timestamps too far in the future.
- Reject upload from inactive device.
- Verify accepted readings are stored with `recordedAt` and `receivedAt`.

## Fall Detection Service Tests

- Normal movement should not create a detection event.
- High acceleration magnitude should create `FALL_SUSPECTED`.
- High rotation magnitude with impact should create `FALL_SUSPECTED`.
- Duplicate fall events should not be created inside the same active detection window.
- Detection metadata should include threshold details needed for debugging.

## Inactivity Detection Tests

- After `FALL_SUSPECTED`, continued low motion should trigger escalation.
- Normal movement after suspicion should prevent critical escalation.
- Inactivity outside a fall suspicion window should follow the configured MVP behavior.
- The service should create `NO_RESPONSE` when the confirmation timeout expires.

## Confirmation Response Tests

- Device submits `SAFE` and detection status becomes `SAFE_CONFIRMED`.
- Device submits `NEEDS_HELP` and a critical alert is created.
- Backend timeout creates `NO_RESPONSE` and a critical alert.
- Response from a mismatched device is rejected.
- Response to an already closed event is rejected.

## Alert Creation and Resolve Tests

- Critical alert is created after no response.
- Alert appears in alert list.
- Alert appears in dashboard summary.
- Caregiver resolves an active alert.
- Resolving an already resolved alert returns `409 ALERT_ALREADY_RESOLVED`.
- CSV export includes resolved and active alert rows.

## Socket.IO Live Event Tests

- Dashboard socket connects with valid JWT.
- Dashboard socket rejects invalid JWT.
- Mobile socket connects with valid device token.
- `sensor.reading.created` is emitted after valid ingestion.
- `detection.fallSuspected` is emitted after fall suspicion.
- `alert.created` is emitted after escalation.
- `alert.resolved` is emitted after caregiver resolution.

## Dashboard Manual Tests

- Login screen uses English UI text.
- Caregiver can view monitored persons.
- Live reading chart or table updates without page refresh.
- Active alerts are visible and visually clear.
- Alert resolve action updates the list and summary.
- CSV export downloads a readable file.
- UI text remains English.

## Mobile App Manual Tests

- Pairing screen accepts a pairing code.
- Paired device stores token securely enough for MVP.
- Sensor monitoring can be started.
- Sensor readings reach the backend.
- Fall simulation triggers `Are you okay?`.
- Tapping `I'm safe` closes the detection event.
- No response scenario creates a critical alert.
- UI text remains English.

## Pre-Demo Checklist

- Backend starts successfully.
- Database is migrated and seeded with demo data if needed.
- Dashboard login works.
- Mobile device is paired.
- Live sensor updates appear on dashboard.
- Fall simulation works.
- Confirmation and no-response scenarios work.
- Alert resolution works.
- CSV export works.
- Swagger page opens.
- Test command output is ready to show if requested.

## Next implementation step

Create the backend Express TypeScript setup after user approval.

