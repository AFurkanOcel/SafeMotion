import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn()
  },
  monitoredPerson: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn()
  }
}));

vi.mock("../src/config/database.js", () => ({
  prisma: prismaMock
}));

vi.mock("../src/config/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

import { createMonitoredPerson, getMonitoredPerson, listMonitoredPersons } from "../src/services/monitored-person.service.js";
import type { AuthUser } from "../src/types/auth.js";

const caregiverUser: AuthUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "caregiver@example.com",
  fullName: "Demo Caregiver",
  role: "CAREGIVER"
};

const adminUser: AuthUser = {
  id: "00000000-0000-4000-8000-000000000002",
  email: "admin@example.com",
  fullName: "Demo Admin",
  role: "ADMIN"
};

describe("monitored person service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates monitored persons for the authenticated caregiver", async () => {
    prismaMock.monitoredPerson.create.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000010",
      displayName: "Demo Patient",
      caregiverId: caregiverUser.id,
      createdById: caregiverUser.id,
      isActive: true
    });

    const result = await createMonitoredPerson(caregiverUser, {
      displayName: "Demo Patient"
    });

    expect(prismaMock.monitoredPerson.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          caregiverId: caregiverUser.id,
          createdById: caregiverUser.id
        })
      })
    );
    expect(result.displayName).toBe("Demo Patient");
  });

  it("prevents caregivers from assigning monitored persons to another caregiver", async () => {
    await expect(
      createMonitoredPerson(caregiverUser, {
        displayName: "Demo Patient",
        caregiverId: "00000000-0000-4000-8000-000000000099"
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN"
    });
  });

  it("lets admins list all active monitored persons", async () => {
    prismaMock.monitoredPerson.findMany.mockResolvedValue([]);

    await listMonitoredPersons(adminUser);

    expect(prismaMock.monitoredPerson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true
        }
      })
    );
  });

  it("limits caregiver lists to assigned monitored persons", async () => {
    prismaMock.monitoredPerson.findMany.mockResolvedValue([]);

    await listMonitoredPersons(caregiverUser);

    expect(prismaMock.monitoredPerson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          caregiverId: caregiverUser.id,
          isActive: true
        }
      })
    );
  });

  it("blocks caregivers from reading another caregiver's monitored person", async () => {
    prismaMock.monitoredPerson.findUnique.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000010",
      caregiverId: "00000000-0000-4000-8000-000000000099",
      isActive: true
    });

    await expect(
      getMonitoredPerson(caregiverUser, {
        params: {
          id: "00000000-0000-4000-8000-000000000010"
        }
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN"
    });
  });
});
