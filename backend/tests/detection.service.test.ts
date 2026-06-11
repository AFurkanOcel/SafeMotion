import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  detectionEvent: {
    create: vi.fn(),
    findFirst: vi.fn()
  }
}));

const socketEventsMock = vi.hoisted(() => ({
  fallSuspected: vi.fn(),
  inactivityDetected: vi.fn()
}));

const confirmationServiceMock = vi.hoisted(() => ({
  recordNoResponseAndEscalate: vi.fn()
}));

vi.mock("../src/config/database.js", () => ({
  prisma: prismaMock
}));

vi.mock("../src/config/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock("../src/sockets/socket.events.js", () => ({
  socketEvents: socketEventsMock
}));

vi.mock("../src/services/confirmation.service.js", () => confirmationServiceMock);

import { analyzeSensorReading } from "../src/services/detection.service.js";

const baseReading = {
  id: "00000000-0000-4000-8000-000000000030",
  deviceId: "00000000-0000-4000-8000-000000000020",
  monitoredPersonId: "00000000-0000-4000-8000-000000000010",
  recordedAt: new Date("2026-06-11T10:00:00.000Z"),
  accelerationMagnitude: 9.9,
  rotationMagnitude: 0.1
};

describe("detection service thresholds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps normal movement readings as NORMAL", async () => {
    prismaMock.detectionEvent.findFirst.mockResolvedValue(null);

    const result = await analyzeSensorReading(baseReading);

    expect(result).toBe("NORMAL");
    expect(prismaMock.detectionEvent.create).not.toHaveBeenCalled();
  });

  it("creates a fall suspicion when acceleration crosses the threshold", async () => {
    prismaMock.detectionEvent.findFirst.mockResolvedValue(null);
    prismaMock.detectionEvent.create.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000040"
    });

    const result = await analyzeSensorReading({
      ...baseReading,
      accelerationMagnitude: 28,
      rotationMagnitude: 0.2
    });

    expect(result).toBe("FALL_SUSPECTED");
    expect(prismaMock.detectionEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "FALL_SUSPECTED",
          status: "OPEN",
          severity: "HIGH"
        })
      })
    );
    expect(socketEventsMock.fallSuspected).toHaveBeenCalledWith(
      expect.objectContaining({
        detectionEventId: "00000000-0000-4000-8000-000000000040",
        deviceId: baseReading.deviceId,
        monitoredPersonId: baseReading.monitoredPersonId
      })
    );
  });

  it("creates inactivity and escalates when low movement continues after a suspected fall", async () => {
    const fallStartedAt = new Date("2026-06-11T09:59:20.000Z");
    prismaMock.detectionEvent.findFirst.mockResolvedValueOnce({
      id: "00000000-0000-4000-8000-000000000040",
      startedAt: fallStartedAt
    });
    prismaMock.detectionEvent.findFirst.mockResolvedValueOnce(null);
    prismaMock.detectionEvent.create.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000041"
    });

    const result = await analyzeSensorReading({
      ...baseReading,
      accelerationMagnitude: 9.81,
      rotationMagnitude: 0.05
    });

    expect(result).toBe("INACTIVITY_DETECTED");
    expect(prismaMock.detectionEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "INACTIVITY_DETECTED",
          metadata: expect.objectContaining({
            linkedFallEventId: "00000000-0000-4000-8000-000000000040"
          })
        })
      })
    );
    expect(confirmationServiceMock.recordNoResponseAndEscalate).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000040"
    );
    expect(socketEventsMock.inactivityDetected).toHaveBeenCalledWith(
      expect.objectContaining({
        detectionEventId: "00000000-0000-4000-8000-000000000041",
        linkedFallEventId: "00000000-0000-4000-8000-000000000040"
      })
    );
  });

  it("does not duplicate inactivity events for the same open fall", async () => {
    prismaMock.detectionEvent.findFirst.mockResolvedValueOnce({
      id: "00000000-0000-4000-8000-000000000040",
      startedAt: new Date("2026-06-11T09:59:20.000Z")
    });
    prismaMock.detectionEvent.findFirst.mockResolvedValueOnce({
      id: "00000000-0000-4000-8000-000000000041"
    });

    const result = await analyzeSensorReading(baseReading);

    expect(result).toBe("FALL_SUSPECTED");
    expect(prismaMock.detectionEvent.create).not.toHaveBeenCalled();
    expect(confirmationServiceMock.recordNoResponseAndEscalate).not.toHaveBeenCalled();
  });
});
