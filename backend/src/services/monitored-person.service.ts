import { prisma } from "../config/database.js";
import { logger } from "../config/logger.js";
import type { CreateMonitoredPersonInput, MonitoredPersonIdParamInput } from "../schemas/monitored-person.schemas.js";
import type { AuthUser } from "../types/auth.js";
import { AppError } from "../utils/app-error.js";

const monitoredPersonSelect = {
  id: true,
  displayName: true,
  notes: true,
  caregiverId: true,
  createdById: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
};

const resolveCaregiverId = async (user: AuthUser, input: CreateMonitoredPersonInput) => {
  if (user.role === "CAREGIVER") {
    if (input.caregiverId && input.caregiverId !== user.id) {
      throw new AppError(403, "FORBIDDEN", "Caregivers can only create monitored persons for themselves");
    }

    return user.id;
  }

  const caregiverId = input.caregiverId ?? user.id;

  const caregiver = await prisma.user.findUnique({
    where: { id: caregiverId },
    select: {
      id: true,
      role: true,
      isActive: true
    }
  });

  if (!caregiver || !caregiver.isActive) {
    throw new AppError(404, "CAREGIVER_NOT_FOUND", "Caregiver was not found");
  }

  if (caregiver.role !== "CAREGIVER" && caregiver.id !== user.id) {
    throw new AppError(400, "INVALID_CAREGIVER", "Assigned user must be a caregiver");
  }

  return caregiverId;
};

export const createMonitoredPerson = async (user: AuthUser, input: CreateMonitoredPersonInput) => {
  const caregiverId = await resolveCaregiverId(user, input);

  const monitoredPerson = await prisma.monitoredPerson.create({
    data: {
      displayName: input.displayName,
      notes: input.notes,
      caregiverId,
      createdById: user.id
    },
    select: monitoredPersonSelect
  });

  logger.info(
    {
      monitoredPersonId: monitoredPerson.id,
      caregiverId
    },
    "Monitored person created"
  );

  return monitoredPerson;
};

export const listMonitoredPersons = async (user: AuthUser) => {
  const monitoredPersons = await prisma.monitoredPerson.findMany({
    where:
      user.role === "CAREGIVER"
        ? {
            caregiverId: user.id,
            isActive: true
          }
        : {
            isActive: true
          },
    orderBy: [{ displayName: "asc" }, { createdAt: "desc" }],
    select: monitoredPersonSelect
  });

  return {
    items: monitoredPersons
  };
};

export const getMonitoredPerson = async (user: AuthUser, input: MonitoredPersonIdParamInput) => {
  const monitoredPerson = await prisma.monitoredPerson.findUnique({
    where: { id: input.params.id },
    select: monitoredPersonSelect
  });

  if (!monitoredPerson || !monitoredPerson.isActive) {
    throw new AppError(404, "MONITORED_PERSON_NOT_FOUND", "Monitored person was not found");
  }

  if (user.role !== "ADMIN" && monitoredPerson.caregiverId !== user.id) {
    throw new AppError(403, "FORBIDDEN", "You do not have permission to access this monitored person");
  }

  return monitoredPerson;
};
