import { 
  businesses, users, clients, services, jobs, estimates, invoices, timeEntries, payrollSettings,
  type Business, type InsertBusiness,
  type User, type InsertUser,
  type Client, type InsertClient,
  type Service, type InsertService,
  type Job, type InsertJob,
  type Estimate, type InsertEstimate,
  type Invoice, type InsertInvoice,
  type TimeEntry, type InsertTimeEntry,
  type PayrollSettings, type InsertPayrollSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, lt, sql, isNull } from "drizzle-orm";

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
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

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
  deleteEstimate(id: number): Promise<void>;
  generateShareToken(estimateId: number): Promise<string>;
  convertEstimateToInvoice(estimateId: number): Promise<Invoice>;

  // Invoice methods
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoicesByBusiness(businessId: number): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  getInvoiceByShareToken(shareToken: string): Promise<Invoice | undefined>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: number): Promise<void>;
  generateInvoiceShareToken(invoiceId: number): Promise<string>;
  getRevenueStats(businessId: number, month: number, year: number): Promise<{total: number, count: number}>;

  // Time entry methods
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  getTimeEntriesByUser(userId: number): Promise<TimeEntry[]>;
  getTimeEntriesByUserAndDate(userId: number, date: Date): Promise<TimeEntry[]>;
  getActiveTimeEntry(userId: number): Promise<TimeEntry | undefined>;
  updateTimeEntry(id: number, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry>;
  getTimeEntriesForPayroll(businessId: number, startDate?: Date, endDate?: Date, userId?: number): Promise<TimeEntry[]>;

  // Payroll settings methods
  getPayrollSettings(businessId: number): Promise<PayrollSettings | undefined>;
  updatePayrollSettings(businessId: number, settings: Partial<InsertPayrollSettings>): Promise<PayrollSettings>;

  // Additional business and job management methods
  getAllBusinesses(): Promise<Business[]>;
  getIncompleteJobsForDate(businessId: number, date: Date): Promise<Job[]>;

  // API Key Management methods
  generateApiKey(businessId: number): Promise<string>;
  revokeApiKey(businessId: number): Promise<void>;
  getBusinessByApiKey(apiKey: string): Promise<Business | null>;
}

export class DatabaseStorage implements IStorage {
  db = db;
  // Business methods
  async createBusiness(insertBusiness: InsertBusiness): Promise<Business> {
    const [business] = await this.db
      .insert(businesses)
      .values(insertBusiness)
      .returning();
    return business;
  }

  async getBusinessByEmail(email: string): Promise<Business | undefined> {
    const [business] = await this.db.select().from(businesses).where(eq(businesses.email, email));
    return business || undefined;
  }

  async getBusinessById(id: number): Promise<Business | undefined> {
    const [business] = await this.db.select().from(businesses).where(eq(businesses.id, id));
    return business || undefined;
  }

