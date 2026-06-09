# SafeMotion Requirements

## Project Description

SafeMotion is a verified fall and inactivity monitoring platform for people who may be alone at home. A mobile device acts as an IoT endpoint, sends motion sensor readings to a Node.js backend, and allows a caregiver to monitor live risk status from a web dashboard.

The project follows the Node.js Web Programming term project requirement sheet and uses the "Fall and Inactivity Detection" scenario.

## Target Users

- Caregivers who monitor a family member or dependent person.
- Admin users who manage system users and high-level configuration.
- Monitored people who carry the mobile device during the demo flow.

The application must not force the monitored person into labels such as elderly, disabled, or other. Detection is based on sensor data, inactivity, and confirmation response.

## Main Demo Persona

The main demo persona is a person living alone who may need help after a fall. A caregiver uses the dashboard to watch live status, receive alerts, and resolve incidents.

## Problem Definition

People who are alone at home may fall and remain unable to request help. Simple fall detection systems can also create false alarms when a phone is shaken or dropped. SafeMotion reduces this risk with a staged workflow: detect suspicious motion, request confirmation, escalate only when needed, and show alerts to a caregiver.

## Solution Approach

1. The mobile app collects accelerometer and gyroscope readings.
2. Readings are sent to the backend with timestamps and a device token.
3. The backend validates, stores, and analyzes the readings.
4. A fall-like movement creates a `FALL_SUSPECTED` detection event.
5. The mobile app shows `Are you okay?`.
6. If the user taps `I'm safe`, the event is closed as safe.
7. If there is no response and inactivity continues, a critical alert is created.
8. The dashboard receives live updates through Socket.IO.
9. The caregiver resolves alerts and can export alert history as CSV.

## PDF Requirements Mapped to SafeMotion

| PDF requirement | SafeMotion mapping |
| --- | --- |
| Mobile data collection from at least two sensors | Mobile app collects accelerometer and gyroscope data. |
| Timestamped sensor upload | Each `SensorReading` includes `recordedAt` and server `receivedAt`. |
| Node.js backend | Express + TypeScript backend. |
| RESTful API | Versioned REST API under `/api/v1`. |
| Data validation and storage | Zod validation, Prisma persistence, structured error responses. |
| User login | JWT login for dashboard users. |
| At least two roles | `admin` and `caregiver`. |
| Authorization | Role-based JWT authorization for dashboard APIs; device token authorization for mobile upload APIs. |
| Database module | PostgreSQL with Prisma models for users, devices, readings, events, alerts, and confirmations. |
| Real-time monitoring panel | React dashboard with Socket.IO live updates. |
| Time-series visualization | Dashboard chart or table for recent sensor readings. |
| Analysis/anomaly detection | Threshold-based fall suspicion and inactivity detection. |
| Alarm mechanism | Alerts are created, listed, shown live, and resolved. |
| Documentation | README and dedicated docs for requirements, architecture, data model, API, roadmap, tests, demo, and setup. |

## Functional Requirements

- Users can register or be created with `admin` or `caregiver` roles.
- Users can log in and receive a JWT.
- Caregivers can create and view monitored persons.
- Caregivers can generate a device pairing code.
- The mobile app can pair using a pairing code and receive a device token.
- The mobile app can upload accelerometer and gyroscope readings with timestamps.
- The backend validates all request bodies.
- The backend stores sensor readings and detection events.
- The backend detects fall suspicion using motion thresholds.
- The backend detects inactivity using low-motion windows after a suspected fall.
- The mobile app can submit confirmation responses.
- The dashboard can show live sensor status and alert status.
- The dashboard can list and resolve alerts.
- The dashboard can export alert history as CSV.

## Non-Functional Requirements

- API, database, code, Swagger/OpenAPI docs, README, and UI text must be English.
- The backend should use a modular structure with routes, controllers, services, schemas, middleware, sockets, and utilities.
- Errors should use consistent HTTP status codes and JSON response bodies.
- Sensitive data should be minimized. The MVP stores motion data and operational metadata only.
- The MVP should be easy to run locally and easy to demonstrate to a jury.
- Mandatory project requirements must be implemented before bonus features.

## Out of Scope

- Camera event capture.
- Map-based tracking.
- Raspberry Pi integration.
- Python microservice.
- On-device AI model.
- PDF export.
- Production-level medical certification or emergency service integration.

## Minimum Viable Product Scope

- JWT login for `admin` and `caregiver`.
- Device pairing with device token authorization.
- Accelerometer and gyroscope upload from mobile.
- PostgreSQL persistence through Prisma.
- Threshold-based detection and inactivity escalation.
- Mobile confirmation screen using English UI text.
- Real-time dashboard with live readings and alert state.
- Alert list, alert resolution, and CSV export.
- Swagger/OpenAPI page and test scenarios.

## Bonus Feature Classification

Planned low-risk bonus features:

- Swagger / OpenAPI integration.
- Logging and error monitoring.
- Automated tests.
- Advanced role-based authorization.
- Socket.IO live data stream.
- CSV export.
- Docker Compose.

Optional stretch goals:

- Sensor sampling to reduce network requests.
- Limited offline buffering in the mobile client.

Excluded bonus features:

- Camera capture.
- Map tracking.
- Raspberry Pi integration.
- Python microservice.
- On-device AI.
- PDF export.

## Team Task Distribution Template

- Backend developer: Express API, validation, Prisma integration, detection services, tests.
- Dashboard developer: React views, charts, Socket.IO client, alert workflows.
- Mobile developer: Expo app, device pairing, sensor collection, confirmation screen.
- Documentation/demo owner: README, setup guide, demo flow, Postman collection, final checklist.

## Next implementation step

Create the backend Express TypeScript setup after user approval.

