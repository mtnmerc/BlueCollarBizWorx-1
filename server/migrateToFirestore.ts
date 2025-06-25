import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { db, pool } from './db'; // Your Drizzle DB instance
import { businesses as drizzleBusinesses } from '@shared/schema'; // Import Drizzle schema

import serviceAccount from '../firebase-service-account-key.json'; // Your service account key

// Initialize Firebase Admin app
const adminApp = initializeApp({
  credential: cert(serviceAccount),
});

// Get Firestore instance
const firestore = getFirestore(adminApp);

async function migrateBusinesses() {
  console.log('Starting business migration...');

  try {
    // Read all businesses from Drizzle
    const businesses = await db.select().from(drizzleBusinesses);

    console.log(`Found ${businesses.length} businesses in Drizzle.`);

    const batch = firestore.batch();
    const businessesCollectionRef = firestore.collection('businesses');

    for (const business of businesses) {
      // Create a new document in Firestore for each business
      // Using the original SQL ID as part of the Firestore document data for reference
      const firestoreBusinessData = {
        // Firestore will generate a unique ID for the document
        // We can store the old SQL ID if needed for debugging or reference,
        // but the primary key in Firestore will be the document ID.
        // oldSqlId: business.id, // Optional: if you want to keep a reference to the old ID
        name: business.name, // Assuming name is not null based on schema
        email: business.email,
        phone: business.phone || null,
        address: business.address || null,
        logo: business.logo || null,
        firebaseUid: business.firebaseUid || null,
        apiKey: business.apiKey || null,
        createdAt: business.createdAt || new Date(), // Ensure createdAt is a Date object
      };

      const newBusinessRef = businessesCollectionRef.doc(); // Let Firestore auto-generate document ID
      batch.set(newBusinessRef, firestoreBusinessData);
    }

    // Commit the batch
    await batch.commit();

    console.log(`Successfully migrated ${businesses.length} businesses to Firestore.`);

  } catch (error: any) {
    console.error('Error migrating businesses:', error);
    throw error; // Re-throw to indicate failure
  }
}

async function migrateClients() {
  console.log('Starting client migration...');

  try {
    const clients = await db.select().from(schema.clients);
    console.log(`Found ${clients.length} clients in Drizzle.`);

    const batch = firestore.batch();
    const clientsCollectionRef = firestore.collection('clients');

    for (const client of clients) {
      const firestoreClientData = {
        businessId: String(client.businessId), // Store businessId as string (Firestore document ID)
        name: client.name, // Assuming name is not null
        email: client.email || null,
        phone: client.phone || null,
        address: client.address || null,
        notes: client.notes || null,
        createdAt: client.createdAt || new Date(),
      };
      batch.set(clientsCollectionRef.doc(), firestoreClientData);
    }

    await batch.commit();
    console.log(`Successfully migrated ${clients.length} clients to Firestore.`);

  } catch (error: any) {
    console.error('Error migrating clients:', error);
    throw error;
  }
}

async function migrateUsers() {
  console.log('Starting user migration...');

  try {
    const users = await db.select().from(schema.users);
    console.log(`Found ${users.length} users in Drizzle.`);

    const batch = firestore.batch();
    const usersCollectionRef = firestore.collection('users');

    for (const user of users) {
      const firestoreUserData = {
        businessId: String(user.businessId), // Store businessId as string (Firestore document ID)
        username: user.username, // Assuming username is not null
        pin: user.pin, // Assuming pin is not null (be cautious with sensitive data)
        role: user.role, // Assuming role is not null
        firstName: user.firstName, // Assuming firstName is not null
        lastName: user.lastName, // Assuming lastName is not null
        phone: user.phone || null,
        email: user.email || null,
        isActive: user.isActive || true,
        createdAt: user.createdAt || new Date(),
      };
      batch.set(usersCollectionRef.doc(), firestoreUserData);
    }

    await batch.commit();
    console.log(`Successfully migrated ${users.length} users to Firestore.`);

  } catch (error: any) {
    console.error('Error migrating users:', error);
    throw error;
  }
}

