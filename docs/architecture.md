# SafeMotion Architecture

## Overview

SafeMotion has four main parts:

- Mobile app: pairs with the backend, collects accelerometer and gyroscope data, uploads readings, and shows fall confirmation actions.
- Backend API: validates requests, stores data, runs detection logic, manages JWT/device-token authentication, and emits Socket.IO events.
- PostgreSQL database: stores users, monitored persons, devices, sensor readings, detection events, alerts, confirmation responses, and optional system logs.
- Dashboard: lets caregivers manage monitored persons, generate pairing codes, view live readings, see alerts, resolve alerts, and export CSV data.

## Runtime Architecture

```text
Expo Mobile App
  -> REST API with device token
  -> Socket.IO device room
  -> Sensor readings and confirmation responses

React Dashboard
  -> REST API with JWT
  -> Socket.IO dashboard room
  -> Monitored person, pairing, live chart, alerts, CSV export

Express Backend
  -> Zod validation
  -> Prisma services
  -> Detection and alert services
  -> Socket.IO event publishing

PostgreSQL
  -> Persistent project data
```

## Data Flow

1. A caregiver signs up or logs in from the dashboard.
2. The dashboard stores the JWT in the client session.
3. The caregiver creates or selects a monitored person.
4. The caregiver generates a temporary pairing code.
5. The mobile app submits the pairing code and receives a device token.
6. The mobile app uploads timestamped accelerometer and gyroscope readings.
7. The backend validates the payload and stores a `SensorReading`.
8. The detection service evaluates acceleration and rotation magnitudes.
9. The backend emits live events for the dashboard.
10. If a fall is suspected, the mobile app displays a confirmation panel.
11. `SAFE` closes the event; `NEEDS_HELP` or no-response/inactivity creates an alert.
12. The caregiver resolves the alert from the dashboard.

## Detection Flow

```text
SensorReading
  -> calculate accelerationMagnitude and rotationMagnitude
  -> compare with fall thresholds
  -> DetectionEvent: FALL_SUSPECTED
  -> mobile confirmation request
  -> SAFE response
      -> close event
  -> NEEDS_HELP or no response with inactivity
      -> Alert: CRITICAL
      -> dashboard live alert
```

The project uses threshold-based analysis because it is explainable, deterministic, and suitable for the course rubric.

## Socket.IO Events

Server-to-dashboard events:

- `sensor.reading.created`
- `device.status.updated`
- `detection.fallSuspected`
- `detection.inactivityDetected`
- `detection.resolved`
- `alert.created`
- `alert.resolved`

Server-to-mobile events:

- `confirmation.requested`
- `confirmation.closed`

Dashboard sockets use JWT authentication. Mobile sockets use device token authentication.

## Authentication and Authorization

- Dashboard users authenticate with email and password.
- Passwords are hashed with bcrypt.
- JWT protects dashboard APIs.
- Roles are `ADMIN` and `CAREGIVER`.
- `ADMIN` can access all monitored records.
- `CAREGIVER` can access only assigned monitored persons and their related devices, readings, alerts, and exports.
- Devices authenticate with device tokens after pairing.
- A device token authorizes only device operations and is never treated as a user role.

## Backend Modules

- `config`: environment, database, detection thresholds, logger.
- `controllers`: Express request handlers.
- `middleware`: auth, device auth, validation, request logging, errors.
- `routes`: route definitions grouped by feature.
- `schemas`: Zod schemas.
- `services`: business logic, Prisma access, detection, alerts, confirmations.
- `sockets`: Socket.IO server, authentication, event emitters.
- `utils`: token helpers and shared utilities.
- `prisma`: schema and seed script.
- `tests`: automated backend workflow tests.

## Deployment and Local Demo

Docker Compose includes:

- PostgreSQL on `localhost:5432`.
- Backend on `localhost:3000`.
- Dashboard on `localhost:5173`.

The mobile app is run with Expo in LAN mode during physical phone testing. For a real phone, mobile environment values must use the computer's local Wi-Fi IP address instead of `localhost`.

## Next implementation step

Finalize the README and screenshot pass after the user adds final screenshots.
