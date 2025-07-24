import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PolicyPDFDownload() {
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/api/generate-policy-pdf');
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'OXIO_Device_Compatibility_Policy.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Downloaded Successfully",
        description: "The OXIO Device Compatibility Policy has been downloaded to your device.",
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <CardTitle>Device Compatibility Policy</CardTitle>
        </div>
        <CardDescription>
          Download the complete OXIO device compatibility guide and pre-porting checklist
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-blue-800 dark:text-blue-200">
                Complete Policy Document
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                This comprehensive PDF includes device unlock requirements, technical specifications, 
                pre-porting checklist, and contact information to ensure a smooth transition to OXIO.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">What's Included:</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              Device compatibility requirements and technical specifications
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              Pre-porting checklist to avoid service interruptions
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              Device unlock process and requirements
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              Network band requirements and feature support
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              OXIO support contact information
            </li>
          </ul>
        </div>

        <Button onClick={handleDownloadPDF} className="w-full" size="lg">
          <Download className="w-5 h-5 mr-2" />
          Download Policy PDF
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          PDF version 2.0 | Updated January 2025 | Compatible with all devices
        </p>
      </CardContent>
    </Card>
  );
}