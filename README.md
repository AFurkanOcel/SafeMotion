# SafeMotion

SafeMotion is a fall and inactivity monitoring platform for people who may be alone at home and unable to request help after a risky event. The project is designed for the Node.js Web Programming term project and maps to the "Fall and Inactivity Detection" scenario in the project requirement sheet.

The first version focuses on a working, jury-demo-friendly system: a mobile device collects motion data, a Node.js backend validates and analyzes it, PostgreSQL stores operational records, and a web dashboard shows live sensor status and alerts.

## Technology Stack

- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL, Prisma ORM
- Authentication: JWT, bcrypt
- Validation: Zod
- Real-time communication: Socket.IO
- Mobile app: React Native, Expo, TypeScript
- Mobile sensors: accelerometer and gyroscope through Expo sensors
- Web dashboard: React, Vite, TypeScript
- Charts: Recharts
- Logging: Pino
- Testing: Vitest, Supertest, Postman
- API documentation: Swagger / OpenAPI
- Deployment bonus: Docker Compose

## Main Features

- Timestamped accelerometer and gyroscope readings from a mobile device.
- Device token authorization for mobile sensor upload.
- JWT-based dashboard authentication for `admin` and `caregiver` users.
- Threshold-based fall suspicion detection.
- Inactivity-based alert escalation.
- Mobile confirmation flow with English UI text such as `Are you okay?` and `I'm safe`.
- Real-time dashboard updates through Socket.IO.
- Alert listing, live alert display, and alert resolution.
- CSV export for alert history.

## Mandatory Modules

SafeMotion covers the required project modules as follows:

- Mobile data collection: accelerometer and gyroscope readings with timestamps.
- Node.js backend: Express + TypeScript REST API with validation and error handling.
- Authentication and authorization: JWT + bcrypt with `admin` and `caregiver` roles.
- Database module: PostgreSQL + Prisma models for users, monitored persons, devices, sensor readings, detection events, confirmation responses, and alerts.
- Real-time monitoring panel: React dashboard with live status, sensor data, alerts, and time-series display.
- Analysis module: threshold-based fall suspicion and inactivity detection.
- Alert mechanism: create, list, display, and resolve alerts.
- Documentation: requirements, architecture, data model, API design, roadmap, tests, demo flow, setup guide, and README.

## Planned Bonus Features

- Swagger / OpenAPI documentation.
- Logging and error monitoring.
- Automated tests.
- Advanced role-based authorization.
- Socket.IO live data stream.
- CSV export.
- Docker Compose setup for backend and PostgreSQL.

Stretch goals are sensor sampling to reduce network requests and limited offline buffering in the mobile client.

## Out of Scope

- Camera event capture.
- Map-based tracking.
- Raspberry Pi integration.
- Python microservice.
- On-device AI model.
- PDF export.

## Planned Folder Structure

```text
SafeMotion/
  docs/
    nodejs_donem_projesi_foyu_guncellenmis.pdf
    requirements.md
    architecture.md
    data-model.md
    api-design.md
    roadmap.md
    test-scenarios.md
    demo-flow.md
    setup-guide.md
  backend/
  dashboard/
  mobile/
  README.md
```

Backend, dashboard, and mobile folders are planned for later phases. This documentation phase does not create application code or package manifests.

## Development Approach

The project will be developed in small, reviewable phases. Each phase should end with a working output, focused tests where relevant, and a clear English commit message. Mandatory requirements come before bonus features.

## Demo Summary

The target demo shows a caregiver logging in, creating a monitored person, pairing a mobile device, watching live motion updates, simulating a fall, handling the mobile confirmation flow, creating a critical alert after no response, resolving the alert, exporting CSV data, and showing the Swagger API page.

## Setup

Setup instructions will be completed as implementation progresses. See [docs/setup-guide.md](docs/setup-guide.md).

