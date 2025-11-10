import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, CheckCircle, XCircle, Loader2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BatchResult {
  imei: string;
  success: boolean;
  esimSupport: boolean | null;
  device: {
    make: string;
    model: string;
    year: number | null;
  } | null;
  source?: string;
  error?: string;
  warning?: string;
}

interface BatchResponse {
  success: boolean;
  summary: {
    total: number;
    processed: number;
    successful: number;
    errors: number;
    esimCompatible: number;
    esimNotCompatible: number;
  };
  results: BatchResult[];
}

interface BatchEsimCheckerProps {
  sessionToken: string;
}

export default function BatchEsimChecker({ sessionToken }: BatchEsimCheckerProps) {
  const [imeiList, setImeiList] = useState("");
  const [results, setResults] = useState<BatchResponse | null>(null);
  const { toast } = useToast();

  const batchCheckMutation = useMutation({
    mutationFn: async (imeis: string[]) => {
      const response = await fetch('/api/v1/esim-check/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imeis }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process batch');
      }
      
      return response.json();
    },
    onSuccess: (data: BatchResponse) => {
      setResults(data);
      toast({
        title: "Batch check completed",
        description: `Processed ${data.summary.processed} IMEIs. ${data.summary.esimCompatible} eSIM compatible.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Batch check failed",
        description: error.message || "Failed to process batch",
        variant: "destructive",
      });
    },
  });

  const handleBatchCheck = () => {
    const imeis = imeiList
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (imeis.length === 0) {
      toast({
        title: "No IMEIs provided",
        description: "Please enter at least one IMEI number",
        variant: "destructive",
      });
      return;
    }

    if (imeis.length > 100) {
      toast({
        title: "Too many IMEIs",
        description: "Maximum 100 IMEIs per batch",
        variant: "destructive",
      });
      return;
    }

    batchCheckMutation.mutate(imeis);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const imeis = text
        .split(/[\n,]/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      setImeiList(imeis.join('\n'));
      toast({
        title: "File loaded",
        description: `Loaded ${imeis.length} IMEI numbers`,
      });
    };
    reader.readAsText(file);
  };

  const exportToJSON = () => {
    if (!results) return;
    
    const dataStr = JSON.stringify(results, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esim-batch-check-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported to JSON",
      description: "Batch results downloaded successfully",
    });
  };

  const exportToCSV = () => {
    if (!results) return;
    
    const headers = ['IMEI', 'eSIM Support', 'Make', 'Model', 'Year', 'Source', 'Status', 'Error'];
    const rows = results.results.map(r => [
      r.imei,
      r.esimSupport === null ? 'Unknown' : r.esimSupport ? 'Yes' : 'No',
      r.device?.make || 'N/A',
      r.device?.model || 'N/A',
      r.device?.year || 'N/A',
      r.source || 'N/A',
      r.success ? 'Success' : 'Error',
      r.error || r.warning || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esim-batch-check-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported to CSV",
      description: "Batch results downloaded successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch eSIM Compatibility Checker</CardTitle>
          <CardDescription>
            Check eSIM support for multiple devices at once (max 100 IMEIs per batch)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Enter IMEIs (one per line)</label>
            <Textarea
              placeholder="013266008012345&#10;010400003012345&#10;352164118012345"
              value={imeiList}
              onChange={(e) => setImeiList(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              data-testid="textarea-batch-imei"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleBatchCheck}
              disabled={batchCheckMutation.isPending || !imeiList.trim()}
              data-testid="button-check-batch"
            >
              {batchCheckMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check Batch
                </>
              )}
            </Button>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="input-upload-file"
              />
              <Button variant="outline" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </span>
              </Button>
            </label>

            {results && (
              <>
                <Button
                  variant="outline"
                  onClick={exportToJSON}
                  data-testid="button-export-json"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>

                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  data-testid="button-export-csv"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Results</CardTitle>
            <CardDescription>
              Summary of {results.summary.total} IMEI checks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{results.summary.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-900">{results.summary.esimCompatible}</div>
                <div className="text-sm text-green-600">eSIM Compatible</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-900">{results.summary.esimNotCompatible}</div>
                <div className="text-sm text-red-600">Not Compatible</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Detailed Results</h4>
              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {results.results.map((result, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-gray-900">{result.imei}</code>
                          {result.success ? (
                            result.esimSupport ? (
                              <Badge className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                eSIM
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="w-3 h-3 mr-1" />
                                No eSIM
                              </Badge>
                            )
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Error
                            </Badge>
                          )}
                        </div>
                        {result.device && (
                          <div className="text-sm text-gray-600 mt-1">
                            {result.device.make} {result.device.model}
                            {result.device.year && ` (${result.device.year})`}
                          </div>
                        )}
                        {(result.error || result.warning) && (
                          <div className="text-xs text-red-600 mt-1">
                            {result.error || result.warning}
                          </div>
                        )}
                      </div>
                      {result.source && (
                        <Badge variant="outline" className="text-xs">
                          {result.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
