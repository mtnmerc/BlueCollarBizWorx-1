import { storage } from "./storage";

// Function to automatically reschedule incomplete jobs
export async function rescheduleIncompleteJobs() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all businesses to process their jobs
    const businesses = await storage.getAllBusinesses();
    
    for (const business of businesses) {
      // Get jobs scheduled for yesterday that are still in 'scheduled' status
      const incompleteJobs = await storage.getIncompleteJobsForDate(business.id, yesterday);
      
      for (const job of incompleteJobs) {
        // Find next available time slot (starting from today)
        const nextSlot = await findNextAvailableTimeSlot(business.id, job);
        
        if (nextSlot) {
          // Reschedule the job
          await storage.updateJob(job.id, {
            scheduledStart: nextSlot.start.toISOString(),
            scheduledEnd: nextSlot.end.toISOString(),
            status: "rescheduled"
          });
          
          console.log(`Auto-rescheduled job ${job.id} from ${job.scheduledStart} to ${nextSlot.start}`);
        }
      }
    }
  } catch (error) {
    console.error("Error in automatic job rescheduling:", error);
  }
}

// Find the next available time slot for a job
async function findNextAvailableTimeSlot(businessId: number, job: any) {
  const originalStart = new Date(job.scheduledStart);
  const originalEnd = new Date(job.scheduledEnd);
  const duration = originalEnd.getTime() - originalStart.getTime();
  
  // Start checking from today
  let checkDate = new Date();
  checkDate.setHours(8, 0, 0, 0); // Start at 8 AM
  
  // Check for the next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDate = new Date(checkDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    
    // Get all jobs for this date
    const existingJobs = await storage.getJobsByDate(businessId, currentDate);
    
    // Check time slots from 8 AM to 6 PM (10 hours)
    for (let hour = 8; hour < 18; hour++) {
      const slotStart = new Date(currentDate);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart.getTime() + duration);
      
      // Check if this slot conflicts with existing jobs
      const hasConflict = existingJobs.some((existingJob: any) => {
        const existingStart = new Date(existingJob.scheduledStart);
        const existingEnd = new Date(existingJob.scheduledEnd);
        
        return (slotStart < existingEnd && slotEnd > existingStart);
      });
      
      if (!hasConflict && slotEnd.getHours() <= 18) {
        return { start: slotStart, end: slotEnd };
      }
    }
  }
  
  return null; // No available slot found in the next 7 days
}

// Start the scheduler (runs every day at midnight)
export function startJobScheduler() {
  // Run immediately on startup
  rescheduleIncompleteJobs();
  
  // Then run every day at midnight
  setInterval(() => {
    rescheduleIncompleteJobs();
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  console.log("Job scheduler started - will reschedule incomplete jobs daily at midnight");
}