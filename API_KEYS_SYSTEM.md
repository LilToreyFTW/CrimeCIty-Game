# 🔑 Crime City API Keys System

## 🎯 **Overview**

The Crime City API Keys system allows users to create secure API keys for integrating with external applications, Discord bots, custom websites, and development projects. The system supports multiple access levels and provides comprehensive integration examples.

## 🔐 **Access Levels**

### **🌍 Public Only**
- **Purpose**: Read-only access to public game data
- **Use Case**: Displaying game statistics on websites
- **Permissions**:
  - View public game stats
  - Read faction information
  - Access leaderboards
  - Get basic game statistics

### **🛡️ Limited Access**
- **Purpose**: Limited access to user account data
- **Use Case**: Custom job applications and faction management
- **Permissions**:
  - Manage your faction members
  - Assign job roles
  - Update faction information
  - Read your game data
  - Access user statistics

### **👑 Full Access**
- **Purpose**: Complete access to user account
- **Use Case**: Faction owners and job creators
- **Permissions**:
  - Full account management
  - Create and manage factions
  - Create and manage jobs
  - Assign all roles and permissions
  - Access all game data
  - Complete system integration

### **🤖 Game AI Assistant**
- **Purpose**: AI-powered API key with intelligent automation
- **Use Case**: Server-managed with advanced capabilities
- **Permissions**:
  - AI-powered faction management
  - Automated job assignments
  - Smart role recommendations
  - Predictive analytics
  - Server-managed security
  - Advanced automation features

## 🚀 **API Endpoints**

### **Authentication**
All API requests require the API key in the Authorization header:
```
Authorization: Bearer YOUR_API_KEY_HERE
```

### **User Data**
- `GET /api/keys/user/data` - Get user information and game data
- **Access**: All levels (data varies by access level)

### **Faction Management**
- `GET /api/keys/faction/data` - Get faction information
- `POST /api/keys/faction/members` - Update faction members
- **Access**: Limited, Full, AI

### **Job Management**
- `POST /api/keys/job/assign-role` - Assign job roles to users
- **Access**: Limited, Full, AI

### **Game Statistics**
- `GET /api/keys/game/stats` - Get game statistics
- **Access**: All levels (data varies by access level)

## 💻 **Integration Examples**

### **Next.js Integration**
```javascript
// Install: npm install axios
import axios from 'axios';

const API_BASE = 'https://your-game-domain.com/api';
const API_KEY = 'your-api-key-here';

// Get user data
const getUserData = async () => {
  try {
    const response = await axios.get(`${API_BASE}/keys/user/data`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
  }
};

// Update faction members
const updateFactionMembers = async (factionId, members) => {
  try {
    const response = await axios.post(`${API_BASE}/keys/faction/members`, {
      factionId,
      members
    }, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
  }
};
```

### **React Integration**
```javascript
// React Hook for API calls
import { useState, useEffect } from 'react';

const useGameAPI = (apiKey) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/keys/user/data', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const userData = await response.json();
      setData(userData);
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchUserData();
    }
  }, [apiKey]);

  return { data, loading, refetch: fetchUserData };
};
```

### **Python Integration**
```python
# Install: pip install requests
import requests
import json

class CrimeCityAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://your-game-domain.com/api/keys"
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def get_user_data(self):
        response = requests.get(f"{self.base_url}/user/data", headers=self.headers)
        return response.json()
    
    def update_faction(self, faction_id, data):
        response = requests.post(
            f"{self.base_url}/faction/members",
            headers=self.headers,
            json={'factionId': faction_id, 'data': data}
        )
        return response.json()
    
    def assign_job_role(self, user_id, job_id, role):
        response = requests.post(
            f"{self.base_url}/job/assign-role",
            headers=self.headers,
            json={'userId': user_id, 'jobId': job_id, 'role': role}
        )
        return response.json()

# Usage
api = CrimeCityAPI('your-api-key-here')
user_data = api.get_user_data()
```

