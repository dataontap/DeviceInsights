import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Key, Shield, Zap, Code, Book, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function IntegrationGuide() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Book className="w-10 h-10" />
            <h1 className="text-4xl font-bold">API Integration Guide</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl">
            Complete guide to integrating IMEI Device Checker API into your application
          </p>
          <div className="flex gap-4 mt-6">
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/api-docs'}
              data-testid="button-api-docs"
            >
              View API Docs
            </Button>
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              onClick={() => window.location.href = '/'}
              data-testid="button-home"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Quick Start */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-500" />
              <CardTitle className="text-2xl">Quick Start (5 Minutes)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2">Get API Key</h3>
                <p className="text-sm text-gray-600">
                  Visit <a href="/api-docs" className="text-blue-600 hover:underline">API Docs</a> and generate your key instantly
                </p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2">Add to Headers</h3>
                <p className="text-sm text-gray-600">
                  Include Bearer token in Authorization header
                </p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2">Start Building</h3>
                <p className="text-sm text-gray-600">
                  Make your first request and integrate!
                </p>
              </div>
            </div>

            <div className="bg-gray-900 text-white p-6 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Your first request (cURL)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(`curl -X POST https://your-domain.replit.app/api/v1/check \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "device": {
      "make": "Apple",
      "model": "iPhone 14 Pro",
      "imei": "013266008012345"
    }
  }'`, 'quick-start')}
                  className="text-white hover:bg-white/10"
                  data-testid="button-copy-quickstart"
                >
                  {copiedCode === 'quick-start' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <pre className="text-sm overflow-x-auto">
{`curl -X POST https://your-domain.replit.app/api/v1/check \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "device": {
      "make": "Apple",
      "model": "iPhone 14 Pro",
      "imei": "013266008012345"
    }
  }'`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Key className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-2xl">Authentication</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">How to Get Your API Key</h3>
              <ol className="space-y-3 list-decimal list-inside text-gray-700">
                <li>Navigate to the <a href="/api-docs" className="text-blue-600 hover:underline">API Documentation page</a></li>
                <li>Fill out the API key generation form:
                  <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-sm">
                    <li><strong>Email</strong> (required): Your contact email</li>
                    <li><strong>API Key Name</strong> (optional): Custom name or auto-generated (Key1, Key2...)</li>
                    <li><strong>Website/Description</strong> (optional): Where you'll use this key</li>
                  </ul>
                </li>
                <li>Click "Generate API Key" button</li>
                <li><strong className="text-red-600">IMPORTANT:</strong> Copy your key immediately - it's only shown once!</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">Security Warning</h4>
                  <p className="text-sm text-yellow-800">
                    API keys start with <code className="bg-yellow-100 px-1 rounded">imei_</code> prefix. 
                    Store them securely and never commit to version control. Use environment variables.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Using Your API Key</h3>
              <p className="text-gray-700 mb-4">
                Include your API key in the <code className="bg-gray-100 px-2 py-1 rounded text-sm">Authorization</code> header 
                using the Bearer token scheme:
              </p>

              <div className="bg-gray-900 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">HTTP Headers</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`Authorization: Bearer imei_your_api_key_here
Content-Type: application/json`, 'auth-headers')}
                    className="text-white hover:bg-white/10"
                    data-testid="button-copy-headers"
                  >
                    {copiedCode === 'auth-headers' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <pre className="text-sm">
{`Authorization: Bearer imei_your_api_key_here
Content-Type: application/json`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Code className="w-6 h-6 text-purple-600" />
              <CardTitle className="text-2xl">Code Examples</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="javascript" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="javascript" data-testid="tab-javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python" data-testid="tab-python">Python</TabsTrigger>
                <TabsTrigger value="nodejs" data-testid="tab-nodejs">Node.js</TabsTrigger>
                <TabsTrigger value="curl" data-testid="tab-curl">cURL</TabsTrigger>
              </TabsList>

              <TabsContent value="javascript" className="space-y-4">
                <div className="bg-gray-900 text-white p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">JavaScript (Fetch API)</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`const API_KEY = 'imei_your_api_key_here';
const BASE_URL = 'https://your-domain.replit.app';

async function checkIMEI(imei, make, model) {
  try {
    const response = await fetch(\`\${BASE_URL}/api/v1/check\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device: { make, model, imei }
      })
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    console.log('Device Info:', data);
    return data;
  } catch (error) {
    console.error('Error checking IMEI:', error);
    throw error;
  }
}

// Example usage
checkIMEI('013266008012345', 'Apple', 'iPhone 14 Pro')
  .then(result => console.log(result))
  .catch(error => console.error(error));`, 'js-fetch')}
                      className="text-white hover:bg-white/10"
                      data-testid="button-copy-javascript"
                    >
                      {copiedCode === 'js-fetch' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto">
{`const API_KEY = 'imei_your_api_key_here';
const BASE_URL = 'https://your-domain.replit.app';

async function checkIMEI(imei, make, model) {
  try {
    const response = await fetch(\`\${BASE_URL}/api/v1/check\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device: { make, model, imei }
      })
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    console.log('Device Info:', data);
    return data;
  } catch (error) {
    console.error('Error checking IMEI:', error);
    throw error;
  }
}

// Example usage
checkIMEI('013266008012345', 'Apple', 'iPhone 14 Pro')
  .then(result => console.log(result))
  .catch(error => console.error(error));`}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="python" className="space-y-4">
                <div className="bg-gray-900 text-white p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Python (requests library)</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`import requests
import os

API_KEY = os.getenv('IMEI_API_KEY', 'imei_your_api_key_here')
BASE_URL = 'https://your-domain.replit.app'

def check_imei(imei, make, model):
    """
    Check IMEI device compatibility
    
    Args:
        imei (str): 15-digit IMEI number
        make (str): Device manufacturer
        model (str): Device model name
    
    Returns:
        dict: Device compatibility information
    """
    url = f'{BASE_URL}/api/v1/check'
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    payload = {
        'device': {
            'make': make,
            'model': model,
            'imei': imei
        }
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        print(f'HTTP error occurred: {http_err}')
        raise
    except Exception as err:
        print(f'Other error occurred: {err}')
        raise

# Example usage
if __name__ == '__main__':
    result = check_imei('013266008012345', 'Apple', 'iPhone 14 Pro')
    print('Device Info:', result)`, 'python-requests')}
                      className="text-white hover:bg-white/10"
                      data-testid="button-copy-python"
                    >
                      {copiedCode === 'python-requests' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto">
{`import requests
import os

API_KEY = os.getenv('IMEI_API_KEY', 'imei_your_api_key_here')
BASE_URL = 'https://your-domain.replit.app'

def check_imei(imei, make, model):
    """
    Check IMEI device compatibility
    
    Args:
        imei (str): 15-digit IMEI number
        make (str): Device manufacturer
        model (str): Device model name
    
    Returns:
        dict: Device compatibility information
    """
    url = f'{BASE_URL}/api/v1/check'
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    payload = {
        'device': {
            'make': make,
            'model': model,
            'imei': imei
        }
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        print(f'HTTP error occurred: {http_err}')
        raise
    except Exception as err:
        print(f'Other error occurred: {err}')
        raise

# Example usage
if __name__ == '__main__':
    result = check_imei('013266008012345', 'Apple', 'iPhone 14 Pro')
    print('Device Info:', result)`}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="nodejs" className="space-y-4">
                <div className="bg-gray-900 text-white p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Node.js (axios)</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`const axios = require('axios');

const API_KEY = process.env.IMEI_API_KEY || 'imei_your_api_key_here';
const BASE_URL = 'https://your-domain.replit.app';

async function checkIMEI(imei, make, model) {
  try {
    const response = await axios.post(
      \`\${BASE_URL}/api/v1/check\`,
      {
        device: { make, model, imei }
      },
      {
        headers: {
          'Authorization': \`Bearer \${API_KEY}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Device Info:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      console.error('Error Response:', error.response.data);
      console.error('Status Code:', error.response.status);
    } else if (error.request) {
      // Request was made but no response
      console.error('No response received:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Example usage
checkIMEI('013266008012345', 'Apple', 'iPhone 14 Pro')
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Failed:', error));

module.exports = { checkIMEI };`, 'nodejs-axios')}
                      className="text-white hover:bg-white/10"
                      data-testid="button-copy-nodejs"
                    >
                      {copiedCode === 'nodejs-axios' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto">
{`const axios = require('axios');

const API_KEY = process.env.IMEI_API_KEY || 'imei_your_api_key_here';
const BASE_URL = 'https://your-domain.replit.app';

async function checkIMEI(imei, make, model) {
  try {
    const response = await axios.post(
      \`\${BASE_URL}/api/v1/check\`,
      {
        device: { make, model, imei }
      },
      {
        headers: {
          'Authorization': \`Bearer \${API_KEY}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Device Info:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      console.error('Error Response:', error.response.data);
      console.error('Status Code:', error.response.status);
    } else if (error.request) {
      // Request was made but no response
      console.error('No response received:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Example usage
checkIMEI('013266008012345', 'Apple', 'iPhone 14 Pro')
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Failed:', error));

module.exports = { checkIMEI };`}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="curl" className="space-y-4">
                <div className="bg-gray-900 text-white p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">cURL Command</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`curl -X POST https://your-domain.replit.app/api/v1/check \\
  -H "Authorization: Bearer imei_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "device": {
      "make": "Apple",
      "model": "iPhone 14 Pro",
      "imei": "013266008012345"
    }
  }'

# Get statistics
curl -X GET https://your-domain.replit.app/api/v1/stats \\
  -H "Authorization: Bearer imei_your_api_key_here"

# Export data (CSV)
curl -X GET "https://your-domain.replit.app/api/v1/export?format=csv&limit=100" \\
  -H "Authorization: Bearer imei_your_api_key_here" \\
  -o searches.csv

# Export data (JSON)
curl -X GET "https://your-domain.replit.app/api/v1/export?format=json&limit=100" \\
  -H "Authorization: Bearer imei_your_api_key_here" \\
  -o searches.json`, 'curl-examples')}
                      className="text-white hover:bg-white/10"
                      data-testid="button-copy-curl"
                    >
                      {copiedCode === 'curl-examples' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto">
{`curl -X POST https://your-domain.replit.app/api/v1/check \\
  -H "Authorization: Bearer imei_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "device": {
      "make": "Apple",
      "model": "iPhone 14 Pro",
      "imei": "013266008012345"
    }
  }'

# Get statistics
curl -X GET https://your-domain.replit.app/api/v1/stats \\
  -H "Authorization: Bearer imei_your_api_key_here"

# Export data (CSV)
curl -X GET "https://your-domain.replit.app/api/v1/export?format=csv&limit=100" \\
  -H "Authorization: Bearer imei_your_api_key_here" \\
  -o searches.csv

# Export data (JSON)
curl -X GET "https://your-domain.replit.app/api/v1/export?format=json&limit=100" \\
  -H "Authorization: Bearer imei_your_api_key_here" \\
  -o searches.json`}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Security Best Practices */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              <CardTitle className="text-2xl">Security Protocols</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">How We Protect Your Data</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">🔐 Key Hashing</h4>
                  <p className="text-sm text-green-800">
                    All API keys are stored using SHA-256 cryptographic hashing. We never store plain-text keys.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">🔒 HTTPS Only</h4>
                  <p className="text-sm text-blue-800">
                    All API requests must use HTTPS. Plain HTTP requests are automatically rejected.
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">🎯 Data Isolation</h4>
                  <p className="text-sm text-purple-800">
                    Each API key can only access its own data. Cross-key data access is impossible.
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">📊 Audit Logging</h4>
                  <p className="text-sm text-orange-800">
                    Every API request is logged with IP, timestamp, and user agent for security monitoring.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Best Practices for Developers</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">✓</div>
                  <div>
                    <strong className="text-gray-900">Use Environment Variables</strong>
                    <p className="text-sm text-gray-600">Store API keys in <code className="bg-gray-100 px-1 rounded">.env</code> files, never in source code</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">✓</div>
                  <div>
                    <strong className="text-gray-900">Add to .gitignore</strong>
                    <p className="text-sm text-gray-600">Ensure <code className="bg-gray-100 px-1 rounded">.env</code> is in your <code className="bg-gray-100 px-1 rounded">.gitignore</code> file</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">✓</div>
                  <div>
                    <strong className="text-gray-900">Rotate Keys Regularly</strong>
                    <p className="text-sm text-gray-600">Generate new keys periodically and deactivate old ones</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">✓</div>
                  <div>
                    <strong className="text-gray-900">Use HTTPS Only</strong>
                    <p className="text-sm text-gray-600">Always make requests over HTTPS to protect keys in transit</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">✓</div>
                  <div>
                    <strong className="text-gray-900">Server-Side Only</strong>
                    <p className="text-sm text-gray-600">Never expose API keys in client-side JavaScript or mobile apps</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Example .env file</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(`# IMEI API Configuration
IMEI_API_KEY=imei_your_api_key_here
IMEI_API_BASE_URL=https://your-domain.replit.app

# Don't commit this file to git!`, 'env-example')}
                  className="text-white hover:bg-white/10"
                  data-testid="button-copy-env"
                >
                  {copiedCode === 'env-example' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <pre className="text-sm">
{`# IMEI API Configuration
IMEI_API_KEY=imei_your_api_key_here
IMEI_API_BASE_URL=https://your-domain.replit.app

# Don't commit this file to git!`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-600" />
              <CardTitle className="text-2xl">Rate Limits</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border">Tier</th>
                    <th className="text-left p-3 border">Requests/Hour</th>
                    <th className="text-left p-3 border">Use Case</th>
                    <th className="text-left p-3 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border font-semibold">Standard</td>
                    <td className="p-3 border">100</td>
                    <td className="p-3 border">Individual developers, testing</td>
                    <td className="p-3 border">
                      <Badge className="bg-green-500">Active (Free Alpha)</Badge>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border font-semibold">MCP Server</td>
                    <td className="p-3 border">500</td>
                    <td className="p-3 border">Automated AI services</td>
                    <td className="p-3 border">
                      <Badge className="bg-green-500">Active</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 border font-semibold">Premium</td>
                    <td className="p-3 border">1,000</td>
                    <td className="p-3 border">Production applications</td>
                    <td className="p-3 border">
                      <Badge className="bg-green-500">Active</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Rate Limit Headers</h3>
              <p className="text-gray-700 mb-4">Every API response includes rate limit information in headers:</p>
              
              <div className="bg-gray-900 text-white p-4 rounded-lg">
                <pre className="text-sm">
{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Handling Rate Limits</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900 mb-2">
                  <strong>HTTP 429 Response:</strong> When you exceed your rate limit
                </p>
                <div className="bg-white p-3 rounded border border-yellow-300 mt-2">
                  <pre className="text-xs text-gray-800">
{`{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 3600
}`}
                  </pre>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-700"><strong>Best practices:</strong></p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                  <li>Implement exponential backoff when receiving 429 responses</li>
                  <li>Cache responses when possible to reduce API calls</li>
                  <li>Monitor <code className="bg-gray-100 px-1 rounded">X-RateLimit-Remaining</code> header</li>
                  <li>Spread requests evenly throughout the hour</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Handling */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <CardTitle className="text-2xl">Error Handling</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">HTTP Status Codes</h3>
              <div className="space-y-3">
                <div className="border border-green-200 bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-green-600">200</Badge>
                    <strong className="text-green-900">Success</strong>
                  </div>
                  <p className="text-sm text-green-800">Request completed successfully</p>
                </div>

                <div className="border border-orange-200 bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-orange-600">400</Badge>
                    <strong className="text-orange-900">Bad Request</strong>
                  </div>
                  <p className="text-sm text-orange-800">Invalid request format or missing required fields</p>
                </div>

                <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-red-600">401</Badge>
                    <strong className="text-red-900">Unauthorized</strong>
                  </div>
                  <p className="text-sm text-red-800">Invalid or missing API key</p>
                </div>

                <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-yellow-600">429</Badge>
                    <strong className="text-yellow-900">Rate Limit Exceeded</strong>
                  </div>
                  <p className="text-sm text-yellow-800">Too many requests - retry after cooldown period</p>
                </div>

                <div className="border border-purple-200 bg-purple-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-purple-600">500</Badge>
                    <strong className="text-purple-900">Internal Server Error</strong>
                  </div>
                  <p className="text-sm text-purple-800">Server error - please retry or contact support</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Error Response Format</h3>
              <div className="bg-gray-900 text-white p-4 rounded-lg">
                <pre className="text-sm">
{`{
  "error": "Error type",
  "message": "Human-readable error description",
  "details": ["Additional error details (optional)"],
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T12:00:00Z"
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Example Error Handling Code</h3>
              <div className="bg-gray-900 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">JavaScript Error Handling</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`async function checkIMEIWithErrorHandling(imei, make, model) {
  try {
    const response = await fetch(\`\${BASE_URL}/api/v1/check\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ device: { make, model, imei } })
    });

    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your credentials.');
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 3600;
      throw new Error(\`Rate limit exceeded. Retry after \${retryAfter} seconds.\`);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('IMEI check failed:', error.message);
    // Implement your error handling logic here
    throw error;
  }
}`, 'error-handling')}
                    className="text-white hover:bg-white/10"
                    data-testid="button-copy-error-handling"
                  >
                    {copiedCode === 'error-handling' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <pre className="text-sm overflow-x-auto">
{`async function checkIMEIWithErrorHandling(imei, make, model) {
  try {
    const response = await fetch(\`\${BASE_URL}/api/v1/check\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ device: { make, model, imei } })
    });

    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your credentials.');
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 3600;
      throw new Error(\`Rate limit exceeded. Retry after \${retryAfter} seconds.\`);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('IMEI check failed:', error.message);
    // Implement your error handling logic here
    throw error;
  }
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Need Help?</h3>
              <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                Have questions or need assistance with integration? We're here to help!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  onClick={() => window.location.href = '/api-docs'}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-view-api-docs"
                >
                  <Book className="w-4 h-4 mr-2" />
                  View Full API Docs
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/coverage-api-docs'}
                  data-testid="button-coverage-docs"
                >
                  View Coverage API Docs
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  data-testid="button-try-demo"
                >
                  Try Live Demo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 IMEI Device Checker. Built for developers, by developers.
          </p>
        </div>
      </div>
    </div>
  );
}
