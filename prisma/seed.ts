import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

// Sample data arrays
const firmNames = [
  "Papadopoulos & Associates",
  "Legal Excellence Group",
  "Athens Law Firm",
  "Mediterranean Legal Services",
  "Hellenic Attorneys",
];

const firstNames = [
  "Dimitris", "Maria", "Giorgos", "Elena", "Nikos", "Sofia", "Kostas", "Anna",
  "Yannis", "Christina", "Petros", "Despina", "Andreas", "Ioanna", "Stavros"
];

const lastNames = [
  "Papadopoulos", "Georgiou", "Dimitriou", "Nikolaou", "Antoniou",
  "Kostas", "Petrou", "Ioannou", "Andreou", "Christou"
];

const companies = [
  "Tech Solutions Ltd", "Global Industries", "Mediterranean Trading",
  "Athens Real Estate", "Hellenic Shipping", "Digital Ventures",
  "Construction Group", "Financial Services", "Healthcare Systems"
];

const leadDescriptions = [
  "Need help with contract dispute regarding payment terms",
  "Looking for representation in employment law case",
  "Require assistance with real estate transaction",
  "Need advice on intellectual property rights",
  "Seeking help with family law matter",
  "Contract negotiation support needed",
  "Legal consultation for business formation",
  "Assistance with regulatory compliance",
];

const matterTitles = [
  "Contract Dispute Resolution",
  "Employment Law Case",
  "Real Estate Transaction",
  "IP Rights Protection",
  "Family Law Matter",
  "Business Formation",
  "Regulatory Compliance",
  "Merger & Acquisition",
];

const documentTypes = [
  "Contract", "Agreement", "Legal Brief", "Court Filing", "Correspondence",
  "Invoice", "Receipt", "Certificate", "License", "Permit"
];

// Helper functions
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function generateEmail(name: string, usedEmails: Set<string>, counter?: number): string {
  const cleanName = name.toLowerCase().replace(/\s+/g, ".");
  const suffix = counter !== undefined ? counter : Math.floor(Math.random() * 100000);
  const email = `${cleanName}.${suffix}@example.com`;
  
  if (usedEmails.has(email)) {
    // If email exists, try with a different counter
    return generateEmail(name, usedEmails, suffix + 1);
  }
  
  usedEmails.add(email);
  return email;
}

function generatePhone(): string {
  return `+30${randomInt(6900000000, 6999999999)}`;
}

