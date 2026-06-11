import { prisma } from "../config/database.js";
import { logger } from "../config/logger.js";
import type { AlertIdParamInput, ListAlertsInput, ResolveAlertInput } from "../schemas/alert.schemas.js";
import { socketEvents } from "../sockets/socket.events.js";
import type { AuthUser } from "../types/auth.js";
import { AppError } from "../utils/app-error.js";

type AlertCreateInput = {
  monitoredPersonId: string;
  detectionEventId?: string;
  severity: "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
};

export const ensureMonitoredPersonAccess = async (user: AuthUser, monitoredPersonId: string) => {
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

export const createAlertForDetectionEvent = async (input: AlertCreateInput) => {
  if (input.detectionEventId) {
    const existingAlert = await prisma.alert.findUnique({
      where: { detectionEventId: input.detectionEventId },
      select: { id: true }
    });

    if (existingAlert) {
      return existingAlert;
    }
  }

  const alert = await prisma.alert.create({
    data: {
      monitoredPersonId: input.monitoredPersonId,
      detectionEventId: input.detectionEventId,
      severity: input.severity,
      title: input.title,
      message: input.message
    },
    select: {
      id: true,
      status: true,
      severity: true,
      title: true,
      message: true,
      createdAt: true
    }
  });
  socketEvents.alertCreated(alert);
  logger.warn(
    {
      alertId: alert.id,
      monitoredPersonId: input.monitoredPersonId,
      severity: input.severity
    },
    "Alert created"
  );

  return alert;
};

export const listAlerts = async (user: AuthUser, input: ListAlertsInput) => {
  if (input.query.monitoredPersonId) {
    await ensureMonitoredPersonAccess(user, input.query.monitoredPersonId);
  }

  const alerts = await prisma.alert.findMany({
    where: {
      status: input.query.status,
      severity: input.query.severity,
      monitoredPersonId:
        user.role === "ADMIN"
          ? input.query.monitoredPersonId
          : input.query.monitoredPersonId
            ? input.query.monitoredPersonId
            : undefined,
      monitoredPerson:
        user.role === "CAREGIVER"
          ? {
              caregiverId: user.id
            }
          : undefined
    },
    orderBy: {
      createdAt: "desc"
    },
    take: input.query.limit,
    select: {
      id: true,
      monitoredPersonId: true,
      detectionEventId: true,
      status: true,
      severity: true,
      title: true,
      message: true,
      createdAt: true,
      resolvedAt: true,
      resolvedById: true,
      resolutionNote: true
    }
  });

  return {
    items: alerts
  };
};

export const getAlert = async (user: AuthUser, input: AlertIdParamInput) => {
  const alert = await prisma.alert.findUnique({
    where: { id: input.params.id },
    include: {
      monitoredPerson: {
        select: {
          caregiverId: true
        }
      }
    }
  });

  if (!alert) {
    throw new AppError(404, "ALERT_NOT_FOUND", "Alert was not found");
  }

  if (user.role !== "ADMIN" && alert.monitoredPerson.caregiverId !== user.id) {
    throw new AppError(403, "FORBIDDEN", "You do not have permission to access this alert");
  }

  return alert;
};

export const resolveAlert = async (user: AuthUser, input: ResolveAlertInput) => {
  const alert = await getAlert(user, {
    params: {
      id: input.params.id
    }
  });

  if (alert.status === "RESOLVED") {
    throw new AppError(409, "ALERT_ALREADY_RESOLVED", "Alert is already resolved");
  }

  const resolvedAlert = await prisma.alert.update({
    where: { id: alert.id },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolvedById: user.id,
      resolutionNote: input.body.resolutionNote
    },
    select: {
      id: true,
      status: true,
      resolvedAt: true,
      resolvedById: true,
      resolutionNote: true
    }
  });
  socketEvents.alertResolved(resolvedAlert);
  logger.info(
    {
      alertId: resolvedAlert.id,
      resolvedById: resolvedAlert.resolvedById
    },
    "Alert resolved"
  );

  return resolvedAlert;
};