async function migrateServices() {
  console.log('Starting service migration...');

  try {
    const services = await db.select().from(schema.services);
    console.log(`Found ${services.length} services in Drizzle.`);

    const batch = firestore.batch();
    const servicesCollectionRef = firestore.collection('services');

    for (const service of services) {
      const firestoreServiceData = {
        businessId: String(service.businessId), // Store businessId as string (Firestore document ID)
        name: service.name, // Assuming name is not null
        description: service.description || null,
        rate: service.rate ? parseFloat(service.rate) : null, // Convert decimal to number
        unit: service.unit || 'hour',
        isActive: service.isActive || true,
      };
      batch.set(servicesCollectionRef.doc(), firestoreServiceData);
    }

    await batch.commit();
    console.log(`Successfully migrated ${services.length} services to Firestore.`);

  } catch (error: any) {
    console.error('Error migrating services:', error);
    throw error;
  }
}

async function migrateJobs() {
  console.log('Starting job migration...');

  try {
    const jobs = await db.select().from(schema.jobs);
    console.log(`Found ${jobs.length} jobs in Drizzle.`);

    const batch = firestore.batch();
    const jobsCollectionRef = firestore.collection('jobs');

    for (const job of jobs) {
      const firestoreJobData = {
        businessId: String(job.businessId), // Store businessId as string (Firestore document ID)
        clientId: String(job.clientId), // Store clientId as string (Firestore document ID)
        assignedUserId: job.assignedUserId ? String(job.assignedUserId) : null, // Store assignedUserId as string (Firestore document ID)
        title: job.title, // Assuming title is not null
        description: job.description || null,
        address: job.address || null,
        scheduledStart: job.scheduledStart || null,
        scheduledEnd: job.scheduledEnd || null,
        status: job.status || 'scheduled',
        priority: job.priority || 'normal',
        jobType: job.jobType || null,
        estimatedAmount: job.estimatedAmount ? parseFloat(job.estimatedAmount) : null, // Convert decimal to number
        actualAmount: job.actualAmount ? parseFloat(job.actualAmount) : null, // Convert decimal to number
        notes: job.notes || null,
        isRecurring: job.isRecurring || false,
        recurringFrequency: job.recurringFrequency || null,
        recurringEndDate: job.recurringEndDate || null,
        parentJobId: job.parentJobId ? String(job.parentJobId) : null, // Store parentJobId as string (Firestore document ID)
        createdAt: job.createdAt || new Date(),
      };
      batch.set(jobsCollectionRef.doc(), firestoreJobData);
    }

    await batch.commit();
    console.log(`Successfully migrated ${jobs.length} jobs to Firestore.`);

  } catch (error: any) {
    console.error('Error migrating jobs:', error);
    throw error;
  }
}