function generateClerkId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Track used emails to ensure uniqueness
  const usedEmails = new Set<string>();

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Cleaning existing data...");
  await prisma.deadline.deleteMany();
  await prisma.document.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.matter.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();
  await prisma.firm.deleteMany();
  await prisma.newsletterSignup.deleteMany();
  await prisma.auditRequest.deleteMany();
  await prisma.contactSubmission.deleteMany();
  await prisma.consultationRequest.deleteMany();

  // Create Firms
  console.log("🏢 Creating firms...");
  const firms = [];
  for (let i = 0; i < firmNames.length; i++) {
    const firm = await prisma.firm.create({
      data: {
        clerkOrgId: generateClerkId("org"),
        name: firmNames[i],
        stripeConnectAccountId: i < 2 ? `acct_${Math.random().toString(36).substring(2, 15)}` : null,
        stripeConnectOnboardingCompleted: i < 2,
      },
    });
    firms.push(firm);
  }

  // Create Users for each firm
  console.log("👥 Creating users...");
  const users = [];
  for (const firm of firms) {
    const numUsers = randomInt(2, 4);
    for (let i = 0; i < numUsers; i++) {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const name = `${firstName} ${lastName}`;
      const user = await prisma.user.create({
        data: {
          clerkUserId: generateClerkId("user"),
          clerkOrgId: firm.clerkOrgId,
          email: generateEmail(name, usedEmails),
          name: name,
          role: i === 0 ? "ADMIN" : randomElement(["ATTORNEY", "PARALEGAL"]),
        },
      });
      users.push(user);
    }
  }

  // Create Leads
  console.log("📋 Creating leads...");
  const leads = [];
  for (const firm of firms) {
    const numLeads = randomInt(5, 15);
    for (let i = 0; i < numLeads; i++) {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const name = `${firstName} ${lastName}`;
      const status = randomElement(["NEW", "CONTACTED", "CONVERTED", "LOST"]);
      
      const lead = await prisma.lead.create({
        data: {
          clerkOrgId: firm.clerkOrgId,
          name: name,
          email: generateEmail(name, usedEmails),
          phone: Math.random() > 0.3 ? generatePhone() : null,
          description: randomElement(leadDescriptions),
          status: status as any,
          source: randomElement(["Website Form", "Facebook Ads", "Organic", "Referral", "Google Ads"]),
          value: Math.random() > 0.3 ? randomFloat(500, 50000) : null,
          priorityScore: randomInt(1, 10),
          aiSummary: `High priority ${status.toLowerCase()} lead requiring immediate attention`,
          notes: Math.random() > 0.5 ? "Follow up scheduled for next week" : null,
        },
      });
      leads.push(lead);
    }
  }

  // Create Matters
  console.log("⚖️ Creating matters...");
  const matters = [];
  for (const firm of firms) {
    const numMatters = randomInt(3, 8);
    for (let i = 0; i < numMatters; i++) {
      const matter = await prisma.matter.create({
        data: {
          clerkOrgId: firm.clerkOrgId,
          title: randomElement(matterTitles),
          description: `Legal matter involving ${randomElement(companies)}`,
          status: randomElement(["ACTIVE", "CLOSED", "ON_HOLD"]) as any,
          billingType: randomElement(["Fixed", "Hourly"]),
          deadline: Math.random() > 0.4 ? randomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) : null,
        },
      });
      matters.push(matter);

      // Convert some leads to this matter
      const firmLeads = leads.filter(l => l.clerkOrgId === firm.clerkOrgId && l.status === "NEW");
      if (firmLeads.length > 0 && Math.random() > 0.5) {
        const leadToConvert = randomElement(firmLeads);
        await prisma.lead.update({
          where: { id: leadToConvert.id },
          data: {
            status: "CONVERTED",
            convertedToMatterId: matter.id,
          },
        });
      }
    }
  }

  // Create Invoices
  console.log("💰 Creating invoices...");
  for (const firm of firms) {
    const firmMatters = matters.filter(m => m.clerkOrgId === firm.clerkOrgId);
    const firmLeads = leads.filter(l => l.clerkOrgId === firm.clerkOrgId);
    
    const numInvoices = randomInt(5, 15);
    for (let i = 0; i < numInvoices; i++) {
      const isMatterInvoice = Math.random() > 0.3 && firmMatters.length > 0;
      const matter = isMatterInvoice ? randomElement(firmMatters) : null;
      const lead = !isMatterInvoice && firmLeads.length > 0 ? randomElement(firmLeads) : null;
      
      const status = randomElement(["DRAFT", "UNPAID", "PAID", "OVERDUE", "CANCELLED"]);
      const dueDate = randomDate(new Date(), new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
      
      await prisma.invoice.create({
        data: {
          clerkOrgId: firm.clerkOrgId,
          matterId: matter?.id,
          leadId: lead?.id,
          amount: randomFloat(100, 10000),
          status: status as any,
          dueDate: dueDate,
          paidAt: status === "PAID" ? randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()) : null,
          description: `Legal services for ${matter?.title || "consultation"}`,
          customerEmail: generateEmail(randomElement(firstNames) + " " + randomElement(lastNames), usedEmails),
        },
      });
    }
  }

  // Create Documents
  console.log("📄 Creating documents...");
  for (const firm of firms) {
    const firmMatters = matters.filter(m => m.clerkOrgId === firm.clerkOrgId);
    
    const numDocuments = randomInt(10, 25);
    for (let i = 0; i < numDocuments; i++) {
      const matter = firmMatters.length > 0 && Math.random() > 0.3 ? randomElement(firmMatters) : null;
      
      await prisma.document.create({
        data: {
          clerkOrgId: firm.clerkOrgId,
          matterId: matter?.id,
          fileName: `${randomElement(documentTypes)}_${randomInt(1, 1000)}.pdf`,
          fileUrl: `https://storage.example.com/files/${Math.random().toString(36).substring(2, 15)}.pdf`,
          fileSize: randomInt(10000, 5000000),
          fileType: "application/pdf",
          aiAnalysis: {
            summary: "Document contains important legal information",
            deadlines: ["2024-12-31"],
            parties: ["Party A", "Party B"],
            urgency: randomInt(1, 10),
          },
        },
      });
    }
  }

  // Create Deadlines
  console.log("⏰ Creating deadlines...");
  for (const firm of firms) {
    const firmMatters = matters.filter(m => m.clerkOrgId === firm.clerkOrgId);
    const firmDocuments = await prisma.document.findMany({
      where: { clerkOrgId: firm.clerkOrgId },
    });
    
    const numDeadlines = randomInt(5, 15);
    for (let i = 0; i < numDeadlines; i++) {
      const matter = firmMatters.length > 0 ? randomElement(firmMatters) : null;
      const document = firmDocuments.length > 0 && Math.random() > 0.5 ? randomElement(firmDocuments) : null;
      
      const dueDate = randomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
      const isOverdue = dueDate < new Date() && Math.random() > 0.7;
      
      await prisma.deadline.create({
        data: {
          clerkOrgId: firm.clerkOrgId,
          matterId: matter?.id,
          documentId: document?.id,
          title: randomElement([
            "Court Hearing",
            "Document Filing",
            "Contract Review",
            "Response Deadline",
            "Appeal Deadline",
            "Discovery Deadline",
          ]),
          dueDate: dueDate,
          description: `Important deadline for ${matter?.title || "legal matter"}`,
          status: isOverdue ? "OVERDUE" : randomElement(["PENDING", "COMPLETED", "CANCELLED"]) as any,
        },
      });
    }
  }

  // Create Consultation Requests
  console.log("📞 Creating consultation requests...");
  for (let i = 0; i < 20; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const name = `${firstName} ${lastName}`;
    
    await prisma.consultationRequest.create({
      data: {
        name: name,
        email: generateEmail(name, usedEmails),
        company: randomElement(companies),
        phone: Math.random() > 0.3 ? generatePhone() : null,
      },
    });
  }

  // Create Contact Submissions
  console.log("✉️ Creating contact submissions...");
  for (let i = 0; i < 15; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const name = `${firstName} ${lastName}`;
    
    await prisma.contactSubmission.create({
      data: {
        name: name,
        email: generateEmail(name, usedEmails),
        company: Math.random() > 0.3 ? randomElement(companies) : null,
        message: `I am interested in learning more about your legal services. ${randomElement(leadDescriptions)}`,
      },
    });
  }

  // Create Audit Requests
  console.log("🔍 Creating audit requests...");
  for (let i = 0; i < 10; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const name = `${firstName} ${lastName}`;
    
    await prisma.auditRequest.create({
      data: {
        website: `https://${randomElement(companies).toLowerCase().replace(/\s+/g, "")}.com`,
        name: name,
        email: generateEmail(name, usedEmails),
      },
    });
  }

  // Create Newsletter Signups
  console.log("📧 Creating newsletter signups...");
  for (let i = 0; i < 30; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const name = `${firstName} ${lastName}`;
    
    await prisma.newsletterSignup.create({
      data: {
        email: generateEmail(name, usedEmails),
      },
    });
  }

  console.log("✅ Database seed completed successfully!");
  console.log(`\n📊 Summary:`);
  console.log(`   - Firms: ${firms.length}`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Leads: ${leads.length}`);
  console.log(`   - Matters: ${matters.length}`);
  console.log(`   - Invoices: ${await prisma.invoice.count()}`);
  console.log(`   - Documents: ${await prisma.document.count()}`);
  console.log(`   - Deadlines: ${await prisma.deadline.count()}`);
  console.log(`   - Consultation Requests: ${await prisma.consultationRequest.count()}`);
  console.log(`   - Contact Submissions: ${await prisma.contactSubmission.count()}`);
  console.log(`   - Audit Requests: ${await prisma.auditRequest.count()}`);
  console.log(`   - Newsletter Signups: ${await prisma.newsletterSignup.count()}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

