# SafeMotion Demo Flow

This flow is designed for a jury presentation and shows the completed MVP from dashboard setup to mobile fall confirmation.

## 1. Start the System

Run Docker Compose from the project root:

```bash
docker compose up --build
```

Open:

- Dashboard: `http://localhost:5173`
- Swagger: `http://localhost:3000/api-docs`

## 2. Caregiver Login or Signup

- Open the dashboard.
- Use the demo caregiver account or create a caregiver account from the signup screen.
- Explain that public signup creates `CAREGIVER` accounts only.
- Explain that JWT protects dashboard APIs.

Expected result: caregiver reaches the dashboard.

## 3. Create or Select a Monitored Person

- Create a monitored person such as `Demo Person`.
- Select the person in the dashboard.
- Explain that the system avoids sensitive category labels and monitors motion/confirmation state instead.

Expected result: the selected monitored person is visible in the live dashboard flow.

## 4. Generate a Pairing Code

- Use the dashboard pairing panel.
- Generate a temporary code for the selected monitored person.
- Explain that the code is temporary and single-use.
- Explain that devices authenticate with device tokens, not roles.

Expected result: pairing code, expiry time, and device ID are visible.

## 5. Pair the Mobile App

- Start the Expo mobile app in LAN mode.
- Enter the pairing code.
- Complete pairing.

Expected result: mobile app shows paired status and backend connection status.

## 6. Start Sensor Monitoring

- Start monitoring in the mobile app.
- The app sends accelerometer and gyroscope readings with timestamps.

Expected result: backend stores readings and emits live dashboard events.

## 7. Show Live Dashboard Updates

- Return to the dashboard.
- Show selected monitored person, latest readings, live events, and alert area.
- Explain the time-series chart/list.

Expected result: readings update without manual refresh.

## 8. Trigger a Safe Fall Demo

- Use the mobile `Send test fall reading` demo button.
- Explain that this avoids unsafe physical phone drops while still using the backend detection pipeline.

Expected result: backend creates a `FALL_SUSPECTED` event and the mobile app displays the confirmation panel.

## 9. Safe Confirmation Scenario

- Tap `I'm safe`.
- Explain that the event closes as `SAFE_CONFIRMED`.

Expected result: dashboard shows the resolved detection state without creating a critical alert.

## 10. Need Help or No-Response Scenario

- Trigger another demo fall reading.
- Tap `Need help`, or leave the confirmation unanswered while inactivity continues.

Expected result: backend creates or escalates to a critical alert.

## 11. Resolve Alert

- Show the active alert banner on the dashboard.
- Resolve the alert with a short note.

Expected result: alert status changes to `RESOLVED`.

## 12. Export CSV

- Use the alert CSV export feature.
- Explain that the export includes status, severity, timestamps, and resolution information.

Expected result: `safemotion-alerts.csv` downloads.

## 13. Swagger Demonstration

- Open `http://localhost:3000/api-docs`.
- Show auth, monitored person, device, sensor reading, confirmation, alert, and CSV endpoints.

Expected result: API documentation is visible and understandable.

## 14. Automated Test Demonstration

If requested, run:

```bash
cd backend
npm run test
```

Expected result: automated backend tests pass.

## Physical Phone Notes

- Computer and phone must be on the same Wi-Fi network.
- Mobile `.env` must use the computer's Wi-Fi IP, not `localhost`.
- Windows firewall may need to allow Node/Expo/backend network access.
- Full phone testing is done after the final documentation and README pass.

## Next implementation step

Finalize the README and screenshot pass after the user adds final screenshots.
