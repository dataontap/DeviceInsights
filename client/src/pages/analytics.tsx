import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Smartphone, ArrowLeft, TrendingUp, Users, Activity, Globe, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface AnalyticsData {
  totalSearches: number;
  totalUsers: number;
  totalApiKeys: number;
  deviceTypes: Array<{ type: string; count: number }>;
  locationStats: Array<{ 
    city: string; 
    state: string; 
    country: string; 
    searches: number 
  }>;
  popularDevices: Array<{ 
    brand: string; 
    model: string; 
    searches: number 
  }>;
  compatibilityStats: {
    compatible: number;
    incompatible: number;
    unknown: number;
  };
  apiUsageStats: Array<{
    apiKeyName: string;
    totalRequests: number;
    requestsLastHour: number;
    rateLimitViolations: number;
  }>;
  recentActivity: Array<{
    timestamp: string;
    action: string;
    details: string;
    location: string;
  }>;
}

export default function Analytics() {
  const [demoAccess, setDemoAccess] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);
  const { toast } = useToast();

  // Check if demo access was granted
  useEffect(() => {
    const demoToken = localStorage.getItem('demoAnalyticsAccess');
    if (demoToken) {
      setDemoAccess(true);
    }
  }, []);

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/analytics/demo'],
    enabled: demoAccess,
  });

  const handleRequestDemoAccess = () => {
    // Grant demo access immediately for analytics
    localStorage.setItem('demoAnalyticsAccess', 'granted');
    setDemoAccess(true);
    setAccessRequested(true);
    
    toast({
      title: "Demo Access Granted!",
      description: "You now have access to view aggregate analytics insights.",
    });
  };

  if (!demoAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Smartphone className="text-white w-4 h-4" />
                </div>
                <span className="text-xl font-semibold text-blue-900">Analytics Demo</span>
              </div>
              <Link href="/">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Demo Access Request */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Analytics Demo Access
              </h1>
              
              <p className="text-gray-600 mb-6">
                Access aggregate insights from all API keys including device trends, 
                location statistics, and usage analytics. Location data is anonymized 
                to city/state level for privacy protection.
              </p>
              
              <div className="space-y-3 text-left text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                  <span>Total searches and device trends</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                  <span>API usage statistics across all keys</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                  <span>Anonymized location insights (city/state only)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                  <span>Device compatibility statistics</span>
                </div>
              </div>
              
              <Button
                onClick={handleRequestDemoAccess}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={accessRequested}
              >
                {accessRequested ? 'Granting Access...' : 'Request Demo Access'}
              </Button>
              
              <p className="text-xs text-gray-500 mt-4">
                Demo access provides read-only analytics for demonstration purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  const data = analyticsData as AnalyticsData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Analytics Navigation */}
      <nav className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Smartphone className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-semibold text-blue-900">Analytics Dashboard</span>
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Demo Access
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  Admin Portal
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Analytics Content */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Analytics</h1>
            <p className="text-gray-600">Aggregate insights from all API keys with privacy-protected location data</p>
          </div>
          
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Searches</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.totalSearches?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.totalUsers?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">API Keys</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.totalApiKeys?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Compatibility Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.compatibilityStats ? 
                      Math.round((data.compatibilityStats.compatible / (data.compatibilityStats.compatible + data.compatibilityStats.incompatible + data.compatibilityStats.unknown)) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Device Types */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Device Types</h3>
              <div className="space-y-3">
                {data?.deviceTypes?.slice(0, 5).map((device, index) => (
                  <div key={device.type} className="flex justify-between items-center">
                    <span className="text-gray-700">{device.type}</span>
                    <span className="text-blue-600 font-medium">{device.count.toLocaleString()}</span>
                  </div>
                )) || (
                  <p className="text-gray-500">No device data available</p>
                )}
              </div>
            </div>

            {/* Location Stats (Privacy Protected) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Locations
                <span className="text-sm font-normal text-gray-500 ml-2">(City/State Level)</span>
              </h3>
              <div className="space-y-3">
                {data?.locationStats?.slice(0, 5).map((location, index) => (
                  <div key={`${location.city}-${location.state}`} className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-700">{location.city}, {location.state}</span>
                      <div className="text-sm text-gray-500">{location.country}</div>
                    </div>
                    <span className="text-blue-600 font-medium">{location.searches.toLocaleString()}</span>
                  </div>
                )) || (
                  <p className="text-gray-500">No location data available</p>
                )}
              </div>
            </div>

            {/* API Usage Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Usage by Key</h3>
              <div className="space-y-3">
                {data?.apiUsageStats?.slice(0, 5).map((apiStat, index) => (
                  <div key={apiStat.apiKeyName} className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-700 font-medium">{apiStat.apiKeyName}</span>
                      <span className="text-blue-600">{apiStat.totalRequests.toLocaleString()} total</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{apiStat.requestsLastHour} last hour</span>
                      <span className={apiStat.rateLimitViolations > 0 ? "text-red-600" : "text-green-600"}>
                        {apiStat.rateLimitViolations} violations
                      </span>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500">No API usage data available</p>
                )}
              </div>
            </div>

            {/* Popular Devices */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Searched Devices</h3>
              <div className="space-y-3">
                {data?.popularDevices?.slice(0, 5).map((device, index) => (
                  <div key={`${device.brand}-${device.model}`} className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-700 font-medium">{device.brand}</span>
                      <div className="text-sm text-gray-500">{device.model}</div>
                    </div>
                    <span className="text-blue-600 font-medium">{device.searches.toLocaleString()}</span>
                  </div>
                )) || (
                  <p className="text-gray-500">No device search data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {data?.recentActivity?.slice(0, 8).map((activity, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <span className="text-gray-700">{activity.action}</span>
                    <div className="text-sm text-gray-500">{activity.details}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{activity.location}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500">No recent activity data available</p>
              )}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Globe className="w-3 h-3 text-blue-600" />
              </div>
              <div className="text-sm text-blue-800">
                <strong>Privacy Protection:</strong> All location data is anonymized to city and state/province level only. 
                No exact coordinates, street addresses, or personally identifiable location information is displayed. 
                This analytics dashboard shows aggregate insights across all API keys for demonstration purposes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}