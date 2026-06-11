import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  monitoredPerson: {
    findUnique: vi.fn()
  },
  alert: {
    findMany: vi.fn()
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

vi.mock("../src/sockets/socket.events.js", () => ({
  socketEvents: {
    alertCreated: vi.fn(),
    alertResolved: vi.fn()
  }
}));

import { exportAlertsCsv } from "../src/services/alert.service.js";
import type { AuthUser } from "../src/types/auth.js";

const adminUser: AuthUser = {
  id: "00000000-0000-4000-8000-000000000002",
  email: "admin@example.com",
  fullName: "Demo Admin",
  role: "ADMIN"
};

const caregiverUser: AuthUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "caregiver@example.com",
  fullName: "Demo Caregiver",
  role: "CAREGIVER"
};

describe("alert CSV export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports CSV headers and escapes comma, quote, and newline values", async () => {
    prismaMock.alert.findMany.mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000050",
        monitoredPersonId: "00000000-0000-4000-8000-000000000010",
        detectionEventId: "00000000-0000-4000-8000-000000000040",
        status: "ACTIVE",
        severity: "CRITICAL",
        title: 'Fall, "critical"',
        message: "No response\nEscalated",
        createdAt: new Date("2026-06-11T10:00:00.000Z"),
        resolvedAt: null,
        resolvedById: null,
        resolutionNote: null
      }
    ]);

    const csv = await exportAlertsCsv(adminUser, {
      query: {}
    });

    expect(csv).toContain(
      "id,monitoredPersonId,detectionEventId,status,severity,title,message,createdAt,resolvedAt,resolvedById,resolutionNote"
    );
    expect(csv).toContain('"Fall, ""critical"""');
    expect(csv).toContain('"No response\nEscalated"');
    expect(csv).toContain("2026-06-11T10:00:00.000Z");
  });

  it("scopes caregiver CSV exports to their assigned monitored persons", async () => {
    prismaMock.alert.findMany.mockResolvedValue([]);

    await exportAlertsCsv(caregiverUser, {
      query: {
        status: "ACTIVE",
        severity: "HIGH"
      }
    });

    expect(prismaMock.alert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "ACTIVE",
          severity: "HIGH",
          monitoredPerson: {
            caregiverId: caregiverUser.id
          }
        })
      })
    );
  });

  it("verifies monitored person access before exporting a filtered caregiver CSV", async () => {
    prismaMock.monitoredPerson.findUnique.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000010",
      caregiverId: caregiverUser.id,
      isActive: true
    });
    prismaMock.alert.findMany.mockResolvedValue([]);

    await exportAlertsCsv(caregiverUser, {
      query: {
        monitoredPersonId: "00000000-0000-4000-8000-000000000010"
      }
    });

    expect(prismaMock.monitoredPerson.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "00000000-0000-4000-8000-000000000010"
        }
      })
    );
  });
});
