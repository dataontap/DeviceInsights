import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Mail, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ApiKeyStats {
  period: string;
  topApiKeys: Array<{
    apiKeyId: number;
    email: string;
    name: string;
    requests: number;
    lastUsed?: string;
  }>;
  totalApiKeys: number;
}

interface ApiKeyAnalyticsProps {
  sessionToken: string;
}

const PERIOD_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '1d', label: '1 Day' },
  { value: '30d', label: '30 Days' }
];

export default function ApiKeyAnalytics({ sessionToken }: ApiKeyAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const { data: apiKeyStats, isLoading } = useQuery<ApiKeyStats>({
    queryKey: ['/api/admin/api-keys/top', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/admin/api-keys/top?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch API key stats');
      }
      
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Top API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            Top 5 API Keys by Usage
          </CardTitle>
          
          {/* Time Period Filters */}
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={selectedPeriod === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(option.value)}
                data-testid={`button-filter-apikey-${option.value}`}
                className={selectedPeriod === option.value ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-purple-700">Active API Keys</p>
              <p className="text-2xl font-bold text-purple-900" data-testid="text-active-api-keys">
                {apiKeyStats?.totalApiKeys || 0}
              </p>
              <p className="text-xs text-purple-600 mt-1">in selected period</p>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-indigo-700">Total Requests</p>
              <p className="text-2xl font-bold text-indigo-900" data-testid="text-total-api-requests">
                {apiKeyStats?.topApiKeys?.reduce((sum, key) => sum + key.requests, 0).toLocaleString() || 0}
              </p>
              <p className="text-xs text-indigo-600 mt-1">across top 5 keys</p>
            </div>
          </div>

          {/* API Keys List */}
          {apiKeyStats && apiKeyStats.topApiKeys && apiKeyStats.topApiKeys.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Most Active API Keys</h3>
              {apiKeyStats.topApiKeys.map((apiKey, index) => (
                <div 
                  key={apiKey.apiKeyId} 
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  data-testid={`apikey-item-${index}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-900">{apiKey.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                            <Mail className="w-3 h-3" />
                            <span>{apiKey.email}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-3 ml-13">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-500">Requests</p>
                            <p className="font-bold text-gray-900">{apiKey.requests.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        {apiKey.lastUsed && (
                          <div>
                            <p className="text-xs text-gray-500">Last Used</p>
                            <p className="font-medium text-gray-700 text-sm">
                              {formatDistanceToNow(new Date(apiKey.lastUsed), { addSuffix: true })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="bg-blue-100 px-3 py-1 rounded-full">
                        <p className="text-xs font-semibold text-blue-700">
                          {((apiKey.requests / (apiKeyStats.topApiKeys.reduce((sum, k) => sum + k.requests, 0) || 1)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No API key activity in this period</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
