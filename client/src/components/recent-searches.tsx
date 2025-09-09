import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Star, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecentSearch {
  id: number;
  device: {
    make: string;
    model: string;
    year?: number;
  };
  searchedAt: string;
}

interface PopularDevice {
  name: string;
  manufacturer: string;
  searches: number;
}

interface RecentSearchesProps {
  popularDevices?: PopularDevice[];
}

export default function RecentSearches({ popularDevices = [] }: RecentSearchesProps) {
  const { data: recentSearches, isLoading } = useQuery<{ searches: RecentSearch[] }>({
    queryKey: ['/api/v1/recent-searches?limit=10'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const isPopularDevice = (deviceMake: string, deviceModel: string) => {
    const deviceName = `${deviceMake} ${deviceModel}`;
    return popularDevices.some(popular => 
      popular.name.toLowerCase() === deviceName.toLowerCase()
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Searches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="w-24 h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="w-12 h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Searches</CardTitle>
        <p className="text-sm text-gray-500">Latest successful device identifications</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentSearches?.searches?.length ? (
            recentSearches.searches.map((search) => {
              const isPopular = isPopularDevice(search.device.make, search.device.model);
              
              return (
                <div key={search.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                      <Smartphone className="text-blue-600 w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {search.device.make} {search.device.model}
                        </p>
                        {isPopular && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {search.device.year && `${search.device.year} • `}
                        ID: {search.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {formatTimeAgo(search.searchedAt)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent searches available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}