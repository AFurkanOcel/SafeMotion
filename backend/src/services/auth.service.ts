import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import type { AuthUser, JwtPayload } from "../types/auth.js";
import { AppError } from "../utils/app-error.js";
import type { ChangePasswordInput, LoginInput, RegisterInput, SignupInput } from "../schemas/auth.schemas.js";

const PASSWORD_SALT_ROUNDS = 12;

const toAuthUser = (user: AuthUser): AuthUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role
});

export const signAccessToken = (user: AuthUser) => {
  const payload: JwtPayload = {
    sub: user.id,
    role: user.role
  };

  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.jwtSecret, options);
};

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existingUser) {
    throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      role: input.role
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true
    }
  });
  logger.info(
    {
      userId: user.id,
      role: user.role
    },
    "Dashboard user registered"
  );

  return toAuthUser(user);
};

export const signupCaregiver = async (input: SignupInput) => {
  const user = await registerUser({
    ...input,
    role: "CAREGIVER"
  });

  return {
    token: signAccessToken(user),
    user
  };
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      passwordHash: true
    }
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const authUser = toAuthUser(user);
  logger.info(
    {
      userId: authUser.id,
      role: authUser.role
    },
    "Dashboard user logged in"
  );

  return {
    token: signAccessToken(authUser),
    user: authUser
  };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true
    }
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required");
  }

  return toAuthUser(user);
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
  }
};

export const changeOwnPassword = async (userId: string, input: ChangePasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
      isActive: true
    }
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required");
  }

  const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "INVALID_CURRENT_PASSWORD", "Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, PASSWORD_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  });
  logger.info({ userId: user.id }, "Dashboard user password changed");

  return {
    status: "UPDATED"
  };
};
