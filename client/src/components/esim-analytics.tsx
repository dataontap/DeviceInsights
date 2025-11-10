import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, TrendingUp, CheckCircle, XCircle, Smartphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface EsimAnalyticsProps {
  sessionToken: string;
}

interface EsimAnalyticsData {
  summary: {
    totalEsimSearches: number;
    compatibilityRate: number;
    compatibleCount: number;
    incompatibleCount: number;
    lastUpdated: string;
  };
  trends: Array<{
    date: string;
    compatible: number;
    incompatible: number;
  }>;
  topDevices: Array<{
    make: string;
    model: string;
    compatibleCount: number;
    lastSeen: string;
  }>;
}

export default function EsimAnalytics({ sessionToken }: EsimAnalyticsProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const { data, isLoading, error } = useQuery<EsimAnalyticsData>({
    queryKey: ['/api/admin/esim-analytics', period],
    enabled: !!sessionToken,
    queryFn: async () => {
      const response = await fetch(`/api/admin/esim-analytics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch eSIM analytics');
      }
      
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">eSIM Analytics</h3>
            <p className="text-gray-600">Track eSIM compatibility trends and insights</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">Failed to load eSIM analytics</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const periodLabels = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">eSIM Analytics</h3>
          <p className="text-gray-600">Track eSIM compatibility trends and insights</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === '7d' ? 'default' : 'outline'}
            onClick={() => setPeriod('7d')}
            size="sm"
            data-testid="button-period-7d"
          >
            7d
          </Button>
          <Button
            variant={period === '30d' ? 'default' : 'outline'}
            onClick={() => setPeriod('30d')}
            size="sm"
            data-testid="button-period-30d"
          >
            30d
          </Button>
          <Button
            variant={period === '90d' ? 'default' : 'outline'}
            onClick={() => setPeriod('90d')}
            size="sm"
            data-testid="button-period-90d"
          >
            90d
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total eSIM Searches</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="text-total-esim-searches">
                  {data.summary.totalEsimSearches.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="text-blue-600 w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{periodLabels[period]}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compatibility Rate</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="text-compatibility-rate">
                  {data.summary.compatibilityRate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600 w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Devices with eSIM support</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">eSIM Compatible</p>
                <p className="text-2xl font-bold text-green-900" data-testid="text-compatible-count">
                  {data.summary.compatibleCount.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600 w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Devices supporting eSIM</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Not Compatible</p>
                <p className="text-2xl font-bold text-red-900" data-testid="text-incompatible-count">
                  {data.summary.incompatibleCount.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="text-red-600 w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Devices without eSIM</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      {data.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>eSIM Compatibility Trends</CardTitle>
            <CardDescription>Daily breakdown of eSIM compatible vs not compatible devices</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="compatible" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                  name="Compatible"
                />
                <Area 
                  type="monotone" 
                  dataKey="incompatible" 
                  stackId="1"
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6}
                  name="Not Compatible"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top eSIM Compatible Devices */}
      {data.topDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top eSIM Compatible Devices</CardTitle>
            <CardDescription>Most searched eSIM-compatible devices in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topDevices.map((device, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                  data-testid={`device-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Smartphone className="text-green-600 w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {device.make} {device.model}
                      </p>
                      <p className="text-sm text-gray-500">
                        Last seen: {new Date(device.lastSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{device.compatibleCount}</p>
                    <p className="text-sm text-gray-500">searches</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.trends.length === 0 && data.topDevices.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No eSIM Data Yet</h3>
            <p className="text-gray-600">
              eSIM compatibility data will appear here once devices with eSIM information are searched.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
