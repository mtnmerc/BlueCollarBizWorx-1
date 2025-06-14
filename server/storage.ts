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
  getBusinessByApiKey(apiKey: string): Promise<Business | null>;
  getAllBusinesses(): Promise<Business[]>;
  updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business>;

  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByPin(businessId: number, pin: string): Promise<User | undefined>;
  getUserByEmailAndPin(email: string, pin: string): Promise<User | undefined>;
  getUsersByBusiness(businessId: number): Promise<User[]>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

  // Client methods
  createClient(client: InsertClient): Promise<Client>;
  getClientsByBusiness(businessId: number): Promise<Client[]>;
  getClientById(id: number): Promise<Client | undefined>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;

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
  deleteJob(id: number): Promise<void>;
  getJobsByDateRange(businessId: number, startDate: Date, endDate: Date): Promise<Job[]>;

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
  getIncompleteJobsForDate(businessId: number, date: Date): Promise<Job[]>;

  // API Key Management methods
  generateApiKey(businessId: number): Promise<string>;
  revokeApiKey(businessId: number): Promise<void>;
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

  async getAllBusinesses(): Promise<Business[]> {
    return await this.db.select().from(businesses);
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

  async getUserByEmailAndPin(email: string, pin: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.pin, pin), eq(users.isActive, true)));
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
      .where(eq(clients.businessId, businessId));
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

  async deleteClient(id: number): Promise<void> {
    await this.db.delete(clients).where(eq(clients.id, id));
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
    const [job] = await this.db
      .insert(jobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async getJobsByBusiness(businessId: number): Promise<Job[]> {
    return await this.db
      .select()
      .from(jobs)
      .where(eq(jobs.businessId, businessId))
      .orderBy(desc(jobs.createdAt));
  }

  async getJobsByDate(businessId: number, date: Date): Promise<Job[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.db
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

  async deleteJob(id: number): Promise<void> {
    await this.db.delete(jobs).where(eq(jobs.id, id));
  }

  async getJobsByDateRange(businessId: number, startDate: Date, endDate: Date): Promise<Job[]> {
    return await this.db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.businessId, businessId),
          gte(jobs.scheduledStart, startDate),
          lte(jobs.scheduledStart, endDate)
        )
      )
      .orderBy(jobs.scheduledStart);
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
    const [estimate] = await this.db
      .select()
      .from(estimates)
      .where(eq(estimates.shareToken, shareToken));
    return estimate || undefined;
  }

  async generateShareToken(estimateId: number): Promise<string> {
    const shareToken = `est_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`;
    
    await this.db
      .update(estimates)
      .set({ shareToken })
      .where(eq(estimates.id, estimateId));
    
    return shareToken;
  }

  async convertEstimateToInvoice(estimateId: number): Promise<Invoice> {
    const estimate = await this.getEstimateById(estimateId);
    if (!estimate) {
      throw new Error('Estimate not found');
    }

    const invoiceData: InsertInvoice = {
      businessId: estimate.businessId,
      clientId: estimate.clientId,
      estimateId: estimateId,
      invoiceNumber: `INV-${Date.now()}`,
      title: estimate.title,
      description: estimate.description,
      lineItems: estimate.lineItems,
      subtotal: estimate.subtotal,
      taxRate: estimate.taxRate,
      taxAmount: estimate.taxAmount,
      total: estimate.total,
      status: 'sent',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentNotes: estimate.clientResponse
    };

    const [invoice] = await this.db
      .insert(invoices)
      .values(invoiceData)
      .returning();

    // Mark estimate as converted
    await this.db
      .update(estimates)
      .set({ 
        status: 'converted'
      })
      .where(eq(estimates.id, estimateId));

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
    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.shareToken, shareToken));
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
    const shareToken = `inv_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`;
    
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
          eq(invoices.status, 'paid'),
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
      .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.clockOut)));
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
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, userId),
          gte(timeEntries.startTime, startOfDay),
          lt(timeEntries.startTime, endOfDay)
        )
      )
      .orderBy(timeEntries.startTime);
  }

  async getTimeEntriesForPayroll(businessId: number, startDate?: Date, endDate?: Date, userId?: number): Promise<TimeEntry[]> {
    let whereConditions = [eq(users.businessId, businessId)];
    
    if (startDate) {
      whereConditions.push(gte(timeEntries.startTime, startDate));
    }
    
    if (endDate) {
      whereConditions.push(lte(timeEntries.startTime, endDate));
    }
    
    if (userId) {
      whereConditions.push(eq(timeEntries.userId, userId));
    }

    return await this.db
      .select()
      .from(timeEntries)
      .innerJoin(users, eq(timeEntries.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(timeEntries.startTime);
  }

  // Payroll settings methods
  async getPayrollSettings(businessId: number): Promise<PayrollSettings | undefined> {
    const [settings] = await this.db
      .select()
      .from(payrollSettings)
      .where(eq(payrollSettings.businessId, businessId));
    return settings || undefined;
  }

  async updatePayrollSettings(businessId: number, settings: Partial<InsertPayrollSettings>): Promise<PayrollSettings> {
    const existingSettings = await this.getPayrollSettings(businessId);
    
    if (existingSettings) {
      const [updatedSettings] = await this.db
        .update(payrollSettings)
        .set(settings)
        .where(eq(payrollSettings.businessId, businessId))
        .returning();
      return updatedSettings;
    } else {
      const [newSettings] = await this.db
        .insert(payrollSettings)
        .values({ businessId, ...settings })
        .returning();
      return newSettings;
    }
  }

  async getIncompleteJobsForDate(businessId: number, date: Date): Promise<Job[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.businessId, businessId),
          gte(jobs.scheduledStart, startOfDay),
          lte(jobs.scheduledStart, endOfDay),
          eq(jobs.status, 'scheduled')
        )
      )
      .orderBy(jobs.scheduledStart);
  }

  // API Key Management methods
  async generateApiKey(businessId: number): Promise<string> {
    const apiKey = `bw_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`;
    
    await this.db
      .update(businesses)
      .set({ apiKey })
      .where(eq(businesses.id, businessId));
    
    return apiKey;
  }

  async revokeApiKey(businessId: number): Promise<void> {
    await this.db
      .update(businesses)
      .set({ apiKey: null })
      .where(eq(businesses.id, businessId));
  }

  async getBusinessByApiKey(apiKey: string): Promise<Business | null> {
    const [business] = await this.db
      .select()
      .from(businesses)
      .where(eq(businesses.apiKey, apiKey));
    return business || null;
  }
}

export const storage = new DatabaseStorage();