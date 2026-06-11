# SafeMotion Data Model

SafeMotion uses PostgreSQL with Prisma. Database table and field names are English. Prisma maps models to snake_case table names.

## User

Table: `users`

Purpose: stores dashboard users.

Key fields:

- `id`: UUID primary key.
- `email`: unique string.
- `passwordHash`: hashed password.
- `fullName`: display name.
- `role`: `ADMIN` or `CAREGIVER`.
- `isActive`: active account flag.
- `createdAt`, `updatedAt`: timestamps.

Relationships:

- One caregiver has many monitored persons.
- One user can create many monitored persons.
- One user can resolve many alerts.

Indexes:

- `email` unique.
- `role`.
- `isActive`.

## MonitoredPerson

Table: `monitored_persons`

Purpose: represents a person monitored by a caregiver.

Key fields:

- `id`: UUID primary key.
- `displayName`: required display name.
- `notes`: optional notes.
- `caregiverId`: assigned caregiver.
- `createdById`: creator user.
- `isActive`: soft-active flag.
- `createdAt`, `updatedAt`: timestamps.

Relationships:

- Belongs to a caregiver.
- Has many devices.
- Has many sensor readings.
- Has many detection events.
- Has many alerts.

Indexes:

- `caregiverId`.
- `createdById`.
- `isActive`.

## Device

Table: `devices`

Purpose: represents a paired mobile phone authorized by device token.

Key fields:

- `id`: UUID primary key.
- `monitoredPersonId`: owner monitored person.
- `deviceName`: phone/device label.
- `platform`: `IOS`, `ANDROID`, or `UNKNOWN`.
- `deviceTokenHash`: hash of the raw device token.
- `pairingCodeHash`: hash of a temporary pairing code.
- `pairingCodeExpiresAt`: pairing expiration timestamp.
- `lastSeenAt`: latest authenticated device activity.
- `isActive`: active device flag.
- `createdAt`, `updatedAt`: timestamps.

Relationships:

- Belongs to one monitored person.
- Has many sensor readings.
- Has many detection events.
- Has many confirmation responses.

Indexes:

- `deviceTokenHash` unique.
- `monitoredPersonId`.
- `pairingCodeHash`.
- `lastSeenAt`.
- `isActive`.

Integrity notes:

- Device access is device token authorization, not a user role.
- Raw tokens and raw pairing codes are not stored.
- Pairing codes are temporary and single-use.

## SensorReading

Table: `sensor_readings`

Purpose: stores timestamped accelerometer and gyroscope readings.

Key fields:

- `id`: UUID primary key.
- `deviceId`: paired device.
- `monitoredPersonId`: monitored person.
- `recordedAt`: client timestamp.
- `receivedAt`: server timestamp.
- `accelerometerX`, `accelerometerY`, `accelerometerZ`: accelerometer axes.
- `gyroscopeX`, `gyroscopeY`, `gyroscopeZ`: gyroscope axes.
- `accelerationMagnitude`: calculated acceleration magnitude.
- `rotationMagnitude`: calculated rotation magnitude.

Indexes:

- Composite `deviceId`, `recordedAt`.
- Composite `monitoredPersonId`, `recordedAt`.
- `receivedAt`.

Integrity notes:

- The monitored person is derived from the authenticated device.
- Numeric sensor values are validated before storage.

## DetectionEvent

Table: `detection_events`

Purpose: stores fall suspicion and inactivity lifecycle events.

Key fields:

- `id`: UUID primary key.
- `monitoredPersonId`: related monitored person.
- `deviceId`: related device.
- `triggerReadingId`: optional sensor reading that triggered the event.
- `type`: `FALL_SUSPECTED` or `INACTIVITY_DETECTED`.
- `status`: `OPEN`, `SAFE_CONFIRMED`, `ESCALATED`, or `DISMISSED`.
- `severity`: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
- `startedAt`: event start timestamp.
- `resolvedAt`: optional resolution timestamp.
- `metadata`: JSON details such as thresholds and linked event IDs.
- `createdAt`, `updatedAt`: timestamps.

Indexes:

- `monitoredPersonId`.
- `deviceId`.
- `triggerReadingId`.
- `type`.
- `status`.
- Composite `monitoredPersonId`, `startedAt`.

Integrity notes:

- Open fall events are reused to avoid duplicate fall windows.
- Inactivity events link back to the related fall event through metadata.

## Alert

Table: `alerts`

Purpose: stores caregiver-visible alerts.

Key fields:

- `id`: UUID primary key.
- `monitoredPersonId`: related monitored person.
- `detectionEventId`: optional unique detection event link.
- `status`: `ACTIVE` or `RESOLVED`.
- `severity`: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
- `title`: alert title.
- `message`: alert message.
- `createdAt`: creation timestamp.
- `resolvedAt`: optional resolution timestamp.
- `resolvedById`: optional user who resolved the alert.
- `resolutionNote`: optional note.

Indexes:

- `status`.
- `severity`.
- Composite `monitoredPersonId`, `createdAt`.
- `resolvedById`.

## ConfirmationResponse

Table: `confirmation_responses`

Purpose: stores mobile responses to fall confirmation requests.

Key fields:

- `id`: UUID primary key.
- `detectionEventId`: related detection event.
- `deviceId`: responding device.
- `response`: `SAFE`, `NEEDS_HELP`, or `NO_RESPONSE`.
- `respondedAt`: response timestamp.
- `createdAt`: creation timestamp.

Indexes:

- `detectionEventId`.
- `deviceId`.
- `respondedAt`.

Integrity notes:

- Only the device linked to the detection event can submit the response.
- `NO_RESPONSE` is created by backend escalation logic.

## SystemLog

Table: `system_logs`

Purpose: optional structured operational log storage.

Key fields:

- `id`: UUID primary key.
- `actorUserId`: optional dashboard user.
- `deviceId`: optional device.
- `action`: action name.
- `entityType`: optional entity type.
- `entityId`: optional entity ID.
- `level`: `INFO`, `WARN`, or `ERROR`.
- `metadata`: optional JSON payload.
- `createdAt`: timestamp.

Indexes:

- `actorUserId`.
- `deviceId`.
- `action`.
- `level`.
- `createdAt`.

## Next implementation step

Finalize the README and screenshot pass after the user adds final screenshots.
