# SafeMotion Demo Flow

This demo flow is designed for a jury presentation. It shows the problem, technical value, and working system behavior in a clear sequence.

## 1. Caregiver Login

- Open the dashboard.
- Log in as a caregiver.
- Show that the dashboard uses English UI text.
- Briefly explain that dashboard users authenticate with JWT.

Expected result: caregiver reaches the monitoring dashboard.

## 2. Monitored Person Creation

- Create or open a monitored person named `Demo Person`.
- Explain that the system does not classify the person by age or disability.
- Emphasize that monitoring is based on motion data and confirmation response.

Expected result: monitored person is ready for device pairing.

## 3. Device Pairing Code Creation

- Generate a pairing code from the dashboard.
- Explain that the pairing code is temporary and single-use.
- Explain that mobile devices use device token authorization, not a user role.

Expected result: pairing code is visible for mobile pairing.

## 4. Mobile Pairing

- Open the mobile app.
- Enter the pairing code.
- Complete pairing and receive a device token.

Expected result: mobile app shows paired status.

## 5. Sensor Monitoring Start

- Start mobile sensor monitoring.
- The mobile app begins collecting accelerometer and gyroscope readings.
- Readings are uploaded with timestamps.

Expected result: backend accepts readings.

## 6. Live Dashboard Update

- Return to the dashboard.
- Show live sensor values in a chart or table.
- Show device status as online or recently active.

Expected result: dashboard updates without manual refresh.

## 7. Fall Simulation

- Trigger a fall-like motion pattern through the mobile app or a controlled test action.
- Explain the threshold-based detection approach.

Expected result: backend creates a `FALL_SUSPECTED` detection event.

## 8. Mobile Confirmation Screen

- Show the mobile confirmation screen with `Are you okay?`.
- Tap `I'm safe` for the first scenario.

Expected result: detection event closes as `SAFE_CONFIRMED`, and the dashboard updates.

## 9. No Response Scenario

- Trigger another fall-like event.
- Do not respond to the mobile confirmation prompt.
- Wait for the configured confirmation timeout and inactivity condition.

Expected result: backend records no response and escalates the event.

## 10. Critical Alert Creation

- Show the dashboard receiving a live critical alert.
- Explain that the alert appears because the user did not confirm safety and inactivity continued.

Expected result: active critical alert is visible in the dashboard.

## 11. Alert Resolve

- Open the alert details.
- Resolve the alert with a short note.

Expected result: alert status changes to `RESOLVED`, and live dashboard status updates.

## 12. CSV Export

- Use the dashboard export action or call the CSV export endpoint.
- Show the downloaded alert history CSV.

Expected result: CSV contains alert status, severity, timestamps, and resolution information.

## 13. Swagger API Page Demonstration

- Open the Swagger / OpenAPI page.
- Show endpoint groups for auth, monitored persons, devices, readings, confirmations, alerts, dashboard summary, and CSV export.

Expected result: API documentation is visible and understandable.

## 14. Test Command Demonstration

- If requested by the jury, run the automated backend tests.
- Show passing tests for the core workflows.

Expected result: tests support the reliability of the demo.

## Demo Talking Points

- SafeMotion uses a mobile phone as an IoT endpoint.
- The MVP collects only required motion data.
- The detection approach is explainable and suitable for the course scope.
- Device token authorization keeps mobile devices separate from dashboard user roles.
- Mandatory requirements are completed before bonus features.
- Bonus features improve presentation quality without increasing project risk too much.

## Next implementation step

Create the backend Express TypeScript setup after user approval.

