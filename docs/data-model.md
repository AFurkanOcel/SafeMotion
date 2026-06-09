# SafeMotion Data Model

This document proposes a PostgreSQL + Prisma data model. Names are English and implementation-ready, but final Prisma syntax will be created in a later phase.

## User

Purpose: stores dashboard users who authenticate with JWT.

Fields:

- `id`: UUID, primary key.
- `email`: String, unique, required.
- `passwordHash`: String, required.
- `fullName`: String, required.
- `role`: Enum `ADMIN` or `CAREGIVER`, required.
- `isActive`: Boolean, default `true`.
- `createdAt`: DateTime, default now.
- `updatedAt`: DateTime, auto-updated.

Relationships:

- One user can create many monitored persons.
- One caregiver can be assigned to many monitored persons.
- One user can resolve many alerts.

Recommended indexes:

- Unique index on `email`.
- Index on `role`.
- Index on `isActive`.

Integrity notes:

- Passwords must never be stored as plain text.
- Email should be normalized before storage.
- Role values must be controlled by an enum.

## MonitoredPerson

Purpose: represents the person being monitored by a caregiver.

Fields:

- `id`: UUID, primary key.
- `displayName`: String, required.
- `notes`: String, optional.
- `caregiverId`: UUID, foreign key to `User`.
- `createdById`: UUID, foreign key to `User`.
- `isActive`: Boolean, default `true`.
- `createdAt`: DateTime, default now.
- `updatedAt`: DateTime, auto-updated.

Relationships:

- Belongs to one caregiver.
- Has many devices.
- Has many sensor readings through devices.
- Has many detection events and alerts.

Recommended indexes:

- Index on `caregiverId`.
- Index on `isActive`.

Integrity notes:

- A monitored person should not be deleted if related alerts or readings exist; use soft deactivation.
- The model does not require health-category labels.

## Device

Purpose: represents a mobile phone authorized to send sensor readings.

Fields:

- `id`: UUID, primary key.
- `monitoredPersonId`: UUID, foreign key to `MonitoredPerson`.
- `deviceName`: String, required.
- `platform`: Enum `IOS`, `ANDROID`, or `UNKNOWN`.
- `deviceTokenHash`: String, unique, required after pairing.
- `pairingCodeHash`: String, optional.
- `pairingCodeExpiresAt`: DateTime, optional.
- `lastSeenAt`: DateTime, optional.
- `isActive`: Boolean, default `true`.
- `createdAt`: DateTime, default now.
- `updatedAt`: DateTime, auto-updated.

Relationships:

- Belongs to one monitored person.
- Has many sensor readings.
- Has many detection events.

Recommended indexes:

- Unique index on `deviceTokenHash`.
- Index on `monitoredPersonId`.
- Index on `lastSeenAt`.
- Index on `isActive`.

Integrity notes:

- Device access is device token authorization, not a user role.
- Store token hashes, not raw device tokens.
- Pairing codes should expire and should be single-use.

## SensorReading

Purpose: stores timestamped accelerometer and gyroscope samples.

Fields:

- `id`: UUID, primary key.
- `deviceId`: UUID, foreign key to `Device`.
- `monitoredPersonId`: UUID, foreign key to `MonitoredPerson`.
- `recordedAt`: DateTime, client-side timestamp.
- `receivedAt`: DateTime, server-side timestamp.
- `accelerometerX`: Float, required.
- `accelerometerY`: Float, required.
- `accelerometerZ`: Float, required.
- `gyroscopeX`: Float, required.
- `gyroscopeY`: Float, required.
- `gyroscopeZ`: Float, required.
- `accelerationMagnitude`: Float, optional calculated value.
- `rotationMagnitude`: Float, optional calculated value.

Relationships:

- Belongs to one device.
- Belongs to one monitored person.
- Can be referenced by detection events as a trigger reading.

Recommended indexes:

- Composite index on `deviceId` and `recordedAt`.
- Composite index on `monitoredPersonId` and `recordedAt`.
- Index on `receivedAt`.

Integrity notes:

- Numeric values should be validated before insertion.
- `recordedAt` should not be too far in the future.
- `monitoredPersonId` should match the device owner to prevent forged relationships.