### **Discord Bot Integration**
```javascript
// Discord.js Bot
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const API_KEY = 'your-api-key-here';
const API_BASE = 'https://your-game-domain.com/api/keys';

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'faction') {
        try {
            const response = await axios.get(`${API_BASE}/faction/data`, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            
            await interaction.reply(`Faction: ${response.data.faction.name}`);
        } catch (error) {
            await interaction.reply('Error fetching faction data!');
        }
    }
});

client.login('your-discord-bot-token');
```

## 🛠️ **Custom Job Development**

### **Requirements for Job Creators**
- **Full Access API Key**: Required for job creation and management
- **Technical Skills**: Python, React, TypeScript, Next.js knowledge
- **API Integration**: Proper use of Crime City API endpoints

### **Job Development Process**
1. **Create Full Access API Key** in Settings → API Keys
2. **Develop Custom Job** using Crime City API
3. **Deploy to Vercel** or other hosting platforms
4. **Manage Job Roles** through API endpoints
5. **Monitor Performance** using API statistics

### **Job API Endpoints**
- `POST /api/keys/job/assign-role` - Assign roles to job members
- `GET /api/keys/user/data` - Get user information for role assignment
- `POST /api/keys/faction/members` - Manage faction members

## 🔒 **Security Features**

### **API Key Security**
- **64-character random keys** (cryptographically secure)
- **Expiration dates** (optional, user-defined)
- **Usage tracking** (last used, usage count)
- **Access level restrictions** (permission-based access)
- **User ownership** (keys tied to specific users)

### **Rate Limiting**
- **Request limits** per API key
- **Usage monitoring** and abuse prevention
- **Automatic key deactivation** for suspicious activity

### **Data Protection**
- **No modding scripts** allowed
- **Legitimate integrations only**
- **User consent** required for data access
- **Audit logging** for all API usage

## 📊 **Usage Monitoring**

### **API Key Statistics**
- **Usage count**: Number of API calls made
- **Last used**: Timestamp of last API call
- **Access level**: Current permission level
- **Status**: Active, expired, or deactivated

### **Performance Metrics**
- **Response times** for API endpoints
- **Success/failure rates** for API calls
- **Usage patterns** and peak times
- **Error tracking** and debugging

## 🎮 **Game Integration**

### **Faction Management**
- **Member management** through API
- **Role assignment** for faction members
- **Faction statistics** and analytics
- **Automated management** with AI assistance

### **Job System**
- **Custom job creation** with API integration
- **Role-based access** for job members
- **Performance tracking** and analytics
- **Automated job assignments**

### **User Data Access**
- **Game statistics** and progress
- **Achievement tracking** and milestones
- **Financial data** and transactions
- **Social connections** and relationships

## 🚀 **Deployment Guide**

### **Vercel Deployment**
1. **Create Next.js project** with Crime City API integration
2. **Use Full Access API Key** for complete functionality
3. **Deploy to Vercel** with environment variables
4. **Configure API endpoints** for your custom job
5. **Test integration** with Crime City API

### **Discord Bot Deployment**
1. **Create Discord application** and bot
2. **Use Limited or Full Access API Key** based on needs
3. **Deploy bot** to hosting platform
4. **Configure slash commands** for faction management
5. **Test bot functionality** with Crime City API

### **Python Application Deployment**
1. **Create Python application** with Crime City API client
2. **Use appropriate API key** for your use case
3. **Deploy to cloud platform** (AWS, Google Cloud, etc.)
4. **Configure environment variables** for API key
5. **Test application** with Crime City API

## 📝 **Best Practices**

### **API Key Management**
- **Store keys securely** in environment variables
- **Never commit keys** to version control
- **Rotate keys regularly** for security
- **Monitor usage** and revoke unused keys

### **Error Handling**
- **Implement proper error handling** for API calls
- **Handle rate limiting** gracefully
- **Log errors** for debugging
- **Provide user feedback** for API failures

### **Performance Optimization**
- **Cache API responses** when appropriate
- **Implement retry logic** for failed requests
- **Monitor API usage** to avoid rate limits
- **Optimize request frequency** for better performance

---

**This comprehensive API Keys system provides secure, flexible integration with Crime City for developers, faction owners, and job creators to build custom applications and automation tools!** 🔑🎮
