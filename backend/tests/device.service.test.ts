import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  monitoredPerson: {
    findUnique: vi.fn()
  },
  device: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn()
  }
}));

const socketEventsMock = vi.hoisted(() => ({
  deviceStatusUpdated: vi.fn()
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

import { createDevicePairingCode, pairDevice } from "../src/services/device.service.js";
import type { AuthUser } from "../src/types/auth.js";
import { hashDeviceSecret } from "../src/utils/token.js";

const caregiverUser: AuthUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "caregiver@example.com",
  fullName: "Demo Caregiver",
  role: "CAREGIVER"
};

describe("device pairing workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a six-digit pairing code for an accessible monitored person", async () => {
    prismaMock.monitoredPerson.findUnique.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000010",
      caregiverId: caregiverUser.id,
      isActive: true
    });
    prismaMock.device.create.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000020"
    });

    const result = await createDevicePairingCode(caregiverUser, {
      monitoredPersonId: "00000000-0000-4000-8000-000000000010",
      deviceName: "Demo Phone",
      platform: "ANDROID"
    });

    expect(result.pairingCode).toMatch(/^\d{6}$/);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(prismaMock.device.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          monitoredPersonId: "00000000-0000-4000-8000-000000000010",
          deviceName: "Demo Phone",
          platform: "ANDROID",
          pairingCodeHash: expect.not.stringMatching(result.pairingCode),
          pairingCodeExpiresAt: expect.any(Date)
        })
      })
    );
  });

  it("prevents caregivers from creating pairing codes for another caregiver's person", async () => {
    prismaMock.monitoredPerson.findUnique.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000010",
      caregiverId: "00000000-0000-4000-8000-000000000099",
      isActive: true
    });

    await expect(
      createDevicePairingCode(caregiverUser, {
        monitoredPersonId: "00000000-0000-4000-8000-000000000010",
        deviceName: "Demo Phone",
        platform: "ANDROID"
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN"
    });
  });

  it("pairs a device, clears the pairing code, and returns a device token", async () => {
    prismaMock.device.findFirst.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000020",
      monitoredPersonId: "00000000-0000-4000-8000-000000000010",
      deviceName: "Temporary Name",
      platform: "UNKNOWN",
      pairingCodeExpiresAt: new Date(Date.now() + 60_000)
    });
    prismaMock.device.update.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000020",
      monitoredPersonId: "00000000-0000-4000-8000-000000000010",
      deviceName: "Demo Phone",
      platform: "ANDROID"
    });

    const result = await pairDevice({
      pairingCode: "123456",
      deviceName: "Demo Phone",
      platform: "ANDROID"
    });

    expect(result.deviceToken).toMatch(/^[a-f0-9]{64}$/);
    expect(prismaMock.device.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          pairingCodeHash: hashDeviceSecret("123456"),
          isActive: true
        }
      })
    );
    expect(prismaMock.device.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deviceTokenHash: expect.not.stringMatching(result.deviceToken),
          pairingCodeHash: null,
          pairingCodeExpiresAt: null,
          lastSeenAt: expect.any(Date)
        })
      })
    );
    expect(socketEventsMock.deviceStatusUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: "00000000-0000-4000-8000-000000000020",
        monitoredPersonId: "00000000-0000-4000-8000-000000000010",
        status: "PAIRED"
      })
    );
  });

  it("rejects expired pairing codes", async () => {
    prismaMock.device.findFirst.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000020",
      monitoredPersonId: "00000000-0000-4000-8000-000000000010",
      deviceName: "Temporary Name",
      platform: "UNKNOWN",
      pairingCodeExpiresAt: new Date(Date.now() - 60_000)
    });

    await expect(
      pairDevice({
        pairingCode: "123456",
        deviceName: "Demo Phone",
        platform: "ANDROID"
      })
    ).rejects.toMatchObject({
      statusCode: 410,
      code: "PAIRING_CODE_EXPIRED"
    });
  });
});
