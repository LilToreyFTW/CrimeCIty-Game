import axios from 'axios';
import { dbGet, dbRun, dbAll } from '../database/init.js';

// VPN detection using multiple services
export async function detectVPN(ipAddress) {
  try {
    // Check cache first
    const cached = await dbGet(
      'SELECT * FROM vpn_cache WHERE ip_address = ? AND expires_at > CURRENT_TIMESTAMP',
      [ipAddress]
    );

    if (cached) {
      return {
        isVpn: cached.is_vpn === 1,
        isProxy: cached.is_proxy === 1,
        provider: cached.provider,
        isMetered: cached.is_metered === 1,
        country: null,
        region: null,
        city: null
      };
    }

    // Use multiple services for better detection
    const [ipifyResult, ipapiResult, vpnapiResult] = await Promise.allSettled([
      getIPInfoFromIpify(ipAddress),
      getIPInfoFromIpapi(ipAddress),
      getIPInfoFromVpnApi(ipAddress)
    ]);

    const ipifyData = ipifyResult.status === 'fulfilled' ? ipifyResult.value : null;
    const ipapiData = ipapiResult.status === 'fulfilled' ? ipapiResult.value : null;
    const vpnapiData = vpnapiResult.status === 'fulfilled' ? vpnapiResult.value : null;

    // Combine results with enhanced detection
    const detectionResult = combineDetectionResults(ipifyData, ipapiData, vpnapiData, ipAddress);
    
    // Cache the result for 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await dbRun(
      `INSERT OR REPLACE INTO vpn_cache (ip_address, is_vpn, is_proxy, provider, is_metered, cached_at, expires_at) 
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      [ipAddress, detectionResult.isVpn, detectionResult.isProxy, detectionResult.provider, detectionResult.isMetered, expiresAt.toISOString()]
    );

    return detectionResult;

  } catch (error) {
    console.error('VPN detection error:', error);
    return {
      isVpn: false,
      isProxy: false,
      provider: null,
      isMetered: false,
      country: null,
      region: null,
      city: null
    };
  }
}

// Enhanced VPN detection combining multiple sources
function combineDetectionResults(ipifyData, ipapiData, vpnapiData, ipAddress) {
  // Known VPN providers to detect
  const knownVpnProviders = [
    'proton vpn', 'protonvpn', 'proton technologies',
    'nord vpn', 'nordvpn', 'nord security',
    'express vpn', 'expressvpn', 'express vpn ltd',
    'cyberghost', 'cyberghost vpn', 'cyberghost srl',
    'ip vanish', 'ipvanish', 'ipvanish vpn',
    'surfshark', 'surfshark vpn',
    'private internet access', 'pia vpn',
    'tunnelbear', 'windscribe', 'mullvad',
    'vpn', 'proxy', 'hosting', 'datacenter'
  ];

  // Check all data sources
  const allProviders = [
    ipifyData?.provider,
    ipapiData?.provider,
    vpnapiData?.provider
  ].filter(Boolean).map(p => p.toLowerCase());

  const allOrgs = [
    ipifyData?.org,
    ipapiData?.org,
    vpnapiData?.org
  ].filter(Boolean).map(o => o.toLowerCase());

  // Check for known VPN providers
  let detectedProvider = null;
  let isVpn = false;
  let isProxy = false;
  let isMetered = false;

  // Check provider names against known VPNs
  for (const provider of allProviders) {
    for (const knownVpn of knownVpnProviders) {
      if (provider.includes(knownVpn)) {
        isVpn = true;
        detectedProvider = provider;
        break;
      }
    }
    if (isVpn) break;
  }

  // Check organization names
  if (!isVpn) {
    for (const org of allOrgs) {
      for (const knownVpn of knownVpnProviders) {
        if (org.includes(knownVpn)) {
          isVpn = true;
          detectedProvider = org;
          break;
        }
      }
      if (isVpn) break;
    }
  }

  // Check for proxy indicators
  isProxy = allProviders.some(p => 
    p.includes('proxy') || p.includes('tor') || p.includes('anonymizer')
  ) || allOrgs.some(o => 
    o.includes('proxy') || o.includes('tor') || o.includes('anonymizer')
  );

  // Check for metered connection (mobile/hotspot)
  isMetered = allProviders.some(p => 
    p.includes('mobile') || p.includes('cellular') || p.includes('lte') || 
    p.includes('4g') || p.includes('5g') || p.includes('hotspot')
  ) || allOrgs.some(o => 
    o.includes('mobile') || o.includes('cellular') || o.includes('lte') || 
    o.includes('4g') || o.includes('5g') || o.includes('hotspot')
  );

  // Combine boolean results from all sources
  const finalIsVpn = isVpn || (ipifyData?.isVpn || false) || (ipapiData?.isVpn || false) || (vpnapiData?.isVpn || false);
  const finalIsProxy = isProxy || (ipifyData?.isProxy || false) || (ipapiData?.isProxy || false) || (vpnapiData?.isProxy || false);

  return {
    isVpn: finalIsVpn,
    isProxy: finalIsProxy,
    provider: detectedProvider || ipifyData?.provider || ipapiData?.provider || vpnapiData?.provider,
    isMetered: isMetered,
    country: ipifyData?.country || ipapiData?.country || vpnapiData?.country,
    region: ipifyData?.region || ipapiData?.region || vpnapiData?.region,
    city: ipifyData?.city || ipapiData?.city || vpnapiData?.city
  };
}

// Get IP info from ipify.org
async function getIPInfoFromIpify(ipAddress) {
  try {
    const response = await axios.get(`https://api.ipify.org?format=json&ip=${ipAddress}`, {
      timeout: 5000
    });
    
    // ipify.org doesn't provide VPN detection directly
    // This is a placeholder - you'd need to use a different service
    return {
      isVpn: false,
      isProxy: false,
      provider: null,
      country: null,
      region: null,
      city: null
    };
  } catch (error) {
    console.error('Ipify API error:', error);
    return null;
  }
}

