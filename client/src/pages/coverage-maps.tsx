import { ProviderCoverageMaps } from '@/components/provider-coverage-maps';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

export function CoverageMaps() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 px-4">
        <div className="text-center mb-6">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1 className="text-3xl font-bold">Provider Coverage Maps</h1>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/coverage-api-docs'}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              API Docs
            </Button>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Analyze network coverage and reliability in your area using real-time Downdetector data. 
            Get insights on provider performance based on user reports within 10km of your location.
          </p>
        </div>
        <ProviderCoverageMaps />
      </div>
    </div>
  );
}