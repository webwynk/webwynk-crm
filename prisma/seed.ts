/// <reference types="node" />
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding WebWynk CRM database...\n");

  // ─── Admin Account ───────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@WebWynk2025", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@webwynk.com" },
    update: {},
    create: {
      name: "WebWynk Admin",
      email: "admin@webwynk.com",
      password: adminPassword,
      role: "ADMIN",
      designation: "System Administrator",
      isFirstLogin: false,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ─── HR Account ──────────────────────────────────────
  const hrPassword = await bcrypt.hash("HR@WebWynk2025", 10);
  const hr = await prisma.user.upsert({
    where: { email: "hr@webwynk.com" },
    update: {},
    create: {
      name: "HR Manager",
      email: "hr@webwynk.com",
      password: hrPassword,
      role: "HR",
      designation: "HR Manager",
      isFirstLogin: false,
    },
  });
  console.log(`✅ HR: ${hr.email}`);

  // ─── Sample Employee ─────────────────────────────────
  const empPassword = await bcrypt.hash("Emp@WebWynk2025", 10);
  const employee = await prisma.user.upsert({
    where: { email: "employee@webwynk.com" },
    update: {},
    create: {
      name: "John Developer",
      email: "employee@webwynk.com",
      password: empPassword,
      role: "EMPLOYEE",
      designation: "Full Stack Developer",
      phone: "+91 9876543210",
      isFirstLogin: false,
    },
  });
  console.log(`✅ Employee: ${employee.email}`);

  // ─── Sample Project ──────────────────────────────────
  const project = await prisma.project.upsert({
    where: { id: "sample-project-001" },
    update: {},
    create: {
      id: "sample-project-001",
      title: "WebWynk Official Website Redesign",
      description: "Complete redesign of the WebWynk agency website with modern UI.",
      clientName: "WebWynk Agency",
      clientEmail: "contact@webwynk.com",
      type: "WEBSITE_DEVELOPMENT",
      status: "IN_PROGRESS",
      progress: 35,
      startDate: new Date("2025-05-01"),
      dueDate: new Date("2025-07-01"),
      createdById: admin.id,
    },
  });

  // Assign employee to project
  await prisma.projectAssignment.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: employee.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: employee.id,
    },
  });
  console.log(`✅ Project: "${project.title}" created & assigned`);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 Database seeded successfully!\n");
  console.log("Login credentials:");
  console.log("  Admin    → admin@webwynk.com    / Admin@WebWynk2025");
  console.log("  HR       → hr@webwynk.com       / HR@WebWynk2025");
  console.log("  Employee → employee@webwynk.com / Emp@WebWynk2025");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⚠️  Change all passwords after first login!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
