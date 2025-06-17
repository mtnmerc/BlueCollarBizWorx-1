import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { businesses, users, clients, jobs, estimates, invoices } from './shared/schema.ts';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function createSampleData() {
  console.log('Creating sample data...');

  try {
    // Create a demo business
    const [business] = await db.insert(businesses).values({
      name: 'Demo Construction Co.',
      email: 'demo@bizworx.com',
      phone: '(555) 123-4567',
      address: '123 Main St, Anytown, USA',
      password: 'demo123'
    }).returning();

    console.log('Created business:', business.name);

    // Create admin user
    const [user] = await db.insert(users).values({
      businessId: business.id,
      username: 'admin',
      pin: '1234',
      role: 'admin',
      firstName: 'Demo',
      lastName: 'Admin',
      phone: '(555) 123-4567',
      email: 'admin@demo.com'
    }).returning();

    console.log('Created admin user:', user.username);

    // Create sample clients
    const clientsData = [
      {
        businessId: business.id,
        name: 'John Smith',
        email: 'john@example.com',
        phone: '(555) 111-2222',
        address: '456 Oak Ave, Anytown, USA',
        notes: 'Regular residential customer'
      },
      {
        businessId: business.id,
        name: 'ABC Restaurant',
        email: 'manager@abcrestaurant.com',
        phone: '(555) 333-4444',
        address: '789 Commercial St, Anytown, USA',
        notes: 'Commercial kitchen repairs'
      },
      {
        businessId: business.id,
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '(555) 555-6666',
        address: '321 Pine Rd, Anytown, USA',
        notes: 'New construction project'
      }
    ];

    const insertedClients = await db.insert(clients).values(clientsData).returning();
    console.log('Created clients:', insertedClients.length);

    // Create sample jobs
    const jobsData = [
      {
        businessId: business.id,
        clientId: insertedClients[0].id,
        assignedUserId: user.id,
        title: 'Kitchen Renovation',
        description: 'Full kitchen remodel including cabinets, countertops, and appliances',
        address: '456 Oak Ave, Anytown, USA',
        scheduledStart: new Date('2025-01-20T09:00:00Z'),
        scheduledEnd: new Date('2025-01-25T17:00:00Z'),
        status: 'scheduled',
        priority: 'high',
        estimatedAmount: '15000.00'
      },
      {
        businessId: business.id,
        clientId: insertedClients[1].id,
        assignedUserId: user.id,
        title: 'HVAC System Repair',
        description: 'Commercial HVAC system maintenance and repair',
        address: '789 Commercial St, Anytown, USA',
        scheduledStart: new Date('2025-01-18T08:00:00Z'),
        status: 'in_progress',
        priority: 'urgent',
        estimatedAmount: '2500.00'
      }
    ];

    const insertedJobs = await db.insert(jobs).values(jobsData).returning();
    console.log('Created jobs:', insertedJobs.length);

    // Create sample estimates
    const estimatesData = [
      {
        businessId: business.id,
        clientId: insertedClients[2].id,
        estimateNumber: 'EST-2025-001',
        title: 'Bathroom Remodel Estimate',
        description: 'Complete bathroom renovation including tile, fixtures, and plumbing',
        lineItems: [
          { description: 'Labor', quantity: 40, rate: 75.00, amount: 3000.00 },
          { description: 'Materials', quantity: 1, rate: 2500.00, amount: 2500.00 },
          { description: 'Permits', quantity: 1, rate: 200.00, amount: 200.00 }
        ],
        subtotal: '5700.00',
        taxRate: '8.25',
        taxAmount: '470.25',
        total: '6170.25',
        status: 'sent',
        validUntil: new Date('2025-02-15')
      }
    ];

    const insertedEstimates = await db.insert(estimates).values(estimatesData).returning();
    console.log('Created estimates:', insertedEstimates.length);

    // Create sample invoices
    const invoicesData = [
      {
        businessId: business.id,
        clientId: insertedClients[0].id,
        jobId: insertedJobs[0].id,
        invoiceNumber: 'INV-2025-001',
        title: 'Kitchen Renovation - Progress Payment',
        description: 'First progress payment for kitchen renovation project',
        lineItems: [
          { description: 'Demolition', quantity: 1, rate: 1500.00, amount: 1500.00 },
          { description: 'Rough Plumbing', quantity: 1, rate: 2000.00, amount: 2000.00 },
          { description: 'Electrical Rough-in', quantity: 1, rate: 1800.00, amount: 1800.00 }
        ],
        subtotal: '5300.00',
        taxRate: '8.25',
        taxAmount: '437.25',
        total: '5737.25',
        status: 'sent',
        dueDate: new Date('2025-02-01')
      }
    ];

    const insertedInvoices = await db.insert(invoices).values(invoicesData).returning();
    console.log('Created invoices:', insertedInvoices.length);

    console.log('\n✅ Sample data created successfully!');
    console.log('\nDemo login credentials:');
    console.log('Email: demo@bizworx.com');
    console.log('Password: demo123');

  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

createSampleData();