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
  getAllBusinesses(): Promise<Business[]>;
  updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business>;
  authenticateBusiness(email: string, password: string): Promise<Business | undefined>;

  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByPin(businessId: number, pin: string): Promise<User | undefined>;
  getUsersByBusiness(businessId: number): Promise<User[]>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getAdminUserByBusiness(businessId: number): Promise<User | undefined>;
  authenticateUserByPin(pin: string): Promise<User | undefined>;

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
  updateEstimate(id: number, estimate: Partial<InsertEstimate>): Promise<Estimate>;
  deleteEstimate(id: number): Promise<void>;

  // Invoice methods
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoicesByBusiness(businessId: number): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: number): Promise<void>;

  // Time Entry methods
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  getTimeEntriesByUser(userId: number): Promise<TimeEntry[]>;
  getTimeEntriesByBusiness(businessId: number): Promise<TimeEntry[]>;
  getTimeEntriesByDateRange(businessId: number, startDate: Date, endDate: Date): Promise<TimeEntry[]>;
  getActiveTimeEntry(userId: number): Promise<TimeEntry | undefined>;
  updateTimeEntry(id: number, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry>;
  deleteTimeEntry(id: number): Promise<void>;

  // Payroll methods
  getPayrollSettings(businessId: number): Promise<PayrollSettings | undefined>;
  updatePayrollSettings(businessId: number, settings: Partial<InsertPayrollSettings>): Promise<PayrollSettings>;

  // API Key methods
  generateApiKey(businessId: number): Promise<string>;
  revokeApiKey(businessId: number): Promise<void>;
  getBusinessByApiKey(apiKey: string): Promise<Business | null>;
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

  async getAllBusinesses(): Promise<Business[]> {
    return await db.select().from(businesses);
  }

  async updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business> {
    const [updatedBusiness] = await db
      .update(businesses)
      .set(business)
      .where(eq(businesses.id, id))
      .returning();
    return updatedBusiness;
  }

  async authenticateBusiness(email: string, password: string): Promise<Business | undefined> {
    const [business] = await db
      .select()
      .from(businesses)
      .where(and(eq(businesses.email, email), eq(businesses.password, password)));
    return business || undefined;
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

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAdminUserByBusiness(businessId: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.businessId, businessId), eq(users.role, 'admin'), eq(users.isActive, true)));
    return user || undefined;
  }

  async authenticateUserByPin(pin: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.pin, pin), eq(users.isActive, true)));
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

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
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
      .where(eq(services.businessId, businessId));
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
    const [job] = await db
      .insert(jobs)
      .values(insertJob)
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
      .where(and(
        eq(jobs.businessId, businessId),
        gte(jobs.scheduledStart, startOfDay),
        lte(jobs.scheduledStart, endOfDay)
      ))
      .orderBy(desc(jobs.scheduledStart));
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

  async deleteJob(id: number): Promise<void> {
    await db.delete(jobs).where(eq(jobs.id, id));
  }

  async getJobsByDateRange(businessId: number, startDate: Date, endDate: Date): Promise<Job[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(jobs)
      .where(and(
        eq(jobs.businessId, businessId),
        gte(jobs.scheduledStart, start),
        lte(jobs.scheduledStart, end)
      ))
      .orderBy(jobs.scheduledStart);
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

  async deleteEstimate(id: number): Promise<void> {
    await db.delete(estimates).where(eq(estimates.id, id));
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

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoice)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  // Time Entry methods
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
      .orderBy(desc(timeEntries.startTime));
  }

  async getTimeEntriesByBusiness(businessId: number): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.businessId, businessId))
      .orderBy(desc(timeEntries.startTime));
  }

  async getTimeEntriesByDateRange(businessId: number, startDate: Date, endDate: Date): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .where(and(
        eq(timeEntries.businessId, businessId),
        gte(timeEntries.startTime, startDate),
        lte(timeEntries.startTime, endDate)
      ))
      .orderBy(timeEntries.startTime);
  }

  async getActiveTimeEntry(userId: number): Promise<TimeEntry | undefined> {
    const [timeEntry] = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.endTime)));
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

  async deleteTimeEntry(id: number): Promise<void> {
    await db.delete(timeEntries).where(eq(timeEntries.id, id));
  }

  // Payroll methods
  async getPayrollSettings(businessId: number): Promise<PayrollSettings | undefined> {
    const [settings] = await db
      .select()
      .from(payrollSettings)
      .where(eq(payrollSettings.businessId, businessId));

    if (!settings) {
      const [newSettings] = await db
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
      const [newSettings] = await db
        .insert(payrollSettings)
        .values({ ...settings, businessId })
        .returning();
      return newSettings;
    }

    const [updatedSettings] = await db
      .update(payrollSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(payrollSettings.businessId, businessId))
      .returning();
    return updatedSettings;
  }

  // API Key methods
  async generateApiKey(businessId: number): Promise<string> {
    const apiKey = 'bw_' + Math.random().toString(36).substr(2, 32) + Date.now().toString(36);

    await db.update(businesses)
      .set({ apiKey })
      .where(eq(businesses.id, businessId));

    return apiKey;
  }

  async revokeApiKey(businessId: number): Promise<void> {
    await db.update(businesses)
      .set({ apiKey: null })
      .where(eq(businesses.id, businessId));
  }

  async getBusinessByApiKey(apiKey: string): Promise<Business | null> {
    const [result] = await db.select().from(businesses).where(eq(businesses.apiKey, apiKey));
    return result || null;
  }
}

export const storage = new DatabaseStorage();