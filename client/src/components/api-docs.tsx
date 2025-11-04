import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Download, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function APIDocs() {
  const [apiKey, setApiKey] = useState("");
  const [email, setEmail] = useState("");
  const [keyName, setKeyName] = useState("");
  const [website, setWebsite] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code snippet copied successfully",
    });
  };

  const generateApiKeyMutation = useMutation({
    mutationFn: async (data: { email: string; name?: string; website?: string }) => {
      const response = await fetch('/api/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw result;
      }
      return result;
    },
    onSuccess: (data) => {
      setApiKey(data.apiKey);
      toast({
        title: "API Key Generated Successfully",
        description: `Your new API key has been created and saved to our database.`,
      });
      setIsGenerating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Generate API Key",
        description: error.details ? error.details.join(", ") : "Please check your email and name fields.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const handleGenerateApiKey = () => {
    if (!email) {
      toast({
        title: "Missing Information",
        description: "Please provide an email address.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    generateApiKeyMutation.mutate({ 
      email, 
      name: keyName || undefined,
      website: website || undefined
    });
  };

  const downloadExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/v1/export?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imei_searches.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Started",
        description: `Downloading ${format.toUpperCase()} export`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to download export file",
        variant: "destructive",
      });
    }
  };

  const endpoints = [
    {
      method: "POST",
      path: "/api/v1/check",
      description: "Check device compatibility by IMEI number",
      example: `{
  "device": {
    "make": "Apple",
    "model": "iPhone 14 Pro",
    "imei": "123456789012345"
  },
  "capabilities": {
    "fourG": true,
    "fiveG": true,
    "volte": true,
    "wifiCalling": "limited"
  }
}`
    },
    {
      method: "GET",
      path: "/api/v1/stats",
      description: "Get platform usage statistics",
      example: `{
  "totalSearches": 24567,
  "uniqueDevices": 8432,
  "successRate": 94.7,
  "popularDevices": [...],
  "locations": [...]
}`
    },
    {
      method: "GET",
      path: "/api/v1/export",
      description: "Export search data in CSV/JSON format",
      example: `{
  "searches": [
    {
      "id": 1,
      "imei": "123456789012345",
      "device": { ... },
      "searchedAt": "2024-01-01T12:00:00Z"
    }
  ]
}`
    },
    {
      method: "POST",
      path: "/api/messaging/sms",
      description: "Send SMS notification via Firebase messaging",
      example: `{
  "success": true,
  "message": "SMS sent successfully"
}`
    },
    {
      method: "POST",
      path: "/api/messaging/email",
      description: "Send email notification via Firebase messaging",
      example: `{
  "success": true,
  "message": "Email sent successfully"
}`
    },
    {
      method: "POST",
      path: "/api/messaging/push",
      description: "Send push notification via Firebase Cloud Messaging",
      example: `{
  "success": true,
  "message": "Push notification sent successfully"
}`
    },
    {
      method: "GET",
      path: "/api/v1/search/{id}",
      description: "Get individual search by ID",
      example: `{
  "id": 1,
  "imei": "123456789012345",
  "device": { ... },
  "capabilities": { ... },
  "searchedAt": "2024-01-01T12:00:00Z"
}`
    },
    {
      method: "POST",
      path: "/api/coverage/analyze",
      description: "Analyze network coverage for mobile carriers and broadband providers",
      example: `{
  "success": true,
  "data": {
    "location": { "lat": 43.6532, "lng": -79.3832 },
    "mobile_providers": [{
      "provider": "Rogers",
      "coverage_score": 95,
      "reliability_rating": 5,
      "recommendation": "excellent"
    }]
  }
}`
    },
    {
      method: "POST",
      path: "/api/coverage/analyze-issue",
      description: "Report network issues with AI-powered pattern recognition",
      example: `{
  "success": true,
  "data": {
    "issue_analysis": "AI analysis of your issue",
    "similar_issues_summary": "3 similar issues found",
    "device_pattern": "Pattern detected with device type",
    "confidence_score": 0.85
  }
}`
    }
  ];

  const rateLimits = [
    { tier: "Free Tier", requests: "100 requests/hour", status: "available", label: "Available in Alpha" },
    { tier: "Pro Tier", requests: "1,000 requests/hour", status: "coming-soon", label: "Coming Soon" },
    { tier: "Enterprise", requests: "Unlimited", status: "coming-soon", label: "Coming Soon" }
  ];

  return (
    <section id="api" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">API Documentation</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Access our comprehensive APIs for IMEI checking and network coverage analysis
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <Button variant="outline" onClick={() => window.location.href = '/coverage-api-docs'}>
              Coverage Maps API Docs
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/coverage-maps'}>
              Interactive Coverage Testing
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Available Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={endpoint.method === 'GET' ? 'default' : 'secondary'}
                        className={`${
                          endpoint.method === 'GET' 
                            ? 'bg-success text-white' 
                            : 'bg-primary text-white'
                        } font-mono text-xs`}
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm text-gray-900">{endpoint.path}</code>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{endpoint.description}</p>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-500">Example Response:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(endpoint.example)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      <code>{endpoint.example}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Authentication & Rate Limits */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-3">Include your API key in the request headers:</p>
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Headers:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`Authorization: Bearer YOUR_API_KEY\nContent-Type: application/json`)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="text-xs text-gray-700">
{`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
                    </pre>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* API Key Generation Form */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1"
                        required
                        data-testid="input-api-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="keyName" className="text-sm font-medium text-gray-700">
                        API Key Name (optional)
                      </Label>
                      <Input
                        id="keyName"
                        type="text"
                        placeholder="Auto-generated if left blank (e.g., Key1, Key2)"
                        value={keyName}
                        onChange={(e) => setKeyName(e.target.value)}
                        className="mt-1"
                        data-testid="input-api-keyname"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If not provided, we'll generate a name like "Key1", "Key2", etc.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                        Website or Description (optional)
                      </Label>
                      <Input
                        id="website"
                        type="text"
                        placeholder="https://myapp.com or Description of usage"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="mt-1"
                        data-testid="input-api-website"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Where will you use this API key?
                      </p>
                    </div>
                  </div>

                  {apiKey && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm text-blue-800 font-medium">Your API Key:</p>
                      <code className="text-sm text-blue-900 break-all">{apiKey}</code>
                      <div className="mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey)}
                          className="h-8 px-2 text-blue-700 hover:bg-blue-100"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Key
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleGenerateApiKey} 
                    disabled={isGenerating || generateApiKeyMutation.isPending}
                    className="bg-primary text-white hover:bg-blue-700 w-full"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {isGenerating || generateApiKeyMutation.isPending ? "Generating..." : "Generate API Key"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Rate Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rateLimits.map((limit, index) => (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center p-3 rounded-lg border-2 ${
                        limit.status === 'available' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-purple-50 border-purple-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">{limit.tier}</span>
                        <Badge 
                          className={`text-xs font-medium ${
                            limit.status === 'available' 
                              ? 'bg-green-500 text-white hover:bg-green-600' 
                              : 'bg-purple-500 text-white hover:bg-purple-600'
                          }`}
                        >
                          {limit.label}
                        </Badge>
                      </div>
                      <span className={`text-sm font-medium ${
                        limit.status === 'available' ? 'text-green-700' : 'text-purple-700'
                      }`}>
                        {limit.requests}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Data Export</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Download search data in your preferred format:
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => downloadExport('json')} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export as JSON
                  </Button>
                  <Button 
                    onClick={() => downloadExport('csv')} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export as CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
