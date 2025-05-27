import { 
  businesses, users, clients, services, jobs, estimates, invoices, timeEntries,
  type Business, type InsertBusiness,
  type User, type InsertUser,
  type Client, type InsertClient,
  type Service, type InsertService,
  type Job, type InsertJob,
  type Estimate, type InsertEstimate,
  type Invoice, type InsertInvoice,
  type TimeEntry, type InsertTimeEntry
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // Business methods
  createBusiness(business: InsertBusiness): Promise<Business>;
  getBusinessByEmail(email: string): Promise<Business | undefined>;
  getBusinessById(id: number): Promise<Business | undefined>;
  updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business>;

  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByPin(businessId: number, pin: string): Promise<User | undefined>;
  getUsersByBusiness(businessId: number): Promise<User[]>;
  getUserById(id: number): Promise<User | undefined>;

  // Client methods
  createClient(client: InsertClient): Promise<Client>;
  getClientsByBusiness(businessId: number): Promise<Client[]>;
  getClientById(id: number): Promise<Client | undefined>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;

  // Service methods
  createService(service: InsertService): Promise<Service>;
  getServicesByBusiness(businessId: number): Promise<Service[]>;
  getServiceById(id: number): Promise<Service | undefined>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // Job methods
  createJob(job: InsertJob): Promise<Job>;
  getJobsByBusiness(businessId: number): Promise<Job[]>;
  getJobsByDate(businessId: number, date: Date): Promise<Job[]>;
  getJobById(id: number): Promise<Job | undefined>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job>;

  // Estimate methods
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  getEstimatesByBusiness(businessId: number): Promise<Estimate[]>;
  getEstimateById(id: number): Promise<Estimate | undefined>;
  getEstimateByShareToken(shareToken: string): Promise<Estimate | undefined>;
  updateEstimate(id: number, estimate: Partial<InsertEstimate>): Promise<Estimate>;
  generateShareToken(estimateId: number): Promise<string>;
  convertEstimateToInvoice(estimateId: number): Promise<Invoice>;

  // Invoice methods
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoicesByBusiness(businessId: number): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  getInvoiceByShareToken(shareToken: string): Promise<Invoice | undefined>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  generateInvoiceShareToken(invoiceId: number): Promise<string>;
  getRevenueStats(businessId: number, month: number, year: number): Promise<{total: number, count: number}>;

  // Time entry methods
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  getTimeEntriesByUser(userId: number): Promise<TimeEntry[]>;
  getActiveTimeEntry(userId: number): Promise<TimeEntry | undefined>;
  updateTimeEntry(id: number, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry>;
}

export class DatabaseStorage implements IStorage {
  // Business methods
  async createBusiness(insertBusiness: InsertBusiness): Promise<Business> {
    const [business] = await db
      .insert(businesses)
      .values(insertBusiness)
      .returning();
    return business;
  }

  async getBusinessByEmail(email: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.email, email));
    return business || undefined;
  }

  async getBusinessById(id: number): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business || undefined;
  }

  async updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business> {
    const [updatedBusiness] = await db
      .update(businesses)
      .set(business)
      .where(eq(businesses.id, id))
      .returning();
    return updatedBusiness;
  }

  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserByPin(businessId: number, pin: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.businessId, businessId), eq(users.pin, pin), eq(users.isActive, true)));
    return user || undefined;
  }

  async getUsersByBusiness(businessId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.businessId, businessId), eq(users.isActive, true)));
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  // Client methods
  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async getClientsByBusiness(businessId: number): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.businessId, businessId))
      .orderBy(desc(clients.createdAt));
  }

  async getClientById(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  // Service methods
  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(insertService)
      .returning();
    return service;
  }

  async getServicesByBusiness(businessId: number): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(and(eq(services.businessId, businessId), eq(services.isActive, true)));
  }

  async getServiceById(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set(service)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Job methods
  async createJob(insertJob: InsertJob): Promise<Job> {
    // Convert date strings to Date objects if needed
    const jobData = {
      ...insertJob,
      scheduledStart: insertJob.scheduledStart ? new Date(insertJob.scheduledStart) : null,
      scheduledEnd: insertJob.scheduledEnd ? new Date(insertJob.scheduledEnd) : null,
      recurringEndDate: insertJob.recurringEndDate ? new Date(insertJob.recurringEndDate) : null,
    };
    
    const [job] = await db
      .insert(jobs)
      .values(jobData)
      .returning();
    return job;
  }

  async getJobsByBusiness(businessId: number): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.businessId, businessId))
      .orderBy(desc(jobs.scheduledStart));
  }

  async getJobsByDate(businessId: number, date: Date): Promise<Job[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.businessId, businessId),
          gte(jobs.scheduledStart, startOfDay),
          lte(jobs.scheduledStart, endOfDay)
        )
      )
      .orderBy(jobs.scheduledStart);
  }

  async getJobById(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job> {
    const [updatedJob] = await db
      .update(jobs)
      .set(job)
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }

  // Estimate methods
  async createEstimate(insertEstimate: InsertEstimate): Promise<Estimate> {
    const [estimate] = await db
      .insert(estimates)
      .values(insertEstimate)
      .returning();
    return estimate;
  }

  async getEstimatesByBusiness(businessId: number): Promise<Estimate[]> {
    return await db
      .select()
      .from(estimates)
      .where(eq(estimates.businessId, businessId))
      .orderBy(desc(estimates.createdAt));
  }

  async getEstimateById(id: number): Promise<Estimate | undefined> {
    const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id));
    return estimate || undefined;
  }

  async updateEstimate(id: number, estimate: Partial<InsertEstimate>): Promise<Estimate> {
    const [updatedEstimate] = await db
      .update(estimates)
      .set(estimate)
      .where(eq(estimates.id, id))
      .returning();
    return updatedEstimate;
  }

  async getEstimateByShareToken(shareToken: string): Promise<Estimate | undefined> {
    const [estimate] = await db.select().from(estimates).where(eq(estimates.shareToken, shareToken));
    return estimate || undefined;
  }

  async generateShareToken(estimateId: number): Promise<string> {
    const shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await db
      .update(estimates)
      .set({ shareToken })
      .where(eq(estimates.id, estimateId));
    return shareToken;
  }

  async convertEstimateToInvoice(estimateId: number): Promise<Invoice> {
    // Get the estimate
    const estimate = await this.getEstimateById(estimateId);
    if (!estimate) {
      throw new Error("Estimate not found");
    }

    // Generate invoice number
    const invoiceCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.businessId, estimate.businessId));
    
    const count = invoiceCount[0]?.count || 0;
    const invoiceNumber = `INV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${String.fromCharCode(65 + (count % 26))}`;

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice from estimate data
    // If deposit was paid on estimate, account for it in the invoice
    // Check both depositPaid flag and depositPaidAt date to determine if deposit was collected
    const depositWasPaid = estimate.depositPaid || estimate.depositPaidAt;
    const depositPaidAmount = depositWasPaid && estimate.depositAmount ? parseFloat(estimate.depositAmount) : 0;
    const remainingTotal = parseFloat(estimate.total) - depositPaidAmount;
    
    console.log('Converting estimate to invoice:');
    console.log('Estimate ID:', estimate.id);
    console.log('Deposit Required:', estimate.depositRequired);
    console.log('Deposit Amount:', estimate.depositAmount);
    console.log('Deposit Paid Flag:', estimate.depositPaid);
    console.log('Deposit Paid At:', estimate.depositPaidAt);
    console.log('Deposit Was Paid:', depositWasPaid);
    console.log('Deposit Paid Amount:', depositPaidAmount);
    console.log('Original Total:', estimate.total);
    console.log('Remaining Total:', remainingTotal);
    
    const invoiceData: InsertInvoice = {
      businessId: estimate.businessId,
      clientId: estimate.clientId,
      invoiceNumber,
      title: estimate.title,
      description: estimate.description,
      lineItems: estimate.lineItems as any,
      subtotal: estimate.subtotal,
      taxRate: estimate.taxRate,
      taxAmount: estimate.taxAmount,
      total: remainingTotal.toString(),
      depositRequired: estimate.depositRequired,
      depositType: estimate.depositType,
      depositAmount: estimate.depositAmount,
      depositPercentage: estimate.depositPercentage,
      depositPaid: estimate.depositPaid,
      depositPaidAt: estimate.depositPaidAt,
      amountPaid: depositPaidAmount > 0 ? depositPaidAmount.toString() : "0",
      status: depositPaidAmount > 0 ? "partial" : "draft",
      dueDate
    };

    const invoice = await this.createInvoice(invoiceData);
    return invoice;
  }

  // Invoice methods
  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values(insertInvoice)
      .returning();
    return invoice;
  }

  async getInvoicesByBusiness(businessId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.businessId, businessId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoiceByShareToken(shareToken: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.shareToken, shareToken));
    return invoice || undefined;
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoice)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async generateInvoiceShareToken(invoiceId: number): Promise<string> {
    const shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await db
      .update(invoices)
      .set({ shareToken })
      .where(eq(invoices.id, invoiceId));
    return shareToken;
  }

  async getRevenueStats(businessId: number, month: number, year: number): Promise<{total: number, count: number}> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL)), 0)`,
        count: sql<number>`COUNT(*)`
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.businessId, businessId),
          eq(invoices.status, "paid"),
          gte(invoices.paidAt, startDate),
          lte(invoices.paidAt, endDate)
        )
      );

    return result[0] || { total: 0, count: 0 };
  }

  // Time entry methods
  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const [timeEntry] = await db
      .insert(timeEntries)
      .values(insertTimeEntry)
      .returning();
    return timeEntry;
  }

  async getTimeEntriesByUser(userId: number): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.userId, userId))
      .orderBy(desc(timeEntries.clockIn));
  }

  async getActiveTimeEntry(userId: number): Promise<TimeEntry | undefined> {
    const [timeEntry] = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.userId, userId), sql`${timeEntries.clockOut} IS NULL`))
      .orderBy(desc(timeEntries.clockIn));
    return timeEntry || undefined;
  }

  async updateTimeEntry(id: number, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry> {
    const [updatedTimeEntry] = await db
      .update(timeEntries)
      .set(timeEntry)
      .where(eq(timeEntries.id, id))
      .returning();
    return updatedTimeEntry;
  }
}

export const storage = new DatabaseStorage();
