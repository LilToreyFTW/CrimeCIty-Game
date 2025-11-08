import axios from 'axios';
import { dbGet, dbRun, dbAll } from './database';

export async function detectVPN(ipAddress: string) {
  try {
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

    const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`, { timeout: 5000 });
    const data = response.data;
    
    const isVpn = data.org?.toLowerCase().includes('vpn') || 
                  data.org?.toLowerCase().includes('proxy') ||
                  data.org?.toLowerCase().includes('hosting');
    const isProxy = data.org?.toLowerCase().includes('proxy') || data.org?.toLowerCase().includes('tor');
    const isMetered = data.org?.toLowerCase().includes('mobile') || data.org?.toLowerCase().includes('cellular');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await dbRun(
      `INSERT OR REPLACE INTO vpn_cache (ip_address, is_vpn, is_proxy, provider, is_metered, cached_at, expires_at) 
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      [ipAddress, isVpn, isProxy, data.org, isMetered, expiresAt.toISOString()]
    );

    return {
      isVpn,
      isProxy,
      provider: data.org,
      isMetered,
      country: data.country_name,
      region: data.region,
      city: data.city
    };
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

export async function checkIPHistory(ipAddress: string) {
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

export async function checkMeteredConnection(userId: number, ipAddress: string) {
  try {
    const meteredConnection = await dbGet(
      'SELECT * FROM metered_connections WHERE user_id = ? AND is_active = 1',
      [userId]
    );

    if (meteredConnection && meteredConnection.ip_address !== ipAddress) {
      return {
        isMetered: true,
        isAllowed: false,
        message: 'You must use the same metered connection that you registered with',
        registeredIP: meteredConnection.ip_address,
        currentIP: ipAddress
      };
    }

    return {
      isMetered: false,
      isAllowed: true,
      message: 'Standard connection'
    };
  } catch (error) {
    return {
      isMetered: false,
      isAllowed: true,
      message: 'Connection check failed'
    };
  }
}
