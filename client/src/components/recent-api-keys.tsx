import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Mail, Copy, Check, Calendar, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface RecentApiKey {
  id: number;
  email: string;
  name: string;
  website?: string;
  key: string;
  createdAt: string;
  isActive: boolean;
}

interface RecentApiKeysProps {
  sessionToken: string;
}

export default function RecentApiKeys({ sessionToken }: RecentApiKeysProps) {
  const [copiedKey, setCopiedKey] = useState<number | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ success: boolean; recentKeys: RecentApiKey[] }>({
    queryKey: ['/api/admin/api-keys/recent'],
    queryFn: async () => {
      const response = await fetch('/api/admin/api-keys/recent', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent API keys');
      }
      
      return response.json();
    },
  });

  const copyToClipboard = async (key: string, id: number) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(id);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy API key",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Recently Provisioned API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const recentKeys = data?.recentKeys || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5 text-green-600" />
          Recently Provisioned API Keys
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentKeys.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No API keys provisioned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentKeys.map((apiKey) => (
              <div 
                key={apiKey.id} 
                className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:bg-green-50/50 transition-all"
                data-testid={`recent-apikey-item-${apiKey.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">{apiKey.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          <span>{apiKey.email}</span>
                        </div>
                      </div>
                    </div>
                    
                    {apiKey.website && (
                      <div className="flex items-center gap-2 mb-2 ml-13">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{apiKey.website}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-3 ml-13">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Created {formatDistanceToNow(new Date(apiKey.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono text-gray-700 break-all flex-1">
                          {apiKey.key}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                          className="shrink-0"
                          data-testid={`button-copy-key-${apiKey.id}`}
                        >
                          {copiedKey === apiKey.id ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      apiKey.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {apiKey.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
