import { prisma } from "../config/database.js";
import type { CreateConfirmationResponseInput } from "../schemas/confirmation.schemas.js";
import { socketEvents } from "../sockets/socket.events.js";
import type { AuthDevice } from "../types/auth.js";
import { AppError } from "../utils/app-error.js";
import { createAlertForDetectionEvent } from "./alert.service.js";

export const createConfirmationResponse = async (device: AuthDevice, input: CreateConfirmationResponseInput) => {
  const detectionEvent = await prisma.detectionEvent.findUnique({
    where: { id: input.detectionEventId },
    select: {
      id: true,
      deviceId: true,
      monitoredPersonId: true,
      status: true,
      type: true
    }
  });

  if (!detectionEvent) {
    throw new AppError(404, "DETECTION_EVENT_NOT_FOUND", "Detection event was not found");
  }

  if (detectionEvent.deviceId !== device.id) {
    throw new AppError(403, "DEVICE_MISMATCH", "Device cannot respond to this detection event");
  }

  if (detectionEvent.status !== "OPEN") {
    throw new AppError(409, "EVENT_ALREADY_CLOSED", "Detection event is already closed");
  }

  const confirmationResponse = await prisma.confirmationResponse.create({
    data: {
      detectionEventId: detectionEvent.id,
      deviceId: device.id,
      response: input.response,
      respondedAt: new Date()
    },
    select: {
      id: true,
      detectionEventId: true,
      response: true,
      respondedAt: true
    }
  });

  if (input.response === "SAFE") {
    await prisma.detectionEvent.update({
      where: { id: detectionEvent.id },
      data: {
        status: "SAFE_CONFIRMED",
        resolvedAt: new Date()
      }
    });
    socketEvents.detectionResolved({
      detectionEventId: detectionEvent.id,
      deviceId: detectionEvent.deviceId,
      status: "SAFE_CONFIRMED"
    });

    return {
      ...confirmationResponse,
      status: "SAFE_CONFIRMED"
    };
  }

  await prisma.detectionEvent.update({
    where: { id: detectionEvent.id },
    data: {
      status: "ESCALATED"
    }
  });

  const alert = await createAlertForDetectionEvent({
    monitoredPersonId: detectionEvent.monitoredPersonId,
    detectionEventId: detectionEvent.id,
    severity: "CRITICAL",
    title: "Critical fall alert",
    message: "The monitored person requested help after a suspected fall."
  });
  socketEvents.detectionResolved({
    detectionEventId: detectionEvent.id,
    deviceId: detectionEvent.deviceId,
    status: "ESCALATED"
  });

  return {
    ...confirmationResponse,
    status: "ESCALATED",
    alert
  };
};

export const getActiveConfirmationRequest = async (device: AuthDevice) => {
  const detectionEvent = await prisma.detectionEvent.findFirst({
    where: {
      deviceId: device.id,
      type: "FALL_SUSPECTED",
      status: "OPEN"
    },
    orderBy: {
      startedAt: "desc"
    },
    select: {
      id: true,
      startedAt: true,
      severity: true
    }
  });

  if (!detectionEvent) {
    throw new AppError(404, "NO_ACTIVE_CONFIRMATION", "No active confirmation request was found");
  }

  return {
    detectionEventId: detectionEvent.id,
    message: "Are you okay?",
    actions: ["I'm safe", "Need help"],
    startedAt: detectionEvent.startedAt,
    severity: detectionEvent.severity
  };
};

export const recordNoResponseAndEscalate = async (detectionEventId: string) => {
  const detectionEvent = await prisma.detectionEvent.findUnique({
    where: { id: detectionEventId },
    select: {
      id: true,
      deviceId: true,
      monitoredPersonId: true,
      status: true
    }
  });

  if (!detectionEvent || detectionEvent.status !== "OPEN") {
    return null;
  }

  await prisma.confirmationResponse.create({
    data: {
      detectionEventId: detectionEvent.id,
      deviceId: detectionEvent.deviceId,
      response: "NO_RESPONSE",
      respondedAt: new Date()
    }
  });

  await prisma.detectionEvent.update({
    where: { id: detectionEvent.id },
    data: {
      status: "ESCALATED"
    }
  });
  socketEvents.detectionResolved({
    detectionEventId: detectionEvent.id,
    deviceId: detectionEvent.deviceId,
    status: "ESCALATED"
  });

  return createAlertForDetectionEvent({
    monitoredPersonId: detectionEvent.monitoredPersonId,
    detectionEventId: detectionEvent.id,
    severity: "CRITICAL",
    title: "Critical fall alert",
    message: "No safety confirmation was received after a suspected fall."
  });
};
