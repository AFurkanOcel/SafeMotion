# SafeMotion API Design

All REST endpoints are under `/api/v1`. Swagger/OpenAPI is available at `/api-docs`, and the raw OpenAPI document is available at `/api-docs/openapi.json`.

## Common Rules

- Dashboard APIs use `Authorization: Bearer <jwt>`.
- Mobile APIs use `Authorization: Bearer <deviceToken>`.
- Device tokens authorize devices only; they are not user roles.
- JSON errors use a consistent error object.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body"
  }
}
```

## Auth

### Signup caregiver

- `POST /api/v1/auth/signup`
- Access: public

```json
{
  "email": "caregiver@example.com",
  "password": "StrongPassword123!",
  "fullName": "Demo Caregiver"
}
```

Creates a `CAREGIVER` account only.

### Login

- `POST /api/v1/auth/login`
- Access: public

```json
{
  "email": "caregiver@example.com",
  "password": "StrongPassword123!"
}
```

Returns:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "caregiver@example.com",
    "fullName": "Demo Caregiver",
    "role": "CAREGIVER"
  }
}
```

### Register user

- `POST /api/v1/auth/register`
- Access: `ADMIN`
- Token: JWT required

Creates admin-managed users with explicit roles.

### Current user

- `GET /api/v1/auth/me`
- Access: `ADMIN`, `CAREGIVER`
- Token: JWT required

## Monitored Persons

### Create monitored person

- `POST /api/v1/monitored-persons`
- Access: `ADMIN`, `CAREGIVER`
- Token: JWT required

```json
{
  "displayName": "Demo Person",
  "notes": "Carries the paired phone."
}
```

### List monitored persons

- `GET /api/v1/monitored-persons`
- Access: `ADMIN`, `CAREGIVER`
- Token: JWT required

`ADMIN` receives all active records. `CAREGIVER` receives assigned records only.

### Get monitored person

- `GET /api/v1/monitored-persons/{id}`
- Access: `ADMIN`, assigned `CAREGIVER`
- Token: JWT required

## Devices

### Create pairing code

- `POST /api/v1/devices/pairing-codes`
- Access: `ADMIN`, assigned `CAREGIVER`
- Token: JWT required

```json
{
  "monitoredPersonId": "uuid",
  "deviceName": "Demo Android Phone",
  "platform": "ANDROID"
}
```

Returns a temporary single-use pairing code and `deviceId`.

### Pair device

- `POST /api/v1/devices/pair`
- Access: public before pairing
- Token: none

```json
{
  "pairingCode": "842913",
  "deviceName": "Demo Android Phone",
  "platform": "ANDROID"
}
```

Returns a raw device token once. The backend stores only the hash.

### Current paired device

- `GET /api/v1/devices/me`
- Access: paired mobile device
- Token: device token required

### Active confirmation

- `GET /api/v1/devices/me/active-confirmation`
- Access: paired mobile device
- Token: device token required

### Device status

- `GET /api/v1/devices/{id}/status`
- Access: `ADMIN`, assigned `CAREGIVER`
- Token: JWT required

## Sensor Readings

### Upload sensor reading

- `POST /api/v1/sensor-readings`
- Access: paired mobile device
- Token: device token required

```json
{
  "recordedAt": "2026-06-11T10:00:00.000Z",
  "accelerometer": { "x": 0.12, "y": 9.81, "z": 0.34 },
  "gyroscope": { "x": 0.01, "y": 0.02, "z": 0.03 }
}
```

Returns the stored reading and detection status.

### Upload reading batch

- `POST /api/v1/sensor-readings/batch`
- Access: paired mobile device
- Token: device token required

### List readings for a monitored person

- `GET /api/v1/sensor-readings/monitored-persons/{monitoredPersonId}`
- Access: `ADMIN`, assigned `CAREGIVER`
- Token: JWT required

## Confirmation Responses

### Submit confirmation response

- `POST /api/v1/confirmation-responses`
- Access: paired mobile device
- Token: device token required

```json
{
  "detectionEventId": "uuid",
  "response": "SAFE"
}
```

Allowed responses are `SAFE` and `NEEDS_HELP`. Backend services can record `NO_RESPONSE` during escalation.

## Alerts

### List alerts

- `GET /api/v1/alerts`
- Access: `ADMIN`, `CAREGIVER`
- Token: JWT required
- Query: `status`, `severity`, `monitoredPersonId`, `limit`

### Get alert

- `GET /api/v1/alerts/{id}`
- Access: `ADMIN`, assigned `CAREGIVER`
- Token: JWT required

### Resolve alert

- `PATCH /api/v1/alerts/{id}/resolve`
- Access: `ADMIN`, assigned `CAREGIVER`
- Token: JWT required

```json
{
  "resolutionNote": "Caregiver contacted the monitored person."
}
```

### Export alerts as CSV

- `GET /api/v1/alerts/export.csv`
- Access: `ADMIN`, `CAREGIVER`
- Token: JWT required
- Query: `status`, `severity`, `monitoredPersonId`, `from`, `to`

Response headers:

```text
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="safemotion-alerts.csv"
```

## Health and Database

- `GET /api/v1/health`: service health check.
- `GET /api/v1/database/health`: database connectivity check.

## Next implementation step

Finalize the README and screenshot pass after the user adds final screenshots.
