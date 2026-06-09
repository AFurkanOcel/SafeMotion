# SafeMotion Architecture

## Overall Architecture

SafeMotion has four main layers:

- Mobile app: collects accelerometer and gyroscope readings, pairs with the backend, uploads sensor data, and shows the confirmation screen.
- Backend API: validates requests, stores data, runs detection logic, manages authentication, and emits real-time events.
- Database: stores users, monitored persons, devices, sensor readings, detection events, confirmation responses, alerts, and logs.
- Web dashboard: shows live monitoring, alert status, historical alerts, and CSV export.

## Component Relationship

```text
Mobile App
  -> REST API with device token
  -> Sensor readings and confirmation responses

Backend API
  -> Validates requests
  -> Stores data with Prisma
  -> Runs detection services
  -> Emits Socket.IO events

PostgreSQL Database
  -> Stores operational and time-series data

Dashboard
  -> REST API with JWT
  -> Socket.IO live events
  -> Charts, tables, alert actions
```

## Textual Data Flow

1. A caregiver logs in to the dashboard and receives a JWT.
2. The caregiver creates a monitored person.
3. The caregiver generates a pairing code for a device.
4. The mobile app submits the pairing code and receives a device token.
5. The mobile app uploads timestamped accelerometer and gyroscope readings.
6. The backend validates and stores the readings.
7. The detection service evaluates the readings.
8. The backend emits live sensor and status events to dashboard clients.
9. If a fall is suspected, the mobile app receives or polls for a confirmation state.
10. The user confirms safety or fails to respond.
11. The backend closes the event as safe or creates a critical alert.
12. The dashboard shows the alert live and allows the caregiver to resolve it.

## Sensor Data Flow

Sensor readings move through the system as follows:

```text
Accelerometer + Gyroscope
  -> Mobile reading buffer
  -> POST /api/v1/sensor-readings
  -> Zod validation
  -> Prisma write to SensorReading
  -> Detection service
  -> Socket.IO event: sensor.reading.created
  -> Dashboard chart/table update
```

Each reading should include device identity, client timestamp, and numeric sensor axes. The backend should also record server receive time for audit and debugging.

## Fall Suspicion and Confirmation Flow

```text
High acceleration or rotation threshold
  -> DetectionEvent: FALL_SUSPECTED
  -> Socket.IO event: detection.fallSuspected
  -> Mobile UI: "Are you okay?"
  -> User taps "I'm safe"
      -> ConfirmationResponse: SAFE_CONFIRMED
      -> DetectionEvent closed
      -> Dashboard receives detection.resolved
  -> No response and low movement continues
      -> Alert: CRITICAL
      -> Socket.IO event: alert.created
      -> Caregiver resolves alert from dashboard
```

The MVP uses threshold-based analysis because it is explainable, low-risk, and suitable for the term project rubric.

## Socket.IO Event Structure

Planned server-to-dashboard events:

- `sensor.reading.created`: emitted after valid sensor ingestion.
- `device.status.updated`: emitted when a device pairs, becomes active, or becomes stale.
- `detection.fallSuspected`: emitted when a fall suspicion is created.
- `detection.resolved`: emitted when a suspicion is closed by confirmation.
- `alert.created`: emitted when a critical alert is created.
- `alert.resolved`: emitted when a caregiver resolves an alert.

Planned server-to-mobile events:

- `confirmation.requested`: tells the mobile app to show `Are you okay?`.
- `confirmation.closed`: tells the mobile app the event no longer needs a response.

Socket connections should authenticate with JWT for dashboard clients and device token for mobile clients.

## Authentication and Authorization

- Dashboard users authenticate with email and password.
- Passwords are hashed with bcrypt.
- Successful login returns a JWT.
- User roles are `admin` and `caregiver`.
- `admin` can manage users and all monitored records.
- `caregiver` can manage assigned monitored persons, devices, readings, and alerts.
- Mobile devices do not use user roles. They authenticate with device tokens issued after pairing.

## Modular Backend Structure

Planned backend modules:

- `config`: environment and app configuration.
- `controllers`: HTTP request handlers.
- `middleware`: authentication, authorization, error handling, validation.
- `routes`: route definitions grouped by feature.
- `schemas`: Zod request schemas.
- `services`: business logic, detection logic, alert workflow.
- `sockets`: Socket.IO authentication and event publishing.
- `utils`: shared helpers, logger, response helpers.
- `prisma`: database schema and migrations.
- `tests`: automated tests.

## Deployment Approach

The MVP should run locally first. Docker Compose is planned as a bonus phase for backend and PostgreSQL. Dashboard and mobile development servers will be run separately during development. Production deployment is not required for the term project.

## Next implementation step

Create the backend Express TypeScript setup after user approval.

