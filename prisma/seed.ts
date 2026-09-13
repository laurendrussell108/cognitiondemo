import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Stand-ins for IdP accounts while AUTH_PROVIDER=mock. */
const USERS = [
  { subject: "mock|venus", email: "venus.admin@example.com", name: "Venus", role: "admin" },
  { subject: "mock|lauren", email: "lauren.viewer@example.com", name: "Lauren", role: "viewer" },
  { subject: "mock|sara", email: "sara.viewer@example.com", name: "Sara", role: "viewer" },
];

const FLAGS = [
  {
    name: "instant-payouts",
    description: "Route eligible payouts through the instant rail",
    enabled: true,
    rolloutPercentage: 25,
    environment: "production",
  },
  {
    name: "kyc-auto-approve",
    description: "Auto-approve low-risk KYC reviews",
    enabled: false,
    rolloutPercentage: 0,
    environment: "staging",
  },
  {
    name: "new-refunds-dashboard",
    description: "Serve the rebuilt refunds dashboard",
    enabled: true,
    rolloutPercentage: 100,
    environment: "development",
  },
];

async function main() {
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { subject: user.subject },
      update: { email: user.email, name: user.name, role: user.role },
      create: user,
    });
  }

  const [admin] = USERS;
  for (const flag of FLAGS) {
    await prisma.featureFlag.upsert({
      where: { name_environment: { name: flag.name, environment: flag.environment } },
      update: {},
      create: { ...flag, createdBy: admin.email },
    });
  }

  console.log(`Seeded ${USERS.length} users and ${FLAGS.length} feature flags.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
