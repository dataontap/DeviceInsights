import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface LocationStats {
  period: string;
  totalSearches: number;
  topLocations: Array<{
    location: string;
    count: number;
  }>;
  locationCounts: { [key: string]: number };
  heatmapData: Array<{
    name: string;
    value: number;
  }>;
}

interface LocationAnalyticsProps {
  sessionToken: string;
}

const PERIOD_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '1d', label: '1 Day' },
  { value: '30d', label: '30 Days' }
];

const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];

export default function LocationAnalytics({ sessionToken }: LocationAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const { data: locationStats, isLoading } = useQuery<LocationStats>({
    queryKey: ['/api/admin/location-stats', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/admin/location-stats?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch location stats');
      }
      
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Geographic Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Geographic Distribution
            </CardTitle>
            
            {/* Time Period Filters */}
            <div className="flex gap-2">
              {PERIOD_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedPeriod === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(option.value)}
                  data-testid={`button-filter-${option.value}`}
                  className={selectedPeriod === option.value ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-700">Total Searches</p>
                <p className="text-2xl font-bold text-blue-900" data-testid="text-total-searches">
                  {locationStats?.totalSearches.toLocaleString() || 0}
                </p>
                <p className="text-xs text-blue-600 mt-1">in selected period</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-700">Unique Locations</p>
                <p className="text-2xl font-bold text-green-900" data-testid="text-unique-locations">
                  {locationStats?.topLocations?.length || 0}
                </p>
                <p className="text-xs text-green-600 mt-1">geographic regions</p>
              </div>
            </div>

            {/* Top Locations Bar Chart */}
            {locationStats && locationStats.topLocations && locationStats.topLocations.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Locations by Search Volume</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={locationStats.topLocations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="location" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {locationStats.topLocations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No location data available for this period</p>
              </div>
            )}

            {/* Location List */}
            {locationStats && locationStats.topLocations && locationStats.topLocations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Location Breakdown</h3>
                <div className="space-y-2">
                  {locationStats.topLocations.map((location, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      data-testid={`location-item-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{location.location}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{location.count.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          {((location.count / (locationStats.totalSearches || 1)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
