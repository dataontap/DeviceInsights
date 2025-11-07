interface IpApiResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

export async function getLocationFromIp(ipAddress: string): Promise<{
  location: string;
  coordinates: { lat: number; lng: number };
  country: string;
  city: string;
  region: string;
} | null> {
  try {
    if (!ipAddress || ipAddress === 'unknown' || ipAddress === '::1' || ipAddress === '127.0.0.1') {
      console.log('[IP-GEO] Invalid or local IP address, skipping geolocation');
      return null;
    }

    const cleanIp = ipAddress.replace(/^::ffff:/, '');
    
    console.log(`[IP-GEO] Fetching geolocation for IP: ${cleanIp}`);
    
    const response = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`[IP-GEO] HTTP error ${response.status}`);
      return null;
    }

    const data: IpApiResponse = await response.json();

    if (data.status !== 'success') {
      console.error('[IP-GEO] Geolocation lookup failed:', data);
      return null;
    }

    const location = [data.city, data.regionName, data.country]
      .filter(Boolean)
      .join(', ');

    console.log(`[IP-GEO] Successfully resolved ${cleanIp} to ${location}`);

    return {
      location,
      coordinates: {
        lat: data.lat,
        lng: data.lon
      },
      country: data.country,
      city: data.city,
      region: data.regionName
    };
  } catch (error) {
    console.error('[IP-GEO] Error fetching geolocation:', error);
    return null;
  }
}
