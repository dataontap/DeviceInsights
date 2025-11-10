// MVNO Configuration from environment secrets
export interface MVNOConfig {
  name: string;
  companyName: string;
  domain: string;
  supportEmail: string;
  fromEmail: string;
  phone: string;
  website: string;
  internationalCarrier: string;
}

// Default DOTM values as fallback
const DEFAULTS: MVNOConfig = {
  name: 'DOTM',
  companyName: 'Data On Tap Inc.',
  domain: 'dotmobile.app',
  supportEmail: 'rbm@dotmobile.app',
  fromEmail: 'rbm@dotmobile.app',
  phone: '1-800-DOTM-HELP',
  website: 'gorse.dotmobile.app',
  internationalCarrier: 'DOTM (International)'
};

function parseMVNOConfig(): MVNOConfig {
  const fullMvno = process.env.FULL_MVNO;
  
  if (!fullMvno) {
    console.log('FULL_MVNO secret not found, using default DOTM values');
    return DEFAULTS;
  }

  try {
    const config = JSON.parse(fullMvno);
    
    return {
      name: config.name || config.brandName || DEFAULTS.name,
      companyName: config.companyName || config.legalName || DEFAULTS.companyName,
      domain: config.domain || config.primaryDomain || DEFAULTS.domain,
      supportEmail: config.supportEmail || config.email || DEFAULTS.supportEmail,
      fromEmail: config.fromEmail || config.supportEmail || config.email || DEFAULTS.fromEmail,
      phone: config.phone || config.supportPhone || DEFAULTS.phone,
      website: config.website || config.url || `${config.domain || DEFAULTS.domain}`.replace('.app', '.com'),
      internationalCarrier: config.internationalCarrier || config.carrierName || `${config.name || DEFAULTS.name} (International)`
    };
  } catch (error) {
    console.warn('⚠️  Failed to parse FULL_MVNO as JSON, using as simple string value');
    
    // If it's just a simple string, use it as the brand name
    return {
      ...DEFAULTS,
      name: fullMvno.trim(),
      internationalCarrier: `${fullMvno.trim()} (International)`
    };
  }
}

export const MVNO = parseMVNOConfig();

// Log the loaded configuration (without sensitive data)
console.log('📱 MVNO Configuration loaded:', {
  name: MVNO.name,
  companyName: MVNO.companyName,
  domain: MVNO.domain,
  website: MVNO.website
});
