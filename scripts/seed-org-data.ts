import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

// Sample data arrays
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
    return generateEmail(name, usedEmails, suffix + 1);
  }
  
  usedEmails.add(email);
  return email;
}

function generatePhone(): string {
  return `+30${randomInt(6900000000, 6999999999)}`;
}

async function main() {
  console.log("🌱 Starting organization data seed...\n");

  // Get organization ID from command line or use the one from the image
  const orgId = process.argv[2] || "org_33yvgySC4wEK1MLWoSAZmHpfTPI";
  
  console.log(`📋 Targeting organization: ${orgId}\n`);

  // Check if organization exists
  const firm = await prisma.firm.findUnique({
    where: { clerkOrgId: orgId },
    include: {
      users: true,
      leads: true,
      matters: true,
      invoices: true,
      documents: true,
      deadlines: true,
    },
  });

  if (!firm) {
    console.error(`❌ Organization ${orgId} not found in database.`);
    console.log("\nAvailable organizations:");
    const allFirms = await prisma.firm.findMany({
      select: { clerkOrgId: true, name: true },
    });
    allFirms.forEach((f) => {
      console.log(`  - ${f.clerkOrgId} (${f.name})`);
    });
    process.exit(1);
  }

  console.log(`✅ Found organization: ${firm.name}`);
  console.log(`   Existing data:`);
  console.log(`   - Users: ${firm.users.length}`);
  console.log(`   - Leads: ${firm.leads.length}`);
  console.log(`   - Matters: ${firm.matters.length}`);
  console.log(`   - Invoices: ${firm.invoices.length}`);
  console.log(`   - Documents: ${firm.documents.length}`);
  console.log(`   - Deadlines: ${firm.deadlines.length}\n`);

  // Ask if user wants to clear existing data
  const clearData = process.argv[3] === "--clear" || process.argv[3] === "-c";
  
  if (clearData) {
    console.log("🧹 Clearing existing data for this organization...");
    await prisma.deadline.deleteMany({ where: { clerkOrgId: orgId } });
    await prisma.document.deleteMany({ where: { clerkOrgId: orgId } });
    await prisma.invoice.deleteMany({ where: { clerkOrgId: orgId } });
    await prisma.matter.deleteMany({ where: { clerkOrgId: orgId } });
    await prisma.lead.deleteMany({ where: { clerkOrgId: orgId } });
    console.log("✅ Cleared existing data\n");
  }

  const usedEmails = new Set<string>();

  // Create Leads
  console.log("📋 Creating leads...");
  const leads = [];
  const numLeads = randomInt(10, 20);
  for (let i = 0; i < numLeads; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const name = `${firstName} ${lastName}`;
    const status = randomElement(["NEW", "CONTACTED", "CONVERTED", "LOST"]);
    
    const lead = await prisma.lead.create({
      data: {
        clerkOrgId: orgId,
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
  console.log(`✅ Created ${leads.length} leads\n`);

  // Create Matters
  console.log("⚖️ Creating matters...");
  const matters = [];
  const numMatters = randomInt(5, 12);
  for (let i = 0; i < numMatters; i++) {
    const matter = await prisma.matter.create({
      data: {
        clerkOrgId: orgId,
        title: randomElement(matterTitles),
        description: `Legal matter involving ${randomElement(companies)}`,
        status: randomElement(["ACTIVE", "CLOSED", "ON_HOLD"]) as any,
        billingType: randomElement(["Fixed", "Hourly"]),
        deadline: Math.random() > 0.4 ? randomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) : null,
      },
    });
    matters.push(matter);

    // Convert some leads to this matter
    const newLeads = leads.filter(l => l.status === "NEW" && !l.convertedToMatterId);
    if (newLeads.length > 0 && Math.random() > 0.5) {
      const leadToConvert = randomElement(newLeads);
      await prisma.lead.update({
        where: { id: leadToConvert.id },
        data: {
          status: "CONVERTED",
          convertedToMatterId: matter.id,
        },
      });
    }
  }
  console.log(`✅ Created ${matters.length} matters\n`);

  // Create Invoices
  console.log("💰 Creating invoices...");
  const numInvoices = randomInt(8, 20);
  for (let i = 0; i < numInvoices; i++) {
    const isMatterInvoice = Math.random() > 0.3 && matters.length > 0;
    const matter = isMatterInvoice ? randomElement(matters) : null;
    const lead = !isMatterInvoice && leads.length > 0 ? randomElement(leads) : null;
    
    const status = randomElement(["DRAFT", "UNPAID", "PAID", "OVERDUE", "CANCELLED"]);
    const dueDate = randomDate(new Date(), new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
    
    await prisma.invoice.create({
      data: {
        clerkOrgId: orgId,
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
  console.log(`✅ Created ${numInvoices} invoices\n`);

  // Create Documents
  console.log("📄 Creating documents...");
  const numDocuments = randomInt(15, 30);
  for (let i = 0; i < numDocuments; i++) {
    const matter = matters.length > 0 && Math.random() > 0.3 ? randomElement(matters) : null;
    
    await prisma.document.create({
      data: {
        clerkOrgId: orgId,
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
  console.log(`✅ Created ${numDocuments} documents\n`);

  // Create Deadlines
  console.log("⏰ Creating deadlines...");
  const firmDocuments = await prisma.document.findMany({
    where: { clerkOrgId: orgId },
  });
  
  const numDeadlines = randomInt(8, 18);
  for (let i = 0; i < numDeadlines; i++) {
    const matter = matters.length > 0 ? randomElement(matters) : null;
    const document = firmDocuments.length > 0 && Math.random() > 0.5 ? randomElement(firmDocuments) : null;
    
    const dueDate = randomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
    const isOverdue = dueDate < new Date() && Math.random() > 0.7;
    
    await prisma.deadline.create({
      data: {
        clerkOrgId: orgId,
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
  console.log(`✅ Created ${numDeadlines} deadlines\n`);

  // Summary
  const finalCounts = await prisma.firm.findUnique({
    where: { clerkOrgId: orgId },
    include: {
      _count: {
        select: {
          leads: true,
          matters: true,
          invoices: true,
          documents: true,
          deadlines: true,
        },
      },
    },
  });

  console.log("✅ Organization data seed completed successfully!");
  console.log(`\n📊 Final Summary for ${firm.name}:`);
  console.log(`   - Leads: ${finalCounts?._count.leads || 0}`);
  console.log(`   - Matters: ${finalCounts?._count.matters || 0}`);
  console.log(`   - Invoices: ${finalCounts?._count.invoices || 0}`);
  console.log(`   - Documents: ${finalCounts?._count.documents || 0}`);
  console.log(`   - Deadlines: ${finalCounts?._count.deadlines || 0}\n`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding organization data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

