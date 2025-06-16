import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Businesses table
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  logo: text("logo"), // URL or base64
  password: text("password").notNull(),
  apiKey: text("api_key").unique(), // For external API access (identifies app)
  apiSecret: text("api_secret").unique(), // For account authentication
  createdAt: timestamp("created_at").defaultNow(),
});

// Users/Team members table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  username: text("username").notNull(),
  pin: text("pin").notNull(), // Last 4 of SSN or custom PIN
  role: text("role").notNull(), // 'admin' | 'member'
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Services/Products table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  description: text("description"),
  rate: decimal("rate", { precision: 10, scale: 2 }),
  unit: text("unit").default("hour"), // hour, item, sq_ft, etc.
  isActive: boolean("is_active").default(true),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  address: text("address"),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  jobType: text("job_type"), // For job templates/categories
  estimatedAmount: decimal("estimated_amount", { precision: 10, scale: 2 }),
  actualAmount: decimal("actual_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  // Recurring job fields
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency"), // weekly, monthly, quarterly
  recurringEndDate: timestamp("recurring_end_date"),
  parentJobId: integer("parent_job_id").references(() => jobs.id), // For recurring job instances
  createdAt: timestamp("created_at").defaultNow(),
});

// Estimates table
export const estimates = pgTable("estimates", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  estimateNumber: text("estimate_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  lineItems: jsonb("line_items").notNull(), // Array of {description, quantity, rate, amount}
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  depositRequired: boolean("deposit_required").default(false),
  depositType: text("deposit_type").default("fixed"), // fixed, percentage
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositPercentage: decimal("deposit_percentage", { precision: 5, scale: 2 }),
  status: text("status").notNull().default("draft"), // draft, sent, approved, rejected, converted
  validUntil: timestamp("valid_until"),
  clientSignature: text("client_signature"), // base64 image
  shareToken: text("share_token").unique(), // unique token for public sharing
  clientResponse: text("client_response"), // client's response message
  clientRespondedAt: timestamp("client_responded_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  jobId: integer("job_id").references(() => jobs.id),
  estimateId: integer("estimate_id").references(() => estimates.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  lineItems: jsonb("line_items").notNull(), // Array of {description, quantity, rate, amount}
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  depositRequired: boolean("deposit_required").default(false),
  depositType: text("deposit_type").default("fixed"), // fixed, percentage
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositPercentage: decimal("deposit_percentage", { precision: 5, scale: 2 }),
  depositPaid: decimal("deposit_paid", { precision: 10, scale: 2 }).default("0"),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  paymentMethod: text("payment_method"), // cash, check, zelle, paypal, etc.
  paymentNotes: text("payment_notes"),
  clientSignature: text("client_signature"), // base64 image
  signedAt: timestamp("signed_at"), // when signature was collected
  shareToken: text("share_token").unique(), // unique token for public sharing
  photos: jsonb("photos"), // Array of base64 images
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Time entries table
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  userId: integer("user_id").notNull().references(() => users.id),
  jobId: integer("job_id").references(() => jobs.id),
  clockIn: timestamp("clock_in").notNull(),
  clockOut: timestamp("clock_out"),
  breakStart: timestamp("break_start"),
  breakEnd: timestamp("break_end"),
  totalHours: decimal("total_hours", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payroll settings table
export const payrollSettings = pgTable("payroll_settings", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  payPeriodType: text("pay_period_type").notNull().default("weekly"), // weekly, biweekly, monthly
  payPeriodStartDay: integer("pay_period_start_day").notNull().default(1), // 1=Monday, 0=Sunday (deprecated in favor of payPeriodStartDate)
  payPeriodStartDate: date("pay_period_start_date"), // Specific start date for pay period alignment
  overtimeThreshold: decimal("overtime_threshold", { precision: 5, scale: 2 }).default("40.00"),
  overtimeMultiplier: decimal("overtime_multiplier", { precision: 3, scale: 2 }).default("1.50"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const businessRelations = relations(businesses, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  services: many(services),
  jobs: many(jobs),
  estimates: many(estimates),
  invoices: many(invoices),
  timeEntries: many(timeEntries),
  payrollSettings: many(payrollSettings),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  business: one(businesses, {
    fields: [users.businessId],
    references: [businesses.id],
  }),
  assignedJobs: many(jobs),
  timeEntries: many(timeEntries),
}));

export const clientRelations = relations(clients, ({ one, many }) => ({
  business: one(businesses, {
    fields: [clients.businessId],
    references: [businesses.id],
  }),
  jobs: many(jobs),
  estimates: many(estimates),
  invoices: many(invoices),
}));

export const jobRelations = relations(jobs, ({ one, many }) => ({
  business: one(businesses, {
    fields: [jobs.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [jobs.clientId],
    references: [clients.id],
  }),
  assignedUser: one(users, {
    fields: [jobs.assignedUserId],
    references: [users.id],
  }),
  invoices: many(invoices),
  timeEntries: many(timeEntries),
}));

export const estimateRelations = relations(estimates, ({ one, many }) => ({
  business: one(businesses, {
    fields: [estimates.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [estimates.clientId],
    references: [clients.id],
  }),
  invoices: many(invoices),
}));

export const invoiceRelations = relations(invoices, ({ one }) => ({
  business: one(businesses, {
    fields: [invoices.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  job: one(jobs, {
    fields: [invoices.jobId],
    references: [jobs.id],
  }),
  estimate: one(estimates, {
    fields: [invoices.estimateId],
    references: [estimates.id],
  }),
}));

export const timeEntryRelations = relations(timeEntries, ({ one }) => ({
  business: one(businesses, {
    fields: [timeEntries.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [timeEntries.jobId],
    references: [jobs.id],
  }),
}));

export const payrollSettingsRelations = relations(payrollSettings, ({ one }) => ({
  business: one(businesses, {
    fields: [payrollSettings.businessId],
    references: [businesses.id],
  }),
}));

// Insert schemas
export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
});

export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  createdAt: true,
}).extend({
  validUntil: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  })
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
}).extend({
  dueDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  })
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
});

export const insertPayrollSettingsSchema = createInsertSchema(payrollSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = z.infer<typeof insertEstimateSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type PayrollSettings = typeof payrollSettings.$inferSelect;
export type InsertPayrollSettings = z.infer<typeof insertPayrollSettingsSchema>;