  async updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business> {
    const [updatedBusiness] = await this.db
      .update(businesses)
      .set(business)
      .where(eq(businesses.id, id))
      .returning();
    return updatedBusiness;
  }

  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserByPin(businessId: number, pin: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.businessId, businessId), eq(users.pin, pin), eq(users.isActive, true)));
    return user || undefined;
  }

  async getUsersByBusiness(businessId: number): Promise<User[]> {
    return await this.db
      .select()
      .from(users)
      .where(and(eq(users.businessId, businessId), eq(users.isActive, true)));
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await this.db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Client methods
  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await this.db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async getClientsByBusiness(businessId: number): Promise<Client[]> {
    return await this.db
      .select()
      .from(clients)
      .where(eq(clients.businessId, businessId))
      .orderBy(desc(clients.createdAt));
  }

  async getClientById(id: number): Promise<Client | undefined> {
    const [client] = await this.db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await this.db
      .update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  // Service methods
  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await this.db
      .insert(services)
      .values(insertService)
      .returning();
    return service;
  }

  async getServicesByBusiness(businessId: number): Promise<Service[]> {
    return await this.db
      .select()
      .from(services)
      .where(and(eq(services.businessId, businessId), eq(services.isActive, true)));
  }

  async getServiceById(id: number): Promise<Service | undefined> {
    const [service] = await this.db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await this.db
      .update(services)
      .set(service)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    await this.db.delete(services).where(eq(services.id, id));
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

    const [job] = await this.db
      .insert(jobs)
      .values(jobData)
      .returning();
    return job;
  }

  async getJobsByBusiness(businessId: number): Promise<any[]> {
    const jobsWithRelations = await this.db
      .select({
        job: jobs,
        client: clients,
        assignedUser: users
      })
      .from(jobs)
      .leftJoin(clients, eq(jobs.clientId, clients.id))
      .leftJoin(users, eq(jobs.assignedUserId, users.id))
      .where(eq(jobs.businessId, businessId))
      .orderBy(desc(jobs.scheduledStart));

    return jobsWithRelations.map(row => ({
      ...row.job,
      client: row.client,
      assignedUser: row.assignedUser
    }));
  }

  async getJobsByDate(businessId: number, date: Date): Promise<any[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const jobsWithRelations = await this.db
      .select({
        job: jobs,
        client: clients,
        assignedUser: users
      })
      .from(jobs)
      .leftJoin(clients, eq(jobs.clientId, clients.id))
      .leftJoin(users, eq(jobs.assignedUserId, users.id))
      .where(
        and(
          eq(jobs.businessId, businessId),
          gte(jobs.scheduledStart, startOfDay),
          lte(jobs.scheduledStart, endOfDay)
        )
      )
      .orderBy(jobs.scheduledStart);

    return jobsWithRelations.map(row => ({
      ...row.job,
      client: row.client,
      assignedUser: row.assignedUser
    }));
  }

  async getJobById(id: number): Promise<Job | undefined> {
    const [job] = await this.db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job> {
    const [updatedJob] = await this.db
      .update(jobs)
      .set(job)
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }

  // Estimate methods
  async createEstimate(insertEstimate: InsertEstimate): Promise<Estimate> {
    const [estimate] = await this.db
      .insert(estimates)
      .values(insertEstimate)
      .returning();
    return estimate;
  }

  async getEstimatesByBusiness(businessId: number): Promise<Estimate[]> {
    return await this.db
      .select()
      .from(estimates)
      .where(eq(estimates.businessId, businessId))
      .orderBy(desc(estimates.createdAt));
  }

  async getEstimateById(id: number): Promise<Estimate | undefined> {
    const [estimate] = await this.db.select().from(estimates).where(eq(estimates.id, id));
    return estimate || undefined;
  }

  async updateEstimate(id: number, estimate: Partial<InsertEstimate>): Promise<Estimate> {
    const [updatedEstimate] = await this.db
      .update(estimates)
      .set(estimate)
      .where(eq(estimates.id, id))
      .returning();
    return updatedEstimate;
  }

  async deleteEstimate(id: number): Promise<void> {
    await this.db.delete(estimates).where(eq(estimates.id, id));
  }

  async getEstimateByShareToken(shareToken: string): Promise<Estimate | undefined> {
    const [estimate] = await this.db.select().from(estimates).where(eq(estimates.shareToken, shareToken));
    return estimate || undefined;
  }

  async generateShareToken(estimateId: number): Promise<string> {
    const shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await this.db
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
    const invoiceCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.businessId, estimate.businessId));

    const count = invoiceCount[0]?.count || 0;
    const invoiceNumber = `INV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${String.fromCharCode(65 + (count % 26))}`;

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice from estimate data
    // If estimate requires a deposit, the invoice should account for it
    // The deposit will be collected separately on the invoice
    const depositAmount = estimate.depositRequired && estimate.depositAmount ? parseFloat(estimate.depositAmount) : 0;
    const originalTotal = parseFloat(estimate.total);

    console.log('Converting estimate to invoice:');
    console.log('Estimate ID:', estimate.id);
    console.log('Deposit Required:', estimate.depositRequired);
    console.log('Deposit Amount:', estimate.depositAmount);
    console.log('Original Total:', estimate.total);
    console.log('Deposit Amount to Account For:', depositAmount);

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
      total: estimate.total, // Keep original total - deposit will be tracked separately
      depositRequired: estimate.depositRequired,
      depositType: estimate.depositType,
      depositAmount: estimate.depositAmount,
      depositPercentage: estimate.depositPercentage,
      amountPaid: "0", // No payments yet on the new invoice
      status: "draft", // Start as draft, will change when deposit is collected
      dueDate
    };

    const invoice = await this.createInvoice(invoiceData);
    return invoice;
  }

  // Invoice methods
  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await this.db
      .insert(invoices)
      .values(insertInvoice)
      .returning();
    return invoice;
  }

  async getInvoicesByBusiness(businessId: number): Promise<Invoice[]> {
    return await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.businessId, businessId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const [invoice] = await this.db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoiceByShareToken(shareToken: string): Promise<Invoice | undefined> {
    const [invoice] = await this.db.select().from(invoices).where(eq(invoices.shareToken, shareToken));
    return invoice || undefined;
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await this.db
      .update(invoices)
      .set(invoice)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<void> {
    await this.db.delete(invoices).where(eq(invoices.id, id));
  }

  async generateInvoiceShareToken(invoiceId: number): Promise<string> {
    const shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await this.db
      .update(invoices)
      .set({ shareToken })
      .where(eq(invoices.id, invoiceId));
    return shareToken;
  }

  async getRevenueStats(businessId: number, month: number, year: number): Promise<{total: number, count: number}> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await this.db
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
    const [timeEntry] = await this.db
      .insert(timeEntries)
      .values(insertTimeEntry)
      .returning();
    return timeEntry;
  }

  async getTimeEntriesByUser(userId: number): Promise<TimeEntry[]> {
    return await this.db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.userId, userId))
      .orderBy(desc(timeEntries.clockIn));
  }

  async getActiveTimeEntry(userId: number): Promise<TimeEntry | undefined> {
    const [timeEntry] = await this.db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.userId, userId), sql`${timeEntries.clockOut} IS NULL`))
      .orderBy(desc(timeEntries.clockIn));
    return timeEntry || undefined;
  }

  async updateTimeEntry(id: number, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry> {
    const [updatedTimeEntry] = await this.db
      .update(timeEntries)
      .set(timeEntry)
      .where(eq(timeEntries.id, id))
      .returning();
    return updatedTimeEntry;
  }

  async getTimeEntriesByUserAndDate(userId: number, date: Date): Promise<TimeEntry[]> {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    return await this.db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, userId),
          gte(timeEntries.clockIn, date),
          lt(timeEntries.clockIn, nextDay)
        )
      )
      .orderBy(desc(timeEntries.clockIn));
  }

  async getTimeEntriesForPayroll(businessId: number, startDate?: Date, endDate?: Date, userId?: number): Promise<any[]> {
    const conditions = [eq(timeEntries.businessId, businessId)];

    if (startDate) {
      conditions.push(gte(timeEntries.clockIn, startDate));
    }
    if (endDate) {
      conditions.push(lte(timeEntries.clockIn, endDate));
    }
    if (userId) {
      conditions.push(eq(timeEntries.userId, userId));
    }

    const results = await this.db
      .select({
        id: timeEntries.id,
        businessId: timeEntries.businessId,
        userId: timeEntries.userId,
        jobId: timeEntries.jobId,
        clockIn: timeEntries.clockIn,
        clockOut: timeEntries.clockOut,
        breakStart: timeEntries.breakStart,
        breakEnd: timeEntries.breakEnd,
        totalHours: timeEntries.totalHours,
        notes: timeEntries.notes,
        createdAt: timeEntries.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username
        }
      })
      .from(timeEntries)
      .leftJoin(users, eq(timeEntries.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(timeEntries.clockIn));

    return results;
  }

  async getPayrollSettings(businessId: number): Promise<PayrollSettings | undefined> {
    const [settings] = await this.db
      .select()
      .from(payrollSettings)
      .where(eq(payrollSettings.businessId, businessId));

    if (!settings) {
      // Create default settings if none exist
      const [newSettings] = await this.db
        .insert(payrollSettings)
        .values({ businessId })
        .returning();
      return newSettings;
    }

    return settings;
  }

  async updatePayrollSettings(businessId: number, settings: Partial<InsertPayrollSettings>): Promise<PayrollSettings> {
    const existing = await this.getPayrollSettings(businessId);

    if (!existing) {
      const [newSettings] = await this.db
        .insert(payrollSettings)
        .values({ ...settings, businessId })
        .returning();
      return newSettings;
    }

    const [updatedSettings] = await this.db
      .update(payrollSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(payrollSettings.businessId, businessId))
      .returning();
    return updatedSettings;
  }

  // Additional business and job management methods
  async getAllBusinesses(): Promise<Business[]> {
    return await this.db.select().from(businesses);
  }

  async getIncompleteJobsForDate(businessId: number, date: Date): Promise<Job[]> {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    return await this.db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.businessId, businessId),
          eq(jobs.status, "scheduled"),
          gte(jobs.scheduledStart, date),
          lt(jobs.scheduledStart, nextDay)
        )
      );
  }

  async generateApiKey(businessId: number): Promise<string> {
    const apiKey = 'bzx_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    await this.db.update(businesses).set({
      apiKey: apiKey
    }).where(eq(businesses.id, businessId));

    return apiKey;
  }

  async revokeApiKey(businessId: number): Promise<void> {
    await this.db.update(businesses).set({
      apiKey: null
    }).where(eq(businesses.id, businessId));
  }

  async getBusinessByApiKey(apiKey: string): Promise<Business | null> {
    const [result] = await this.db.select().from(businesses).where(eq(businesses.apiKey, apiKey));
    return result || null;
  }

  async generateApiKey(businessId: number): Promise<string> {
    const apiKey = 'bw_' + Math.random().toString(36).substr(2, 32) + Date.now().toString(36);
    
    await this.db.update(businesses)
      .set({ apiKey })
      .where(eq(businesses.id, businessId));
    
    return apiKey;
  }

  async revokeApiKey(businessId: number): Promise<void> {
    await this.db.update(businesses)
      .set({ apiKey: null })
      .where(eq(businesses.id, businessId));
  }
}

export const storage = new DatabaseStorage();