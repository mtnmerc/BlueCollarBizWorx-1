import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Briefcase, 
  FileText, 
  Receipt, 
  DollarSign,
  TrendingUp 
} from "lucide-react";

interface DashboardStats {
  totalClients: number;
  activeJobs: number;
  pendingEstimates: number;
  monthlyRevenue: number;
  recentActivity: Array<{
    id: number;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  return response.json();
}

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: fetchDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">
              Unable to load dashboard data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Clients",
      value: stats?.totalClients || 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Jobs",
      value: stats?.activeJobs || 0,
      icon: Briefcase,
      color: "text-green-600",
    },
    {
      title: "Pending Estimates",
      value: stats?.pendingEstimates || 0,
      icon: FileText,
      color: "text-yellow-600",
    },
    {
      title: "Monthly Revenue",
      value: `$${stats?.monthlyRevenue || 0}`,
      icon: DollarSign,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <TrendingUp className="w-4 h-4" />
          <span>Business Overview</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium">Add Client</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <CardContent className="p-4 text-center">
                  <Briefcase className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium">Create Job</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <CardContent className="p-4 text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                  <p className="text-sm font-medium">New Estimate</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <CardContent className="p-4 text-center">
                  <Receipt className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-medium">Send Invoice</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}