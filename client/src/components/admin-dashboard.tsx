import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Smartphone, Code, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import RecentSearches from "@/components/recent-searches";
import { NotificationManager } from "@/components/notification-manager";

interface StatsData {
  totalSearches: number;
  uniqueDevices: number;
  successRate: number;
  apiCalls: number;
  popularDevices: Array<{
    name: string;
    manufacturer: string;
    searches: number;
  }>;
}



interface AdminDashboardProps {
  sessionToken: string;
}

export default function AdminDashboard({ sessionToken }: AdminDashboardProps) {
  const { data: stats, isLoading, error } = useQuery<StatsData>({
    queryKey: ['/api/v1/stats'],
  });

  if (isLoading) {
    return (
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Analytics Dashboard</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive insights into IMEI searches, device trends, and usage patterns
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-4" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Analytics</h2>
          <p className="text-gray-600">Unable to load analytics data. Please try again later.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Searches",
      value: stats?.totalSearches?.toLocaleString() || "0",
      icon: Search,
      change: "+12.5%",
      color: "text-primary"
    },
    {
      title: "Unique Devices",
      value: stats?.uniqueDevices?.toLocaleString() || "0",
      icon: Smartphone,
      change: "+8.2%",
      color: "text-accent"
    },
    {
      title: "API Calls",
      value: stats?.apiCalls?.toLocaleString() || "0",
      icon: Code,
      change: "+23.1%",
      color: "text-secondary"
    },
    {
      title: "Success Rate",
      value: `${stats?.successRate || 0}%`,
      icon: CheckCircle,
      change: "+2.1%",
      color: "text-success"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Analytics Dashboard</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive insights into IMEI searches, device trends, and usage patterns
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center`}>
                      <IconComponent className={`${stat.color} w-6 h-6`} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-success text-sm font-medium">{stat.change}</span>
                    <span className="text-gray-500 text-sm ml-2">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-8">
          {/* Popular Devices Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Most Searched Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.popularDevices?.length ? (
                  stats.popularDevices.map((device, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Smartphone className="text-gray-600 w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{device.name}</p>
                          <p className="text-sm text-gray-500">{device.manufacturer}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{device.searches.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">searches</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No device data available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Searches */}
          <RecentSearches popularDevices={stats?.popularDevices || []} />
        </div>

        {/* Firebase Messaging Center */}
        <div className="max-w-4xl mx-auto">
          <NotificationManager />
        </div>
      </div>
    </section>
  );
}
