import { prisma } from "../config/database.js";
import { logger } from "../config/logger.js";
import type { SensorReadingPayload, SensorReadingBatchInput, ListSensorReadingsInput } from "../schemas/sensor-reading.schemas.js";
import { socketEvents } from "../sockets/socket.events.js";
import { analyzeSensorReading, type DetectionStatus } from "./detection.service.js";
import type { AuthDevice, AuthUser } from "../types/auth.js";
import { AppError } from "../utils/app-error.js";

const MAX_FUTURE_DRIFT_MS = 60 * 1000;

const calculateMagnitude = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);

const parseRecordedAt = (recordedAt: string) => {
  const date = new Date(recordedAt);

  if (date.getTime() > Date.now() + MAX_FUTURE_DRIFT_MS) {
    throw new AppError(400, "INVALID_RECORDED_AT", "Recorded timestamp cannot be too far in the future");
  }

  return date;
};

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
};

const createReadingData = (device: AuthDevice, input: SensorReadingPayload) => {
  const accelerationMagnitude = calculateMagnitude(input.accelerometer.x, input.accelerometer.y, input.accelerometer.z);
  const rotationMagnitude = calculateMagnitude(input.gyroscope.x, input.gyroscope.y, input.gyroscope.z);

  return {
    deviceId: device.id,
    monitoredPersonId: device.monitoredPersonId,
    recordedAt: parseRecordedAt(input.recordedAt),
    accelerometerX: input.accelerometer.x,
    accelerometerY: input.accelerometer.y,
    accelerometerZ: input.accelerometer.z,
    gyroscopeX: input.gyroscope.x,
    gyroscopeY: input.gyroscope.y,
    gyroscopeZ: input.gyroscope.z,
    accelerationMagnitude,
    rotationMagnitude
  };
};

export const createSensorReading = async (device: AuthDevice, input: SensorReadingPayload) => {
  const reading = await prisma.sensorReading.create({
    data: createReadingData(device, input),
    select: {
      id: true,
      deviceId: true,
      monitoredPersonId: true,
      recordedAt: true,
      receivedAt: true,
      accelerationMagnitude: true,
      rotationMagnitude: true
    }
  });
  socketEvents.sensorReadingCreated({
    id: reading.id,
    deviceId: reading.deviceId,
    monitoredPersonId: reading.monitoredPersonId,
    recordedAt: reading.recordedAt,
    receivedAt: reading.receivedAt,
    accelerationMagnitude: reading.accelerationMagnitude,
    rotationMagnitude: reading.rotationMagnitude
  });

  const detectionStatus = await analyzeSensorReading(reading);
  logger.debug(
    {
      readingId: reading.id,
      deviceId: reading.deviceId,
      monitoredPersonId: reading.monitoredPersonId,
      detectionStatus
    },
    "Sensor reading accepted"
  );

  return {
    id: reading.id,
    status: "ACCEPTED",
    detectionStatus,
    recordedAt: reading.recordedAt,
    receivedAt: reading.receivedAt,
    accelerationMagnitude: reading.accelerationMagnitude,
    rotationMagnitude: reading.rotationMagnitude
  };
};

export const createSensorReadingBatch = async (device: AuthDevice, input: SensorReadingBatchInput) => {
  let latestDetectionStatus: DetectionStatus = "NORMAL";

  for (const readingInput of input.readings) {
    const reading = await prisma.sensorReading.create({
      data: createReadingData(device, readingInput),
      select: {
        id: true,
        deviceId: true,
        monitoredPersonId: true,
        recordedAt: true,
        accelerationMagnitude: true,
        rotationMagnitude: true
      }
    });
    socketEvents.sensorReadingCreated({
      id: reading.id,
      deviceId: reading.deviceId,
      monitoredPersonId: reading.monitoredPersonId,
      recordedAt: reading.recordedAt,
      accelerationMagnitude: reading.accelerationMagnitude,
      rotationMagnitude: reading.rotationMagnitude
    });

    latestDetectionStatus = await analyzeSensorReading(reading);
  }
  logger.debug(
    {
      deviceId: device.id,
      monitoredPersonId: device.monitoredPersonId,
      accepted: input.readings.length,
      detectionStatus: latestDetectionStatus
    },
    "Sensor reading batch accepted"
  );

  return {
    accepted: input.readings.length,
    rejected: 0,
    detectionStatus: latestDetectionStatus
  };
};

export const listSensorReadings = async (user: AuthUser, input: ListSensorReadingsInput) => {
  await ensureMonitoredPersonAccess(user, input.params.monitoredPersonId);

  const readings = await prisma.sensorReading.findMany({
    where: {
      monitoredPersonId: input.params.monitoredPersonId,
      recordedAt: {
        gte: input.query.from ? new Date(input.query.from) : undefined,
        lte: input.query.to ? new Date(input.query.to) : undefined
      }
    },
    orderBy: {
      recordedAt: "desc"
    },
    take: input.query.limit,
    select: {
      id: true,
      deviceId: true,
      recordedAt: true,
      receivedAt: true,
      accelerometerX: true,
      accelerometerY: true,
      accelerometerZ: true,
      gyroscopeX: true,
      gyroscopeY: true,
      gyroscopeZ: true,
      accelerationMagnitude: true,
      rotationMagnitude: true
    }
  });

  return {
    items: readings
  };
};
