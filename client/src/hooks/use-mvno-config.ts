import { useQuery } from '@tanstack/react-query';

export interface MVNOConfig {
  name: string;
  companyName: string;
  website: string;
  phone: string;
  supportEmail: string;
  internationalCarrier: string;
}

const NEUTRAL_MVNO_CONFIG: MVNOConfig = {
  name: 'Network Services',
  companyName: 'Network Services Inc.',
  website: 'our website',
  phone: 'our support line',
  supportEmail: 'our support team',
  internationalCarrier: 'our network'
};

export function useMVNOConfig() {
  const { data, isLoading, error } = useQuery<MVNOConfig>({
    queryKey: ['/api/mvno-config'],
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    config: data || NEUTRAL_MVNO_CONFIG,
    isLoading,
    error
  };
}
