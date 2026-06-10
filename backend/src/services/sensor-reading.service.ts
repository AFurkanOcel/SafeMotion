import { prisma } from "../config/database.js";
import type { SensorReadingPayload, SensorReadingBatchInput, ListSensorReadingsInput } from "../schemas/sensor-reading.schemas.js";
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
      recordedAt: true,
      receivedAt: true,
      accelerationMagnitude: true,
      rotationMagnitude: true
    }
  });

  return {
    id: reading.id,
    status: "ACCEPTED",
    detectionStatus: "NORMAL",
    recordedAt: reading.recordedAt,
    receivedAt: reading.receivedAt,
    accelerationMagnitude: reading.accelerationMagnitude,
    rotationMagnitude: reading.rotationMagnitude
  };
};

export const createSensorReadingBatch = async (device: AuthDevice, input: SensorReadingBatchInput) => {
  const data = input.readings.map((reading) => createReadingData(device, reading));

  await prisma.sensorReading.createMany({
    data
  });

  return {
    accepted: data.length,
    rejected: 0
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