## DetectionEvent

Purpose: records fall suspicion and inactivity detection lifecycle.

Fields:

- `id`: UUID, primary key.
- `monitoredPersonId`: UUID, foreign key to `MonitoredPerson`.
- `deviceId`: UUID, foreign key to `Device`.
- `triggerReadingId`: UUID, optional foreign key to `SensorReading`.
- `type`: Enum `FALL_SUSPECTED` or `INACTIVITY_DETECTED`.
- `status`: Enum `OPEN`, `SAFE_CONFIRMED`, `ESCALATED`, `DISMISSED`.
- `severity`: Enum `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- `startedAt`: DateTime, required.
- `resolvedAt`: DateTime, optional.
- `metadata`: Json, optional.
- `createdAt`: DateTime, default now.
- `updatedAt`: DateTime, auto-updated.

Relationships:

- Belongs to one monitored person.
- Belongs to one device.
- Can have one or more confirmation responses.
- Can create one alert.

Recommended indexes:

- Index on `monitoredPersonId`.
- Index on `deviceId`.
- Index on `type`.
- Index on `status`.
- Composite index on `monitoredPersonId` and `startedAt`.

Integrity notes:

- An open fall event should not create duplicate critical alerts for the same detection window.
- `resolvedAt` is required when status is no longer `OPEN`.

## Alert

Purpose: stores caregiver-visible risk alerts.

Fields:

- `id`: UUID, primary key.
- `monitoredPersonId`: UUID, foreign key to `MonitoredPerson`.
- `detectionEventId`: UUID, optional foreign key to `DetectionEvent`.
- `status`: Enum `ACTIVE` or `RESOLVED`.
- `severity`: Enum `MEDIUM`, `HIGH`, or `CRITICAL`.
- `title`: String, required.
- `message`: String, required.
- `createdAt`: DateTime, default now.
- `resolvedAt`: DateTime, optional.
- `resolvedById`: UUID, optional foreign key to `User`.
- `resolutionNote`: String, optional.

Relationships:

- Belongs to one monitored person.
- Optionally belongs to one detection event.
- Optionally resolved by one user.

Recommended indexes:

- Index on `status`.
- Index on `severity`.
- Composite index on `monitoredPersonId` and `createdAt`.
- Index on `resolvedById`.

Integrity notes:

- `resolvedAt` and `resolvedById` are required when status is `RESOLVED`.
- Active alerts should be visible in dashboard summary and live events.

## ConfirmationResponse

Purpose: stores mobile responses to a fall confirmation request.

Fields:

- `id`: UUID, primary key.
- `detectionEventId`: UUID, foreign key to `DetectionEvent`.
- `deviceId`: UUID, foreign key to `Device`.
- `response`: Enum `SAFE`, `NEEDS_HELP`, `NO_RESPONSE`.
- `respondedAt`: DateTime, required.
- `createdAt`: DateTime, default now.

Relationships:

- Belongs to one detection event.
- Belongs to one device.

Recommended indexes:

- Index on `detectionEventId`.
- Index on `deviceId`.
- Index on `respondedAt`.

Integrity notes:

- Only the paired device for the detection event should submit the response.
- `NO_RESPONSE` can be created by the backend timeout worker or service.

## SystemLog

Purpose: optional operational audit and debugging log.

Fields:

- `id`: UUID, primary key.
- `actorUserId`: UUID, optional foreign key to `User`.
- `deviceId`: UUID, optional foreign key to `Device`.
- `action`: String, required.
- `entityType`: String, optional.
- `entityId`: UUID, optional.
- `level`: Enum `INFO`, `WARN`, `ERROR`.
- `metadata`: Json, optional.
- `createdAt`: DateTime, default now.

Relationships:

- Optionally belongs to one user.
- Optionally belongs to one device.

Recommended indexes:

- Index on `actorUserId`.
- Index on `deviceId`.
- Index on `action`.
- Index on `level`.
- Index on `createdAt`.

Integrity notes:

- Logs should not store passwords, raw tokens, or unnecessary personal data.
- Application logging can start with Pino and add database logs only when needed.

## Next implementation step

Create the backend Express TypeScript setup after user approval.

