import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Copy, ExternalLink, BookOpen, Zap, Shield, Map, MessageSquare } from 'lucide-react';
import { useState } from 'react';

export function CoverageApiDocs() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const jsExample = `const analyzeCoverage = async (lat, lng, provider = 'auto') => {
  const response = await fetch('/api/coverage/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${apiKey}\`
    },
    body: JSON.stringify({
      lat: lat,
      lng: lng,
      provider: provider
    })
  });
  
  const result = await response.json();
  return result.data;
};`;

  const pythonExample = `import requests

def analyze_coverage(lat, lng, api_key, provider='auto'):
    url = 'https://your-domain.replit.app/api/coverage/analyze'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }
    data = {
        'lat': lat,
        'lng': lng,
        'provider': provider
    }
    
    response = requests.post(url, headers=headers, json=data)
    return response.json()`;

  const curlExample = `curl -X POST https://your-domain.replit.app/api/coverage/analyze \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your_api_key" \\
  -d '{
    "lat": 43.6532,
    "lng": -79.3832,
    "address": "Toronto, ON, Canada",
    "provider": "Rogers"
  }'`;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Map className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Coverage Maps API</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comprehensive network coverage analysis with AI-powered insights for mobile carriers and broadband providers worldwide.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant="secondary" className="text-sm">
            <Zap className="h-3 w-3 mr-1" />
            Real-time Analysis
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Shield className="h-3 w-3 mr-1" />
            Secure API
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <MessageSquare className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
              <h3 className="font-semibold mb-1">Get API Key</h3>
              <p className="text-sm text-muted-foreground">Generate your API key from the API Keys page</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">2</div>
              <h3 className="font-semibold mb-1">Make Request</h3>
              <p className="text-sm text-muted-foreground">Send POST request with coordinates and provider</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">3</div>
              <h3 className="font-semibold mb-1">Get Results</h3>
              <p className="text-sm text-muted-foreground">Receive coverage scores and AI analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Coverage Analysis Endpoint */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">POST</Badge>
                  <code className="text-sm">/api/coverage/analyze</code>
                </div>
                <Badge variant="outline">Primary</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Analyze network coverage for mobile carriers and broadband providers at a specific location.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm">
                <h4 className="font-semibold mb-2">Request Body:</h4>
                <pre className="text-xs overflow-x-auto">{`{
  "lat": 43.6532,
  "lng": -79.3832,
  "address": "Toronto, ON, Canada",
  "provider": "Rogers"
}`}</pre>
              </div>
            </div>

            {/* Issue Analysis Endpoint */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500">POST</Badge>
                  <code className="text-sm">/api/coverage/analyze-issue</code>
                </div>
                <Badge variant="outline">AI Analysis</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Report network issues and get AI-powered analysis with similar problem detection.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm">
                <h4 className="font-semibold mb-2">Request Body:</h4>
                <pre className="text-xs overflow-x-auto">{`{
  "lat": 43.6532,
  "lng": -79.3832,
  "issue_description": "Frequent call drops during peak hours"
}`}</pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Code Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="javascript" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>
            
            <TabsContent value="javascript" className="space-y-4">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => copyToClipboard(jsExample, 'js')}
                >
                  {copiedCode === 'js' ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{jsExample}</code>
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="python" className="space-y-4">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => copyToClipboard(pythonExample, 'python')}
                >
                  {copiedCode === 'python' ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{pythonExample}</code>
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="curl" className="space-y-4">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => copyToClipboard(curlExample, 'curl')}
                >
                  {copiedCode === 'curl' ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{curlExample}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Map className="h-4 w-4 text-blue-600" />
              Geographic Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• US, Canada & International</li>
              <li>• Auto-detect country providers</li>
              <li>• 10km radius analysis</li>
              <li>• GPS coordinate support</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 30-minute response caching</li>
              <li>• 100 requests/hour limit</li>
              <li>• Real-time analysis</li>
              <li>• Optimized for speed</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              AI Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Issue pattern recognition</li>
              <li>• Device-specific analysis</li>
              <li>• Confidence scoring</li>
              <li>• Similar problem detection</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Support & Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Get Help</h3>
              <p className="text-sm text-muted-foreground mb-3">Technical support and questions</p>
              <Button variant="outline" size="sm" onClick={() => window.open('mailto:rbm@dotmobile.app', '_blank')}>
                <ExternalLink className="h-4 w-4 mr-1" />
                rbm@dotmobile.app
              </Button>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Interactive Testing</h3>
              <p className="text-sm text-muted-foreground mb-3">Test API endpoints live</p>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/coverage-maps'}>
                <Map className="h-4 w-4 mr-1" />
                Coverage Maps
              </Button>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Full Documentation</h3>
              <p className="text-sm text-muted-foreground mb-3">Complete API reference</p>
              <Button variant="outline" size="sm" onClick={() => window.open('/COVERAGE_MAPS_API_DOCUMENTATION.md', '_blank')}>
                <BookOpen className="h-4 w-4 mr-1" />
                View Docs
              </Button>
            </div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Alpha Status:</strong> This API is currently in Alpha. Results are experimental and should be verified with additional sources for critical decisions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}