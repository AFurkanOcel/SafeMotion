# SafeMotion API Design

All REST endpoints are planned under `/api/v1`. Request and response examples use English names and implementation-ready shapes. Final details may be adjusted during implementation, but the interface should stay consistent with this design.

## Common Rules

- Dashboard APIs require `Authorization: Bearer <jwt>` unless stated otherwise.
- Mobile device APIs require `Authorization: Bearer <deviceToken>` unless stated otherwise.
- Device tokens authorize devices only; they are not user roles.
- JSON errors should use this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body"
  }
}
```

## Auth Endpoints

### Register user

- Method: `POST`
- URL: `/api/v1/auth/register`
- Access: `admin`
- Token: JWT required

Request:

```json
{
  "email": "caregiver@example.com",
  "password": "StrongPassword123!",
  "fullName": "Caregiver User",
  "role": "CAREGIVER"
}
```

Response:

```json
{
  "id": "user_123",
  "email": "caregiver@example.com",
  "fullName": "Caregiver User",
  "role": "CAREGIVER"
}
```

Possible errors: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `409 EMAIL_ALREADY_EXISTS`.

### Login

- Method: `POST`
- URL: `/api/v1/auth/login`
- Access: public
- Token: none

Request:

```json
{
  "email": "caregiver@example.com",
  "password": "StrongPassword123!"
}
```

Response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user_123",
    "email": "caregiver@example.com",
    "fullName": "Caregiver User",
    "role": "CAREGIVER"
  }
}
```

Possible errors: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS`.

### Current user

- Method: `GET`
- URL: `/api/v1/auth/me`
- Access: `admin`, `caregiver`
- Token: JWT required

Response:

```json
{
  "id": "user_123",
  "email": "caregiver@example.com",
  "fullName": "Caregiver User",
  "role": "CAREGIVER"
}
```

Possible errors: `401 UNAUTHORIZED`.

## Monitored Person Endpoints

### Create monitored person

- Method: `POST`
- URL: `/api/v1/monitored-persons`
- Access: `admin`, `caregiver`
- Token: JWT required

Request:

```json
{
  "displayName": "Demo Person",
  "notes": "Lives alone and carries the paired phone."
}
```

Response:

```json
{
  "id": "person_123",
  "displayName": "Demo Person",
  "notes": "Lives alone and carries the paired phone.",
  "caregiverId": "user_123",
  "isActive": true
}
```

Possible errors: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`.

### List monitored persons

- Method: `GET`
- URL: `/api/v1/monitored-persons`
- Access: `admin`, `caregiver`
- Token: JWT required

Response:

```json
{
  "items": [
    {
      "id": "person_123",
      "displayName": "Demo Person",
      "isActive": true
    }
  ]
}
```

Possible errors: `401 UNAUTHORIZED`.

### Get monitored person

- Method: `GET`
- URL: `/api/v1/monitored-persons/{id}`
- Access: `admin`, assigned `caregiver`
- Token: JWT required

Response:

```json
{
  "id": "person_123",
  "displayName": "Demo Person",
  "notes": "Lives alone and carries the paired phone.",
  "devices": [],
  "activeAlerts": []
}
```

Possible errors: `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`.

## Device Pairing Endpoints

### Create pairing code

- Method: `POST`
- URL: `/api/v1/devices/pairing-codes`
- Access: `admin`, assigned `caregiver`
- Token: JWT required

Request:

```json
{
  "monitoredPersonId": "person_123",
  "deviceName": "Demo Android Phone",
  "platform": "ANDROID"
}
```

Response:

```json
{
  "pairingCode": "842913",
  "expiresAt": "2026-06-09T19:30:00.000Z"
}
```

