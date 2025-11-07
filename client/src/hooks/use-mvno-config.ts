import { useQuery } from '@tanstack/react-query';

export interface MVNOConfig {
  name: string;
  companyName: string;
  website: string;
  phone: string;
  supportEmail: string;
  internationalCarrier: string;
}

const DEFAULT_MVNO_CONFIG: MVNOConfig = {
  name: 'DOTM',
  companyName: 'DOTM Inc.',
  website: 'dotm.com',
  phone: '1-800-DOTM-HELP',
  supportEmail: 'rbm@dotmobile.app',
  internationalCarrier: 'DOTM'
};

export function useMVNOConfig() {
  const { data, isLoading } = useQuery<MVNOConfig>({
    queryKey: ['/api/mvno-config'],
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    config: data || DEFAULT_MVNO_CONFIG,
    isLoading
  };
}
