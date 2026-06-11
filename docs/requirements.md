# SafeMotion Requirements

## Project Description

SafeMotion is a fall and inactivity monitoring platform built for the Node.js Web Programming term project. It maps to the "Fall and Inactivity Detection" scenario from the project sheet.

A mobile phone acts as the sensor device. It collects accelerometer and gyroscope readings, sends timestamped data to a Node.js backend, and lets the monitored person respond to a fall confirmation prompt. A caregiver uses the dashboard to create monitored persons, pair devices, watch live sensor data, receive alerts, and resolve incidents.

## Target Users

- `ADMIN`: manages high-level system access and can view all monitored records.
- `CAREGIVER`: manages assigned monitored persons, device pairing, alerts, and demo workflows.
- Monitored person: carries the paired mobile phone and responds to confirmation prompts.

Mobile devices are not users and do not have roles. They authenticate with device token authorization after pairing.

## Problem Definition

People who are alone may fall and become unable to request help. SafeMotion demonstrates a staged safety workflow:

1. Detect suspicious motion.
2. Ask the person for confirmation.
3. Escalate only when no safety confirmation is received and inactivity continues.
4. Notify the caregiver in real time.

## PDF Requirements Mapped to SafeMotion

| PDF requirement | SafeMotion implementation |
| --- | --- |
| Mobile data collection from at least two sensors | Expo mobile app collects accelerometer and gyroscope data. |
| Timestamped data upload | Each `SensorReading` includes `recordedAt`; backend stores `receivedAt`. |
| Node.js backend | Express + TypeScript backend. |
| RESTful API | Versioned API under `/api/v1`. |
| Data validation | Zod schemas validate request bodies, params, and query values. |
| Error handling | Centralized JSON error responses. |
| User authentication | Email/password login returns JWT. |
| Authorization with roles | `ADMIN` and `CAREGIVER` roles protect dashboard APIs. |
| Device authorization | Mobile APIs use device tokens, not user roles. |
| Database module | PostgreSQL with Prisma models. |
| Real-time dashboard | React dashboard receives Socket.IO events. |
| Time-series display | Dashboard shows recent sensor readings in a chart/list. |
| Detection/analysis | Threshold-based fall suspicion and inactivity analysis. |
| Alarm mechanism | Alerts are created, listed live, exported, and resolved. |
| Documentation | Dedicated docs for requirements, architecture, data model, API, tests, demo, and setup. |

## Functional Requirements

- Public signup creates `CAREGIVER` accounts only.
- Admin-protected registration can create users with explicit roles.
- Dashboard users can log in and get a JWT.
- Caregivers can create, list, and select monitored persons.
- Caregivers can generate temporary pairing codes for selected monitored persons.
- Mobile devices can pair with a code and receive a raw device token once.
- Mobile devices can upload accelerometer and gyroscope readings with timestamps.
- Backend calculates acceleration and rotation magnitudes.
- Backend creates `FALL_SUSPECTED` events when thresholds are crossed.
- Mobile app shows a confirmation panel for active fall events.
- Mobile app can submit `SAFE` or `NEEDS_HELP` responses.
- Backend escalates no-response/inactivity cases to critical alerts.
- Dashboard shows selected person, latest readings, live events, active alerts, and pairing state.
- Dashboard can resolve alerts and export alert history as CSV.
- Swagger/OpenAPI documentation is available.
- Docker Compose can run PostgreSQL, backend, and dashboard.

## Non-Functional Requirements

- Project outputs are English: code, API routes, database names, Swagger/OpenAPI, docs, README, dashboard UI, and mobile UI.
- User communication outside the project remains Turkish.
- Device tokens and pairing codes are stored as hashes.
- Sensitive data such as raw passwords and raw device tokens must not be persisted.
- The MVP should be easy to run locally and demonstrate to a jury.
- The detection approach is explainable and suitable for course evaluation.

## Out of Scope

- Camera event capture.
- Map-based tracking.
- Raspberry Pi integration.
- Python microservice.
- On-device AI model.
- PDF export.
- Production medical certification or emergency service integration.

## Bonus Features Included

- Swagger/OpenAPI.
- Logging with structured server logs.
- Automated backend tests.
- Advanced role-based authorization.
- Socket.IO live data stream.
- CSV export.
- Docker Compose for PostgreSQL, backend, and dashboard.

## Optional Stretch Goals

- Sensor sampling optimization.
- Limited offline buffering in the mobile client.

## Current Demo Accounts

Seed data provides demo accounts for the local/Docker demo:

- `admin@example.com`
- `caregiver@example.com`

The actual demo passwords are defined in the backend seed configuration and should be verified before the final demo.

## Next implementation step

Finalize the README and screenshot pass after the user adds final screenshots.
