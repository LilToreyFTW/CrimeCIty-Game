# Crime City - Battle Game Website

A comprehensive web-based battle/crime game with authentication, IP tracking, and VPN detection. Built with Vite, Express.js, and SQLite.

## Features

### 🎮 Game Features
- **Complete City System**: 33+ locations across 7 districts
- **Education System**: 12 courses with stat improvements
- **Casino Games**: 11 different games with realistic odds
- **Crime System**: 5 crime types with risk/reward mechanics
- **Mission System**: 5 mission types with progression
- **Job System**: 5 job types with requirements and income
- **Item System**: Weapons, drugs, candy, and other items
- **Faction System**: $30 million creation cost

### 🔐 Authentication & Security
- **Email/Password Registration**: Secure account creation
- **IP Tracking**: One account per IP address
- **VPN Detection**: Blocks VPN and proxy connections
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Protection against abuse
- **Suspicious Activity Detection**: Monitors login patterns

### 🛡️ Security Features
- **IP Validation**: Prevents multiple accounts from same IP
- **VPN Blocking**: Detects and blocks VPN connections
- **Proxy Detection**: Identifies proxy usage
- **Suspicious Activity Monitoring**: Tracks failed logins and patterns
- **Warning System**: Alerts users about security issues

## Tech Stack

### Frontend
- **Vite**: Fast build tool and dev server
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Modern styling with gradients and animations
- **Font Awesome**: Icons and UI elements

### Backend
- **Express.js**: Node.js web framework
- **SQLite**: Lightweight database
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers

### Deployment
- **Vercel**: Serverless deployment platform
- **Node.js**: Runtime environment

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd battlegamewebsite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## Deployment on Vercel

### Automatic Deployment

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect your repository to Vercel
   - Vercel will automatically detect the configuration

2. **Set Environment Variables**
   In Vercel dashboard, add these environment variables:
   ```
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=production
   ```

3. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-app.vercel.app`

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login to account
- `GET /api/auth/verify` - Verify JWT token

### Game Data
- `GET /api/game/data` - Get user's game data
- `POST /api/game/save` - Save game data
- `GET /api/game/profile` - Get user profile
- `PUT /api/game/profile` - Update user profile

### IP Tracking
- `GET /api/ip/current` - Get current IP info
- `GET /api/ip/history` - Get user's IP history
- `GET /api/ip/suspicious` - Check for suspicious activity

## Security Features

### IP Tracking
- Tracks user IP addresses
- Prevents multiple accounts from same IP
- Monitors IP changes and patterns

### VPN Detection
- Uses multiple services for VPN detection
- Caches results for performance
- Blocks VPN and proxy connections

### Suspicious Activity Detection
- Monitors failed login attempts
- Tracks VPN usage patterns
- Warns users about suspicious activity

### Rate Limiting
- Limits requests per IP address
- Prevents brute force attacks
- Configurable time windows

## Game Mechanics

### Player Progression
- **Level System**: Automatic leveling with bonuses
- **Stat System**: Strength, Defense, Speed, Dexterity
- **Skill System**: 6 different skills to develop
- **Job System**: 5 job types with requirements

### Economy
- **Money System**: Earn and spend money
- **Property System**: Buy and manage properties
- **Item System**: Weapons, drugs, and consumables
- **Faction Creation**: $30 million end-game goal

### Time System
- **Automatic Progression**: Game progresses over time
- **Energy Regeneration**: 1 energy per minute
- **Job Income**: Automatic daily income
- **Property Fees**: Automatic fee collection

## File Structure

```
battlegamewebsite/
├── src/
│   ├── auth.html          # Authentication page
│   ├── auth.js            # Authentication logic
│   └── game-auth.js       # Game authentication integration
├── server/
│   ├── index.js           # Main server file
│   ├── database/
│   │   └── init.js        # Database initialization
│   ├── routes/
│   │   ├── auth.js        # Authentication routes
│   │   ├── game.js        # Game data routes
│   │   └── ip.js          # IP tracking routes
│   └── utils/
│       └── ipUtils.js     # IP and VPN detection utilities
├── html/
│   ├── css/
│   │   ├── style.css      # Game styles
│   │   └── script.js      # Game logic
├── index.html             # Main game page
├── package.json           # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── vercel.json           # Vercel deployment config
└── env.example           # Environment variables template
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments

---

**Enjoy playing Crime City!** 🎮