Possible errors: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 MONITORED_PERSON_NOT_FOUND`.

### Pair device

- Method: `POST`
- URL: `/api/v1/devices/pair`
- Access: mobile device
- Token: none before pairing

Request:

```json
{
  "pairingCode": "842913",
  "deviceName": "Demo Android Phone",
  "platform": "ANDROID"
}
```

Response:

```json
{
  "deviceId": "device_123",
  "deviceToken": "device-token",
  "monitoredPersonId": "person_123"
}
```

Possible errors: `400 VALIDATION_ERROR`, `401 INVALID_PAIRING_CODE`, `410 PAIRING_CODE_EXPIRED`.

### Get device status

- Method: `GET`
- URL: `/api/v1/devices/{id}/status`
- Access: `admin`, assigned `caregiver`
- Token: JWT required

Response:

```json
{
  "id": "device_123",
  "isActive": true,
  "lastSeenAt": "2026-06-09T19:25:00.000Z"
}
```

Possible errors: `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`.

## Sensor Reading Endpoints

### Upload sensor reading

- Method: `POST`
- URL: `/api/v1/sensor-readings`
- Access: paired mobile device
- Token: device token required

Request:

```json
{
  "recordedAt": "2026-06-09T19:25:00.000Z",
  "accelerometer": {
    "x": 0.12,
    "y": 9.81,
    "z": 0.34
  },
  "gyroscope": {
    "x": 0.01,
    "y": 0.02,
    "z": 0.03
  }
}
```

Response:

```json
{
  "id": "reading_123",
  "status": "ACCEPTED",
  "detectionStatus": "NORMAL"
}
```

Possible errors: `400 VALIDATION_ERROR`, `401 INVALID_DEVICE_TOKEN`, `403 DEVICE_INACTIVE`.

### Upload sensor reading batch

- Method: `POST`
- URL: `/api/v1/sensor-readings/batch`
- Access: paired mobile device
- Token: device token required

Request:

```json
{
  "readings": [
    {
      "recordedAt": "2026-06-09T19:25:00.000Z",
      "accelerometer": { "x": 0.12, "y": 9.81, "z": 0.34 },
      "gyroscope": { "x": 0.01, "y": 0.02, "z": 0.03 }
    }
  ]
}
```

Response:

```json
{
  "accepted": 1,
  "rejected": 0
}
```

Possible errors: `400 VALIDATION_ERROR`, `401 INVALID_DEVICE_TOKEN`.

### List readings for dashboard

- Method: `GET`
- URL: `/api/v1/monitored-persons/{id}/sensor-readings`
- Access: `admin`, assigned `caregiver`
- Token: JWT required

Response:

```json
{
  "items": [
    {
      "id": "reading_123",
      "recordedAt": "2026-06-09T19:25:00.000Z",
      "accelerationMagnitude": 9.82,
      "rotationMagnitude": 0.04
    }
  ]
}
```

Possible errors: `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 MONITORED_PERSON_NOT_FOUND`.

## Fall Confirmation Endpoints

### Submit confirmation response

- Method: `POST`
- URL: `/api/v1/confirmation-responses`
- Access: paired mobile device
- Token: device token required

Request:

```json
{
  "detectionEventId": "event_123",
  "response": "SAFE"
}
```

Response:

```json
{
  "id": "response_123",
  "detectionEventId": "event_123",
  "response": "SAFE",
  "status": "SAFE_CONFIRMED"
}
```

Possible errors: `400 VALIDATION_ERROR`, `401 INVALID_DEVICE_TOKEN`, `403 DEVICE_MISMATCH`, `404 DETECTION_EVENT_NOT_FOUND`, `409 EVENT_ALREADY_CLOSED`.

### Get active confirmation request

- Method: `GET`
- URL: `/api/v1/devices/me/active-confirmation`
- Access: paired mobile device
- Token: device token required

Response:

```json
{
  "detectionEventId": "event_123",
  "message": "Are you okay?",
  "actions": ["I'm safe", "Need help"]
}
```

Possible errors: `401 INVALID_DEVICE_TOKEN`, `404 NO_ACTIVE_CONFIRMATION`.

## Alert Endpoints

### List alerts

- Method: `GET`
- URL: `/api/v1/alerts`
- Access: `admin`, `caregiver`
- Token: JWT required

Response:

```json
{
  "items": [
    {
      "id": "alert_123",
      "status": "ACTIVE",
      "severity": "CRITICAL",
      "title": "Critical fall alert",
      "createdAt": "2026-06-09T19:30:00.000Z"
    }
  ]
}
```

Possible errors: `401 UNAUTHORIZED`.

### Get alert

- Method: `GET`
- URL: `/api/v1/alerts/{id}`
- Access: `admin`, assigned `caregiver`
- Token: JWT required

Response:

```json
{
  "id": "alert_123",
  "status": "ACTIVE",
  "severity": "CRITICAL",
  "title": "Critical fall alert",
  "message": "No safety confirmation was received after a suspected fall."
}
```

Possible errors: `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`.

### Resolve alert

- Method: `PATCH`
- URL: `/api/v1/alerts/{id}/resolve`
- Access: `admin`, assigned `caregiver`
- Token: JWT required

Request:

```json
{
  "resolutionNote": "Caregiver contacted the monitored person."
}
```

Response:

```json
{
  "id": "alert_123",
  "status": "RESOLVED",
  "resolvedAt": "2026-06-09T19:40:00.000Z"
}
```

Possible errors: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 ALERT_ALREADY_RESOLVED`.

## Dashboard Summary Endpoints

### Get dashboard summary

- Method: `GET`
- URL: `/api/v1/dashboard/summary`
- Access: `admin`, `caregiver`
- Token: JWT required

Response:

```json
{
  "activeAlerts": 1,
  "monitoredPersons": 2,
  "onlineDevices": 1,
  "latestDetectionStatus": "FALL_SUSPECTED"
}
```

Possible errors: `401 UNAUTHORIZED`.

### Get monitored person dashboard

- Method: `GET`
- URL: `/api/v1/dashboard/monitored-persons/{id}`
- Access: `admin`, assigned `caregiver`
- Token: JWT required

Response:

```json
{
  "monitoredPerson": {
    "id": "person_123",
    "displayName": "Demo Person"
  },
  "deviceStatus": "ONLINE",
  "recentReadings": [],
  "activeAlerts": []
}
```

Possible errors: `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`.

## CSV Export Endpoint

### Export alerts as CSV

- Method: `GET`
- URL: `/api/v1/exports/alerts.csv`
- Access: `admin`, `caregiver`
- Token: JWT required

Query parameters:

- `from`: optional ISO date.
- `to`: optional ISO date.
- `status`: optional `ACTIVE` or `RESOLVED`.

Response:

```text
Content-Type: text/csv
id,status,severity,title,createdAt,resolvedAt
alert_123,RESOLVED,CRITICAL,Critical fall alert,2026-06-09T19:30:00.000Z,2026-06-09T19:40:00.000Z
```

Possible errors: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`.

## Next implementation step

Create the backend Express TypeScript setup after user approval.

