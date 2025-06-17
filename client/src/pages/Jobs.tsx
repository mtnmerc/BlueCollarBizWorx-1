import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Plus, Calendar, MapPin, User, Clock } from "lucide-react";

interface Job {
  id: number;
  title: string;
  description?: string;
  clientName: string;
  address?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  status: string;
  priority: string;
  estimatedAmount?: number;
  assignedUserName?: string;
}

async function fetchJobs(): Promise<Job[]> {
  const response = await fetch('/api/jobs');
  if (!response.ok) {
    throw new Error('Failed to fetch jobs');
  }
  return response.json();
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function Jobs() {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: fetchJobs,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Jobs</h1>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </Button>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">
              Unable to load jobs. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Button>
      </div>

      {!jobs || jobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No jobs scheduled</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first job to get started with scheduling and tracking work.
            </p>
            <Button>Create Job</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                        {job.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            {job.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            {job.clientName}
                          </div>
                          {job.address && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {job.address}
                            </div>
                          )}
                          {job.scheduledStart && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              {new Date(job.scheduledStart).toLocaleDateString()}
                            </div>
                          )}
                          {job.assignedUserName && (
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              Assigned to {job.assignedUserName}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge className={statusColors[job.status as keyof typeof statusColors]}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={priorityColors[job.priority as keyof typeof priorityColors]}>
                            {job.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      {job.estimatedAmount && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Estimated</p>
                          <p className="text-lg font-semibold">
                            ${job.estimatedAmount.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}