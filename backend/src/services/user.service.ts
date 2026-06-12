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