async function migrateEstimates() {
  console.log('Starting estimate migration...');

  try {
    const estimates = await db.select().from(schema.estimates);
    console.log(`Found ${estimates.length} estimates in Drizzle.`);

    const batch = firestore.batch();
    const estimatesCollectionRef = firestore.collection('estimates');

    for (const estimate of estimates) {
      const firestoreEstimateData = {
        businessId: String(estimate.businessId), // Store businessId as string (Firestore document ID)
        clientId: String(estimate.clientId), // Store clientId as string (Firestore document ID)
        estimateNumber: estimate.estimateNumber, // Assuming estimateNumber is not null
        title: estimate.title, // Assuming title is not null
        description: estimate.description || null,
        lineItems: (estimate.lineItems as any) || [], // Assuming lineItems is an array or can be empty
        subtotal: parseFloat(estimate.subtotal), // Convert decimal to number
        taxRate: estimate.taxRate ? parseFloat(estimate.taxRate) : 0, // Convert decimal to number
        taxAmount: estimate.taxAmount ? parseFloat(estimate.taxAmount) : 0, // Convert decimal to number
        total: parseFloat(estimate.total), // Convert decimal to number 
        depositRequired: estimate.depositRequired || false,
        depositType: estimate.depositType || 'fixed',
        depositAmount: estimate.depositAmount ? parseFloat(estimate.depositAmount) : null, // Convert decimal to number
        depositPercentage: estimate.depositPercentage ? parseFloat(estimate.depositPercentage) : null, // Convert decimal to number
        status: estimate.status || 'draft',
        validUntil: estimate.validUntil || null,
        clientSignature: estimate.clientSignature || null,
        shareToken: estimate.shareToken || null,
        clientResponse: estimate.clientResponse || null,
        clientRespondedAt: estimate.clientRespondedAt || null,
        notes: estimate.notes || null,
        createdAt: estimate.createdAt || new Date(),
      };
      batch.set(estimatesCollectionRef.doc(), firestoreEstimateData);
    }

    await batch.commit();
    console.log(`Successfully migrated ${estimates.length} estimates to Firestore.`);

  } catch (error: any) {
    console.error('Error migrating estimates:', error);
    throw error;
  }
}

async function migrateInvoices() {
  console.log('Starting invoice migration...');

  try {
    const invoices = await db.select().from(schema.invoices);
    console.log(`Found ${invoices.length} invoices in Drizzle.`);

    const batch = firestore.batch();
    const invoicesCollectionRef = firestore.collection('invoices');

    for (const invoice of invoices) {
      const firestoreInvoiceData = {
        businessId: String(invoice.businessId), // Store businessId as string (Firestore document ID)
        clientId: String(invoice.clientId), // Store clientId as string (Firestore document ID)
        jobId: invoice.jobId ? String(invoice.jobId) : null, // Store jobId as string (Firestore document ID)
        estimateId: invoice.estimateId ? String(invoice.estimateId) : null, // Store estimateId as string (Firestore document ID)
        invoiceNumber: invoice.invoiceNumber, // Assuming invoiceNumber is not null
        title: invoice.title, // Assuming title is not null
        description: invoice.description || null,
        lineItems: (invoice.lineItems as any) || [], // Assuming lineItems is an array or can be empty
        subtotal: parseFloat(invoice.subtotal), // Convert decimal to number
        taxRate: invoice.taxRate ? parseFloat(invoice.taxRate) : 0, // Convert decimal to number
        taxAmount: invoice.taxAmount ? parseFloat(invoice.taxAmount) : 0, // Convert decimal to number
        total: parseFloat(invoice.total), // Convert decimal to number 
        depositRequired: invoice.depositRequired || false,
        depositType: invoice.depositType || 'fixed',
        depositAmount: invoice.depositAmount ? parseFloat(invoice.depositAmount) : null, // Convert decimal to number
        depositPercentage: invoice.depositPercentage ? parseFloat(invoice.depositPercentage) : null, // Convert decimal to number
        depositPaid: invoice.depositPaid ? parseFloat(invoice.depositPaid) : 0, // Convert decimal to number
        amountPaid: invoice.amountPaid ? parseFloat(invoice.amountPaid) : 0, // Convert decimal to number
        status: invoice.status || 'draft',
        paymentMethod: invoice.paymentMethod || null,
        paymentNotes: invoice.paymentNotes || null,
        clientSignature: invoice.clientSignature || null,
        signedAt: invoice.signedAt || null,
        shareToken: invoice.shareToken || null,
        photos: (invoice.photos as any) || [], // Assuming photos is an array or can be empty
        dueDate: invoice.dueDate || null,
        paidAt: invoice.paidAt || null,
        createdAt: invoice.createdAt || new Date(),
      };
      batch.set(invoicesCollectionRef.doc(), firestoreInvoiceData);
    }

    await batch.commit();
    console.log(`Successfully migrated ${invoices.length} invoices to Firestore.`);

  } catch (error: any) {
    console.error('Error migrating invoices:', error);
    throw error;
  }
}

