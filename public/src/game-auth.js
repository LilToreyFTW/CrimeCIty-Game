// Game Authentication Integration
class GameAuthManager {
    constructor() {
        this.authToken = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        this.init();
    }

    async init() {
        if (!this.authToken) {
            this.showAuthRequired();
            return;
        }

        // Verify token is still valid
        const isValid = await this.verifyToken();
        if (!isValid) {
            this.logout();
            this.showAuthRequired();
            return;
        }

        // Initialize game with user data
        this.initializeGame();
    }

    async verifyToken() {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                localStorage.setItem('user', JSON.stringify(this.user));
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            return false;
        }
    }

    showAuthRequired() {
        document.getElementById('authCheck').style.display = 'block';
        document.getElementById('game-container').style.display = 'none';
    }

    initializeGame() {
        document.getElementById('authCheck').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        
        // Update user info in game
        if (window.game && this.user.username) {
            window.game.player.name = this.user.username;
            window.game.updateDisplay();
        }

        // Load user's game data
        this.loadGameData();
    }

    async loadGameData() {
        try {
            const response = await fetch('/api/game/data', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.gameData && window.game) {
                    // Merge saved game data with current game state
                    Object.assign(window.game.player, data.gameData.player);
                    window.game.updateDisplay();
                    window.game.updateInventory();
                }
            }
        } catch (error) {
            console.error('Failed to load game data:', error);
        }
    }

    async saveGameData() {
        if (!window.game) return;

        try {
            const gameData = {
                player: window.game.player,
                currentSection: window.game.currentSection,
                gameTime: window.game.gameTime,
                achievements: window.game.achievements || [],
                properties: window.game.properties || [],
                jobs: window.game.jobs || [],
                crimes: window.game.crimes || [],
                missions: window.game.missions || [],
                faction: window.game.faction || null
            };

            await fetch('/api/game/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ gameData })
            });
        } catch (error) {
            console.error('Failed to save game data:', error);
        }
    }

    // Save specific game progress
    async saveGameProgress(progressData) {
        if (!this.authToken) return;

        try {
            await fetch('/api/game/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(progressData)
            });
        } catch (error) {
            console.error('Failed to save game progress:', error);
        }
    }

    // Save education progress
    async saveEducationProgress(course, completed, progress, stats) {
        if (!this.authToken) return;

        try {
            await fetch('/api/game/education', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    course,
                    completed,
                    progress,
                    stats
                })
            });
        } catch (error) {
            console.error('Failed to save education progress:', error);
        }
    }

    // Save inventory changes
    async saveInventoryChanges(items, category, action) {
        if (!this.authToken) return;

        try {
            await fetch('/api/game/inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    items,
                    category,
                    action
                })
            });
        } catch (error) {
            console.error('Failed to save inventory changes:', error);
        }
    }

    // Get comprehensive game statistics
    async getGameStats() {
        if (!this.authToken) return null;

        try {
            const response = await fetch('/api/game/stats', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.stats;
            }
        } catch (error) {
            console.error('Failed to get game stats:', error);
        }
        return null;
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.authToken = null;
        this.user = {};
    }

    async checkIPStatus() {
        try {
            const response = await fetch('/api/ip/suspicious', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.suspicious.isSuspicious) {
                    this.showIPWarning(data.suspicious);
                }
            }
        } catch (error) {
            console.error('Failed to check IP status:', error);
        }
    }

    showIPWarning(suspiciousData) {
        const warningMessage = `
            ⚠️ Suspicious Activity Detected ⚠️
            
            Multiple failed login attempts: ${suspiciousData.failedAttempts}
            VPN usage detected: ${suspiciousData.vpnAttempts}
            
            Please ensure you are using a secure connection and not a VPN.
        `;

        if (confirm(warningMessage + '\n\nDo you want to continue?')) {
            // User chose to continue
            return;
        } else {
            // User chose to stop
            this.logout();
            this.showAuthRequired();
        }
    }
}

// Global functions
function redirectToAuth() {
    window.location.href = '/src/auth.html';
}

// Initialize authentication manager
const gameAuthManager = new GameAuthManager();

// Auto-save integration
if (window.game) {
    // Override the original auto-save to use our authenticated save
    const originalAutoSave = window.AutoSave;
    window.AutoSave = class extends originalAutoSave {
        saveGame() {
            super.saveGame(); // Call original save
            gameAuthManager.saveGameData(); // Call authenticated save
        }
    }
}

// Check IP status periodically
setInterval(() => {
    if (gameAuthManager.authToken) {
        gameAuthManager.checkIPStatus();
    }
}, 300000); // Check every 5 minutes
