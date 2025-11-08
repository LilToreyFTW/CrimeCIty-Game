# VPN Detection & Metered Connection System

## 🛡️ Enhanced VPN Detection System

### **Targeted VPN Providers**
The system specifically detects and blocks these VPN services:

#### **Primary VPN Targets:**
- **Proton VPN** - Proton Technologies AG
- **Nord VPN** - Nord Security
- **ExpressVPN** - Express VPN Ltd
- **CyberGhost VPN** - CyberGhost SRL
- **IP Vanish** - IPVanish VPN

#### **Additional VPN Detection:**
- **Surfshark VPN**
- **Private Internet Access (PIA)**
- **TunnelBear**
- **Windscribe**
- **Mullvad**
- **Generic VPN/Proxy/Hosting/Datacenter providers**

### **Detection Methods**

#### **1. Multi-Source Detection**
- **ipapi.co** - Primary IP geolocation service
- **vpnapi.io** - Specialized VPN detection API
- **ipify.org** - Backup IP information service

#### **2. Provider Name Matching**
```javascript
const knownVpnProviders = [
  'proton vpn', 'protonvpn', 'proton technologies',
  'nord vpn', 'nordvpn', 'nord security',
  'express vpn', 'expressvpn', 'express vpn ltd',
  'cyberghost', 'cyberghost vpn', 'cyberghost srl',
  'ip vanish', 'ipvanish', 'ipvanish vpn',
  // ... more providers
];
```

#### **3. Organization Detection**
- Checks ISP organization names
- Identifies hosting providers
- Detects datacenter connections
- Flags proxy services

#### **4. Connection Type Analysis**
- **VPN Detection**: Identifies VPN services
- **Proxy Detection**: Flags proxy connections
- **Metered Detection**: Identifies mobile/hotspot connections

## 📱 Metered Connection System

### **What Are Metered Connections?**
Metered connections are mobile data connections that users are allowed to use with VPNs:

#### **Allowed Connection Types:**
- **Mobile Data** (4G/5G/LTE)
- **Mobile Hotspot**
- **Cellular Tethering**
- **Mobile VPN** (when using mobile data)

#### **Detection Keywords:**
```javascript
const meteredKeywords = [
  'mobile', 'cellular', 'lte', '4g', '5g', 'hotspot'
];
```

### **Metered Connection Rules**

#### **1. Registration Process**
- Users can register ONE metered connection
- Must be using mobile data or hotspot
- Connection is tied to specific IP address
- User must always use the SAME metered connection

#### **2. Enforcement Rules**
- **Same IP Required**: Must use registered IP
- **Single Connection**: Only one metered connection per user
- **No IP Switching**: Cannot change metered connection IP
- **VPN Allowed**: VPN is allowed ONLY on metered connections

#### **3. Violation Handling**
- **Wrong IP**: "You must use the same metered connection"
- **Non-Metered VPN**: "VPN only allowed on metered connections"
- **Multiple Connections**: "Only one metered connection allowed"

## 🔒 Security Implementation

### **Database Schema**

#### **VPN Cache Table**
```sql
CREATE TABLE vpn_cache (
  id INTEGER PRIMARY KEY,
  ip_address TEXT UNIQUE,
  is_vpn BOOLEAN,
  is_proxy BOOLEAN,
  is_metered BOOLEAN,
  provider TEXT,
  cached_at DATETIME,
  expires_at DATETIME
);
```

#### **Metered Connections Table**
```sql
CREATE TABLE metered_connections (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  ip_address TEXT,
  is_metered BOOLEAN,
  connection_type TEXT,
  first_used DATETIME,
  last_used DATETIME,
  is_active BOOLEAN
);
```

### **API Endpoints**

#### **Authentication**
- `POST /api/auth/register` - Enhanced VPN detection
- `POST /api/auth/login` - Metered connection enforcement

#### **Metered Connections**
- `POST /api/metered/register` - Register metered connection
- `GET /api/metered/status` - Check connection status
- `GET /api/metered/history` - View connection history

### **Detection Flow**

#### **1. Registration Process**
```
User Registration → VPN Detection → Metered Check → Account Creation
```

#### **2. Login Process**
```
User Login → Metered Verification → VPN Check → Access Granted
```

#### **3. Connection Validation**
```
IP Check → VPN Detection → Metered Verification → Access Decision
```

## ⚠️ Warning Messages

### **VPN Detection Warnings**
- **"VPN connections are not allowed"**
- **"Only metered connections (mobile/hotspot) are allowed with VPN"**
- **"Proxy connections are not allowed"**

### **Metered Connection Warnings**
- **"You must use the same metered connection that you registered with"**
- **"Metered connection violation"**
- **"Not a metered connection"**

### **Security Warnings**
- **"Multiple accounts from the same IP are not allowed"**
- **"Suspicious activity detected"**
- **"VPN usage detected"**

## 🎯 Implementation Benefits

### **Security Features**
1. **Prevents Multiple Accounts**: One account per IP
2. **Blocks VPN Abuse**: No VPN on regular connections
3. **Allows Mobile VPN**: VPN allowed on metered connections
4. **Enforces Consistency**: Same metered connection required
5. **Real-time Detection**: Immediate VPN/proxy detection

### **User Experience**
1. **Clear Warnings**: Specific error messages
2. **Mobile Friendly**: Supports mobile users
3. **Flexible Rules**: Allows legitimate mobile VPN usage
4. **Secure Access**: Maintains security while allowing flexibility

### **Administrative Benefits**
1. **Comprehensive Logging**: All connections tracked
2. **Suspicious Activity Monitoring**: Failed login tracking
3. **Connection History**: Full IP history for users
4. **Real-time Enforcement**: Immediate rule application

## 🚀 Deployment

### **Environment Variables**
```bash
JWT_SECRET=your-secret-key
NODE_ENV=production
```

### **Database Setup**
- SQLite database created automatically
- Tables initialized on first run
- Caching system for performance

### **API Integration**
- RESTful API endpoints
- JWT authentication
- Rate limiting protection
- CORS configuration

## 📊 Monitoring

### **Metrics Tracked**
- VPN detection accuracy
- Metered connection usage
- Failed login attempts
- Suspicious activity patterns
- Connection type distribution

### **Logging**
- All VPN detection attempts
- Metered connection registrations
- Security violations
- User connection patterns

---

**This system provides comprehensive VPN detection while allowing legitimate mobile users to use VPNs on their metered connections, maintaining security while providing flexibility for mobile users.**