async function migrateTimeEntries() {
  console.log('Starting time entry migration...');

  try {
    const timeEntries = await db.select().from(schema.timeEntries);
    console.log(`Found ${timeEntries.length} time entries in Drizzle.`);

    const batch = firestore.batch();
    const timeEntriesCollectionRef = firestore.collection('timeEntries');

    for (const timeEntry of timeEntries) {
      const firestoreTimeEntryData = {
        businessId: String(timeEntry.businessId), // Store businessId as string (Firestore document ID)
        userId: String(timeEntry.userId), // Store userId as string (Firestore document ID)
        jobId: timeEntry.jobId ? String(timeEntry.jobId) : null, // Store jobId as string (Firestore document ID)
        clockIn: timeEntry.clockIn, // Assuming clockIn is not null
        clockOut: timeEntry.clockOut || null,
        breakStart: timeEntry.breakStart || null,
        breakEnd: timeEntry.breakEnd || null,
        totalHours: timeEntry.totalHours ? parseFloat(timeEntry.totalHours) : null, // Convert decimal to number
        notes: timeEntry.notes || null,
        createdAt: timeEntry.createdAt || new Date(),
      };
      batch.set(timeEntriesCollectionRef.doc(), firestoreTimeEntryData);
    }

    await batch.commit();
    console.log(`Successfully migrated ${timeEntries.length} time entries to Firestore.`);

  } catch (error: any) {
    console.error('Error migrating time entries:', error);
    throw error;
  }
}

async function migratePayrollSettings() {
  console.log('Starting payroll settings migration...');

  try {
    const payrollSettings = await db.select().from(schema.payrollSettings);
    console.log(`Found ${payrollSettings.length} payroll settings in Drizzle.`);

    const batch = firestore.batch();
    const payrollSettingsCollectionRef = firestore.collection('payrollSettings');

    for (const settings of payrollSettings) {
      const firestorePayrollSettingsData = {
        businessId: String(settings.businessId), // Store businessId as string (Firestore document ID)
        payPeriodType: settings.payPeriodType || 'weekly',
        payPeriodStartDay: settings.payPeriodStartDay || 1,
        payPeriodStartDate: settings.payPeriodStartDate || null,
        overtimeThreshold: settings.overtimeThreshold ? parseFloat(settings.overtimeThreshold) : 40.00, // Convert decimal to number
        overtimeMultiplier: settings.overtimeMultiplier ? parseFloat(settings.overtimeMultiplier) : 1.50, // Convert decimal to number
        createdAt: settings.createdAt || new Date(),
        updatedAt: settings.updatedAt || new Date(),
      };
      // Optional: Use businessId as document ID for 1-to-1 relationship
      // batch.set(payrollSettingsCollectionRef.doc(firestorePayrollSettingsData.businessId), firestorePayrollSettingsData);
      // Using auto-generated ID for now:
      batch.set(payrollSettingsCollectionRef.doc(), firestorePayrollSettingsData);
    }

    await batch.commit();
    console.log(`Successfully migrated ${payrollSettings.length} payroll settings to Firestore.`);

  } catch (error: any) {
    console.error('Error migrating payroll settings:', error);
    throw error;
  }
}

// Example usage (you would call this function to start the migration)
// migrateBusinesses().catch(console.error);

// You can add a main execution block here if you want to run this script directly
// (async () => {
//   await migrateBusinesses();
 (async () => {
   await migrateBusinesses();
   await migrateClients();
   await migrateUsers();
   await migrateServices();
   await migrateJobs();
   await migrateEstimates();
   await migrateInvoices();
   await migrateTimeEntries();
   await migratePayrollSettings();
   console.log('Migration process finished.');
   await pool.end(); // Close the database pool connection
   process.exit(0);
 })();