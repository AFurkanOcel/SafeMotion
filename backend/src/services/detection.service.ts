import { prisma } from "../config/database.js";
import { detectionConfig } from "../config/detection.js";
import { logger } from "../config/logger.js";
import { socketEvents } from "../sockets/socket.events.js";
import { recordNoResponseAndEscalate } from "./confirmation.service.js";

export type DetectionStatus = "NORMAL" | "FALL_SUSPECTED" | "INACTIVITY_DETECTED";

type ReadingForAnalysis = {
  id: string;
  deviceId: string;
  monitoredPersonId: string;
  recordedAt: Date;
  accelerationMagnitude: number | null;
  rotationMagnitude: number | null;
};

const isFallLikeReading = (reading: ReadingForAnalysis) => {
  const accelerationMagnitude = reading.accelerationMagnitude ?? 0;
  const rotationMagnitude = reading.rotationMagnitude ?? 0;

  return (
    accelerationMagnitude >= detectionConfig.fallAccelerationMagnitudeThreshold ||
    rotationMagnitude >= detectionConfig.fallRotationMagnitudeThreshold
  );
};

const isLowMovementReading = (reading: ReadingForAnalysis) => {
  const accelerationMagnitude = reading.accelerationMagnitude ?? detectionConfig.gravityMagnitude;
  const rotationMagnitude = reading.rotationMagnitude ?? 0;
  const accelerationDeltaFromGravity = Math.abs(accelerationMagnitude - detectionConfig.gravityMagnitude);

  return (
    accelerationDeltaFromGravity <= detectionConfig.inactivityAccelerationDeltaFromGravityThreshold &&
    rotationMagnitude <= detectionConfig.inactivityRotationMagnitudeThreshold
  );
};

const createFallSuspectedEvent = async (reading: ReadingForAnalysis): Promise<DetectionStatus> => {
  const detectionEvent = await prisma.detectionEvent.create({
    data: {
      monitoredPersonId: reading.monitoredPersonId,
      deviceId: reading.deviceId,
      triggerReadingId: reading.id,
      type: "FALL_SUSPECTED",
      status: "OPEN",
      severity: "HIGH",
      startedAt: reading.recordedAt,
      metadata: {
        reason: "Threshold-based fall suspicion",
        accelerationMagnitude: reading.accelerationMagnitude,
        rotationMagnitude: reading.rotationMagnitude,
        thresholds: {
          fallAccelerationMagnitude: detectionConfig.fallAccelerationMagnitudeThreshold,
          fallRotationMagnitude: detectionConfig.fallRotationMagnitudeThreshold
        }
      }
    }
  });
  socketEvents.fallSuspected({
    detectionEventId: detectionEvent.id,
    deviceId: reading.deviceId,
    monitoredPersonId: reading.monitoredPersonId
  });
  logger.warn(
    {
      detectionEventId: detectionEvent.id,
      deviceId: reading.deviceId,
      monitoredPersonId: reading.monitoredPersonId,
      accelerationMagnitude: reading.accelerationMagnitude,
      rotationMagnitude: reading.rotationMagnitude
    },
    "Fall suspected"
  );

  return "FALL_SUSPECTED" satisfies DetectionStatus;
};

const createInactivityEvent = async (
  reading: ReadingForAnalysis,
  fallEventId: string,
  fallStartedAt: Date
): Promise<DetectionStatus> => {
  const inactivityEvent = await prisma.detectionEvent.create({
    data: {
      monitoredPersonId: reading.monitoredPersonId,
      deviceId: reading.deviceId,
      triggerReadingId: reading.id,
      type: "INACTIVITY_DETECTED",
      status: "OPEN",
      severity: "HIGH",
      startedAt: reading.recordedAt,
      metadata: {
        reason: "Low movement after suspected fall",
        linkedFallEventId: fallEventId,
        fallStartedAt: fallStartedAt.toISOString(),
        accelerationMagnitude: reading.accelerationMagnitude,
        rotationMagnitude: reading.rotationMagnitude,
        thresholds: {
          inactivityWindowMs: detectionConfig.inactivityWindowMs,
          inactivityAccelerationDeltaFromGravity: detectionConfig.inactivityAccelerationDeltaFromGravityThreshold,
          inactivityRotationMagnitude: detectionConfig.inactivityRotationMagnitudeThreshold
        }
      }
    }
  });

  await recordNoResponseAndEscalate(fallEventId);
  socketEvents.inactivityDetected({
    detectionEventId: inactivityEvent.id,
    linkedFallEventId: fallEventId,
    deviceId: reading.deviceId,
    monitoredPersonId: reading.monitoredPersonId
  });
  logger.warn(
    {
      detectionEventId: inactivityEvent.id,
      linkedFallEventId: fallEventId,
      deviceId: reading.deviceId,
      monitoredPersonId: reading.monitoredPersonId
    },
    "Inactivity detected after fall suspicion"
  );

  return "INACTIVITY_DETECTED" satisfies DetectionStatus;
};

export const analyzeSensorReading = async (reading: ReadingForAnalysis): Promise<DetectionStatus> => {
  const openFallEvent = await prisma.detectionEvent.findFirst({
    where: {
      deviceId: reading.deviceId,
      type: "FALL_SUSPECTED",
      status: "OPEN"
    },
    orderBy: {
      startedAt: "desc"
    },
    select: {
      id: true,
      startedAt: true
    }
  });

  if (openFallEvent) {
    const openInactivityEvent = await prisma.detectionEvent.findFirst({
      where: {
        deviceId: reading.deviceId,
        type: "INACTIVITY_DETECTED",
        status: "OPEN"
      },
      select: {
        id: true
      }
    });

    const elapsedMs = reading.recordedAt.getTime() - openFallEvent.startedAt.getTime();

    if (!openInactivityEvent && elapsedMs >= detectionConfig.inactivityWindowMs && isLowMovementReading(reading)) {
      return createInactivityEvent(reading, openFallEvent.id, openFallEvent.startedAt);
    }

    return "FALL_SUSPECTED";
  }

  if (isFallLikeReading(reading)) {
    return createFallSuspectedEvent(reading);
  }

  return "NORMAL";
};