// Get IP info from ipapi.co
async function getIPInfoFromIpapi(ipAddress) {
  try {
    const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`, {
      timeout: 5000
    });

    const data = response.data;
    
    // Check for VPN/Proxy indicators
    const isVpn = data.org?.toLowerCase().includes('vpn') || 
                  data.org?.toLowerCase().includes('proxy') ||
                  data.org?.toLowerCase().includes('hosting') ||
                  data.org?.toLowerCase().includes('datacenter');

    const isProxy = data.org?.toLowerCase().includes('proxy') ||
                   data.org?.toLowerCase().includes('tor');

    return {
      isVpn,
      isProxy,
      provider: data.org,
      org: data.org,
      country: data.country_name,
      region: data.region,
      city: data.city
    };
  } catch (error) {
    console.error('Ipapi API error:', error);
    return null;
  }
}

// Get IP info from VPN API (additional service)
async function getIPInfoFromVpnApi(ipAddress) {
  try {
    const response = await axios.get(`https://vpnapi.io/api/${ipAddress}?key=your-api-key`, {
      timeout: 5000
    });

    const data = response.data;
    
    return {
      isVpn: data.security?.vpn || false,
      isProxy: data.security?.proxy || false,
      provider: data.network?.organization || null,
      org: data.network?.organization || null,
      country: data.location?.country || null,
      region: data.location?.region || null,
      city: data.location?.city || null
    };
  } catch (error) {
    console.error('VPN API error:', error);
    return null;
  }
}

// Check IP history for existing accounts
export async function checkIPHistory(ipAddress) {
  try {
    const accounts = await dbAll(
      'SELECT username, created_at, last_login FROM users WHERE ip_address = ?',
      [ipAddress]
    );
    return accounts;
  } catch (error) {
    console.error('IP history check error:', error);
    return [];
  }
}

// Get user's IP history
export async function getUserIPHistory(userId) {
  try {
    const history = await dbAll(
      `SELECT ip_address, first_seen, last_seen, is_vpn, is_proxy, country, region, city 
       FROM ip_tracking WHERE user_id = ? ORDER BY last_seen DESC`,
      [userId]
    );
    return history;
  } catch (error) {
    console.error('User IP history error:', error);
    return [];
  }
}

// Check for suspicious login patterns
export async function checkSuspiciousActivity(ipAddress, userId) {
  try {
    // Check for multiple failed login attempts
    const failedAttempts = await dbAll(
      'SELECT COUNT(*) as count FROM login_attempts WHERE ip_address = ? AND success = 0 AND timestamp > datetime("now", "-1 hour")',
      [ipAddress]
    );

    // Check for VPN usage in recent logins
    const vpnAttempts = await dbAll(
      'SELECT COUNT(*) as count FROM login_attempts WHERE ip_address = ? AND is_vpn = 1 AND timestamp > datetime("now", "-24 hours")',
      [ipAddress]
    );

    return {
      failedAttempts: failedAttempts[0]?.count || 0,
      vpnAttempts: vpnAttempts[0]?.count || 0,
      isSuspicious: (failedAttempts[0]?.count || 0) > 5 || (vpnAttempts[0]?.count || 0) > 0
    };
  } catch (error) {
    console.error('Suspicious activity check error:', error);
    return { failedAttempts: 0, vpnAttempts: 0, isSuspicious: false };
  }
}

// Check if user is using metered connection and enforce same account rule
export async function checkMeteredConnection(userId, ipAddress) {
  try {
    // Check if user has a registered metered connection
    const meteredConnection = await dbGet(
      'SELECT * FROM metered_connections WHERE user_id = ? AND is_active = 1',
      [userId]
    );

    if (meteredConnection) {
      // Check if current IP matches the registered metered connection
      if (meteredConnection.ip_address !== ipAddress) {
        return {
          isMetered: true,
          isAllowed: false,
          message: 'You must use the same metered connection (mobile/hotspot) that you registered with',
          registeredIP: meteredConnection.ip_address,
          currentIP: ipAddress
        };
      }
      
      // Update last used time
      await dbRun(
        'UPDATE metered_connections SET last_used = CURRENT_TIMESTAMP WHERE id = ?',
        [meteredConnection.id]
      );

      return {
        isMetered: true,
        isAllowed: true,
        message: 'Metered connection verified'
      };
    }

    return {
      isMetered: false,
      isAllowed: true,
      message: 'Standard connection'
    };
  } catch (error) {
    console.error('Metered connection check error:', error);
    return {
      isMetered: false,
      isAllowed: true,
      message: 'Connection check failed'
    };
  }
}

// Register a metered connection for a user
export async function registerMeteredConnection(userId, ipAddress, connectionType) {
  try {
    // Deactivate any existing metered connections
    await dbRun(
      'UPDATE metered_connections SET is_active = 0 WHERE user_id = ?',
      [userId]
    );

    // Register new metered connection
    await dbRun(
      `INSERT INTO metered_connections (user_id, ip_address, is_metered, connection_type) 
       VALUES (?, ?, 1, ?)`,
      [userId, ipAddress, connectionType]
    );

    return { success: true, message: 'Metered connection registered successfully' };
  } catch (error) {
    console.error('Register metered connection error:', error);
    return { success: false, message: 'Failed to register metered connection' };
  }
}
