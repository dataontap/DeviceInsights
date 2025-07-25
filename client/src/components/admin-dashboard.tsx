import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Smartphone, Code, CheckCircle, MapPin, ArrowRight, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import APIDocs from "@/components/api-docs";

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
  locations: Array<{
    location: string;
    searches: number;
  }>;
}

// Helper function to create Google Earth links
function createGoogleEarthLink(location: string): string | null {
  // Check if location contains coordinates (latitude,longitude format)
  const coordsMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordsMatch) {
    const [, lat, lng] = coordsMatch;
    return `https://earth.google.com/web/@${lat},${lng},1000a,35y,0h,0t,0r`;
  }
  return null;
}

// Helper function to format location display
function formatLocationDisplay(location: string): { display: string; coords?: string } {
  const coordsMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordsMatch) {
    const [, lat, lng] = coordsMatch;
    return {
      display: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`,
      coords: location
    };
  }
  return { display: location };
}

export default function AdminDashboard() {
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

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Popular Devices */}
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

          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Search Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.locations?.length ? (
                  stats.locations.map((location, index) => {
                    const maxSearches = Math.max(...stats.locations.map(l => l.searches));
                    const percentage = (location.searches / maxSearches) * 100;
                    const locationInfo = formatLocationDisplay(location.location);
                    const googleEarthLink = createGoogleEarthLink(location.location);

                    return (
                      <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <MapPin className="text-primary w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{locationInfo.display}</span>
                            {locationInfo.coords && (
                              <span className="text-xs text-gray-500">Coordinates</span>
                            )}
                          </div>
                          {googleEarthLink && (
                            <a 
                              href={googleEarthLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-blue-700 transition-colors"
                              title="View in Google Earth"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {location.searches.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No location data available yet</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button variant="link" className="text-primary hover:text-blue-700 p-0">
                  View Full Geographic Report <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* API Documentation Section */}
      <APIDocs />
    </section>
  );
}