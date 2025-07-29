import { ProviderCoverageMaps } from '@/components/provider-coverage-maps';

export function CoverageMaps() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Provider Coverage Maps</h1>
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