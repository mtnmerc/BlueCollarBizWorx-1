import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, asc, gte, lte, isNull, sql } from "drizzle-orm";
import type {
  Business,
  User,
  Client,
  Service,
  Job,
  Estimate,
  Invoice,
  TimeEntry,
  PayrollSettings,
  InsertBusiness,
  InsertUser,
  InsertClient,
  InsertService,
  InsertJob,
  InsertEstimate,
  InsertInvoice,
  InsertTimeEntry,
  InsertPayrollSettings,
} from "../shared/schema";
import {
  businesses,
  users,
  clients,
  services,
  jobs,
  estimates,
  invoices,
  timeEntries,
  payrollSettings,
} from "../shared/schema";

class DatabaseStorage {
  private db;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    const sql = neon(databaseUrl);
    this.db = drizzle(sql);
  }

  // Business methods
  async createBusiness(business: InsertBusiness): Promise<Business> {
    const [newBusiness] = await this.db
      .insert(businesses)
      .values(business)
      .returning();
    return newBusiness;
  }

  async getBusinessById(id: number): Promise<Business | undefined> {
    const [business] = await this.db
      .select()
      .from(businesses)
      .where(eq(businesses.id, id));
    return business || undefined;
  }

  async getBusinessByApiKey(apiKey: string): Promise<Business | undefined> {
    const [business] = await this.db
      .select()
      .from(businesses)
      .where(eq(businesses.apiKey, apiKey));
    return business || undefined;
  }

  // User methods
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await this.db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));
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
      .where(and(eq(users.businessId, businessId), eq(users.isActive, true)))
      .orderBy(asc(users.firstName));
  }

  // Client methods
  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await this.db
      .insert(clients)
      .values(client)
      .returning();
    return newClient;
  }

  async getClientById(id: number): Promise<Client | undefined> {
    const [client] = await this.db
      .select()
      .from(clients)
      .where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientsByBusiness(businessId: number): Promise<Client[]> {
    return await this.db
      .select()
      .from(clients)
      .where(eq(clients.businessId, businessId))
      .orderBy(asc(clients.name));
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
  async createService(service: InsertService): Promise<Service> {
    const [newService] = await this.db
      .insert(services)
      .values(service)
      .returning();
    return newService;
  }

  async getServicesByBusiness(businessId: number): Promise<Service[]> {
    return await this.db
      .select()
      .from(services)
      .where(eq(services.businessId, businessId))
      .orderBy(asc(services.name));
  }

  // Job methods
  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await this.db
      .insert(jobs)
      .values(job)
      .returning();
    return newJob;
  }

  async getJobById(id: number): Promise<Job | undefined> {
    const [job] = await this.db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id));
    return job || undefined;
  }

  async getJobsByBusiness(businessId: number): Promise<Job[]> {
    const result = await this.db
      .select()
      .from(jobs)
      .where(eq(jobs.businessId, businessId))
      .orderBy(desc(jobs.createdAt));
    return result;
  }

  async getJobsByUser(userId: number): Promise<Job[]> {
    return await this.db
      .select()
      .from(jobs)
      .where(eq(jobs.assignedUserId, userId))
      .orderBy(desc(jobs.createdAt));
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

  // Estimate methods
  async createEstimate(estimate: InsertEstimate): Promise<Estimate> {
    const [newEstimate] = await this.db
      .insert(estimates)
      .values(estimate)
      .returning();
    return newEstimate;
  }

  async getEstimatesByBusiness(businessId: number): Promise<Estimate[]> {
    return await this.db
      .select()
      .from(estimates)
      .where(eq(estimates.businessId, businessId))
      .orderBy(desc(estimates.createdAt));
  }

  async getEstimateById(id: number): Promise<Estimate | undefined> {
    const [estimate] = await this.db
      .select()
      .from(estimates)
      .where(eq(estimates.id, id));
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

  // Invoice methods
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await this.db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async getInvoicesByBusiness(businessId: number): Promise<Invoice[]> {
    return await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.businessId, businessId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
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

  // Time entry methods
  async createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const [newTimeEntry] = await this.db
      .insert(timeEntries)
      .values(timeEntry)
      .returning();
    return newTimeEntry;
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

  // Payroll methods
  async createPayrollSettings(settings: InsertPayrollSettings): Promise<PayrollSettings> {
    const [newSettings] = await this.db
      .insert(payrollSettings)
      .values(settings)
      .returning();
    return newSettings;
  }

  async getPayrollSettingsByBusiness(businessId: number): Promise<PayrollSettings | undefined> {
    const [settings] = await this.db
      .select()
      .from(payrollSettings)
      .where(eq(payrollSettings.businessId, businessId));
    return settings || undefined;
  }
}

export const storage = new DatabaseStorage();