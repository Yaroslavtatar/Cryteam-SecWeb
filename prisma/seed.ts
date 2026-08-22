import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { scenarios } from "../src/lib/scenarios";

// Демо-данные для CRYTEAM SecWeb (на русском языке).

const prisma = new PrismaClient();

const seedAdmin = {
  email: process.env.ADMIN_EMAIL ?? "admin@cryteam.local",
  password: process.env.ADMIN_PASSWORD ?? "Admin#SecWeb2026",
  name: process.env.ADMIN_NAME ?? "Главный администратор",
};

async function hash(plain: string) {
  return bcrypt.hash(plain, 12);
}

async function main() {
  console.log("Заполнение базы данных демо-данными…");

  // --- Администратор ---
  const admin = await prisma.user.upsert({
    where: { email: seedAdmin.email },
    update: {},
    create: {
      email: seedAdmin.email,
      fullName: seedAdmin.name,
      passwordHash: await hash(seedAdmin.password),
      role: "ADMIN",
    },
  });
  console.log(`  Администратор: ${admin.email}`);

  // --- Демо-ученик ---
  const student = await prisma.user.upsert({
    where: { email: "student@cryteam.local" },
    update: {},
    create: {
      email: "student@cryteam.local",
      fullName: "Иван Петров",
      passwordHash: await hash("Student#SecWeb2026"),
      role: "STUDENT",
    },
  });
  console.log(`  Ученик: ${student.email}`);

  // --- Второй ученик (для наглядности в админке) ---
  await prisma.user.upsert({
    where: { email: "maria@cryteam.local" },
    update: {},
    create: {
      email: "maria@cryteam.local",
      fullName: "Мария Соколова",
      passwordHash: await hash("Student#SecWeb2026"),
      role: "STUDENT",
    },
  });

  // --- Модули и шаги схем из сценариев ---
  for (const scenario of scenarios) {
    const module = await prisma.module.upsert({
      where: { slug: scenario.slug },
      update: {
        title: scenario.title,
        summary: scenario.summary,
        category: scenario.category,
        difficulty: scenario.difficulty,
        scenarioKey: scenario.key,
        estimatedMin: scenario.estimatedMin,
        order: scenario.order,
        authorId: admin.id,
      },
      create: {
        slug: scenario.slug,
        title: scenario.title,
        summary: scenario.summary,
        category: scenario.category,
        difficulty: scenario.difficulty,
        scenarioKey: scenario.key,
        estimatedMin: scenario.estimatedMin,
        order: scenario.order,
        authorId: admin.id,
      },
    });

    // Пересоздаём шаги, чтобы они всегда соответствовали сценарию.
    await prisma.schemeStep.deleteMany({ where: { moduleId: module.id } });
    await prisma.schemeStep.createMany({
      data: scenario.steps.map((step) => ({
        moduleId: module.id,
        order: step.order,
        title: step.title,
        description: step.description,
        fromNode: step.from,
        toNode: step.to,
        packetLabel: step.packetLabel,
        outcome: step.outcome,
      })),
    });
    console.log(`  Модуль: ${scenario.title} (${scenario.steps.length} шагов)`);
  }

  // --- Прогресс демо-ученика ---
  const firstModule = await prisma.module.findFirst({
    orderBy: { order: "asc" },
  });
  if (firstModule) {
    await prisma.progress.upsert({
      where: {
        userId_moduleId: { userId: student.id, moduleId: firstModule.id },
      },
      update: { status: "completed", lastStep: firstModule.estimatedMin, completedAt: new Date() },
      create: {
        userId: student.id,
        moduleId: firstModule.id,
        status: "completed",
        lastStep: 5,
        completedAt: new Date(),
      },
    });
  }

  // --- Демонстрационные записи журнала аудита ---
  await prisma.auditLog.createMany({
    data: [
      {
        action: "LOGIN_SUCCESS",
        severity: "info",
        message: `Успешный вход администратора ${admin.email}.`,
        userId: admin.id,
        ip: "127.0.0.1",
      },
      {
        action: "LOGIN_FAILED",
        severity: "warning",
        message: "Неудачная попытка входа: неверный пароль.",
        targetEmail: "student@cryteam.local",
        ip: "203.0.113.10",
      },
      {
        action: "RATE_LIMITED",
        severity: "critical",
        message: "Превышен лимит попыток входа — возможен подбор пароля (brute-force).",
        targetEmail: "unknown@evil.example",
        ip: "198.51.100.7",
      },
    ],
  });

  console.log("Готово. База данных заполнена.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
