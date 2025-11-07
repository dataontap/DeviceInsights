import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, DollarSign, Wifi, Smartphone, Loader2, MapPin, Signal, Zap, Clock } from "lucide-react";
import { getCoverageMapUrl } from "@shared/coverage-maps";

interface PricingPlan {
  carrier: string;
  planName: string;
  monthlyPrice: number;
  data: string;
  speed: string;
  features: string[];
  contractType: "prepaid" | "postpaid";
  additionalFees?: string;
  promotions?: string;
}

interface CoverageQuality {
  threeG?: {
    available: boolean;
    signalStrength: number;
    downloadSpeed: string;
    uploadSpeed: string;
    latency: string;
    quality: "excellent" | "good" | "fair" | "poor" | "no_coverage";
  };
  fourG?: {
    available: boolean;
    signalStrength: number;
    downloadSpeed: string;
    uploadSpeed: string;
    latency: string;
    quality: "excellent" | "good" | "fair" | "poor" | "no_coverage";
  };
  fiveG?: {
    available: boolean;
    signalStrength: number;
    downloadSpeed: string;
    uploadSpeed: string;
    latency: string;
    quality: "excellent" | "good" | "fair" | "poor" | "no_coverage";
  };
}

interface PricingComparisonProps {
  country: string;
  carriers?: string[];
  compatibleCarriers?: string[];
  location?: string;
  coordinates?: { lat: number; lng: number };
}

export function PricingComparison({ country, carriers, compatibleCarriers = [], location, coordinates }: PricingComparisonProps) {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityData, setQualityData] = useState<Record<string, CoverageQuality>>({});

  useEffect(() => {
    fetchPricing();
  }, [country, carriers]);

  useEffect(() => {
    if (location && plans.length > 0) {
      fetchCoverageQuality();
    }
  }, [location, plans]);

  const fetchPricing = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/pricing-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country,
          carriers: carriers || [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pricing plans');
      }

      const data = await response.json();
      setPlans(data.plans || []);
      setCurrency(data.currency || "USD");
    } catch (err) {
      console.error('Pricing fetch error:', err);
      setError('Unable to load pricing information. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoverageQuality = async () => {
    try {
      const carrierNames = plans.map(p => p.carrier);
      
      const response = await fetch('/api/coverage-quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          carriers: carrierNames,
          location: location,
          coordinates: coordinates,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQualityData(data.data || {});
      }
    } catch (err) {
      console.error('Coverage quality fetch error:', err);
    }
  };

  const isCarrierCompatible = (carrier: string): boolean => {
    return compatibleCarriers.some(c => c.toLowerCase() === carrier.toLowerCase());
  };

  const formatPrice = (price: number): string => {
    const currencySymbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      CAD: "CA$",
      AUD: "A$",
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${price}`;
  };

  const getQualityColor = (quality: string): string => {
    switch (quality) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'fair': return 'text-yellow-600 dark:text-yellow-400';
      case 'poor': return 'text-orange-600 dark:text-orange-400';
      case 'no_coverage': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSignalBars = (strength: number): JSX.Element => {
    const bars = Math.ceil(strength / 25);
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 ${
              bar <= bars ? 'bg-current' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            style={{ height: `${bar * 3 + 3}px` }}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Loading pricing plans...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-orange-200 bg-orange-50">
        <CardContent className="py-6">
          <p className="text-orange-800 text-center">{error}</p>
          <div className="flex justify-center mt-4">
            <Button onClick={fetchPricing} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (plans.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="py-6">
          <p className="text-gray-600 text-center">No pricing plans available for this region.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="pricing-comparison">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Network Plans in {country}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Compare pricing and features across carriers
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, index) => {
          const isCompatible = isCarrierCompatible(plan.carrier);
          const coverageMapUrl = getCoverageMapUrl(plan.carrier);
          const quality = qualityData[plan.carrier];
          
          return (
            <Card
              key={`${plan.carrier}-${plan.planName}-${index}`}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                isCompatible 
                  ? 'border-2 border-green-500 dark:border-green-600' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              data-testid={`card-plan-${index}`}
            >
              {isCompatible && (
                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                  Compatible
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl mb-1" data-testid={`text-carrier-${index}`}>
                        {plan.carrier}
                      </CardTitle>
                      {coverageMapUrl && (
                        <a
                          href={coverageMapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-7 w-7"
                          title="View Coverage Map"
                          data-testid={`button-coverage-map-${index}`}
                        >
                          <MapPin className="h-4 w-4 text-primary" />
                        </a>
                      )}
                    </div>
                    <CardDescription data-testid={`text-plan-name-${index}`}>
                      {plan.planName}
                    </CardDescription>
                  </div>
                  <Badge variant={plan.contractType === 'prepaid' ? 'secondary' : 'default'}>
                    {plan.contractType}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid={`text-price-${index}`}>
                      {formatPrice(plan.monthlyPrice)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  {plan.additionalFees && (
                    <p className="text-xs text-gray-500 mt-1">{plan.additionalFees}</p>
                  )}
                </div>

                {/* Data & Speed */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Wifi className="h-4 w-4 text-primary" />
                    <span className="font-medium">{plan.data}</span>
                    <Badge variant="outline" className="ml-auto">{plan.speed}</Badge>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-4">
                  {plan.features.slice(0, 4).map((feature, fIndex) => (
                    <div 
                      key={fIndex} 
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      data-testid={`text-feature-${index}-${fIndex}`}
                    >
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Coverage Quality Metrics */}
                {quality && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Network Quality in {location}</p>
                    
                    {/* 5G */}
                    {quality.fiveG?.available && (
                      <div className="flex items-center justify-between text-xs" data-testid={`quality-5g-${index}`}>
                        <div className="flex items-center gap-2">
                          <Signal className="h-3 w-3" />
                          <span className="font-medium">5G</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1 ${getQualityColor(quality.fiveG.quality)}`}>
                            {getSignalBars(quality.fiveG.signalStrength)}
                            <span className="text-xs">{quality.fiveG.signalStrength}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">{quality.fiveG.downloadSpeed}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4G */}
                    {quality.fourG?.available && (
                      <div className="flex items-center justify-between text-xs" data-testid={`quality-4g-${index}`}>
                        <div className="flex items-center gap-2">
                          <Signal className="h-3 w-3" />
                          <span className="font-medium">4G LTE</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1 ${getQualityColor(quality.fourG.quality)}`}>
                            {getSignalBars(quality.fourG.signalStrength)}
                            <span className="text-xs">{quality.fourG.signalStrength}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">{quality.fourG.downloadSpeed}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3G */}
                    {quality.threeG?.available && (
                      <div className="flex items-center justify-between text-xs" data-testid={`quality-3g-${index}`}>
                        <div className="flex items-center gap-2">
                          <Signal className="h-3 w-3" />
                          <span className="font-medium">3G</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1 ${getQualityColor(quality.threeG.quality)}`}>
                            {getSignalBars(quality.threeG.signalStrength)}
                            <span className="text-xs">{quality.threeG.signalStrength}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">{quality.threeG.downloadSpeed}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Promotions */}
                {plan.promotions && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                      {plan.promotions}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 text-center mt-6">
        Prices and plans are approximate and subject to change. Contact carriers directly for exact pricing and availability.
      </p>
    </div>
  );
}
