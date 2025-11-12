import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Trash2, Download, List, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface BlacklistItem {
  id: number;
  imei: string;
  reason: string;
  blacklistedAt: string;
  addedBy: string;
}

export default function BlacklistDemo() {
  const [apiKey, setApiKey] = useState("");
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Add single IMEI
  const [addImei, setAddImei] = useState("");
  const [addReason, setAddReason] = useState("");
  
  // Remove IMEI
  const [removeImei, setRemoveImei] = useState("");
  
  // Bulk operations
  const [bulkData, setBulkData] = useState("");
  
  const { toast } = useToast();

  const makeRequest = async (url: string, options: RequestInit = {}) => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your API key first",
        variant: "destructive",
      });
      throw new Error("API key required");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
  };

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const data = await makeRequest('/api/v1/blacklist');
      setBlacklist(data.blacklist || []);
      toast({
        title: "Success",
        description: `Loaded ${data.count} blacklisted IMEIs`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch blacklist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddImei = async () => {
    if (!addImei || !addReason) {
      toast({
        title: "Validation Error",
        description: "Please provide both IMEI and reason",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await makeRequest('/api/v1/blacklist', {
        method: 'POST',
        body: JSON.stringify({
          imei: addImei,
          reason: addReason,
          scope: 'local'
        }),
      });
      
      toast({
        title: "Success",
        description: "IMEI added to blacklist",
      });
      
      setAddImei("");
      setAddReason("");
      fetchBlacklist();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add IMEI",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImei = async () => {
    if (!removeImei) {
      toast({
        title: "Validation Error",
        description: "Please provide an IMEI",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await makeRequest(`/api/v1/blacklist/${removeImei}`, {
        method: 'DELETE',
      });
      
      toast({
        title: "Success",
        description: "IMEI removed from blacklist",
      });
      
      setRemoveImei("");
      fetchBlacklist();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove IMEI",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkData) {
      toast({
        title: "Validation Error",
        description: "Please provide bulk data",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Parse CSV or JSON
      let imeis;
      try {
        // Try JSON first
        imeis = JSON.parse(bulkData);
      } catch {
        // Parse as CSV
        const lines = bulkData.split('\n').filter(line => line.trim());
        const hasHeader = lines[0].toLowerCase().includes('imei');
        const dataLines = hasHeader ? lines.slice(1) : lines;
        
        imeis = dataLines.map(line => {
          const [imei, reason] = line.split(',').map(s => s.trim().replace(/"/g, ''));
          return { imei, reason: reason || 'Bulk import' };
        });
      }

      const data = await makeRequest('/api/v1/blacklist/bulk', {
        method: 'POST',
        body: JSON.stringify({ imeis }),
      });
      
      toast({
        title: "Success",
        description: `Processed ${data.processed} IMEIs: ${data.added} added, ${data.skipped} skipped`,
      });
      
      setBulkData("");
      fetchBlacklist();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process bulk operation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/blacklist/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blacklist-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: `Blacklist exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Blacklist API Demo
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Test and explore the IMEI blacklist management APIs
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>API Authentication</CardTitle>
            <CardDescription>
              Enter your API key to test the blacklist endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="password"
                  placeholder="Enter your API key (imei_...)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  data-testid="input-api-key"
                />
              </div>
              <Button
                onClick={fetchBlacklist}
                disabled={!apiKey || loading}
                data-testid="button-fetch-blacklist"
              >
                <List className="h-4 w-4 mr-2" />
                Load Blacklist
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="list">View List</TabsTrigger>
            <TabsTrigger value="add">Add IMEI</TabsTrigger>
            <TabsTrigger value="remove">Remove IMEI</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Blacklisted IMEIs</CardTitle>
                    <CardDescription>
                      {blacklist.length} items in your local blacklist
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExport('json')}
                      disabled={!apiKey || loading || blacklist.length === 0}
                      data-testid="button-export-json"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExport('csv')}
                      disabled={!apiKey || loading || blacklist.length === 0}
                      data-testid="button-export-csv"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {blacklist.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No blacklisted IMEIs. Add some using the "Add IMEI" tab.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {blacklist.map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-mono font-bold text-lg">{item.imei}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {item.reason}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Added by {item.addedBy} on{' '}
                              {new Date(item.blacklistedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add IMEI to Blacklist</CardTitle>
                <CardDescription>
                  Add a single IMEI to your local blacklist
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="add-imei">IMEI (15 digits)</Label>
                  <Input
                    id="add-imei"
                    placeholder="123456789012345"
                    value={addImei}
                    onChange={(e) => setAddImei(e.target.value)}
                    maxLength={15}
                    data-testid="input-add-imei"
                  />
                </div>
                <div>
                  <Label htmlFor="add-reason">Reason</Label>
                  <Input
                    id="add-reason"
                    placeholder="Reported stolen device"
                    value={addReason}
                    onChange={(e) => setAddReason(e.target.value)}
                    data-testid="input-add-reason"
                  />
                </div>
                <Button
                  onClick={handleAddImei}
                  disabled={!apiKey || loading}
                  className="w-full"
                  data-testid="button-add-imei"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Blacklist
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="remove">
            <Card>
              <CardHeader>
                <CardTitle>Remove IMEI from Blacklist</CardTitle>
                <CardDescription>
                  Remove a single IMEI from your local blacklist
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="remove-imei">IMEI (15 digits)</Label>
                  <Input
                    id="remove-imei"
                    placeholder="123456789012345"
                    value={removeImei}
                    onChange={(e) => setRemoveImei(e.target.value)}
                    maxLength={15}
                    data-testid="input-remove-imei"
                  />
                </div>
                <Button
                  onClick={handleRemoveImei}
                  disabled={!apiKey || loading}
                  variant="destructive"
                  className="w-full"
                  data-testid="button-remove-imei"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from Blacklist
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Operations</CardTitle>
                <CardDescription>
                  Add multiple IMEIs at once (max 100). Supports JSON or CSV format.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bulk-data">Bulk Data</Label>
                  <Textarea
                    id="bulk-data"
                    placeholder={`JSON format:\n[{"imei": "123456789012345", "reason": "Stolen"},{"imei": "987654321098765", "reason": "Fraud"}]\n\nCSV format:\nimei,reason\n123456789012345,Reported stolen\n987654321098765,Fraudulent activity`}
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                    data-testid="textarea-bulk-data"
                  />
                </div>
                <Button
                  onClick={handleBulkAdd}
                  disabled={!apiKey || loading}
                  className="w-full"
                  data-testid="button-bulk-add"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Process Bulk Operation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>API Reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold">GET /api/v1/blacklist</p>
              <p className="text-gray-600">Retrieve all blacklisted IMEIs</p>
            </div>
            <div>
              <p className="font-semibold">POST /api/v1/blacklist</p>
              <p className="text-gray-600">Add an IMEI to blacklist</p>
            </div>
            <div>
              <p className="font-semibold">DELETE /api/v1/blacklist/:imei</p>
              <p className="text-gray-600">Remove an IMEI from blacklist</p>
            </div>
            <div>
              <p className="font-semibold">POST /api/v1/blacklist/bulk</p>
              <p className="text-gray-600">Bulk add IMEIs (max 100)</p>
            </div>
            <div>
              <p className="font-semibold">GET /api/v1/blacklist/export?format=csv|json</p>
              <p className="text-gray-600">Export blacklist data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
