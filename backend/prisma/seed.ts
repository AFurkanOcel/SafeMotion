import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "StrongPassword123!";
const PASSWORD_SALT_ROUNDS = 12;

const demoUsers = [
  {
    email: "admin@example.com",
    fullName: "Demo Admin",
    role: UserRole.ADMIN
  },
  {
    email: "caregiver@example.com",
    fullName: "Demo Caregiver",
    role: UserRole.CAREGIVER
  }
];

const main = async () => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, PASSWORD_SALT_ROUNDS);

  const [admin, caregiver] = await Promise.all(
    demoUsers.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          fullName: user.fullName,
          role: user.role,
          isActive: true
        },
        create: {
          ...user,
          passwordHash,
          isActive: true
        }
      })
    )
  );

  await prisma.monitoredPerson.upsert({
    where: { id: "11111111-1111-4111-8111-111111111111" },
    update: {
      displayName: "Demo Patient",
      notes: "Demo monitored person for dashboard and mobile pairing tests.",
      caregiverId: caregiver.id,
      createdById: admin.id,
      isActive: true
    },
    create: {
      id: "11111111-1111-4111-8111-111111111111",
      displayName: "Demo Patient",
      notes: "Demo monitored person for dashboard and mobile pairing tests.",
      caregiverId: caregiver.id,
      createdById: admin.id,
      isActive: true
    }
  });

  console.log("Demo seed completed.");
  console.log("Admin login: admin@example.com / StrongPassword123!");
  console.log("Caregiver login: caregiver@example.com / StrongPassword123!");
};

main()
  .catch((error) => {
    console.error("Demo seed failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
