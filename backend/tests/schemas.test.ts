import { createSensorReadingSchema } from "../src/schemas/sensor-reading.schemas.js";
import { createConfirmationResponseSchema } from "../src/schemas/confirmation.schemas.js";
import { pairDeviceSchema } from "../src/schemas/device.schemas.js";
import { signupSchema } from "../src/schemas/auth.schemas.js";
import { createMonitoredPersonSchema, monitoredPersonIdParamSchema } from "../src/schemas/monitored-person.schemas.js";

describe("request schemas", () => {
  it("accepts a valid accelerometer and gyroscope reading", () => {
    const result = createSensorReadingSchema.safeParse({
      body: {
        recordedAt: new Date().toISOString(),
        accelerometer: { x: 0.1, y: 9.7, z: 0.2 },
        gyroscope: { x: 0.01, y: 0.02, z: 0.03 }
      }
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing gyroscope data", () => {
    const result = createSensorReadingSchema.safeParse({
      body: {
        recordedAt: new Date().toISOString(),
        accelerometer: { x: 0.1, y: 9.7, z: 0.2 }
      }
    });

    expect(result.success).toBe(false);
  });

  it("accepts only supported confirmation responses", () => {
    const valid = createConfirmationResponseSchema.safeParse({
      body: {
        detectionEventId: "00000000-0000-4000-8000-000000000001",
        response: "SAFE"
      }
    });
    const invalid = createConfirmationResponseSchema.safeParse({
      body: {
        detectionEventId: "00000000-0000-4000-8000-000000000001",
        response: "MAYBE"
      }
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("requires a six digit pairing code", () => {
    const result = pairDeviceSchema.safeParse({
      body: {
        pairingCode: "12345",
        deviceName: "Demo Phone",
        platform: "ANDROID"
      }
    });

    expect(result.success).toBe(false);
  });

  it("accepts public caregiver signup details without a role", () => {
    const result = signupSchema.safeParse({
      body: {
        email: "newcaregiver@example.com",
        password: "StrongPassword123!",
        fullName: "New Caregiver"
      }
    });

    expect(result.success).toBe(true);
  });

  it("accepts monitored person creation details", () => {
    const result = createMonitoredPersonSchema.safeParse({
      body: {
        displayName: "Demo Patient",
        notes: "Lives alone and carries the paired phone."
      }
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid monitored person IDs", () => {
    const result = monitoredPersonIdParamSchema.safeParse({
      params: {
        id: "not-a-uuid"
      }
    });

    expect(result.success).toBe(false);
  });
});
