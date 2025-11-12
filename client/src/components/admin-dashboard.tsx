import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Smartphone, Code, CheckCircle, AlertTriangle, CreditCard, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import RecentSearches from "@/components/recent-searches";
// import { NotificationManager } from "@/components/notification-manager"; // Hidden for now
import NpsMetrics from "@/components/nps-metrics";
import LocationAnalytics from "@/components/location-analytics";
import ApiKeyAnalytics from "@/components/api-key-analytics";
import RecentApiKeys from "@/components/recent-api-keys";
import NetworkPolicyEditor from "@/components/network-policy-editor";
import BatchEsimChecker from "@/components/batch-esim-checker";
import EsimAnalytics from "@/components/esim-analytics";
import BlacklistDemo from "@/pages/blacklist-demo";

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
  onSessionExpired?: () => void;
}

export default function AdminDashboard({ sessionToken, onSessionExpired }: AdminDashboardProps) {
  const { data: stats, isLoading, error } = useQuery<StatsData>({
    queryKey: ['/api/admin/stats', sessionToken],
    enabled: !!sessionToken,
    queryFn: async () => {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Admin stats fetch error:', errorData);
        
        // If session is invalid or expired, clear it and notify parent
        if (response.status === 401 && onSessionExpired) {
          console.log('Session expired or invalid, triggering logout');
          setTimeout(() => onSessionExpired(), 1000);
        }
        
        throw new Error(errorData.message || errorData.error || 'Failed to fetch stats');
      }
      
      return response.json();
    },
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
    const errorMessage = error instanceof Error ? error.message : 'Unable to load analytics data';
    const isSessionError = errorMessage.includes('session') || errorMessage.includes('expired') || errorMessage.includes('invalid');
    
    return (
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {isSessionError ? 'Session Expired' : 'Error Loading Analytics'}
            </h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            {isSessionError && (
              <p className="text-sm text-gray-500">
                Please log out and log back in to continue.
              </p>
            )}
          </div>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Analytics, batch processing, and system management
          </p>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="batch-esim">
              <CreditCard className="w-4 h-4 mr-2" />
              Batch eSIM
            </TabsTrigger>
            <TabsTrigger value="blacklist-api">
              <Shield className="w-4 h-4 mr-2" />
              Blacklist API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
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

        {/* NPS Metrics Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <NpsMetrics />
        </div>

        {/* Location Analytics Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <LocationAnalytics sessionToken={sessionToken} />
        </div>

        {/* API Key Analytics Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <ApiKeyAnalytics sessionToken={sessionToken} />
        </div>

        {/* Recently Provisioned API Keys Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <RecentApiKeys sessionToken={sessionToken} />
        </div>

        {/* eSIM Analytics Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <EsimAnalytics sessionToken={sessionToken} />
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

        {/* Network Policy Editor */}
        <div className="max-w-6xl mx-auto mb-8">
          <NetworkPolicyEditor />
        </div>

        {/* Firebase Messaging Center - Hidden for now */}
        {/* <div className="max-w-4xl mx-auto">
          <NotificationManager />
        </div> */}
          </TabsContent>

          <TabsContent value="batch-esim">
            <div className="max-w-6xl mx-auto">
              <BatchEsimChecker sessionToken={sessionToken} />
            </div>
          </TabsContent>

          <TabsContent value="blacklist-api">
            <BlacklistDemo />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
