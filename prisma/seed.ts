import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.strategyItem.deleteMany();
  await prisma.strategy.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.eventCompany.deleteMany();
  await prisma.event.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // Create companies
  const [company1, company2, company3] = await Promise.all([
    prisma.company.create({
      data: {
        name: "TechVision",
        industry: "SaaS",
        website: "https://techvision.io",
        description: "B2B SaaS platform for project management",
        plan: "PRO",
      },
    }),
    prisma.company.create({
      data: {
        name: "GreenLeaf",
        industry: "E-commerce",
        website: "https://greenleaf.shop",
        description: "Sustainable fashion e-commerce",
        plan: "STARTER",
      },
    }),
    prisma.company.create({
      data: {
        name: "FinFlow",
        industry: "Fintech",
        website: "https://finflow.com",
        description: "Personal finance management app",
        plan: "FREE",
      },
    }),
  ]);

  console.log("Companies created");

  // Hash passwords
  const hashedPassword = await hashPassword("password123");

  // Create users with Better Auth credential accounts
  const createUserWithAuth = async (
    data: {
      name: string;
      email: string;
      role: "SUPER_ADMIN" | "ADMIN" | "CLIENT_ADMIN" | "CLIENT_MEMBER";
      companyId?: string;
    }
  ) => {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        companyId: data.companyId ?? null,
        emailVerified: true,
      },
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });

    return user;
  };

  // Fastlane team
  const superAdmin = await createUserWithAuth({
    name: "Admin Fastlane",
    email: "admin@fastlane.io",
    role: "SUPER_ADMIN",
  });

  const admin1 = await createUserWithAuth({
    name: "Marie Dupont",
    email: "team1@fastlane.io",
    role: "ADMIN",
  });

  const admin2 = await createUserWithAuth({
    name: "Lucas Martin",
    email: "team2@fastlane.io",
    role: "ADMIN",
  });

  // Company 1 users
  const c1Admin = await createUserWithAuth({
    name: "Sophie Bernard",
    email: "sophie@techvision.io",
    role: "CLIENT_ADMIN",
    companyId: company1.id,
  });

  const c1Member = await createUserWithAuth({
    name: "Thomas Petit",
    email: "thomas@techvision.io",
    role: "CLIENT_MEMBER",
    companyId: company1.id,
  });

  // Company 2 users
  const c2Admin = await createUserWithAuth({
    name: "Emma Laurent",
    email: "emma@greenleaf.shop",
    role: "CLIENT_ADMIN",
    companyId: company2.id,
  });

  await createUserWithAuth({
    name: "Hugo Moreau",
    email: "hugo@greenleaf.shop",
    role: "CLIENT_MEMBER",
    companyId: company2.id,
  });

  // Company 3 users
  const c3Admin = await createUserWithAuth({
    name: "Lea Dubois",
    email: "lea@finflow.com",
    role: "CLIENT_ADMIN",
    companyId: company3.id,
  });

  await createUserWithAuth({
    name: "Nathan Roux",
    email: "nathan@finflow.com",
    role: "CLIENT_MEMBER",
    companyId: company3.id,
  });

  console.log("Users created");

  // Create event
  const event = await prisma.event.create({
    data: {
      name: "Q1 2026 Growth Sprint",
      description: "Intensive 2-week growth hacking sprint targeting user acquisition and conversion optimization.",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-14"),
      status: "ACTIVE",
    },
  });

  // Link companies to event
  const [ec1, ec2, ec3] = await Promise.all([
    prisma.eventCompany.create({
      data: { eventId: event.id, companyId: company1.id },
    }),
    prisma.eventCompany.create({
      data: { eventId: event.id, companyId: company2.id },
    }),
    prisma.eventCompany.create({
      data: { eventId: event.id, companyId: company3.id },
    }),
  ]);

  console.log("Event created");

  // Create strategies
  const strategy1 = await prisma.strategy.create({
    data: {
      title: "Outbound Acquisition Strategy",
      description: "Multi-channel outbound approach targeting mid-market SaaS companies",
      content: { summary: "Focus on LinkedIn + cold email for top-of-funnel acquisition" },
      status: "APPROVED",
      version: 2,
      eventCompanyId: ec1.id,
    },
  });

  const strategy2 = await prisma.strategy.create({
    data: {
      title: "Social Commerce Growth Plan",
      description: "Instagram and TikTok-first approach to drive e-commerce sales",
      content: { summary: "Leverage UGC and influencer partnerships for organic growth" },
      status: "PENDING_REVIEW",
      version: 1,
      eventCompanyId: ec2.id,
    },
  });

  // Strategy items for strategy 1 (approved)
  await Promise.all([
    prisma.strategyItem.create({
      data: {
        title: "LinkedIn Cold Outreach",
        description: "Targeted connection requests + value-driven messages to 500 prospects/week",
        content: { channel: "LinkedIn", frequency: "Daily" },
        order: 0,
        status: "APPROVED",
        strategyId: strategy1.id,
      },
    }),
    prisma.strategyItem.create({
      data: {
        title: "Cold Email Sequence",
        description: "5-email sequence with personalized openers, targeting CTOs and VPs of Engineering",
        content: { channel: "Email", emails: 5 },
        order: 1,
        status: "APPROVED",
        strategyId: strategy1.id,
      },
    }),
    prisma.strategyItem.create({
      data: {
        title: "Webinar Funnel",
        description: "Monthly webinar on project management best practices to generate MQLs",
        content: { channel: "Webinar", frequency: "Monthly" },
        order: 2,
        status: "APPROVED",
        strategyId: strategy1.id,
      },
    }),
  ]);

  // Strategy items for strategy 2 (pending review)
  await Promise.all([
    prisma.strategyItem.create({
      data: {
        title: "Instagram Reels Campaign",
        description: "Daily reels showcasing sustainable fashion styling tips",
        content: { platform: "Instagram", format: "Reels" },
        order: 0,
        status: "PENDING",
        strategyId: strategy2.id,
      },
    }),
    prisma.strategyItem.create({
      data: {
        title: "Micro-Influencer Partnerships",
        description: "Partner with 20 eco-conscious micro-influencers (10k-50k followers)",
        content: { platform: "Instagram/TikTok", count: 20 },
        order: 1,
        status: "PENDING",
        strategyId: strategy2.id,
      },
    }),
    prisma.strategyItem.create({
      data: {
        title: "TikTok Shop Integration",
        description: "Set up TikTok Shop and create shoppable video content",
        content: { platform: "TikTok", type: "Shop" },
        order: 2,
        status: "PENDING",
        strategyId: strategy2.id,
      },
    }),
  ]);

  console.log("Strategies created");

  // Create deliverables
  const [deliverable1, deliverable2, deliverable3] = await Promise.all([
    prisma.deliverable.create({
      data: {
        title: "Cold Email Template - CTO Outreach",
        description: "Personalized cold email template targeting CTOs at mid-market SaaS companies",
        type: "EMAIL_TEMPLATE",
        status: "APPROVED",
        version: 2,
        content: {
          subject: "Quick question about {{company_name}}'s engineering workflow",
          body: "Hi {{first_name}},\n\nI noticed {{company_name}} recently...",
        },
        eventCompanyId: ec1.id,
      },
    }),
    prisma.deliverable.create({
      data: {
        title: "Instagram Ad Creatives - Spring Collection",
        description: "Set of 5 ad creatives for the spring sustainable fashion collection",
        type: "AD_CREATIVE",
        status: "IN_REVIEW",
        version: 1,
        content: { format: "1080x1080", count: 5 },
        eventCompanyId: ec2.id,
      },
    }),
    prisma.deliverable.create({
      data: {
        title: "Landing Page - Free Trial Signup",
        description: "High-converting landing page for the free trial signup flow",
        type: "LANDING_PAGE",
        status: "DRAFT",
        version: 1,
        content: {
          sections: ["hero", "social-proof", "features", "pricing", "faq", "cta"],
        },
        eventCompanyId: ec3.id,
      },
    }),
  ]);

  console.log("Deliverables created");

  // Create comments
  await Promise.all([
    prisma.comment.create({
      data: {
        content: "Great strategy! The LinkedIn approach should work well for our target market.",
        authorId: c1Admin.id,
        strategyId: strategy1.id,
      },
    }),
    prisma.comment.create({
      data: {
        content: "I love the email template. Can we add a case study link in the follow-up?",
        authorId: c1Admin.id,
        deliverableId: deliverable1.id,
      },
    }),
    prisma.comment.create({
      data: {
        content: "Sure! I'll add a link to the TechVision case study in email #3.",
        authorId: admin1.id,
        deliverableId: deliverable1.id,
      },
    }),
    prisma.comment.create({
      data: {
        content: "The ad creatives look great but could we use more earthy tones to match our brand?",
        authorId: c2Admin.id,
        deliverableId: deliverable2.id,
      },
    }),
  ]);

  console.log("Comments created");

  // Create activities
  await Promise.all([
    prisma.activity.create({
      data: {
        type: "STRATEGY_CREATED",
        message: 'created strategy "Outbound Acquisition Strategy"',
        userId: admin1.id,
        strategyId: strategy1.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: "STRATEGY_APPROVED",
        message: 'approved strategy "Outbound Acquisition Strategy"',
        userId: c1Admin.id,
        strategyId: strategy1.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: "STRATEGY_CREATED",
        message: 'created strategy "Social Commerce Growth Plan"',
        userId: admin2.id,
        strategyId: strategy2.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: "STRATEGY_SUBMITTED",
        message: 'submitted strategy "Social Commerce Growth Plan" for review',
        userId: admin2.id,
        strategyId: strategy2.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: "DELIVERABLE_CREATED",
        message: 'created deliverable "Cold Email Template - CTO Outreach"',
        userId: admin1.id,
        deliverableId: deliverable1.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: "DELIVERABLE_APPROVED",
        message: 'approved deliverable "Cold Email Template - CTO Outreach"',
        userId: c1Admin.id,
        deliverableId: deliverable1.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: "DELIVERABLE_SUBMITTED",
        message: 'submitted "Instagram Ad Creatives - Spring Collection" for review',
        userId: admin2.id,
        deliverableId: deliverable2.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: "COMMENT_ADDED",
        message: "commented on Instagram Ad Creatives",
        userId: c2Admin.id,
        deliverableId: deliverable2.id,
      },
    }),
  ]);

  console.log("Activities created");

  // Create notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        title: "Strategy submitted for review",
        message: 'The "Social Commerce Growth Plan" strategy is ready for your review.',
        link: `/portal/strategy/${strategy2.id}`,
        userId: c2Admin.id,
      },
    }),
    prisma.notification.create({
      data: {
        title: "Deliverable submitted",
        message: '"Instagram Ad Creatives - Spring Collection" is ready for review.',
        link: `/portal/deliverables/${deliverable2.id}`,
        userId: c2Admin.id,
      },
    }),
    prisma.notification.create({
      data: {
        title: "Strategy approved",
        message: 'TechVision approved the "Outbound Acquisition Strategy".',
        link: `/admin/events/${event.id}`,
        userId: admin1.id,
      },
    }),
    prisma.notification.create({
      data: {
        title: "New comment",
        message: "Sophie commented on the cold email template.",
        link: `/admin/events/${event.id}`,
        userId: admin1.id,
        read: true,
      },
    }),
  ]);

  console.log("Notifications created");
  console.log("Seed completed!");
  console.log("");
  console.log("Test accounts:");
  console.log("  Admin:  admin@fastlane.io / password123");
  console.log("  Team:   team1@fastlane.io / password123");
  console.log("  Client: sophie@techvision.io / password123");
  console.log("  Client: emma@greenleaf.shop / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
