import { prisma } from "../config/database.js";
import { logger } from "../config/logger.js";
import { socketEvents } from "../sockets/socket.events.js";
import type { AuthDevice, AuthUser } from "../types/auth.js";
import { AppError } from "../utils/app-error.js";
import { createDeviceToken, createPairingCode, hashDeviceSecret } from "../utils/token.js";
import type { CreatePairingCodeInput, PairDeviceInput } from "../schemas/device.schemas.js";

const PAIRING_CODE_TTL_MINUTES = 10;

const toAuthDevice = (device: AuthDevice): AuthDevice => ({
  id: device.id,
  monitoredPersonId: device.monitoredPersonId,
  deviceName: device.deviceName,
  platform: device.platform
});

const ensureMonitoredPersonAccess = async (user: AuthUser, monitoredPersonId: string) => {
  const monitoredPerson = await prisma.monitoredPerson.findUnique({
    where: { id: monitoredPersonId },
    select: {
      id: true,
      caregiverId: true,
      isActive: true
    }
  });

  if (!monitoredPerson || !monitoredPerson.isActive) {
    throw new AppError(404, "MONITORED_PERSON_NOT_FOUND", "Monitored person was not found");
  }

  if (user.role !== "ADMIN" && monitoredPerson.caregiverId !== user.id) {
    throw new AppError(403, "FORBIDDEN", "You do not have permission to access this monitored person");
  }

  return monitoredPerson;
};

export const createDevicePairingCode = async (user: AuthUser, input: CreatePairingCodeInput) => {
  await ensureMonitoredPersonAccess(user, input.monitoredPersonId);

  const pairingCode = createPairingCode();
  const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MINUTES * 60 * 1000);

  const device = await prisma.device.create({
    data: {
      monitoredPersonId: input.monitoredPersonId,
      deviceName: input.deviceName,
      platform: input.platform,
      pairingCodeHash: hashDeviceSecret(pairingCode),
      pairingCodeExpiresAt: expiresAt
    },
    select: {
      id: true
    }
  });
  logger.info(
    {
      deviceId: device.id,
      monitoredPersonId: input.monitoredPersonId
    },
    "Device pairing code created"
  );

  return {
    deviceId: device.id,
    pairingCode,
    expiresAt
  };
};

export const pairDevice = async (input: PairDeviceInput) => {
  const pairingCodeHash = hashDeviceSecret(input.pairingCode);

  const device = await prisma.device.findFirst({
    where: {
      pairingCodeHash,
      isActive: true
    },
    select: {
      id: true,
      monitoredPersonId: true,
      deviceName: true,
      platform: true,
      pairingCodeExpiresAt: true
    }
  });

  if (!device) {
    throw new AppError(401, "INVALID_PAIRING_CODE", "Pairing code is invalid");
  }

  if (!device.pairingCodeExpiresAt || device.pairingCodeExpiresAt.getTime() < Date.now()) {
    throw new AppError(410, "PAIRING_CODE_EXPIRED", "Pairing code has expired");
  }

  const deviceToken = createDeviceToken();
  const pairedDevice = await prisma.device.update({
    where: { id: device.id },
    data: {
      deviceName: input.deviceName,
      platform: input.platform,
      deviceTokenHash: hashDeviceSecret(deviceToken),
      pairingCodeHash: null,
      pairingCodeExpiresAt: null,
      lastSeenAt: new Date()
    },
    select: {
      id: true,
      monitoredPersonId: true,
      deviceName: true,
      platform: true
    }
  });
  socketEvents.deviceStatusUpdated({
    deviceId: pairedDevice.id,
    monitoredPersonId: pairedDevice.monitoredPersonId,
    status: "PAIRED",
    lastSeenAt: new Date()
  });
  logger.info(
    {
      deviceId: pairedDevice.id,
      monitoredPersonId: pairedDevice.monitoredPersonId,
      platform: pairedDevice.platform
    },
    "Device paired"
  );

  return {
    deviceId: pairedDevice.id,
    monitoredPersonId: pairedDevice.monitoredPersonId,
    deviceToken
  };
};

export const getDeviceStatus = async (user: AuthUser, deviceId: string) => {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    select: {
      id: true,
      monitoredPersonId: true,
      deviceName: true,
      platform: true,
      lastSeenAt: true,
      isActive: true,
      monitoredPerson: {
        select: {
          caregiverId: true,
          isActive: true
        }
      }
    }
  });

  if (!device || !device.monitoredPerson.isActive) {
    throw new AppError(404, "DEVICE_NOT_FOUND", "Device was not found");
  }

  if (user.role !== "ADMIN" && device.monitoredPerson.caregiverId !== user.id) {
    throw new AppError(403, "FORBIDDEN", "You do not have permission to access this device");
  }

  return {
    id: device.id,
    monitoredPersonId: device.monitoredPersonId,
    deviceName: device.deviceName,
    platform: device.platform,
    isActive: device.isActive,
    lastSeenAt: device.lastSeenAt
  };
};

export const getDeviceByToken = async (deviceToken: string) => {
  const deviceTokenHash = hashDeviceSecret(deviceToken);

  const device = await prisma.device.findUnique({
    where: { deviceTokenHash },
    select: {
      id: true,
      monitoredPersonId: true,
      deviceName: true,
      platform: true,
      isActive: true
    }
  });

  if (!device || !device.isActive) {
    throw new AppError(401, "INVALID_DEVICE_TOKEN", "Device token is invalid");
  }

  const lastSeenAt = new Date();

  await prisma.device.update({
    where: { id: device.id },
    data: { lastSeenAt }
  });
  socketEvents.deviceStatusUpdated({
    deviceId: device.id,
    monitoredPersonId: device.monitoredPersonId,
    status: "ONLINE",
    lastSeenAt
  });

  return toAuthDevice(device);
};
