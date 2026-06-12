import bcrypt from "bcryptjs";

import { prisma } from "../config/database.js";
import { logger } from "../config/logger.js";
import type { ResetUserPasswordInput, UserIdParamInput } from "../schemas/user.schemas.js";
import type { AuthUser } from "../types/auth.js";
import { AppError } from "../utils/app-error.js";

const PASSWORD_SALT_ROUNDS = 12;

export const listUsers = async () => {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return {
    items: users
  };
};

export const deactivateUser = async (actor: AuthUser, input: UserIdParamInput) => {
  if (actor.id === input.params.id) {
    throw new AppError(400, "CANNOT_DEACTIVATE_SELF", "You cannot deactivate your own account");
  }

  const user = await prisma.user.findUnique({
    where: { id: input.params.id },
    select: {
      id: true,
      isActive: true
    }
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User was not found");
  }

  if (!user.isActive) {
    return {
      id: user.id,
      isActive: false
    };
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { isActive: false },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true
    }
  });
  logger.warn({ actorId: actor.id, userId: updatedUser.id }, "Dashboard user deactivated");

  return updatedUser;
};

export const reactivateUser = async (actor: AuthUser, input: UserIdParamInput) => {
  const user = await prisma.user.findUnique({
    where: { id: input.params.id },
    select: {
      id: true,
      isActive: true
    }
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User was not found");
  }

  if (user.isActive) {
    return {
      id: user.id,
      isActive: true
    };
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { isActive: true },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true
    }
  });
  logger.info({ actorId: actor.id, userId: updatedUser.id }, "Dashboard user reactivated");

  return updatedUser;
};

export const removeUser = async (actor: AuthUser, input: UserIdParamInput) => {
  if (actor.id === input.params.id) {
    throw new AppError(400, "CANNOT_REMOVE_SELF", "You cannot remove your own account");
  }

  const user = await prisma.user.findUnique({
    where: { id: input.params.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      caregiverMonitoredPersons: {
        select: { id: true },
        take: 1
      },
      createdMonitoredPersons: {
        select: { id: true },
        take: 1
      },
      resolvedAlerts: {
        select: { id: true },
        take: 1
      },
      systemLogs: {
        select: { id: true },
        take: 1
      }
    }
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User was not found");
  }

  const hasRelatedRecords =
    user.caregiverMonitoredPersons.length > 0 ||
    user.createdMonitoredPersons.length > 0 ||
    user.resolvedAlerts.length > 0 ||
    user.systemLogs.length > 0;

  if (hasRelatedRecords) {
    throw new AppError(
      409,
      "USER_HAS_RELATED_RECORDS",
      "This user has related records and cannot be removed safely. Deactivate the account instead."
    );
  }

  await prisma.user.delete({
    where: { id: user.id }
  });
  logger.warn({ actorId: actor.id, userId: user.id, email: user.email }, "Dashboard user removed");

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    removed: true
  };
};

export const resetUserPassword = async (actor: AuthUser, input: ResetUserPasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { id: input.params.id },
    select: {
      id: true,
      isActive: true
    }
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User was not found");
  }

  if (!user.isActive) {
    throw new AppError(409, "USER_INACTIVE", "Cannot reset password for an inactive user");
  }

  const passwordHash = await bcrypt.hash(input.body.newPassword, PASSWORD_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  });
  logger.info({ actorId: actor.id, userId: user.id }, "Dashboard user password reset by admin");

  return {
    status: "UPDATED"
  };
};
