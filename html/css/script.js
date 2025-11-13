// Authentication System
class AuthenticationSystem {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.token = localStorage.getItem('authToken');
        this.init();
    }

    init() {
        // Check if user is already authenticated
        if (this.token) {
            this.verifyToken();
        } else {
            this.showLogin();
        }
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register form
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Auth screen switching
        document.getElementById('showRegisterLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegister();
        });

        document.getElementById('showLoginLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLogin();
        });
    }

    showLogin() {
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('registerScreen').style.display = 'none';
        document.getElementById('authLoading').style.display = 'none';
        
        // Remove any verification screens
        const verificationScreen = document.getElementById('verificationScreen');
        const verificationRequiredScreen = document.getElementById('verificationRequiredScreen');
        if (verificationScreen) verificationScreen.remove();
        if (verificationRequiredScreen) verificationRequiredScreen.remove();
    }

    showRegister() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('registerScreen').style.display = 'block';
        document.getElementById('authLoading').style.display = 'none';
        
        // Remove any verification screens
        const verificationScreen = document.getElementById('verificationScreen');
        const verificationRequiredScreen = document.getElementById('verificationRequiredScreen');
        if (verificationScreen) verificationScreen.remove();
        if (verificationRequiredScreen) verificationRequiredScreen.remove();
    }

    showLoading() {
        document.getElementById('authLoading').style.display = 'flex';
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('registerScreen').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('authLoading').style.display = 'none';
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('userData', JSON.stringify(this.currentUser));
                this.authenticateUser();
            } else {
                if (data.needsVerification) {
                    this.hideLoading();
                    this.showVerificationRequired(data.message, data.error);
                } else {
                    this.showMessage(data.error || 'Login failed', 'error');
                    this.hideLoading();
                    this.showLogin();
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Network error. Please try again.', 'error');
            this.hideLoading();
            this.showLogin();
        }
    }

    async handleRegister() {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const playerName = document.getElementById('playerName').value;

        if (!email || !password || !confirmPassword || !playerName) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    password, 
                    username: playerName 
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.hideLoading();
                this.showVerificationMessage(email, data.emailSent);
            } else {
                this.showMessage(data.error || 'Registration failed', 'error');
                this.hideLoading();
                this.showRegister();
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('Network error. Please try again.', 'error');
            this.hideLoading();
            this.showRegister();
        }
    }

    async verifyToken() {
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.authenticateUser();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Token verification error:', error);
            this.logout();
        }
    }

    authenticateUser() {
        this.isAuthenticated = true;
        document.body.classList.add('authenticated');
        this.hideLoading();
        
        // Initialize game with user data
        if (window.gameState) {
            window.gameState.loadUserData(this.currentUser);
        }
        
        this.showMessage('Welcome to Crime City!', 'success');
    }

    logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        document.body.classList.remove('authenticated');
        this.showLogin();
    }

    showMessage(message, type = 'info') {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
            color: white;
            border-radius: 10px;
            z-index: 10001;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showVerificationMessage(email, emailSent) {
        // Hide all auth screens
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('registerScreen').style.display = 'none';
        document.getElementById('authLoading').style.display = 'none';

        // Create verification message screen
        const verificationScreen = document.createElement('div');
        verificationScreen.id = 'verificationScreen';
        verificationScreen.className = 'auth-screen';
        verificationScreen.style.display = 'block';
        verificationScreen.innerHTML = `
            <div class="auth-container">
                <div class="auth-header">
                    <h1><i class="fas fa-envelope-open"></i> Check Your Email</h1>
                    <p>We've sent a verification link to your email</p>
                </div>
                
                <div class="verification-content">
                    <div class="verification-icon">
                        <i class="fas fa-paper-plane"></i>
                    </div>
                    
                    <div class="verification-message">
                        <h3>Almost there!</h3>
                        <p>We've sent a verification link to:</p>
                        <p class="email-address">${email}</p>
                        <p>Click the link in the email to verify your account and start playing.</p>
                    </div>
                    
                    <div class="verification-actions">
                        <button class="auth-btn secondary" onclick="window.authSystem.resendVerification('${email}')">
                            <i class="fas fa-redo"></i> Resend Email
                        </button>
                        <button class="auth-btn primary" onclick="window.authSystem.backToLogin()">
                            <i class="fas fa-sign-in-alt"></i> Back to Login
                        </button>
                    </div>
                    
                    <div class="verification-help">
                        <p><strong>Didn't receive the email?</strong></p>
                        <ul>
                            <li>Check your spam/junk folder</li>
                            <li>Make sure the email address is correct</li>
                            <li>Wait a few minutes and try again</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('authSystem').appendChild(verificationScreen);
    }

    showVerificationRequired(message, error) {
        // Hide all auth screens
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('registerScreen').style.display = 'none';
        document.getElementById('authLoading').style.display = 'none';

        // Create verification required screen
        const verificationScreen = document.createElement('div');
        verificationScreen.id = 'verificationRequiredScreen';
        verificationScreen.className = 'auth-screen';
        verificationScreen.style.display = 'block';
        verificationScreen.innerHTML = `
            <div class="auth-container">
                <div class="auth-header">
                    <h1><i class="fas fa-exclamation-triangle"></i> Email Verification Required</h1>
                    <p>You need to verify your email before logging in</p>
                </div>
                
                <div class="verification-content">
                    <div class="verification-icon warning">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    
                    <div class="verification-message">
                        <h3>Account Not Verified</h3>
                        <p>${message}</p>
                        <p>Please check your email and click the verification link to activate your account.</p>
                    </div>
                    
                    <div class="verification-actions">
                        <button class="auth-btn secondary" onclick="window.authSystem.resendVerification()">
                            <i class="fas fa-redo"></i> Resend Verification Email
                        </button>
                        <button class="auth-btn primary" onclick="window.authSystem.backToLogin()">
                            <i class="fas fa-sign-in-alt"></i> Back to Login
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('authSystem').appendChild(verificationScreen);
    }

    async resendVerification(email = null) {
        if (!email) {
            // Get email from login form
            email = document.getElementById('loginEmail').value;
        }

        if (!email) {
            this.showMessage('Please enter your email address', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Verification email sent! Check your inbox.', 'success');
            } else {
                this.showMessage(data.error || 'Failed to resend verification email', 'error');
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    backToLogin() {
        // Remove verification screens
        const verificationScreen = document.getElementById('verificationScreen');
        const verificationRequiredScreen = document.getElementById('verificationRequiredScreen');
        
        if (verificationScreen) verificationScreen.remove();
        if (verificationRequiredScreen) verificationRequiredScreen.remove();
        
        this.showLogin();
    }
}

// Global functions for auth screen switching
function showLogin() {
    if (window.authSystem) {
        window.authSystem.showLogin();
    }
}

function showRegister() {
    if (window.authSystem) {
        window.authSystem.showRegister();
    }
}

// Game State Management
class GameState {
    constructor() {
        this.player = {
            name: "Player [0000001]",
            money: 10000,
            points: 0,
            level: 1,
            rank: "#7 Average Outcast",
            life: 100,
            energy: 100,
            age: 0,
            status: "Single",
            networth: 10000,
            property: {
                name: "None",
                cost: 0,
                fees: 0
            },
            stats: {
                strength: 100,
                defense: 100,
                speed: 100,
                dexterity: 100
            },
            workingStats: {
                manualLabor: 100,
                intelligence: 100,
                endurance: 100
            },
            faction: {
                name: "None",
                days: 0
            },
            // New comprehensive stats
            battleStats: {
                wins: 0,
                losses: 0,
                damageDealt: 0,
                damageTaken: 0,
                criticalHits: 0,
                dodges: 0
            },
            crimeStats: {
                successful: 0,
                failed: 0,
                arrested: 0,
                escaped: 0,
                totalEarnings: 0
            },
            jobStats: {
                totalEarnings: 0,
                hoursWorked: 0,
                promotions: 0,
                fired: 0
            },
            factionStats: {
                warsWon: 0,
                warsLost: 0,
                territoryControlled: 0,
                membersRecruited: 0
            },
            // Status effects and cooldowns
            statusEffects: [],
            cooldowns: {
                battle: 0,
                crime: 0,
                job: 0,
                hospital: 0,
                jail: 0
            },
            // Location and travel
            location: 'City Center',
            travelTime: 0,
            // Reputation and respect
            respect: 0,
            reputation: 0,
            // Bank and investments
            bankBalance: 0,
            investments: [],
            // Medical and health
            health: 100,
            injuries: 0,
            medicalBills: 0,
            injuryList: [],
            diseases: [],
            // Social
            friends: [],
            enemies: [],
            // Market and trading
            marketOrders: [],
            tradingHistory: [],
            // Drug system
            drugs: {
                xanax: { quantity: 0, addiction: 0, lastUsed: 0 },
                ecstasy: { quantity: 0, addiction: 0, lastUsed: 0 },
                vicodin: { quantity: 0, addiction: 0, lastUsed: 0 },
                cannabis: { quantity: 0, addiction: 0, lastUsed: 0 },
                lsd: { quantity: 0, addiction: 0, lastUsed: 0 },
                opium: { quantity: 0, addiction: 0, lastUsed: 0 },
                pcp: { quantity: 0, addiction: 0, lastUsed: 0 },
                shrooms: { quantity: 0, addiction: 0, lastUsed: 0 },
                speed: { quantity: 0, addiction: 0, lastUsed: 0 },
                ketamine: { quantity: 0, addiction: 0, lastUsed: 0 }
            },
            drugEffects: [],
            addictionLevel: 0,
            // Faction inventory system
            factionInventory: {
                drugs: {},
                weapons: {},
                armor: {},
                misc: {}
            },
            factionPermissions: {
                canAccessInventory: false,
                canWithdrawDrugs: false,
                canWithdrawWeapons: false,
                canWithdrawArmor: false,
                canWithdrawMisc: false
            }
        },
        job: {
                name: "None",
                rank: "None",
                income: 0,
                points: 0
            },
            skills: {
                searchForCash: 0.0,
                shoplifting: 0.0,
                bootlegging: 0.0,
                pickpocketing: 0.0,
                graffiti: 0.0,
                cracking: 0.0
            },
            items: {
                weapons: [],
                drugs: [],
                candy: [],
                other: []
            },
            achievements: [],
            missions: {
                active: [],
                completed: []
            },
            jailTime: 0,
            hospitalTime: 0
        };
        this.currentSection = 'home';
        this.notifications = [];
        this.gameTime = 0;
        this.lastSave = Date.now();
    }

    updateDisplay() {
        // Update header stats
        document.getElementById('money').textContent = `$${this.player.money.toLocaleString()}`;
        document.getElementById('points').textContent = this.player.points;
        document.getElementById('level').textContent = this.player.level;
        document.getElementById('life').textContent = this.player.life;
        document.getElementById('energy').textContent = this.player.energy;
        document.getElementById('player-name').textContent = this.player.name;
        document.getElementById('rank').textContent = this.player.rank;

        // Update dashboard
        document.getElementById('player-name-display').textContent = this.player.name;
        document.getElementById('money-display').textContent = `$${this.player.money.toLocaleString()}`;
        document.getElementById('points-display').textContent = this.player.points;
        document.getElementById('level-display').textContent = this.player.level;
        document.getElementById('rank-display').textContent = this.player.rank;
        document.getElementById('life-display').textContent = this.player.life;
        document.getElementById('age-display').textContent = `Day ${this.player.age}`;
        document.getElementById('status-display').textContent = this.player.status;

        // Update property info
        document.getElementById('property-name').textContent = this.player.property.name;
        document.getElementById('property-cost').textContent = `$${this.player.property.cost.toLocaleString()}`;
        document.getElementById('property-fees').textContent = `$${this.player.property.fees}`;

        // Update battle stats
        this.updateBattleStats();
        
        // Update faction info
        document.getElementById('faction-name').textContent = this.player.faction.name;
        document.getElementById('faction-days').textContent = this.player.faction.days;

        // Update job info
        document.getElementById('job-name').textContent = this.player.job.name;
        document.getElementById('job-rank').textContent = this.player.job.rank;
        document.getElementById('job-income').textContent = `$${this.player.job.income}`;
        document.getElementById('job-points').textContent = this.player.job.points;
    }

    updateBattleStats() {
        const stats = this.player.stats;
        const total = stats.strength + stats.defense + stats.speed + stats.dexterity;
        
        // Update progress bars
        document.querySelectorAll('.progress-fill').forEach(bar => {
            const stat = bar.dataset.stat;
            if (stat && stats[stat]) {
                const percentage = Math.min((stats[stat] / 1000) * 100, 100);
                bar.style.width = `${percentage}%`;
                bar.textContent = stats[stat];
            }
        });
    }

    addMoney(amount) {
        this.player.money += amount;
        this.updateDisplay();
        this.showNotification(`+$${amount.toLocaleString()}`, 'success');
    }

    spendMoney(amount) {
        if (this.player.money >= amount) {
            this.player.money -= amount;
            this.updateDisplay();
            this.showNotification(`-$${amount.toLocaleString()}`, 'info');
            return true;
        } else {
            this.showNotification('Not enough money!', 'error');
            return false;
        }
    }

    changeLife(amount) {
        this.player.life = Math.max(0, Math.min(100, this.player.life + amount));
        this.updateDisplay();
        if (amount > 0) {
            this.showNotification(`+${amount} Life`, 'success');
        } else {
            this.showNotification(`${amount} Life`, 'error');
        }
    }

    changeEnergy(amount) {
        this.player.energy = Math.max(0, Math.min(100, this.player.energy + amount));
        this.updateDisplay();
        if (amount > 0) {
            this.showNotification(`+${amount} Energy`, 'success');
        } else {
            this.showNotification(`${amount} Energy`, 'error');
        }
    }

    updateStat(stat, amount) {
        if (this.player.stats[stat] !== undefined) {
            this.player.stats[stat] = Math.max(0, Math.min(999999, this.player.stats[stat] + amount));
            this.updateDisplay();
            this.showNotification(`${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${amount > 0 ? '+' : ''}${amount}`, 'success');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.getElementById('notifications').appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateInventory() {
        // Update weapons list
        const weaponsList = document.getElementById('weapons-list');
        if (game.player.items.weapons.length > 0) {
            weaponsList.innerHTML = '';
            game.player.items.weapons.forEach((weapon, index) => {
                const weaponEntry = document.createElement('div');
                weaponEntry.className = 'item-entry';
                weaponEntry.innerHTML = `
                    <div>
                        <div class="item-name">${weapon.name}</div>
                        <div class="item-stats">Damage: ${weapon.damage} | Type: ${weapon.type}</div>
                    </div>
                    <div class="item-actions">
                        <button class="item-btn danger" onclick="gameActions.useItem('weapon', ${index})">Use</button>
                        <button class="item-btn danger" onclick="gameActions.sellItem('weapon', ${index})">Sell</button>
                    </div>
                `;
                weaponsList.appendChild(weaponEntry);
            });
        } else {
            weaponsList.innerHTML = '<p>No weapons owned</p>';
        }

        // Update drugs list
        const drugsList = document.getElementById('drugs-list');
        if (game.player.items.drugs.length > 0) {
            drugsList.innerHTML = '';
            game.player.items.drugs.forEach((drug, index) => {
                const drugEntry = document.createElement('div');
                drugEntry.className = 'item-entry';
                drugEntry.innerHTML = `
                    <div>
                        <div class="item-name">${drug.name}</div>
                        <div class="item-stats">Effect: ${drug.effect} | Value: ${drug.value}</div>
                    </div>
                    <div class="item-actions">
                        <button class="item-btn" onclick="gameActions.useItem('drug', ${index})">Use</button>
                        <button class="item-btn danger" onclick="gameActions.sellItem('drug', ${index})">Sell</button>
                    </div>
                `;
                drugsList.appendChild(drugEntry);
            });
        } else {
            drugsList.innerHTML = '<p>No drugs owned</p>';
        }

        // Update candy list
        const candyList = document.getElementById('candy-list');
        if (game.player.items.candy.length > 0) {
            candyList.innerHTML = '';
            game.player.items.candy.forEach((candy, index) => {
                const candyEntry = document.createElement('div');
                candyEntry.className = 'item-entry';
                candyEntry.innerHTML = `
                    <div>
                        <div class="item-name">${candy.name}</div>
                        <div class="item-stats">Effect: ${candy.effect} | Value: ${candy.value}</div>
                    </div>
                    <div class="item-actions">
                        <button class="item-btn" onclick="gameActions.useItem('candy', ${index})">Use</button>
                        <button class="item-btn danger" onclick="gameActions.sellItem('candy', ${index})">Sell</button>
                    </div>
                `;
                candyList.appendChild(candyEntry);
            });
        } else {
            candyList.innerHTML = '<p>No candy owned</p>';
        }

        // Update other items list
        const otherItemsList = document.getElementById('other-items-list');
        if (game.player.items.other.length > 0) {
            otherItemsList.innerHTML = '';
            game.player.items.other.forEach((item, index) => {
                const itemEntry = document.createElement('div');
                itemEntry.className = 'item-entry';
                itemEntry.innerHTML = `
                    <div>
                        <div class="item-name">${item.name}</div>
                        <div class="item-stats">Type: ${item.type} | Value: $${item.value}</div>
                    </div>
                    <div class="item-actions">
                        <button class="item-btn" onclick="gameActions.useItem('other', ${index})">Use</button>
                        <button class="item-btn danger" onclick="gameActions.sellItem('other', ${index})">Sell</button>
                    </div>
                `;
                otherItemsList.appendChild(itemEntry);
            });
        } else {
            otherItemsList.innerHTML = '<p>No other items owned</p>';
        }
    }

    async loadUserData(userData) {
        // Load user data when authenticated
        if (userData) {
            this.player.name = userData.playerName || this.player.name;
            this.player.email = userData.email;
            
            // Load saved game data from backend
            try {
                const response = await fetch('/api/game/data', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.gameData && data.gameData.player) {
                        Object.assign(this.player, data.gameData.player);
                this.updateDisplay();
                    }
                }
            } catch (error) {
                console.error('Failed to load game data:', error);
            }
            
            this.showNotification(`Welcome back, ${this.player.name}!`, 'success');
        }
    }

    async saveGameData() {
        try {
            const gameData = {
                player: this.player,
                currentSection: this.currentSection,
                gameTime: this.gameTime,
                achievements: this.achievements || [],
                properties: this.properties || [],
                jobs: this.jobs || [],
                crimes: this.crimes || [],
                missions: this.missions || [],
                faction: this.faction || null
            };

            await fetch('/api/game/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ gameData })
            });
        } catch (error) {
            console.error('Failed to save game data:', error);
        }
    }
}

// Initialize game
const game = new GameState();

// Navigation System
class Navigation {
    constructor() {
        this.currentSection = 'home';
        this.init();
    }

    init() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Show initial section
        this.showSection('home');
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.game-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Add active class to nav button
        const navBtn = document.querySelector(`[data-section="${sectionId}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }

        this.currentSection = sectionId;
    }
}

// Game Actions
class GameActions {
    constructor() {
        this.init();
    }

    init() {
        // Location buttons
        document.querySelectorAll('.location-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const location = e.currentTarget.dataset.location;
                this.handleLocation(location);
            });
        });

        // Education buttons
        document.querySelectorAll('.education-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const course = e.currentTarget.dataset.course;
                this.handleEducation(course);
            });
        });

        // Casino buttons
        document.querySelectorAll('.casino-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const game = e.currentTarget.dataset.game;
                this.openCasinoModal(game);
            });
        });

        // Gym buttons
        document.querySelectorAll('.gym-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const activity = e.currentTarget.dataset.activity;
                this.handleGym(activity);
            });
        });

        // Education system
        this.initializeEducationSystem();

        // Crime buttons
        document.querySelectorAll('.crime-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const crime = e.currentTarget.dataset.crime;
                this.handleCrime(crime);
            });
        });

        // Mission buttons
        document.querySelectorAll('.mission-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mission = e.currentTarget.dataset.mission;
                this.handleMission(mission);
            });
        });

        // Faction buttons
        document.querySelectorAll('.faction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleFaction(action);
            });
        });

        // Medical buttons
        document.querySelectorAll('.medical-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const treatment = e.currentTarget.dataset.treatment;
                this.handleMedical(treatment);
            });
        });
    }

    handleLocation(location) {
        const locations = {
            // City Center
            'chronicle-archives': () => this.showModal('Chronicle Archives', 'Welcome to the Chronicle Archives! Here you can view historical records and player statistics.'),
            'city-hall': () => this.handleCityHall(),
            'community-center': () => this.handleCommunityCenter(),
            'hospital': () => this.handleHospital(),
            'jail': () => this.handleJail(),
            'player-committee': () => this.showModal('Player Committee', 'Welcome to the Player Committee! Here you can participate in community decisions and voting.'),
            'staff': () => this.showModal('Staff Office', 'Welcome to the Staff Office! Here you can contact game administrators and staff members.'),
            'visual-center': () => this.showModal('Visual Center', 'Welcome to the Visual Center! Here you can customize your character appearance and view galleries.'),
            
            // East Side
            'gun-shop': () => this.handleGunShop(),
            'cyberforce': () => this.showModal('CyberForce', 'Welcome to CyberForce! Here you can access advanced technology and cyber services.'),
            'docks': () => this.showModal('Docks', 'Welcome to the Docks! Here you can access shipping services and maritime activities.'),
            'pawn-shop': () => this.handlePawnShop(),
            'pharmacy': () => this.handlePharmacy(),
            'post-office': () => this.showModal('Post Office', 'Welcome to the Post Office! Here you can send and receive mail, packages, and messages.'),
            'print-store': () => this.showModal('Print Store', 'Welcome to the Print Store! Here you can print documents, flyers, and promotional materials.'),
            'rats-ribs': () => this.showModal('Rats\'n\'Ribs', 'Welcome to Rats\'n\'Ribs! Here you can buy food and drinks to restore energy.'),
            'recycling-center': () => this.showModal('Recycling Center', 'Welcome to the Recycling Center! Here you can recycle items and earn money from waste.'),
            'super-store': () => this.handleSuperStore(),
            'sweet-shop': () => this.showModal('Sweet Shop', 'Welcome to the Sweet Shop! Here you can buy candy and treats for stat boosts.'),
            'tc-clothing': () => this.showModal('TC Clothing', 'Welcome to TC Clothing! Here you can buy fashionable clothes and accessories.'),
            
            // Financial District
            'bank': () => this.handleBank(),
            'donator-house': () => this.handleDonatorHouse(),
            'messaging-inc': () => this.showModal('Messaging Inc', 'Welcome to Messaging Inc! Here you can send messages to other players and manage communications.'),
            
            // North Side
            'auction-house': () => this.showModal('Auction House', 'Welcome to the Auction House! Here you can buy and sell rare items through auctions.'),
            'church': () => this.showModal('Church', 'Welcome to the Church! Here you can find spiritual guidance and community support.'),
            'qazaar-directory': () => this.showModal('Qazaar Directory', 'Welcome to the Qazaar Directory! Here you can browse and access various marketplaces and shops.'),
            
            // West Side
            'education': () => {
                const nav = new Navigation();
                nav.showSection('education');
            },
            'global-gym': () => {
                const nav = new Navigation();
                nav.showSection('gym');
            },
            'travel-agency': () => this.showModal('Travel Agency', 'Welcome to the Travel Agency! Here you can book trips to other cities and locations.'),
            
            // Red Light District
            'casino': () => this.handleCasinoLocation(),
            'dump': () => this.showModal('Dump', 'Welcome to the Dump! Here you can dispose of unwanted items and find hidden treasures.'),
            'loan-shark': () => this.handleLoanShark(),
            'missions': () => {
                const nav = new Navigation();
                nav.showSection('missions');
            },
            'raceways': () => this.handleRaceways(),
            
            // Residential
            'estate-agents': () => this.showModal('Estate Agents', 'Welcome to Estate Agents! Here you can buy and sell properties and real estate.'),
            'your-mansion': () => this.showModal('Your Mansion', 'Welcome to Your Mansion! This is your personal residence where you can rest and manage your affairs.')
        };

        if (locations[location]) {
            locations[location]();
        }
    }

    handleCityHall() {
        const jobs = [
            { name: "Street Cleaner", income: 50, requirements: { manualLabor: 50 } },
            { name: "Security Guard", income: 100, requirements: { strength: 80, defense: 60 } },
            { name: "Office Worker", income: 150, requirements: { intelligence: 100 } },
            { name: "Police Officer", income: 300, requirements: { strength: 120, intelligence: 100 } },
            { name: "Mayor", income: 1000, requirements: { intelligence: 200, points: 1000 } }
        ];

        let jobList = "Available Jobs:\n\n";
        jobs.forEach((job, index) => {
            const canApply = this.canApplyForJob(job);
            jobList += `${index + 1}. ${job.name} - $${job.income}/day ${canApply ? '(Available)' : '(Requirements not met)'}\n`;
        });

        this.showModal('City Hall - Job Center', jobList, () => {
            this.showJobSelection(jobs);
        });
    }

    handleHospital() {
        if (game.player.life >= 100) {
            this.showModal('Hospital', 'You are at full health! No treatment needed.');
        } else {
            this.showModal('Hospital', 'Welcome to the hospital. You can get medical treatment here.', () => {
                this.showMedicalServices();
            });
        }
    }

    handleJail() {
        if (game.player.jailTime > 0) {
            this.showModal('Jail', `You are serving ${game.player.jailTime} days in jail. Time remaining: ${game.player.jailTime} days.`);
        } else {
            this.showModal('Jail', 'You are not currently in jail. This is where criminals serve their time.');
        }
    }

    handleCommunityCenter() {
        this.showModal('Community Center', 'Welcome to the Community Center! Here you can:\n\n1. Meet other players\n2. Join community events\n3. Get community support\n4. Participate in group activities', () => {
            this.showCommunityOptions();
        });
    }

    handleGunShop() {
        const weapons = [
            { name: "Knife", cost: 500, damage: 10, type: "melee" },
            { name: "Baseball Bat", cost: 200, damage: 15, type: "melee" },
            { name: "Pistol", cost: 2000, damage: 25, type: "ranged" },
            { name: "Shotgun", cost: 5000, damage: 40, type: "ranged" },
            { name: "Assault Rifle", cost: 15000, damage: 60, type: "ranged" }
        ];

        let weaponList = "Available Weapons:\n\n";
        weapons.forEach((weapon, index) => {
            weaponList += `${index + 1}. ${weapon.name} - $${weapon.cost} (Damage: ${weapon.damage})\n`;
        });

        this.showModal('Big T\'s Gun Shop', weaponList, () => {
            this.showWeaponShop(weapons);
        });
    }

    handlePharmacy() {
        const items = [
            { name: "Painkillers", cost: 100, effect: "life", value: 20 },
            { name: "Energy Drink", cost: 50, effect: "energy", value: 30 },
            { name: "Steroids", cost: 500, effect: "strength", value: 50 },
            { name: "Adrenaline", cost: 300, effect: "speed", value: 30 },
            { name: "Vitamins", cost: 200, effect: "defense", value: 25 }
        ];

        let itemList = "Available Items:\n\n";
        items.forEach((item, index) => {
            itemList += `${index + 1}. ${item.name} - $${item.cost}\n`;
        });

        this.showModal('Pharmacy', itemList, () => {
            this.showPharmacyShop(items);
        });
    }

    handlePawnShop() {
        this.showModal('Pawn Shop', 'Welcome to the Pawn Shop!\n\n1. Sell your items\n2. Buy used goods\n3. Get quick cash for your valuables', () => {
            this.showPawnShopOptions();
        });
    }

    handleSuperStore() {
        const items = [
            { name: "Food", cost: 25, effect: "energy", value: 10 },
            { name: "Water", cost: 10, effect: "energy", value: 5 },
            { name: "Clothes", cost: 100, effect: "defense", value: 5 },
            { name: "Tools", cost: 200, effect: "manualLabor", value: 10 }
        ];

        let itemList = "Available Items:\n\n";
        items.forEach((item, index) => {
            itemList += `${index + 1}. ${item.name} - $${item.cost}\n`;
        });

        this.showModal('Super Store', itemList, () => {
            this.showSuperStoreShop(items);
        });
    }

    handleBank() {
        this.showModal('Bank', 'Welcome to the Bank!\n\n1. Deposit money\n2. Withdraw money\n3. Take out loans\n4. Invest money', () => {
            this.showBankServices();
        });
    }

    handleDonatorHouse() {
        this.showModal('Donator House', 'Welcome to the Donator House!\n\nSpecial benefits for donators:\n- Bonus energy regeneration\n- Exclusive items\n- Special missions\n- Priority support');
    }

    handleCasinoLocation() {
        this.showModal('Casino', 'Welcome to the Casino!\n\nTry your luck at our various games:\n- Slots, Roulette, Blackjack\n- Poker, Craps, Keno\n- And many more!', () => {
            // Switch to casino section
            const nav = new Navigation();
            nav.showSection('casino');
        });
    }

    handleLoanShark() {
        this.showModal('Loan Shark', 'Need quick cash? I can help... but the interest rates are high!\n\nCurrent rates:\n- Small loan: $1,000 (20% interest)\n- Medium loan: $5,000 (25% interest)\n- Large loan: $10,000 (30% interest)', () => {
            this.showLoanOptions();
        });
    }

    handleRaceways() {
        this.showModal('Raceways', 'Welcome to the Raceways!\n\nRace cars and win money!\n\n1. Street Racing - $500 entry\n2. Professional Racing - $2,000 entry\n3. Championship Racing - $10,000 entry', () => {
            this.showRacingOptions();
        });
    }

    // Education System
    initializeEducationSystem() {
        // Education tab switching
        document.querySelectorAll('.education-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.switchEducationTab(tabId);
            });
        });

        // Course category filtering
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.filterCoursesByCategory(category);
            });
        });

        // Library category filtering
        document.querySelectorAll('.lib-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.filterLibraryByCategory(category);
            });
        });

        // Certificate filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.filterCertificates(filter);
            });
        });

        // Library search
        const searchInput = document.getElementById('librarySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchLibrary(e.target.value);
            });
        }

        // Initialize education data
        this.loadEducationData();
    }

    switchEducationTab(tabId) {
        // Hide all tabs
        document.querySelectorAll('.education-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from buttons
        document.querySelectorAll('.education-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Add active class to button
        const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    loadEducationData() {
        // Load courses
        this.loadCourses();

        // Load progress
        this.loadProgress();

        // Load certificates
        this.loadCertificates();

        // Load library
        this.loadLibrary();
    }

    loadCourses() {
        const courses = [
            {
                id: 'combat-training',
                name: 'Combat Training',
                category: 'combat',
                description: 'Learn basic combat techniques and improve your fighting skills.',
                duration: '2 hours',
                energyCost: 20,
                skillGain: '+5 Strength, +3 Defense',
                prerequisites: 'None',
                enrolled: false,
                completed: false
            },
            {
                id: 'self-defense',
                name: 'Self Defense',
                category: 'combat',
                description: 'Master defensive techniques to protect yourself in any situation.',
                duration: '1.5 hours',
                energyCost: 18,
                skillGain: '+7 Defense, +5 Dexterity',
                prerequisites: 'None',
                enrolled: false,
                completed: false
            },
            {
                id: 'business',
                name: 'Business Fundamentals',
                category: 'business',
                description: 'Learn the basics of business management and entrepreneurship.',
                duration: '2 hours',
                energyCost: 15,
                skillGain: '+6 Intelligence, +0.5 Search for Cash',
                prerequisites: 'None',
                enrolled: false,
                completed: false
            },
            {
                id: 'computer-science',
                name: 'Computer Science',
                category: 'technology',
                description: 'Dive into programming, algorithms, and computer systems.',
                duration: '3 hours',
                energyCost: 20,
                skillGain: '+10 Intelligence, +0.3 Cracking',
                prerequisites: 'None',
                enrolled: false,
                completed: false
            },
            {
                id: 'biology',
                name: 'Biology',
                category: 'science',
                description: 'Study living organisms and biological processes.',
                duration: '2 hours',
                energyCost: 15,
                skillGain: '+8 Intelligence',
                prerequisites: 'None',
                enrolled: false,
                completed: false
            },
            {
                id: 'law',
                name: 'Criminal Law',
                category: 'arts',
                description: 'Understand legal systems and criminal justice procedures.',
                duration: '2.5 hours',
                energyCost: 18,
                skillGain: '+7 Intelligence, +2 Defense',
                prerequisites: 'None',
                enrolled: false,
                completed: false
            },
            {
                id: 'sports-science',
                name: 'Sports Science',
                category: 'sports',
                description: 'Learn about human physiology and athletic performance.',
                duration: '2 hours',
                energyCost: 15,
                skillGain: '+6 Speed, +4 Endurance',
                prerequisites: 'None',
                enrolled: false,
                completed: false
            }
        ];

        this.courses = courses;
        this.displayCourses('all');
    }

    displayCourses(category) {
        const grid = document.getElementById('coursesGrid');
        if (!grid) return;

        let filteredCourses = this.courses;
        if (category !== 'all') {
            filteredCourses = this.courses.filter(course => course.category === category);
        }

        grid.innerHTML = '';

        filteredCourses.forEach(course => {
            const courseCard = document.createElement('div');
            courseCard.className = 'course-card';
            courseCard.onclick = () => this.showCourseModal(course);

            courseCard.innerHTML = `
                <h4>${course.name}</h4>
                <div class="category" style="background: ${this.getCategoryColor(course.category)}">${this.getCategoryName(course.category)}</div>
                <p>${course.description}</p>
                <div class="course-stats">
                    <div class="course-stat">
                        <span class="label">Duration:</span>
                        <span class="value">${course.duration}</span>
                    </div>
                    <div class="course-stat">
                        <span class="label">Energy:</span>
                        <span class="value">${course.energyCost}</span>
                    </div>
                    <div class="course-stat">
                        <span class="label">Skills:</span>
                        <span class="value">${course.skillGain}</span>
                    </div>
                </div>
                <button class="enroll-btn">${course.enrolled ? 'Continue' : 'Enroll'}</button>
            `;

            grid.appendChild(courseCard);
        });
    }

    filterCoursesByCategory(category) {
        // Update active category button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[data-category="${category}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.displayCourses(category);
    }

    getCategoryColor(category) {
        const colors = {
            combat: '#ff6b35',
            business: '#4CAF50',
            technology: '#2196F3',
            science: '#9C27B0',
            arts: '#FF9800',
            sports: '#795548'
        };
        return colors[category] || '#666';
    }

    getCategoryName(category) {
        const names = {
            combat: 'Combat & Defense',
            business: 'Business & Finance',
            technology: 'Technology',
            science: 'Science & Medicine',
            arts: 'Arts & Humanities',
            sports: 'Sports & Fitness'
        };
        return names[category] || category;
    }

    showCourseModal(course) {
        const modal = document.getElementById('course-modal');
        const title = document.getElementById('course-modal-title');
        const name = document.getElementById('course-name');
        const desc = document.getElementById('course-description');
        const duration = document.getElementById('course-duration');
        const energy = document.getElementById('course-energy');
        const skill = document.getElementById('course-skill');
        const prereq = document.getElementById('course-prereq');
        const enrollBtn = document.querySelector('#course-modal .enroll-btn');

        if (title) title.textContent = course.name;
        if (name) name.textContent = course.name;
        if (desc) desc.textContent = course.description;
        if (duration) duration.textContent = course.duration;
        if (energy) energy.textContent = course.energyCost.toString();
        if (skill) skill.textContent = course.skillGain;
        if (prereq) prereq.textContent = course.prerequisites;
        if (enrollBtn) enrollBtn.textContent = course.enrolled ? 'Continue Course' : 'Enroll Now';

        // Store current course
        this.currentCourse = course;

        modal.classList.add('show');
    }

    closeEducationModal() {
        const modal = document.getElementById('course-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    enrollInCourse() {
        if (!this.currentCourse) return;

        if (game.player.energy < this.currentCourse.energyCost) {
            game.showNotification('Not enough energy to enroll!', 'error');
            return;
        }

        // Handle course enrollment based on existing education system
        this.handleEducation(this.currentCourse.id);

        // Update course status
        this.currentCourse.enrolled = true;

        // Refresh courses display
        const activeCategory = document.querySelector('.category-btn.active').dataset.category;
        this.displayCourses(activeCategory);

        // Close modal
        this.closeEducationModal();

        // Show success message
        game.showNotification(`Enrolled in ${this.currentCourse.name}!`, 'success');
    }

    loadProgress() {
        // Load and display progress data
        this.updateProgressDisplay();
        this.loadSkillProgress();
        this.loadRecentActivity();
    }

    updateProgressDisplay() {
        const completedCourses = this.courses.filter(c => c.completed).length;
        const totalCourses = this.courses.length;
        const percentage = Math.round((completedCourses / totalCourses) * 100);

        // Update overall progress
        const progressCircle = document.getElementById('overall-progress');
        const progressText = progressCircle.querySelector('.progress-text');
        const coursesCompleted = document.getElementById('courses-completed');

        if (progressCircle) {
            progressCircle.style.setProperty('--progress', `${percentage}deg`);
        }
        if (progressText) progressText.textContent = `${percentage}%`;
        if (coursesCompleted) coursesCompleted.textContent = `${completedCourses} of ${totalCourses} courses completed`;

        // Update study streak and time
        const streakElement = document.getElementById('study-streak');
        const timeElement = document.getElementById('total-study-time');

        if (streakElement) streakElement.textContent = (game.player.studyStreak || 0).toString();
        if (timeElement) timeElement.textContent = (game.player.totalStudyTime || 0).toString();
    }

    loadSkillProgress() {
        const skillBars = document.getElementById('skillBars');
        if (!skillBars) return;

        const skills = [
            { name: 'Intelligence', value: game.player.intelligence || 100 },
            { name: 'Strength', value: game.player.strength || 100 },
            { name: 'Defense', value: game.player.defense || 100 },
            { name: 'Speed', value: game.player.speed || 100 },
            { name: 'Dexterity', value: game.player.dexterity || 100 },
            { name: 'Endurance', value: game.player.endurance || 100 }
        ];

        skillBars.innerHTML = '';

        skills.forEach(skill => {
            const skillBar = document.createElement('div');
            skillBar.className = 'skill-bar';
            skillBar.innerHTML = `
                <div class="skill-name">${skill.name}</div>
                <div class="skill-level">
                    <div class="skill-fill" style="width: ${Math.min(skill.value, 100)}%"></div>
                </div>
            `;
            skillBars.appendChild(skillBar);
        });
    }

    loadRecentActivity() {
        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        // Mock recent activity data
        const activities = [
            {
                course: 'Combat Training',
                action: 'Completed course',
                date: new Date().toLocaleDateString(),
                time: '2 hours ago'
            },
            {
                course: 'Business Fundamentals',
                action: 'Enrolled in course',
                date: new Date().toLocaleDateString(),
                time: '1 day ago'
            }
        ];

        activityList.innerHTML = '';

        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <div class="activity-info">
                    <h5>${activity.course}</h5>
                    <p>${activity.action}</p>
                </div>
                <div class="activity-date">${activity.time}</div>
            `;
            activityList.appendChild(activityItem);
        });
    }

    loadCertificates() {
        const gallery = document.getElementById('certificatesGallery');
        if (!gallery) return;

        // Mock certificates data
        const certificates = [
            {
                course: 'Combat Training',
                date: '2024-01-15',
                grade: 'A+'
            },
            {
                course: 'Business Fundamentals',
                date: '2024-01-10',
                grade: 'A'
            }
        ];

        gallery.innerHTML = '';

        certificates.forEach(cert => {
            const certCard = document.createElement('div');
            certCard.className = 'certificate-card';
            certCard.onclick = () => this.showCertificate(cert);
            certCard.innerHTML = `
                <div class="certificate-icon">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <h4>${cert.course}</h4>
                <div class="date">${cert.date}</div>
                <div class="grade">Grade: ${cert.grade}</div>
            `;
            gallery.appendChild(certCard);
        });
    }

    showCertificate(certificate) {
        const modal = document.getElementById('certificate-modal');
        const studentName = document.getElementById('cert-student-name');
        const courseName = document.getElementById('cert-course-name');
        const certDate = document.getElementById('cert-date');

        if (studentName) studentName.textContent = game.player.name || 'Player';
        if (courseName) courseName.textContent = certificate.course;
        if (certDate) certDate.textContent = new Date(certificate.date).toLocaleDateString();

        modal.classList.add('show');
    }

    closeCertificateModal() {
        const modal = document.getElementById('certificate-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    filterCertificates(filter) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // For now, just reload certificates (could be filtered by date/category)
        this.loadCertificates();
    }

    downloadCertificate() {
        game.showNotification('Certificate download feature coming soon!', 'info');
    }

    shareCertificate() {
        game.showNotification('Certificate sharing feature coming soon!', 'info');
    }

    loadLibrary() {
        const resources = [
            {
                title: 'Introduction to Combat',
                type: 'textbook',
                category: 'combat',
                description: 'Comprehensive guide to basic combat techniques and strategies.',
                author: 'Master Instructor',
                pages: 150
            },
            {
                title: 'Business Strategy 101',
                type: 'video',
                category: 'business',
                description: 'Video series on fundamental business strategies and market analysis.',
                author: 'Business Expert',
                duration: '45 min'
            },
            {
                title: 'Programming Fundamentals',
                type: 'article',
                category: 'technology',
                description: 'Essential concepts in computer programming and software development.',
                author: 'Tech Guru',
                readTime: '15 min'
            },
            {
                title: 'Human Anatomy',
                type: 'research',
                category: 'science',
                description: 'Detailed study of human physiological systems and anatomy.',
                author: 'Dr. Science',
                pages: 300
            }
        ];

        this.libraryResources = resources;
        this.displayLibraryResources('all');
    }

    displayLibraryResources(category) {
        const container = document.getElementById('libraryResources');
        if (!container) return;

        let filteredResources = this.libraryResources;
        if (category !== 'all') {
            filteredResources = this.libraryResources.filter(r => r.category === category);
        }

        container.innerHTML = '';

        filteredResources.forEach(resource => {
            const resourceCard = document.createElement('div');
            resourceCard.className = 'resource-card';
            resourceCard.onclick = () => this.openResource(resource);
            resourceCard.innerHTML = `
                <div class="resource-icon">
                    <i class="fas ${this.getResourceIcon(resource.type)}"></i>
                </div>
                <h4>${resource.title}</h4>
                <div class="type">${resource.type}</div>
                <p>${resource.description}</p>
                <div class="resource-meta">
                    <span>${resource.author}</span>
                    <span>${resource.pages || resource.duration || resource.readTime}</span>
                </div>
            `;
            container.appendChild(resourceCard);
        });
    }

    getResourceIcon(type) {
        const icons = {
            textbook: 'fa-book',
            video: 'fa-video',
            article: 'fa-newspaper',
            research: 'fa-microscope'
        };
        return icons[type] || 'fa-book';
    }

    filterLibraryByCategory(category) {
        // Update active category button
        document.querySelectorAll('.lib-category-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[data-category="${category}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.displayLibraryResources(category);
    }

    searchLibrary(query) {
        const container = document.getElementById('libraryResources');
        if (!container) return;

        if (!query.trim()) {
            this.displayLibraryResources('all');
            return;
        }

        const filtered = this.libraryResources.filter(resource =>
            resource.title.toLowerCase().includes(query.toLowerCase()) ||
            resource.description.toLowerCase().includes(query.toLowerCase()) ||
            resource.author.toLowerCase().includes(query.toLowerCase())
        );

        container.innerHTML = '';

        filtered.forEach(resource => {
            const resourceCard = document.createElement('div');
            resourceCard.className = 'resource-card';
            resourceCard.onclick = () => this.openResource(resource);
            resourceCard.innerHTML = `
                <div class="resource-icon">
                    <i class="fas ${this.getResourceIcon(resource.type)}"></i>
                </div>
                <h4>${resource.title}</h4>
                <div class="type">${resource.type}</div>
                <p>${resource.description}</p>
                <div class="resource-meta">
                    <span>${resource.author}</span>
                    <span>${resource.pages || resource.duration || resource.readTime}</span>
                </div>
            `;
            container.appendChild(resourceCard);
        });
    }

    openResource(resource) {
        const modal = document.getElementById('reading-modal');
        const title = document.getElementById('reading-title');

        if (title) title.textContent = resource.title;

        // Mock reading content
        const content = `This is a comprehensive ${resource.type} about ${resource.title.toLowerCase()}.

        ${this.getResourceContent(resource)}

        This educational resource provides valuable knowledge and insights into the subject matter. Study diligently to improve your skills and understanding.

        Remember: Education is the key to success in Crime City!`;

        const textElement = document.getElementById('readingText');
        if (textElement) textElement.textContent = content;

        // Initialize reading progress
        this.currentPage = 1;
        this.totalPages = 10;
        this.updateReadingProgress();

        modal.classList.add('show');
    }

    getResourceContent(resource) {
        const contents = {
            textbook: 'This textbook covers fundamental concepts, practical applications, and advanced techniques in the field.',
            video: 'This video tutorial demonstrates step-by-step procedures and provides visual explanations of complex topics.',
            article: 'This scholarly article presents research findings, analysis, and theoretical frameworks related to the subject.',
            research: 'This research paper contains detailed methodology, experimental results, and comprehensive conclusions.'
        };
        return contents[resource.type] || 'This resource contains valuable educational content.';
    }

    updateReadingProgress() {
        const percentage = Math.round((this.currentPage / this.totalPages) * 100);
        const progressFill = document.getElementById('reading-progress-fill');
        const percentageText = document.getElementById('reading-percentage');
        const currentPageEl = document.getElementById('current-page');
        const totalPagesEl = document.getElementById('total-pages');

        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (percentageText) percentageText.textContent = `${percentage}%`;
        if (currentPageEl) currentPageEl.textContent = this.currentPage.toString();
        if (totalPagesEl) totalPagesEl.textContent = this.totalPages.toString();
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateReadingProgress();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updateReadingProgress();
        } else {
            // Finished reading
            game.showNotification('Reading completed! Knowledge gained!', 'success');
            this.closeReadingModal();
        }
    }

    closeReadingModal() {
        const modal = document.getElementById('reading-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    handleEducation(course) {
        if (game.player.energy < 20) {
            game.showNotification('Not enough energy to study!', 'error');
            return;
        }

        const courses = {
            'combat-training': () => {
                game.changeEnergy(-20);
                game.updateStat('strength', 5);
                game.updateStat('defense', 3);
                game.showNotification('Combat training completed!', 'success');
            },
            'self-defense': () => {
                game.changeEnergy(-18);
                game.updateStat('defense', 7);
                game.updateStat('dexterity', 5);
                game.showNotification('Self Defense training completed!', 'success');
            },
            'biology': () => {
                game.changeEnergy(-15);
                game.updateStat('intelligence', 8);
                game.showNotification('Biology course completed!', 'success');
            },
            'business': () => {
                game.changeEnergy(-15);
                game.updateStat('intelligence', 6);
                game.player.skills.searchForCash += 0.5;
                game.showNotification('Business course completed!', 'success');
            },
            'computer-science': () => {
                game.changeEnergy(-20);
                game.updateStat('intelligence', 10);
                game.player.skills.cracking += 0.3;
                game.showNotification('Computer Science course completed!', 'success');
            },
            'general-studies': () => {
                game.changeEnergy(-12);
                game.updateStat('intelligence', 4);
                game.updateStat('manualLabor', 2);
                game.showNotification('General Studies course completed!', 'success');
            },
            'history': () => {
                game.changeEnergy(-15);
                game.updateStat('intelligence', 6);
                game.showNotification('History course completed!', 'success');
            },
            'law': () => {
                game.changeEnergy(-18);
                game.updateStat('intelligence', 7);
                game.updateStat('defense', 2);
                game.showNotification('Law course completed!', 'success');
            },
            'mathematics': () => {
                game.changeEnergy(-15);
                game.updateStat('intelligence', 7);
                game.showNotification('Mathematics course completed!', 'success');
            },
            'psychology': () => {
                game.changeEnergy(-15);
                game.updateStat('intelligence', 6);
                game.showNotification('Psychology course completed!', 'success');
            },
            'health-fitness': () => {
                game.changeEnergy(-10);
                game.updateStat('endurance', 8);
                game.changeLife(5);
                game.showNotification('Health & Fitness training completed!', 'success');
            },
            'sports-science': () => {
                game.changeEnergy(-15);
                game.updateStat('speed', 6);
                game.updateStat('endurance', 4);
                game.showNotification('Sports Science course completed!', 'success');
            }
        };

        if (courses[course]) {
            courses[course]();
            
            // Save education progress to server
            if (window.autoSave) {
                window.autoSave.saveEducation(course, true, 100, {
                    energyUsed: 20,
                    statsGained: 'varies by course'
                });
            }
        }
    }

    handleCasino(gameType) {
        if (game.player.money < 50) {
            game.showNotification('Not enough money to play!', 'error');
            return;
        }

        const betAmount = Math.min(100, Math.floor(game.player.money * 0.1));
        
        if (!game.spendMoney(betAmount)) return;

        const games = {
            'slots': () => {
                const win = Math.random() < 0.3; // 30% chance to win
                if (win) {
                    const winnings = betAmount * 3;
                    game.addMoney(winnings);
                    game.showNotification(`Jackpot! Won $${winnings}!`, 'success');
                } else {
                    game.showNotification('Better luck next time!', 'info');
                }
            },
            'roulette': () => {
                const win = Math.random() < 0.35; // 35% chance to win
                if (win) {
                    const winnings = betAmount * 2.5;
                    game.addMoney(winnings);
                    game.showNotification(`Lucky number! Won $${winnings}!`, 'success');
                } else {
                    game.showNotification('Not your lucky day!', 'error');
                }
            },
            'highlow': () => {
                const win = Math.random() < 0.5; // 50% chance to win
                if (win) {
                    const winnings = betAmount * 1.8;
                    game.addMoney(winnings);
                    game.showNotification(`Correct guess! Won $${winnings}!`, 'success');
                } else {
                    game.showNotification('Wrong guess! You lost.', 'error');
                }
            },
            'keno': () => {
                const win = Math.random() < 0.25; // 25% chance to win
                if (win) {
                    const winnings = betAmount * 4;
                    game.addMoney(winnings);
                    game.showNotification(`Keno winner! Won $${winnings}!`, 'success');
                } else {
                    game.showNotification('Numbers didn't match!', 'error');
                }
            },
            'craps': () => {
                const win = Math.random() < 0.4; // 40% chance to win
                if (win) {
                    const winnings = betAmount * 2.2;
                    game.addMoney(winnings);
                    game.showNotification(`Craps winner! Won $${winnings}!`, 'success');
                } else {
                    game.showNotification('Snake eyes! You lost.', 'error');
                }
            },
            'bookie': () => {
                const win = Math.random() < 0.45; // 45% chance to win
                if (win) {
                    const winnings = betAmount * 2.1;
                    game.addMoney(winnings);
                    game.showNotification(`Bet won! Won $${winnings}!`, 'success');
                } else {
                    game.showNotification('Bet lost!', 'error');
                }
            },
            'lottery': () => {
                const win = Math.random() < 0.1; // 10% chance to win
                if (win) {
                    const winnings = betAmount * 10;
                    game.addMoney(winnings);
                    game.showNotification(`LOTTERY JACKPOT! Won $${winnings}!`, 'success');
                } else {
                    game.showNotification('No winning numbers!', 'error');
                }
            },
            'blackjack': () => {
                const win = Math.random() < 0.45; // 45% chance to win
                if (win) {
                    const winnings = betAmount * 2;
                    game.addMoney(winnings);
                    game.showNotification(`Blackjack! Won $${winnings}!`, 'success');
                } else {
                    game.showNotification('Bust! You lost.', 'error');
                }
            },
            'poker': () => {
                const win = Math.random() < 0.4; // 40% chance to win
                if (win) {
                    const winnings = betAmount * 2.5;
                    game.addMoney(winnings);
                    game.showNotification(`Poker hand won! Won $${winnings}!`, 'success');
                } else {
                    game.showNotification('House wins!', 'error');
                }
            },
            'russian-roulette': () => {
                const win = Math.random() < 0.15; // 15% chance to win (very risky!)
                if (win) {
                    const winnings = betAmount * 8;
                    game.addMoney(winnings);
                    game.showNotification(`Survived! Won $${winnings}!`, 'success');
                } else {
                    const damage = Math.floor(Math.random() * 50) + 25;
                    game.changeLife(-damage);
                    game.showNotification(`BANG! Lost ${damage} life!`, 'error');
                }
            },
            'spin-wheel': () => {
                const win = Math.random() < 0.3; // 30% chance to win
                if (win) {
                    const winnings = betAmount * 3.5;
                    game.addMoney(winnings);
                    game.showNotification(`Wheel winner! Won $${winnings}!`, 'success');
                } else {
                    game.showNotification('Wheel stopped on empty!', 'error');
                }
            }
        };

        if (games[gameType]) {
            games[gameType]();
        }
    }

    // Casino Modal Functions
    openCasinoModal(gameType) {
        const modalId = `${gameType}-modal`;
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            this.initializeCasinoGame(gameType);
        }
    }

    closeCasinoModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    initializeCasinoGame(gameType) {
        // Update casino balance display
        const balanceElement = document.getElementById('casino-balance');
        if (balanceElement && game.player) {
            balanceElement.textContent = game.player.money.toLocaleString();
        }

        switch (gameType) {
            case 'slots':
                this.initializeSlots();
                break;
            case 'blackjack':
                this.initializeBlackjack();
                break;
            case 'roulette':
                this.initializeRoulette();
                break;
            case 'poker':
                this.initializePoker();
                break;
            case 'craps':
                this.initializeCraps();
                break;
            case 'keno':
                this.initializeKeno();
                break;
            case 'highlow':
                this.initializeHighLow();
                break;
            case 'lottery':
                this.initializeLottery();
                break;
            case 'russian-roulette':
                this.initializeRussianRoulette();
                break;
            case 'spin-wheel':
                this.initializeSpinWheel();
                break;
        }
    }

    // Slots Game
    initializeSlots() {
        // Generate random symbols for reels
        const symbols = ['🍒', '🍋', '🍊', '⭐', '💎', '7️⃣'];
        for (let i = 1; i <= 3; i++) {
            const reel = document.getElementById(`reel${i}`);
            if (reel) {
                const symbolElements = reel.querySelectorAll('.symbol');
                symbolElements.forEach((symbol, index) => {
                    symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                    symbol.style.top = `${index * 20}px`;
                });
            }
        }
    }

    spinSlots() {
        const betInput = document.getElementById('slots-bet');
        const betAmount = parseInt(betInput.value) || 50;

        if (game.player.money < betAmount) {
            game.showNotification('Not enough money!', 'error');
            return;
        }

        if (!game.spendMoney(betAmount)) return;

        // Disable spin button
        const spinBtn = document.querySelector('.spin-btn');
        spinBtn.disabled = true;
        spinBtn.textContent = 'Spinning...';

        // Animate reels
        const symbols = ['🍒', '🍋', '🍊', '⭐', '💎', '7️⃣'];
        const results = [];

        for (let i = 1; i <= 3; i++) {
            const reel = document.getElementById(`reel${i}`);
            const result = symbols[Math.floor(Math.random() * symbols.length)];
            results.push(result);

            if (reel) {
                const symbolElements = reel.querySelectorAll('.symbol');
                symbolElements.forEach((symbol, index) => {
                    symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                });
            }
        }

        setTimeout(() => {
            // Show final results
            for (let i = 1; i <= 3; i++) {
                const reel = document.getElementById(`reel${i}`);
                if (reel) {
                    const symbolElements = reel.querySelectorAll('.symbol');
                    symbolElements.forEach((symbol, index) => {
                        if (index === 2) { // Middle symbol
                            symbol.textContent = results[i-1];
                        } else {
                            symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                        }
                    });
                }
            }

            // Calculate winnings
            let winnings = 0;
            const [reel1, reel2, reel3] = results;

            if (reel1 === reel2 && reel2 === reel3) {
                switch (reel1) {
                    case '🍒': winnings = betAmount * 5; break;
                    case '⭐': winnings = betAmount * 10; break;
                    case '💎': winnings = betAmount * 20; break;
                    case '7️⃣': winnings = betAmount * 50; break;
                    default: winnings = betAmount * 3;
                }
                game.addMoney(winnings);
                game.showNotification(`JACKPOT! Won $${winnings.toLocaleString()}!`, 'success');
            } else {
                game.showNotification('Better luck next time!', 'info');
            }

            // Update balance and re-enable button
            const balanceElement = document.getElementById('casino-balance');
            if (balanceElement) {
                balanceElement.textContent = game.player.money.toLocaleString();
            }

            spinBtn.disabled = false;
            spinBtn.innerHTML = '<i class="fas fa-play"></i> Spin ($<span id="slots-cost">' + (parseInt(betInput.value) || 50) + '</span>)';
        }, 2000);
    }

    // Blackjack Game
    initializeBlackjack() {
        this.blackjackDeck = this.createDeck();
        this.shuffleDeck();
        this.blackjackDealerCards = [];
        this.blackjackPlayerCards = [];
        this.gameInProgress = false;
    }

    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck = [];

        for (const suit of suits) {
            for (const value of values) {
                deck.push({ suit, value });
            }
        }

        return deck;
    }

    shuffleDeck() {
        for (let i = this.blackjackDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.blackjackDeck[i], this.blackjackDeck[j]] = [this.blackjackDeck[j], this.blackjackDeck[i]];
        }
    }

    dealBlackjack() {
        const betInput = document.getElementById('blackjack-bet');
        const betAmount = parseInt(betInput.value) || 50;

        if (game.player.money < betAmount) {
            game.showNotification('Not enough money!', 'error');
            return;
        }

        if (!game.spendMoney(betAmount)) return;

        this.blackjackBet = betAmount;
        this.gameInProgress = true;

        // Reset cards
        this.blackjackDealerCards = [];
        this.blackjackPlayerCards = [];

        // Deal initial cards
        this.blackjackPlayerCards.push(this.drawCard());
        this.blackjackDealerCards.push(this.drawCard());
        this.blackjackPlayerCards.push(this.drawCard());
        this.blackjackDealerCards.push(this.drawCard());

        this.updateBlackjackDisplay();

        // Enable action buttons
        document.getElementById('deal-btn').disabled = true;
        document.getElementById('hit-btn').disabled = false;
        document.getElementById('stand-btn').disabled = false;
        document.getElementById('double-btn').disabled = false;
    }

    drawCard() {
        return this.blackjackDeck.pop();
    }

    getCardValue(card) {
        if (['J', 'Q', 'K'].includes(card.value)) return 10;
        if (card.value === 'A') return 11;
        return parseInt(card.value);
    }

    calculateHandValue(cards) {
        let value = 0;
        let aces = 0;

        for (const card of cards) {
            if (card.value === 'A') {
                aces++;
                value += 11;
            } else {
                value += this.getCardValue(card);
            }
        }

        // Handle aces
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }

        return value;
    }

    updateBlackjackDisplay() {
        // Update dealer cards (show one face down)
        const dealerContainer = document.getElementById('dealer-cards');
        dealerContainer.innerHTML = '';

        this.blackjackDealerCards.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            if (index === 1 && this.gameInProgress) {
                cardDiv.textContent = '🂠'; // Face down
            } else {
                cardDiv.textContent = card.value + card.suit;
                if (card.suit === '♥' || card.suit === '♦') {
                    cardDiv.style.color = '#ff6b35';
                }
            }
            dealerContainer.appendChild(cardDiv);
        });

        // Update dealer value
        const dealerValue = this.gameInProgress ?
            this.getCardValue(this.blackjackDealerCards[0]) :
            this.calculateHandValue(this.blackjackDealerCards);
        document.getElementById('dealer-value').textContent = dealerValue.toString();

        // Update player cards
        const playerContainer = document.getElementById('player-cards');
        playerContainer.innerHTML = '';

        this.blackjackPlayerCards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.textContent = card.value + card.suit;
            if (card.suit === '♥' || card.suit === '♦') {
                cardDiv.style.color = '#ff6b35';
            }
            playerContainer.appendChild(cardDiv);
        });

        // Update player value
        const playerValue = this.calculateHandValue(this.blackjackPlayerCards);
        document.getElementById('player-value').textContent = playerValue.toString();

        // Check for automatic outcomes
        if (playerValue === 21 && this.blackjackPlayerCards.length === 2) {
            this.endBlackjackGame('blackjack');
        } else if (playerValue > 21) {
            this.endBlackjackGame('bust');
        }
    }

    hitBlackjack() {
        this.blackjackPlayerCards.push(this.drawCard());
        this.updateBlackjackDisplay();
    }

    standBlackjack() {
        this.gameInProgress = false;
        this.dealerTurn();
    }

    doubleDownBlackjack() {
        if (game.player.money < this.blackjackBet) {
            game.showNotification('Not enough money to double down!', 'error');
            return;
        }

        if (!game.spendMoney(this.blackjackBet)) return;
        this.blackjackBet *= 2;

        this.blackjackPlayerCards.push(this.drawCard());
        this.updateBlackjackDisplay();

        if (this.calculateHandValue(this.blackjackPlayerCards) <= 21) {
            this.standBlackjack();
        }
    }

    dealerTurn() {
        while (this.calculateHandValue(this.blackjackDealerCards) < 17) {
            this.blackjackDealerCards.push(this.drawCard());
        }

        this.updateBlackjackDisplay();

        const playerValue = this.calculateHandValue(this.blackjackPlayerCards);
        const dealerValue = this.calculateHandValue(this.blackjackDealerCards);

        if (dealerValue > 21 || playerValue > dealerValue) {
            this.endBlackjackGame('win');
        } else if (dealerValue > playerValue) {
            this.endBlackjackGame('lose');
        } else {
            this.endBlackjackGame('push');
        }
    }

    endBlackjackGame(result) {
        this.gameInProgress = false;

        // Disable action buttons
        document.getElementById('hit-btn').disabled = true;
        document.getElementById('stand-btn').disabled = true;
        document.getElementById('double-btn').disabled = true;
        document.getElementById('deal-btn').disabled = false;

        let message = '';
        let winnings = 0;

        switch (result) {
            case 'blackjack':
                winnings = Math.floor(this.blackjackBet * 2.5);
                message = `Blackjack! You win $${winnings.toLocaleString()}!`;
                game.addMoney(winnings);
                break;
            case 'win':
                winnings = this.blackjackBet * 2;
                message = `You win! +$${winnings.toLocaleString()}`;
                game.addMoney(winnings);
                break;
            case 'lose':
                message = `Dealer wins. You lose $${this.blackjackBet.toLocaleString()}.`;
                break;
            case 'push':
                winnings = this.blackjackBet;
                message = `Push! Your bet is returned.`;
                game.addMoney(winnings);
                break;
            case 'bust':
                message = `Bust! You lose $${this.blackjackBet.toLocaleString()}.`;
                break;
        }

        document.getElementById('blackjack-status').textContent = message;

        // Update balance
        const balanceElement = document.getElementById('casino-balance');
        if (balanceElement) {
            balanceElement.textContent = game.player.money.toLocaleString();
        }

        if (winnings > 0) {
            game.showNotification(message, 'success');
        } else {
            game.showNotification(message, 'error');
        }
    }

    // Roulette Game
    initializeRoulette() {
        this.rouletteBets = [];
        this.updateRouletteBetsDisplay();
    }

    placeRouletteBet(type, payout) {
        const betAmount = 50; // Fixed bet for simplicity

        if (game.player.money < betAmount) {
            game.showNotification('Not enough money!', 'error');
            return;
        }

        if (!game.spendMoney(betAmount)) return;

        this.rouletteBets.push({ type, amount: betAmount, payout });

        // Update display
        const betsList = document.getElementById('bets-list');
        if (betsList) {
            betsList.innerHTML = this.rouletteBets.map(bet =>
                `<div>${bet.type.toUpperCase()}: $${bet.amount} (${bet.payout}:1)</div>`
            ).join('');
        }

        const balanceElement = document.getElementById('casino-balance');
        if (balanceElement) {
            balanceElement.textContent = game.player.money.toLocaleString();
        }
    }

    clearRouletteBets() {
        // Refund all bets
        const totalRefund = this.rouletteBets.reduce((sum, bet) => sum + bet.amount, 0);
        game.addMoney(totalRefund);

        this.rouletteBets = [];
        const betsList = document.getElementById('bets-list');
        if (betsList) {
            betsList.textContent = 'No bets placed';
        }

        const balanceElement = document.getElementById('casino-balance');
        if (balanceElement) {
            balanceElement.textContent = game.player.money.toLocaleString();
        }
    }

    spinRoulette() {
        if (this.rouletteBets.length === 0) {
            game.showNotification('Place some bets first!', 'warning');
            return;
        }

        const spinBtn = document.querySelector('.spin-btn');
        const clearBtn = document.querySelector('.clear-btn');

        spinBtn.disabled = true;
        clearBtn.disabled = true;

        // Animate wheel
        const wheel = document.getElementById('roulette-wheel');
        const ball = document.getElementById('roulette-ball');

        const result = Math.floor(Math.random() * 37); // 0-36
        const rotation = 360 * 5 + (result * 9.73); // 5 full rotations + result position

        wheel.style.setProperty('--rotation', `${rotation}deg`);
        wheel.classList.add('spinning');

        setTimeout(() => {
            wheel.classList.remove('spinning');

            // Calculate winnings
            let totalWinnings = 0;

            this.rouletteBets.forEach(bet => {
                let won = false;

                switch (bet.type) {
                    case 'red':
                        won = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(result);
                        break;
                    case 'black':
                        won = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35].includes(result);
                        break;
                    case 'even':
                        won = result !== 0 && result % 2 === 0;
                        break;
                    case 'odd':
                        won = result % 2 === 1;
                        break;
                }

                if (won) {
                    const winnings = bet.amount * bet.payout;
                    totalWinnings += winnings;
                }
            });

            if (totalWinnings > 0) {
                game.addMoney(totalWinnings);
                game.showNotification(`Roulette win! +$${totalWinnings.toLocaleString()}`, 'success');
            } else {
                game.showNotification(`Roulette: ${result} - All bets lost!`, 'error');
            }

            // Clear bets and update display
            this.rouletteBets = [];
            const betsList = document.getElementById('bets-list');
            if (betsList) {
                betsList.textContent = 'No bets placed';
            }

            const balanceElement = document.getElementById('casino-balance');
            if (balanceElement) {
                balanceElement.textContent = game.player.money.toLocaleString();
            }

            const statusElement = document.getElementById('roulette-status');
            if (statusElement) {
                statusElement.textContent = `Ball landed on ${result}`;
            }

            spinBtn.disabled = false;
            clearBtn.disabled = false;
        }, 3000);
    }

    updateRouletteBetsDisplay() {
        const betsList = document.getElementById('bets-list');
        if (betsList) {
            betsList.textContent = 'No bets placed';
        }
    }

    // Poker Game
    initializePoker() {
        this.pokerDeck = this.createDeck();
        this.shuffleDeck();
        this.pokerPot = 0;
        this.currentBet = 0;
        this.playerChips = 1000;
        this.dealerChips = 1000;
    }

    dealPoker() {
        const betAmount = parseInt(document.getElementById('poker-bet').value) || 50;

        if (this.playerChips < betAmount) {
            game.showNotification('Not enough chips!', 'error');
            return;
        }

        // Reset game
        this.pokerDeck = this.createDeck();
        this.shuffleDeck();
        this.pokerPot = 0;
        this.currentBet = betAmount;

        // Deal hole cards
        this.playerHand = [this.drawCard(), this.drawCard()];
        this.dealerHand = [this.drawCard(), this.drawCard()];

        // Deal community cards
        this.communityCards = [
            this.drawCard(),
            this.drawCard(),
            this.drawCard(),
            this.drawCard(),
            this.drawCard()
        ];

        // Place initial bets
        this.playerChips -= betAmount;
        this.dealerChips -= betAmount;
        this.pokerPot += betAmount * 2;

        this.updatePokerDisplay();
        this.updatePokerButtons();

        // Dealer's turn (simple AI)
        if (Math.random() < 0.7) { // 70% chance to call
            this.callPoker();
        } else {
            this.foldPoker();
        }
    }

    updatePokerDisplay() {
        // Update community cards
        const communityContainer = document.getElementById('community-cards');
        communityContainer.innerHTML = '';

        this.communityCards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.textContent = card.value + card.suit;
            if (card.suit === '♥' || card.suit === '♦') {
                cardDiv.style.color = '#ff6b35';
            }
            communityContainer.appendChild(cardDiv);
        });

        // Update player hand
        const playerContainer = document.getElementById('poker-hand');
        playerContainer.innerHTML = '';

        this.playerHand.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.textContent = card.value + card.suit;
            if (card.suit === '♥' || card.suit === '♦') {
                cardDiv.style.color = '#ff6b35';
            }
            playerContainer.appendChild(cardDiv);
        });

        // Update hand rank
        const handRank = this.evaluatePokerHand([...this.playerHand, ...this.communityCards]);
        document.getElementById('hand-rank').textContent = handRank;

        // Update pot and current bet
        document.getElementById('poker-pot').textContent = this.pokerPot.toString();
        document.getElementById('current-bet').textContent = this.currentBet.toString();
    }

    foldPoker() {
        // Dealer wins
        this.dealerChips += this.pokerPot;
        this.pokerPot = 0;

        document.getElementById('poker-status').textContent = 'You folded. Dealer wins!';
        this.endPokerGame();
    }

    callPoker() {
        const callAmount = this.currentBet;

        if (this.playerChips >= callAmount) {
            this.playerChips -= callAmount;
            this.pokerPot += callAmount;

            // Dealer calls too
            this.dealerChips -= callAmount;
            this.pokerPot += callAmount;

            // Showdown
            const playerRank = this.getHandValue([...this.playerHand, ...this.communityCards]);
            const dealerRank = this.getHandValue([...this.dealerHand, ...this.communityCards]);

            if (playerRank > dealerRank) {
                this.playerChips += this.pokerPot;
                document.getElementById('poker-status').textContent = 'You win the hand!';
                game.addMoney(this.pokerPot);
            } else if (dealerRank > playerRank) {
                this.dealerChips += this.pokerPot;
                document.getElementById('poker-status').textContent = 'Dealer wins the hand.';
            } else {
                // Split pot
                const split = Math.floor(this.pokerPot / 2);
                this.playerChips += split;
                this.dealerChips += split;
                document.getElementById('poker-status').textContent = 'Split pot!';
                game.addMoney(split);
            }

            this.pokerPot = 0;
            this.endPokerGame();
        } else {
            game.showNotification('Not enough chips to call!', 'error');
        }
    }

    raisePoker() {
        const raiseAmount = parseInt(document.getElementById('poker-bet').value) || 50;

        if (this.playerChips >= raiseAmount) {
            this.playerChips -= raiseAmount;
            this.pokerPot += raiseAmount;
            this.currentBet += raiseAmount;

            // Dealer may re-raise or call
            if (Math.random() < 0.5 && this.dealerChips >= raiseAmount) {
                this.dealerChips -= raiseAmount;
                this.pokerPot += raiseAmount;
                document.getElementById('poker-status').textContent = 'Dealer re-raises!';
            } else {
                document.getElementById('poker-status').textContent = 'Dealer calls.';
            }

            this.updatePokerDisplay();
        } else {
            game.showNotification('Not enough chips to raise!', 'error');
        }
    }

    endPokerGame() {
        // Reset for next hand
        setTimeout(() => {
            document.getElementById('poker-status').textContent = '';
            this.updatePokerButtons();
        }, 3000);
    }

    updatePokerButtons() {
        const dealBtn = document.getElementById('deal-poker-btn');
        const foldBtn = document.getElementById('fold-btn');
        const callBtn = document.getElementById('call-btn');
        const raiseBtn = document.getElementById('raise-btn');

        dealBtn.disabled = this.pokerPot > 0;
        foldBtn.disabled = this.pokerPot === 0;
        callBtn.disabled = this.pokerPot === 0;
        raiseBtn.disabled = this.pokerPot === 0;
    }

    evaluatePokerHand(cards) {
        const handValue = this.getHandValue(cards);
        // Simplified hand ranking
        const rankings = [
            'High Card', 'Pair', 'Two Pair', 'Three of a Kind',
            'Straight', 'Flush', 'Full House', 'Four of a Kind',
            'Straight Flush', 'Royal Flush'
        ];
        return rankings[Math.min(handValue, rankings.length - 1)];
    }

    getHandValue(cards) {
        // Simplified hand evaluation - just return a score
        return Math.floor(Math.random() * 10);
    }

    // Craps Game
    initializeCraps() {
        this.crapsPoint = null;
        this.crapsBets = [];
        this.updateCrapsDisplay();
    }

    placeCrapsBet(type) {
        const betAmount = parseInt(document.getElementById('craps-bet').value) || 50;

        if (game.player.money < betAmount) {
            game.showNotification('Not enough money!', 'error');
            return;
        }

        if (!game.spendMoney(betAmount)) return;

        this.crapsBets.push({ type, amount: betAmount });
        this.updateCrapsBetsDisplay();
    }

    rollDice() {
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        const sum = die1 + die2;

        // Update dice display
        document.getElementById('die1').textContent = this.getDieSymbol(die1);
        document.getElementById('die2').textContent = this.getDieSymbol(die2);
        document.getElementById('last-roll').textContent = sum.toString();

        // Add rolling animation
        document.getElementById('die1').classList.add('rolling');
        document.getElementById('die2').classList.add('rolling');

        setTimeout(() => {
            document.getElementById('die1').classList.remove('rolling');
            document.getElementById('die2').classList.remove('rolling');
        }, 500);

        // Process bets
        let totalWinnings = 0;

        this.crapsBets.forEach(bet => {
            let won = false;
            let payout = 0;

            switch (bet.type) {
                case 'pass':
                    if (!this.crapsPoint) {
                        // Come out roll
                        if ([7, 11].includes(sum)) {
                            won = true;
                            payout = 1;
                        } else if ([2, 3, 12].includes(sum)) {
                            won = false;
                        } else {
                            this.crapsPoint = sum;
                            document.getElementById('point-number').textContent = sum.toString();
                        }
                    } else {
                        // Point established
                        if (sum === this.crapsPoint) {
                            won = true;
                            payout = 1;
                            this.crapsPoint = null;
                            document.getElementById('point-number').textContent = 'Off';
                        } else if (sum === 7) {
                            won = false;
                            this.crapsPoint = null;
                            document.getElementById('point-number').textContent = 'Off';
                        }
                    }
                    break;
                case 'dont_pass':
                    if (!this.crapsPoint) {
                        if ([2, 3].includes(sum)) {
                            won = true;
                            payout = 1;
                        } else if ([7, 11].includes(sum)) {
                            won = false;
                        } else if (sum !== 12) {
                            this.crapsPoint = sum;
                        }
                    } else {
                        if (sum === 7) {
                            won = true;
                            payout = 1;
                            this.crapsPoint = null;
                            document.getElementById('point-number').textContent = 'Off';
                        } else if (sum === this.crapsPoint) {
                            won = false;
                            this.crapsPoint = null;
                            document.getElementById('point-number').textContent = 'Off';
                        }
                    }
                    break;
                case 'come':
                    if ([7, 11].includes(sum)) {
                        won = true;
                        payout = 1;
                    } else if ([2, 3, 12].includes(sum)) {
                        won = false;
                    }
                    break;
                case 'field':
                    if ([2, 3, 4, 9, 10, 11, 12].includes(sum)) {
                        won = true;
                        payout = sum === 2 || sum === 12 ? 2 : 1;
                    }
                    break;
            }

            if (won) {
                const winnings = bet.amount * payout;
                totalWinnings += winnings;
            }
        });

        if (totalWinnings > 0) {
            game.addMoney(totalWinnings);
            game.showNotification(`Craps win! +$${totalWinnings.toLocaleString()}`, 'success');
        }

        // Clear bets for next roll
        this.crapsBets = [];
        this.updateCrapsBetsDisplay();

        const balanceElement = document.getElementById('casino-balance');
        if (balanceElement) {
            balanceElement.textContent = game.player.money.toLocaleString();
        }

        const statusElement = document.getElementById('craps-status');
        if (statusElement) {
            statusElement.textContent = `Rolled ${sum}`;
        }
    }

    getDieSymbol(number) {
        const symbols = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        return symbols[number - 1];
    }

    updateCrapsDisplay() {
        document.getElementById('point-number').textContent = this.crapsPoint || 'Off';
        document.getElementById('last-roll').textContent = '-';
        this.updateCrapsBetsDisplay();
    }

    updateCrapsBetsDisplay() {
        const betsElement = document.getElementById('craps-bets');
        if (betsElement) {
            if (this.crapsBets.length === 0) {
                betsElement.textContent = 'No bets placed';
            } else {
                betsElement.innerHTML = this.crapsBets.map(bet =>
                    `<div>${bet.type.toUpperCase()}: $${bet.amount}</div>`
                ).join('');
            }
        }
    }

    // Keno Game
    initializeKeno() {
        this.selectedKenoNumbers = [];
        this.generateKenoBoard();
    }

    generateKenoBoard() {
        const board = document.getElementById('keno-numbers');
        if (!board) return;

        board.innerHTML = '';

        for (let i = 1; i <= 80; i++) {
            const numberDiv = document.createElement('div');
            numberDiv.className = 'keno-number';
            numberDiv.textContent = i.toString();
            numberDiv.onclick = () => this.toggleKenoNumber(i);
            board.appendChild(numberDiv);
        }
    }

    toggleKenoNumber(number) {
        const index = this.selectedKenoNumbers.indexOf(number);

        if (index > -1) {
            this.selectedKenoNumbers.splice(index, 1);
        } else if (this.selectedKenoNumbers.length < 10) {
            this.selectedKenoNumbers.push(number);
        } else {
            game.showNotification('Maximum 10 numbers allowed!', 'warning');
            return;
        }

        this.updateKenoDisplay();
    }

    updateKenoDisplay() {
        // Update all number displays
        const numbers = document.querySelectorAll('.keno-number');
        numbers.forEach((numDiv, index) => {
            const num = index + 1;
            if (this.selectedKenoNumbers.includes(num)) {
                numDiv.classList.add('selected');
            } else {
                numDiv.classList.remove('selected');
                numDiv.classList.remove('drawn');
            }
        });

        // Update selected numbers display
        const selectedDiv = document.getElementById('selected-numbers');
        if (selectedDiv) {
            selectedDiv.textContent = this.selectedKenoNumbers.length > 0 ?
                this.selectedKenoNumbers.join(', ') : 'None';
        }
    }

    playKeno() {
        const betAmount = parseInt(document.getElementById('keno-bet').value) || 10;

        if (this.selectedKenoNumbers.length === 0) {
            game.showNotification('Select some numbers first!', 'warning');
            return;
        }

        if (game.player.money < betAmount) {
            game.showNotification('Not enough money!', 'error');
            return;
        }

        if (!game.spendMoney(betAmount)) return;

        // Draw 20 random numbers
        const drawnNumbers = [];
        const availableNumbers = Array.from({length: 80}, (_, i) => i + 1);

        for (let i = 0; i < 20; i++) {
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            drawnNumbers.push(availableNumbers.splice(randomIndex, 1)[0]);
        }

        // Mark drawn numbers
        const numbers = document.querySelectorAll('.keno-number');
        drawnNumbers.forEach(num => {
            const numDiv = numbers[num - 1];
            if (numDiv) {
                numDiv.classList.add('drawn');
            }
        });

        // Calculate hits
        const hits = this.selectedKenoNumbers.filter(num => drawnNumbers.includes(num)).length;

        // Calculate payout (simplified)
        let payout = 0;
        if (hits >= 5) {
            payout = betAmount * Math.pow(2, hits - 4);
        }

        if (payout > 0) {
            game.addMoney(payout);
            game.showNotification(`Keno: ${hits} hits! Won $${payout.toLocaleString()}`, 'success');
        } else {
            game.showNotification(`Keno: ${hits} hits. Better luck next time!`, 'info');
        }

        const balanceElement = document.getElementById('casino-balance');
        if (balanceElement) {
            balanceElement.textContent = game.player.money.toLocaleString();
        }

        // Clear selection for next game
        setTimeout(() => {
            this.selectedKenoNumbers = [];
            this.updateKenoDisplay();
        }, 3000);
    }

    clearKenoNumbers() {
        this.selectedKenoNumbers = [];
        this.updateKenoDisplay();
    }

    // High-Low Game
    initializeHighLow() {
        this.currentCard = null;
        this.nextCard = null;
        this.streak = 0;
        this.highLowMultiplier = 1.0;
        this.startHighLowGame();
    }

    startHighLowGame() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        this.currentCard = {
            value: values[Math.floor(Math.random() * values.length)],
            suit: suits[Math.floor(Math.random() * suits.length)]
        };

        this.nextCard = {
            value: values[Math.floor(Math.random() * values.length)],
            suit: suits[Math.floor(Math.random() * suits.length)]
        };

        this.updateHighLowDisplay(true);
    }

    updateHighLowDisplay(hideNext = false) {
        const currentCardDiv = document.getElementById('current-card');
        const nextCardDiv = document.getElementById('next-card');

        if (currentCardDiv) {
            currentCardDiv.textContent = this.currentCard.value + this.currentCard.suit;
            if (this.currentCard.suit === '♥' || this.currentCard.suit === '♦') {
                currentCardDiv.style.color = '#ff6b35';
            } else {
                currentCardDiv.style.color = 'white';
            }
        }

        if (nextCardDiv) {
            nextCardDiv.textContent = hideNext ? '❓' : (this.nextCard.value + this.nextCard.suit);
            if (!hideNext && (this.nextCard.suit === '♥' || this.nextCard.suit === '♦')) {
                nextCardDiv.style.color = '#ff6b35';
            } else if (!hideNext) {
                nextCardDiv.style.color = 'white';
            }
        }

        document.getElementById('streak-count').textContent = this.streak.toString();
        document.getElementById('multiplier').textContent = this.highLowMultiplier.toFixed(1) + 'x';
    }

    guessHighLow(guess) {
        const betAmount = parseInt(document.getElementById('highlow-bet').value) || 50;

        if (game.player.money < betAmount) {
            game.showNotification('Not enough money!', 'error');
            return;
        }

        if (!game.spendMoney(betAmount)) return;

        const currentValue = this.getCardNumericValue(this.currentCard);
        const nextValue = this.getCardNumericValue(this.nextCard);

        const correct = (guess === 'high' && nextValue > currentValue) ||
                       (guess === 'low' && nextValue < currentValue);

        if (correct) {
            this.streak++;
            this.highLowMultiplier *= 1.5;
            const winnings = Math.floor(betAmount * (this.highLowMultiplier - 1));
            game.addMoney(winnings + betAmount); // Return bet + winnings

            game.showNotification(`Correct! Streak: ${this.streak} (+$${winnings})`, 'success');
        } else {
            this.streak = 0;
            this.highLowMultiplier = 1.0;
            game.showNotification('Wrong guess! Streak reset.', 'error');
        }

        // Reveal next card
        this.updateHighLowDisplay(false);

        // Move to next round
        setTimeout(() => {
            this.currentCard = this.nextCard;
            const suits = ['♠', '♥', '♦', '♣'];
            const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

            this.nextCard = {
                value: values[Math.floor(Math.random() * values.length)],
                suit: suits[Math.floor(Math.random() * suits.length)]
            };

            this.updateHighLowDisplay(true);
        }, 2000);

        const balanceElement = document.getElementById('casino-balance');
        if (balanceElement) {
            balanceElement.textContent = game.player.money.toLocaleString();
        }
    }

    getCardNumericValue(card) {
        const valueMap = {'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13};
        return valueMap[card.value] || 0;
    }

    // Lottery Game
    initializeLottery() {
        this.selectedLotteryNumbers = [];
        this.generateLotteryBoard();
    }

    generateLotteryBoard() {
        const board = document.getElementById('lottery-numbers');
        if (!board) return;

        board.innerHTML = '';

        for (let i = 1; i <= 49; i++) {
            const numberDiv = document.createElement('div');
            numberDiv.className = 'lottery-number';
            numberDiv.textContent = i.toString();
            numberDiv.onclick = () => this.toggleLotteryNumber(i);
            board.appendChild(numberDiv);
        }
    }

    toggleLotteryNumber(number) {
        const index = this.selectedLotteryNumbers.indexOf(number);

        if (index > -1) {
            this.selectedLotteryNumbers.splice(index, 1);
        } else if (this.selectedLotteryNumbers.length < 6) {
            this.selectedLotteryNumbers.push(number);
        } else {
            game.showNotification('Maximum 6 numbers allowed!', 'warning');
            return;
        }

        this.updateLotteryDisplay();
    }

    updateLotteryDisplay() {
        // Update all number displays
        const numbers = document.querySelectorAll('.lottery-number');
        numbers.forEach((numDiv, index) => {
            const num = index + 1;
            if (this.selectedLotteryNumbers.includes(num)) {
                numDiv.classList.add('selected');
            } else {
                numDiv.classList.remove('selected');
            }
        });

        // Update selected ticket display
        const selectedDiv = document.getElementById('selected-ticket');
        if (selectedDiv) {
            selectedDiv.textContent = this.selectedLotteryNumbers.length > 0 ?
                this.selectedLotteryNumbers.join(', ') : 'No numbers selected';
        }
    }

    buyLotteryTicket() {
        if (this.selectedLotteryNumbers.length !== 6) {
            game.showNotification('Select exactly 6 numbers!', 'warning');
            return;
        }

        if (game.player.money < 10) {
            game.showNotification('Not enough money! Tickets cost $10.', 'error');
            return;
        }

        if (!game.spendMoney(10)) return;

        // Generate winning numbers
        const winningNumbers = [];
        const availableNumbers = Array.from({length: 49}, (_, i) => i + 1);

        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            winningNumbers.push(availableNumbers.splice(randomIndex, 1)[0]);
        }

        // Check matches
        const matches = this.selectedLotteryNumbers.filter(num => winningNumbers.includes(num)).length;

        let winnings = 0;
        if (matches === 6) {
            winnings = 1000000; // Jackpot
        } else if (matches === 5) {
            winnings = 10000;
        } else if (matches === 4) {
            winnings = 100;
        } else if (matches === 3) {
            winnings = 10;
        }

        if (winnings > 0) {
            game.addMoney(winnings);
            game.showNotification(`LOTTERY WIN! ${matches} matches! Won $${winnings.toLocaleString()}!`, 'success');
        } else {
            game.showNotification(`No matches. Winning numbers: ${winningNumbers.join(', ')}`, 'info');
        }

        // Update jackpot (simulated)
        const jackpotElement = document.getElementById('jackpot-amount');
        if (jackpotElement) {
            const currentJackpot = parseInt(jackpotElement.textContent.replace(/,/g, '')) || 1000000;
            jackpotElement.textContent = (currentJackpot + 10000).toLocaleString();
        }

        const balanceElement = document.getElementById('casino-balance');
        if (balanceElement) {
            balanceElement.textContent = game.player.money.toLocaleString();
        }

        // Clear selection for next ticket
        this.selectedLotteryNumbers = [];
        this.updateLotteryDisplay();
    }

    quickPickLottery() {
        this.selectedLotteryNumbers = [];
        const availableNumbers = Array.from({length: 49}, (_, i) => i + 1);

        // Pick 6 random numbers
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            this.selectedLotteryNumbers.push(availableNumbers.splice(randomIndex, 1)[0]);
        }

        this.selectedLotteryNumbers.sort((a, b) => a - b);
        this.updateLotteryDisplay();
    }

    clearLotteryNumbers() {
        this.selectedLotteryNumbers = [];
        this.updateLotteryDisplay();
    }

    // Russian Roulette Game
    initializeRussianRoulette() {
        this.rrChamber = Math.floor(Math.random() * 6) + 1; // 1-6
        this.updateRussianRouletteDisplay();
    }

    updateRussianRouletteDisplay() {
        // Reset all chambers
        for (let i = 1; i <= 6; i++) {
            const chamber = document.getElementById(`chamber${i}`);
            if (chamber) {
                chamber.classList.remove('loaded');
            }
        }

        // Show loaded chamber (for demo only - in real game this would be hidden)
        const loadedChamber = document.getElementById(`chamber${this.rrChamber}`);
        if (loadedChamber) {
            loadedChamber.classList.add('loaded');
        }
    }

    playRussianRoulette() {
        const betAmount = parseInt(document.getElementById('rr-bet').value) || 1000;

        if (game.player.money < betAmount) {
            game.showNotification('Not enough money for this risk!', 'error');
            return;
        }

        if (!game.spendMoney(betAmount)) return;

        // Animate hammer
        const hammer = document.querySelector('.hammer');
        hammer.classList.add('fired');

        setTimeout(() => {
            hammer.classList.remove('fired');

            const result = Math.floor(Math.random() * 6) + 1;

            if (result === this.rrChamber) {
                // BANG! Player loses
                const damage = Math.floor(Math.random() * 50) + 25;
                game.changeLife(-damage);
                game.showNotification(`BANG! Chamber ${result} was loaded! Lost ${damage} life!`, 'error');

                // Reset game
                this.initializeRussianRoulette();
            } else {
                // Click! Player wins
                const winnings = betAmount * 5;
                game.addMoney(winnings);
                game.showNotification(`CLICK! Chamber ${result} was empty! Won $${winnings.toLocaleString()}!`, 'success');

                // New round with new chamber
                this.rrChamber = Math.floor(Math.random() * 6) + 1;
                this.updateRussianRouletteDisplay();
            }

            const balanceElement = document.getElementById('casino-balance');
            if (balanceElement) {
                balanceElement.textContent = game.player.money.toLocaleString();
            }
        }, 1000);
    }

    // Spin the Wheel Game
    initializeSpinWheel() {
        // Wheel is already set up in HTML
    }

    spinWheel() {
        const betAmount = 20; // Fixed bet

        if (game.player.money < betAmount) {
            game.showNotification('Not enough money! Spin costs $20.', 'error');
            return;
        }

        if (!game.spendMoney(betAmount)) return;

        const wheel = document.querySelector('.fortune-wheel');
        const result = Math.floor(Math.random() * 6);

        const rotations = 5 + result; // 5 full rotations + result
        const rotationDegrees = rotations * 60; // 60 degrees per segment

        wheel.style.transform = `rotate(${rotationDegrees}deg)`;

        setTimeout(() => {
            const prizes = [0, 50, 100, 500, 1000, 5000];
            const winnings = prizes[result];

            if (winnings > 0) {
                game.addMoney(winnings);
                game.showNotification(`Wheel landed on $${winnings.toLocaleString()}!`, 'success');
            } else {
                game.showNotification('Wheel landed on $0. Better luck next time!', 'info');
            }

            const balanceElement = document.getElementById('casino-balance');
            if (balanceElement) {
                balanceElement.textContent = game.player.money.toLocaleString();
            }

            // Reset wheel
            setTimeout(() => {
                wheel.style.transform = 'rotate(0deg)';
            }, 2000);
        }, 3000);
    }

    handleGym(activity) {
        if (game.player.energy < 15) {
            game.showNotification('Not enough energy to train!', 'error');
            return;
        }

        const activities = {
            'strength': () => {
                game.changeEnergy(-15);
                game.updateStat('strength', 8);
                game.showNotification('Strength training completed!', 'success');
            },
            'cardio': () => {
                game.changeEnergy(-20);
                game.updateStat('speed', 6);
                game.updateStat('endurance', 4);
                game.showNotification('Cardio session completed!', 'success');
            },
            'defense': () => {
                game.changeEnergy(-15);
                game.updateStat('defense', 7);
                game.showNotification('Defense training completed!', 'success');
            }
        };

        if (activities[activity]) {
            activities[activity]();
        }
    }

    handleCrime(crime) {
        if (game.player.energy < 10) {
            game.showNotification('Not enough energy to commit crimes!', 'error');
            return;
        }

        if (game.player.jailTime > 0) {
            game.showNotification('You are in jail! Cannot commit crimes.', 'error');
            return;
        }

        const crimes = {
            'pickpocket': () => {
                game.changeEnergy(-10);
                const success = Math.random() < 0.7; // 70% success rate
                if (success) {
                    const money = Math.floor(Math.random() * 150) + 50;
                    game.addMoney(money);
                    game.player.skills.pickpocketing += 0.2;
                    game.showNotification(`Pickpocket successful! Got $${money}`, 'success');
                } else {
                    const damage = Math.floor(Math.random() * 20) + 10;
                    game.changeLife(-damage);
                    game.showNotification(`Caught! Lost ${damage} life`, 'error');
                    this.riskJailTime(1);
                }
            },
            'shoplift': () => {
                game.changeEnergy(-15);
                const success = Math.random() < 0.5; // 50% success rate
                if (success) {
                    const money = Math.floor(Math.random() * 400) + 100;
                    game.addMoney(money);
                    game.player.skills.shoplifting += 0.3;
                    game.showNotification(`Shoplifting successful! Got $${money}`, 'success');
                } else {
                    const damage = Math.floor(Math.random() * 30) + 15;
                    game.changeLife(-damage);
                    game.showNotification(`Caught! Lost ${damage} life`, 'error');
                    this.riskJailTime(2);
                }
            },
            'car-theft': () => {
                game.changeEnergy(-25);
                const success = Math.random() < 0.3; // 30% success rate
                if (success) {
                    const money = Math.floor(Math.random() * 1500) + 500;
                    game.addMoney(money);
                    game.showNotification(`Car theft successful! Got $${money}`, 'success');
                } else {
                    const damage = Math.floor(Math.random() * 40) + 20;
                    game.changeLife(-damage);
                    game.showNotification(`Caught! Lost ${damage} life`, 'error');
                    this.riskJailTime(5);
                }
            },
            'burglary': () => {
                game.changeEnergy(-30);
                const success = Math.random() < 0.25; // 25% success rate
                if (success) {
                    const money = Math.floor(Math.random() * 3000) + 1000;
                    game.addMoney(money);
                    game.showNotification(`Burglary successful! Got $${money}`, 'success');
                } else {
                    const damage = Math.floor(Math.random() * 50) + 30;
                    game.changeLife(-damage);
                    game.showNotification(`Caught! Lost ${damage} life`, 'error');
                    this.riskJailTime(10);
                }
            },
            'bank-robbery': () => {
                game.changeEnergy(-50);
                const success = Math.random() < 0.1; // 10% success rate
                if (success) {
                    const money = Math.floor(Math.random() * 10000) + 5000;
                    game.addMoney(money);
                    game.showNotification(`Bank robbery successful! Got $${money}`, 'success');
                } else {
                    const damage = Math.floor(Math.random() * 80) + 40;
                    game.changeLife(-damage);
                    game.showNotification(`Caught! Lost ${damage} life`, 'error');
                    this.riskJailTime(30);
                }
            }
        };

        if (crimes[crime]) {
            crimes[crime]();
        }
    }

    riskJailTime(days) {
        if (Math.random() < 0.3) { // 30% chance to go to jail
            game.player.jailTime = days;
            game.showNotification(`You've been arrested! ${days} days in jail.`, 'error');
        }
    }

    handleMission(mission) {
        if (game.player.energy < 20) {
            game.showNotification('Not enough energy for missions!', 'error');
            return;
        }

        if (game.player.jailTime > 0) {
            game.showNotification('You are in jail! Cannot do missions.', 'error');
            return;
        }

        const missions = {
            'street-cleanup': () => {
                game.changeEnergy(-20);
                game.addMoney(100);
                game.updateStat('manualLabor', 2);
                game.showNotification('Street cleanup mission completed! +$100', 'success');
            },
            'security': () => {
                game.changeEnergy(-30);
                game.addMoney(250);
                game.updateStat('defense', 3);
                game.updateStat('strength', 2);
                game.showNotification('Security mission completed! +$250', 'success');
            },
            'delivery': () => {
                game.changeEnergy(-25);
                game.addMoney(150);
                game.updateStat('speed', 3);
                game.updateStat('endurance', 2);
                game.showNotification('Delivery mission completed! +$150', 'success');
            },
            'investigation': () => {
                game.changeEnergy(-40);
                game.addMoney(400);
                game.updateStat('intelligence', 5);
                game.updateStat('cracking', 0.5);
                game.showNotification('Investigation mission completed! +$400', 'success');
            },
            'vip-protection': () => {
                game.changeEnergy(-60);
                game.addMoney(1000);
                game.updateStat('defense', 8);
                game.updateStat('strength', 5);
                game.updateStat('speed', 3);
                game.showNotification('VIP Protection mission completed! +$1000', 'success');
            }
        };

        if (missions[mission]) {
            missions[mission]();
        }
    }

    handleFaction(action) {
        if (action === 'join') {
            this.joinFaction();
        } else if (action === 'create') {
            const factionCost = 30000000; // $30 million
            if (game.player.money >= factionCost) {
                const factionName = prompt('Enter faction name:');
                if (factionName && factionName.trim()) {
                    if (game.spendMoney(factionCost)) {
                        game.player.faction.name = factionName.trim();
                        game.player.faction.days = 0;
                        game.player.faction.created = true;
                        game.player.faction.members = [game.player.name];
                        game.player.faction.money = 0;
                        game.player.faction.territory = 0;
                        game.updateDisplay();
                        game.showNotification(`Faction "${factionName}" created successfully!`, 'success');
                        if (window.gameAuthManager) {
                            window.gameAuthManager.saveGameData();
                        }
                    }
                }
            } else {
                const needed = factionCost - game.player.money;
                game.showNotification(`You need $${needed.toLocaleString()} more to create a faction!`, 'error');
            }
        }
    }

    joinFaction() {
        const availableFactions = [
            { name: 'The Syndicate', members: 15, territory: 3, description: 'A powerful criminal organization' },
            { name: 'Street Kings', members: 8, territory: 1, description: 'Local street gang' },
            { name: 'The Cartel', members: 25, territory: 5, description: 'International drug cartel' },
            { name: 'Night Runners', members: 12, territory: 2, description: 'Elite thieves guild' },
            { name: 'Iron Fist', members: 20, territory: 4, description: 'Mercenary group' }
        ];

        let factionList = 'Available Factions:\n\n';
        availableFactions.forEach((faction, index) => {
            factionList += `${index + 1}. ${faction.name}\n   Members: ${faction.members} | Territory: ${faction.territory}\n   ${faction.description}\n\n`;
        });

        const choice = prompt(factionList + 'Enter faction number (1-5) or 0 to cancel:');
        const factionIndex = parseInt(choice) - 1;

        if (factionIndex >= 0 && factionIndex < availableFactions.length) {
            const selectedFaction = availableFactions[factionIndex];
            
            if (game.player.faction && game.player.faction.name) {
                game.showNotification('You are already in a faction!', 'error');
                return;
            }

            game.player.faction = {
                name: selectedFaction.name,
                members: selectedFaction.members + 1,
                territory: selectedFaction.territory,
                days: 0,
                joined: true
            };
            
            game.updateDisplay();
            game.showNotification(`Successfully joined "${selectedFaction.name}"!`, 'success');
            
            if (window.gameAuthManager) {
                window.gameAuthManager.saveGameData();
            }
        }
    }

    handleMedical(treatment) {
        const treatments = {
            'basic': () => {
                if (game.spendMoney(50)) {
                    game.changeLife(25);
                    game.showNotification('Basic treatment received!', 'success');
                }
            },
            'advanced': () => {
                if (game.spendMoney(200)) {
                    game.changeLife(75);
                    game.showNotification('Advanced treatment received!', 'success');
                }
            },
            'surgery': () => {
                if (game.spendMoney(1000)) {
                    game.changeLife(100);
                    game.showNotification('Emergency surgery completed!', 'success');
                }
            }
        };

        if (treatments[treatment]) {
            treatments[treatment]();
        }
    }

    showModal(title, message, onConfirm = null) {
        const modal = document.getElementById('action-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.style.display = 'block';

        // Close modal handlers
        document.querySelector('.close').onclick = () => {
            modal.style.display = 'none';
        };

        document.getElementById('modal-cancel').onclick = () => {
            modal.style.display = 'none';
        };

        document.getElementById('modal-confirm').onclick = () => {
            if (onConfirm) {
                onConfirm();
            }
            modal.style.display = 'none';
        };

        // Close on outside click
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    // Helper methods for city locations
    canApplyForJob(job) {
        for (const [stat, requirement] of Object.entries(job.requirements)) {
            if (stat === 'points') {
                if (game.player.points < requirement) return false;
            } else if (game.player.stats[stat] < requirement) {
                return false;
            }
        }
        return true;
    }

    showJobSelection(jobs) {
        let jobOptions = "Select a job to apply for:\n\n";
        jobs.forEach((job, index) => {
            const canApply = this.canApplyForJob(job);
            jobOptions += `${index + 1}. ${job.name} - $${job.income}/day ${canApply ? '(Available)' : '(Requirements not met)'}\n`;
        });

        this.showModal('Job Application', jobOptions, () => {
            const choice = prompt("Enter job number (1-5):");
            if (choice && choice >= 1 && choice <= jobs.length) {
                const selectedJob = jobs[choice - 1];
                if (this.canApplyForJob(selectedJob)) {
                    game.player.job.name = selectedJob.name;
                    game.player.job.income = selectedJob.income;
                    game.player.job.rank = "Employee";
                    game.updateDisplay();
                    game.showNotification(`Got job as ${selectedJob.name}!`, 'success');
                } else {
                    game.showNotification('You don\'t meet the requirements!', 'error');
                }
            }
        });
    }

    showMedicalServices() {
        const treatments = [
            { name: "Basic Treatment", cost: 50, effect: "life", value: 25 },
            { name: "Advanced Treatment", cost: 200, effect: "life", value: 75 },
            { name: "Surgery", cost: 1000, effect: "life", value: 100 }
        ];

        let treatmentList = "Available Treatments:\n\n";
        treatments.forEach((treatment, index) => {
            treatmentList += `${index + 1}. ${treatment.name} - $${treatment.cost} (Restores ${treatment.value} life)\n`;
        });

        this.showModal('Medical Services', treatmentList, () => {
            const choice = prompt("Enter treatment number (1-3):");
            if (choice && choice >= 1 && choice <= treatments.length) {
                const treatment = treatments[choice - 1];
                if (game.spendMoney(treatment.cost)) {
                    game.changeLife(treatment.value);
                    game.showNotification(`Received ${treatment.name}!`, 'success');
                }
            }
        });
    }

    showCommunityOptions() {
        const options = [
            '1. Meet Players - Find other players to interact with',
            '2. Community Events - Join weekly community activities',
            '3. Support Groups - Get help and advice',
            '4. Group Activities - Participate in group missions',
            '5. Leaderboard - View top community members'
        ].join('\n');

        const choice = prompt(`Community Center Options:\n\n${options}\n\nEnter option number (1-5) or 0 to cancel:`);
        
        switch(choice) {
            case '1':
                this.meetPlayers();
                break;
            case '2':
                this.joinCommunityEvent();
                break;
            case '3':
                this.joinSupportGroup();
                break;
            case '4':
                this.joinGroupActivity();
                break;
            case '5':
                this.viewCommunityLeaderboard();
                break;
        }
    }

    meetPlayers() {
        const players = [
            { name: 'Shadow', level: 15, faction: 'The Syndicate' },
            { name: 'Razor', level: 12, faction: 'Street Kings' },
            { name: 'Viper', level: 18, faction: 'The Cartel' },
            { name: 'Ghost', level: 10, faction: 'Night Runners' }
        ];

        let playerList = 'Available Players:\n\n';
        players.forEach((player, index) => {
            playerList += `${index + 1}. ${player.name} (Level ${player.level}) - ${player.faction}\n`;
        });

        const choice = prompt(playerList + '\nEnter player number to interact (1-4) or 0 to cancel:');
        const playerIndex = parseInt(choice) - 1;

        if (playerIndex >= 0 && playerIndex < players.length) {
            const player = players[playerIndex];
            const actions = [
                '1. Chat',
                '2. Trade',
                '3. Challenge to Battle',
                '4. Send Gift'
            ].join('\n');

            const action = prompt(`Interact with ${player.name}:\n\n${actions}\n\nEnter action number (1-4):`);
            
            switch(action) {
                case '1':
                    game.showNotification(`Chatting with ${player.name}...`, 'info');
                    break;
                case '2':
                    game.showNotification(`Trade request sent to ${player.name}!`, 'success');
                    break;
                case '3':
                    game.showNotification(`Challenge sent to ${player.name}!`, 'success');
                    break;
                case '4':
                    if (game.player.money >= 100) {
                        game.spendMoney(100);
                        game.showNotification(`Gift sent to ${player.name}!`, 'success');
                    } else {
                        game.showNotification('Not enough money for gift!', 'error');
                    }
                    break;
            }
        }
    }

    joinCommunityEvent() {
        const events = [
            { name: 'Weekly Crime Spree', reward: 500, energy: 20 },
            { name: 'Community Cleanup', reward: 200, energy: 15 },
            { name: 'Charity Drive', reward: 300, energy: 10 }
        ];

        let eventList = 'Community Events:\n\n';
        events.forEach((event, index) => {
            eventList += `${index + 1}. ${event.name}\n   Reward: $${event.reward} | Energy: ${event.energy}\n\n`;
        });

        const choice = prompt(eventList + 'Enter event number (1-3) or 0 to cancel:');
        const eventIndex = parseInt(choice) - 1;

        if (eventIndex >= 0 && eventIndex < events.length) {
            const event = events[eventIndex];
            if (game.player.energy >= event.energy) {
                game.player.energy -= event.energy;
                game.addMoney(event.reward);
                game.showNotification(`Completed "${event.name}"! Earned $${event.reward}!`, 'success');
                game.updateDisplay();
            } else {
                game.showNotification(`Not enough energy! Need ${event.energy} energy.`, 'error');
            }
        }
    }

    joinSupportGroup() {
        game.showNotification('Joined support group! You feel better about your criminal activities.', 'success');
        game.changeLife(10);
        game.updateDisplay();
    }

    joinGroupActivity() {
        if (game.player.energy >= 25) {
            game.player.energy -= 25;
            const reward = Math.floor(Math.random() * 300) + 100;
            game.addMoney(reward);
            game.showNotification(`Completed group activity! Earned $${reward}!`, 'success');
            game.updateDisplay();
        } else {
            game.showNotification('Not enough energy! Need 25 energy.', 'error');
        }
    }

    viewCommunityLeaderboard() {
        const leaders = [
            { rank: 1, name: 'Shadow', level: 25, money: 5000000 },
            { rank: 2, name: 'Razor', level: 22, money: 3500000 },
            { rank: 3, name: 'Viper', level: 20, money: 2500000 },
            { rank: 4, name: 'Ghost', level: 18, money: 1800000 },
            { rank: 5, name: 'Blade', level: 15, money: 1200000 }
        ];

        let leaderboard = 'Community Leaderboard:\n\n';
        leaders.forEach(leader => {
            leaderboard += `${leader.rank}. ${leader.name} - Level ${leader.level} - $${leader.money.toLocaleString()}\n`;
        });

        alert(leaderboard);
    }

    showWeaponShop(weapons) {
        const choice = prompt("Enter weapon number to buy (1-5):");
        if (choice && choice >= 1 && choice <= weapons.length) {
            const weapon = weapons[choice - 1];
            if (game.spendMoney(weapon.cost)) {
                game.player.items.weapons.push(weapon);
                game.showNotification(`Bought ${weapon.name}!`, 'success');
            }
        }
    }

    showPharmacyShop(items) {
        const choice = prompt("Enter item number to buy (1-5):");
        if (choice && choice >= 1 && choice <= items.length) {
            const item = items[choice - 1];
            if (game.spendMoney(item.cost)) {
                if (item.effect === "life") {
                    game.changeLife(item.value);
                } else if (item.effect === "energy") {
                    game.changeEnergy(item.value);
                } else {
                    game.updateStat(item.effect, item.value);
                }
                game.showNotification(`Used ${item.name}!`, 'success');
            }
        }
    }

    showPawnShopOptions() {
        const options = [
            '1. Sell Weapons - Get cash for your weapons',
            '2. Sell Items - Pawn your items',
            '3. Buy Used Goods - Purchase second-hand items',
            '4. Quick Cash Loan - Get instant cash (20% interest)'
        ].join('\n');

        const choice = prompt(`Pawn Shop Options:\n\n${options}\n\nEnter option number (1-4) or 0 to cancel:`);
        
        switch(choice) {
            case '1':
                this.sellWeapons();
                break;
            case '2':
                this.sellItems();
                break;
            case '3':
                this.buyUsedGoods();
                break;
            case '4':
                this.getQuickCashLoan();
                break;
        }
    }

    sellWeapons() {
        if (!game.player.inventory || !game.player.inventory.weapons || game.player.inventory.weapons.length === 0) {
            game.showNotification('You have no weapons to sell!', 'error');
            return;
        }

        const weapons = game.player.inventory.weapons;
        let weaponList = 'Your Weapons:\n\n';
        weapons.forEach((weapon, index) => {
            const sellPrice = Math.floor(weapon.price * 0.6); // 60% of original price
            weaponList += `${index + 1}. ${weapon.name} - Sell for $${sellPrice}\n`;
        });

        const choice = prompt(weaponList + '\nEnter weapon number to sell (1-' + weapons.length + ') or 0 to cancel:');
        const weaponIndex = parseInt(choice) - 1;

        if (weaponIndex >= 0 && weaponIndex < weapons.length) {
            const weapon = weapons[weaponIndex];
            const sellPrice = Math.floor(weapon.price * 0.6);
            game.player.inventory.weapons.splice(weaponIndex, 1);
            game.addMoney(sellPrice);
            game.showNotification(`Sold ${weapon.name} for $${sellPrice}!`, 'success');
            game.updateDisplay();
            game.updateInventory();
        }
    }

    sellItems() {
        const items = [
            { name: 'Old Watch', price: 50 },
            { name: 'Jewelry', price: 150 },
            { name: 'Electronics', price: 200 },
            { name: 'Antiques', price: 300 }
        ];

        let itemList = 'Items to Sell:\n\n';
        items.forEach((item, index) => {
            itemList += `${index + 1}. ${item.name} - $${item.price}\n`;
        });

        const choice = prompt(itemList + '\nEnter item number (1-4) or 0 to cancel:');
        const itemIndex = parseInt(choice) - 1;

        if (itemIndex >= 0 && itemIndex < items.length) {
            const item = items[itemIndex];
            game.addMoney(item.price);
            game.showNotification(`Sold ${item.name} for $${item.price}!`, 'success');
            game.updateDisplay();
        }
    }

    buyUsedGoods() {
        const usedGoods = [
            { name: 'Used Weapon', price: 200, type: 'weapon' },
            { name: 'Second-hand Car', price: 5000, type: 'vehicle' },
            { name: 'Old Electronics', price: 100, type: 'item' },
            { name: 'Vintage Clothing', price: 75, type: 'item' }
        ];

        let goodsList = 'Used Goods Available:\n\n';
        usedGoods.forEach((item, index) => {
            goodsList += `${index + 1}. ${item.name} - $${item.price}\n`;
        });

        const choice = prompt(goodsList + '\nEnter item number (1-4) or 0 to cancel:');
        const itemIndex = parseInt(choice) - 1;

        if (itemIndex >= 0 && itemIndex < usedGoods.length) {
            const item = usedGoods[itemIndex];
            if (game.spendMoney(item.price)) {
                if (item.type === 'weapon') {
                    if (!game.player.inventory.weapons) game.player.inventory.weapons = [];
                    game.player.inventory.weapons.push({ name: item.name, price: item.price });
                }
                game.showNotification(`Purchased ${item.name} for $${item.price}!`, 'success');
                game.updateDisplay();
                game.updateInventory();
            }
        }
    }

    getQuickCashLoan() {
        const loanAmount = 1000;
        const interest = 0.20;
        const totalPayback = loanAmount * (1 + interest);

        if (confirm(`Get quick cash loan?\n\nAmount: $${loanAmount}\nInterest: 20%\nTotal to pay back: $${totalPayback}\n\nDo you want to proceed?`)) {
            game.addMoney(loanAmount);
            if (!game.player.loans) game.player.loans = [];
            game.player.loans.push({
                amount: loanAmount,
                total: totalPayback,
                interest: interest,
                dueDate: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
            });
            game.showNotification(`Received quick cash loan of $${loanAmount}! Pay back $${totalPayback} within 7 days.`, 'success');
            game.updateDisplay();
        }
    }

    showSuperStoreShop(items) {
        const choice = prompt("Enter item number to buy (1-4):");
        if (choice && choice >= 1 && choice <= items.length) {
            const item = items[choice - 1];
            if (game.spendMoney(item.cost)) {
                if (item.effect === "energy") {
                    game.changeEnergy(item.value);
                } else {
                    game.updateStat(item.effect, item.value);
                }
                game.showNotification(`Bought ${item.name}!`, 'success');
            }
        }
    }

    showBankServices() {
        const options = [
            '1. Deposit Money - Store money safely',
            '2. Withdraw Money - Get your money back',
            '3. Take Loan - Borrow money with interest',
            '4. Investments - Invest money for returns',
            '5. Savings Account - Earn interest on savings'
        ].join('\n');

        const choice = prompt(`Bank Services:\n\n${options}\n\nEnter option number (1-5) or 0 to cancel:`);
        
        switch(choice) {
            case '1':
                this.depositMoney();
                break;
            case '2':
                this.withdrawMoney();
                break;
            case '3':
                this.takeBankLoan();
                break;
            case '4':
                this.investMoney();
                break;
            case '5':
                this.openSavingsAccount();
                break;
        }
    }

    depositMoney() {
        if (!game.player.bankAccount) {
            game.player.bankAccount = { balance: 0, savings: 0 };
        }

        const amount = prompt(`How much do you want to deposit?\n\nCurrent Cash: $${game.player.money.toLocaleString()}\nBank Balance: $${game.player.bankAccount.balance.toLocaleString()}\n\nEnter amount:`);
        const depositAmount = parseInt(amount);

        if (depositAmount && depositAmount > 0 && depositAmount <= game.player.money) {
            game.spendMoney(depositAmount);
            game.player.bankAccount.balance += depositAmount;
            game.showNotification(`Deposited $${depositAmount.toLocaleString()} to bank!`, 'success');
            game.updateDisplay();
        } else {
            game.showNotification('Invalid amount!', 'error');
        }
    }

    withdrawMoney() {
        if (!game.player.bankAccount || game.player.bankAccount.balance === 0) {
            game.showNotification('You have no money in the bank!', 'error');
            return;
        }

        const amount = prompt(`How much do you want to withdraw?\n\nBank Balance: $${game.player.bankAccount.balance.toLocaleString()}\n\nEnter amount:`);
        const withdrawAmount = parseInt(amount);

        if (withdrawAmount && withdrawAmount > 0 && withdrawAmount <= game.player.bankAccount.balance) {
            game.player.bankAccount.balance -= withdrawAmount;
            game.addMoney(withdrawAmount);
            game.showNotification(`Withdrew $${withdrawAmount.toLocaleString()} from bank!`, 'success');
            game.updateDisplay();
        } else {
            game.showNotification('Invalid amount!', 'error');
        }
    }

    takeBankLoan() {
        const loans = [
            { amount: 5000, interest: 0.15, name: 'Small Loan' },
            { amount: 10000, interest: 0.18, name: 'Medium Loan' },
            { amount: 25000, interest: 0.20, name: 'Large Loan' },
            { amount: 50000, interest: 0.25, name: 'Business Loan' }
        ];

        let loanList = 'Available Loans:\n\n';
        loans.forEach((loan, index) => {
            const totalPayback = loan.amount * (1 + loan.interest);
            loanList += `${index + 1}. ${loan.name}\n   Amount: $${loan.amount.toLocaleString()}\n   Interest: ${loan.interest * 100}%\n   Total Payback: $${totalPayback.toLocaleString()}\n\n`;
        });

        const choice = prompt(loanList + 'Enter loan number (1-4) or 0 to cancel:');
        const loanIndex = parseInt(choice) - 1;

        if (loanIndex >= 0 && loanIndex < loans.length) {
            const loan = loans[loanIndex];
            const totalPayback = loan.amount * (1 + loan.interest);
            
            if (confirm(`Take ${loan.name}?\n\nAmount: $${loan.amount.toLocaleString()}\nInterest: ${loan.interest * 100}%\nTotal to pay back: $${totalPayback.toLocaleString()}\n\nDo you want to proceed?`)) {
                game.addMoney(loan.amount);
                if (!game.player.loans) game.player.loans = [];
                game.player.loans.push({
                    amount: loan.amount,
                    total: totalPayback,
                    interest: loan.interest,
                    dueDate: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
                });
                game.showNotification(`Received ${loan.name} of $${loan.amount.toLocaleString()}! Pay back $${totalPayback.toLocaleString()} within 30 days.`, 'success');
                game.updateDisplay();
            }
        }
    }

    investMoney() {
        const investments = [
            { name: 'Stocks', minAmount: 1000, returnRate: 0.10, risk: 'Medium' },
            { name: 'Real Estate', minAmount: 5000, returnRate: 0.15, risk: 'Low' },
            { name: 'Cryptocurrency', minAmount: 500, returnRate: 0.25, risk: 'High' },
            { name: 'Business', minAmount: 10000, returnRate: 0.20, risk: 'Medium' }
        ];

        let investList = 'Investment Options:\n\n';
        investments.forEach((inv, index) => {
            investList += `${index + 1}. ${inv.name}\n   Min Amount: $${inv.minAmount.toLocaleString()}\n   Return Rate: ${inv.returnRate * 100}%\n   Risk: ${inv.risk}\n\n`;
        });

        const choice = prompt(investList + 'Enter investment number (1-4) or 0 to cancel:');
        const investIndex = parseInt(choice) - 1;

        if (investIndex >= 0 && investIndex < investments.length) {
            const investment = investments[investIndex];
            const amount = prompt(`How much do you want to invest in ${investment.name}?\n\nMinimum: $${investment.minAmount.toLocaleString()}\nCurrent Cash: $${game.player.money.toLocaleString()}\n\nEnter amount:`);
            const investAmount = parseInt(amount);

            if (investAmount && investAmount >= investment.minAmount && investAmount <= game.player.money) {
                if (game.spendMoney(investAmount)) {
                    if (!game.player.investments) game.player.investments = [];
                    game.player.investments.push({
                        name: investment.name,
                        amount: investAmount,
                        returnRate: investment.returnRate,
                        risk: investment.risk,
                        startDate: Date.now()
                    });
                    game.showNotification(`Invested $${investAmount.toLocaleString()} in ${investment.name}!`, 'success');
                    game.updateDisplay();
                }
            } else {
                game.showNotification(`Invalid amount! Minimum is $${investment.minAmount.toLocaleString()}`, 'error');
            }
        }
    }

    openSavingsAccount() {
        if (!game.player.bankAccount) {
            game.player.bankAccount = { balance: 0, savings: 0 };
        }

        const amount = prompt(`How much do you want to put in savings?\n\nCurrent Cash: $${game.player.money.toLocaleString()}\nCurrent Savings: $${game.player.bankAccount.savings.toLocaleString()}\nInterest Rate: 5% per day\n\nEnter amount:`);
        const savingsAmount = parseInt(amount);

        if (savingsAmount && savingsAmount > 0 && savingsAmount <= game.player.money) {
            game.spendMoney(savingsAmount);
            game.player.bankAccount.savings += savingsAmount;
            game.showNotification(`Added $${savingsAmount.toLocaleString()} to savings account!`, 'success');
            game.updateDisplay();
        } else {
            game.showNotification('Invalid amount!', 'error');
        }
    }

    showLoanOptions() {
        const loans = [
            { amount: 1000, interest: 0.20, name: "Small Loan" },
            { amount: 5000, interest: 0.25, name: "Medium Loan" },
            { amount: 10000, interest: 0.30, name: "Large Loan" }
        ];

        let loanList = "Available Loans:\n\n";
        loans.forEach((loan, index) => {
            loanList += `${index + 1}. ${loan.name} - $${loan.amount} (${loan.interest * 100}% interest)\n`;
        });

        this.showModal('Loan Options', loanList, () => {
            const choice = prompt("Enter loan number (1-3):");
            if (choice && choice >= 1 && choice <= loans.length) {
                const loan = loans[choice - 1];
                game.addMoney(loan.amount);
                game.showNotification(`Received ${loan.name} of $${loan.amount}!`, 'success');
            }
        });
    }

    showRacingOptions() {
        const races = [
            { name: "Street Racing", cost: 500, reward: 1000, risk: 0.3 },
            { name: "Professional Racing", cost: 2000, reward: 5000, risk: 0.4 },
            { name: "Championship Racing", cost: 10000, reward: 25000, risk: 0.5 }
        ];

        let raceList = "Available Races:\n\n";
        races.forEach((race, index) => {
            raceList += `${index + 1}. ${race.name} - $${race.cost} entry (Win: $${race.reward})\n`;
        });

        this.showModal('Racing Options', raceList, () => {
            const choice = prompt("Enter race number (1-3):");
            if (choice && choice >= 1 && choice <= races.length) {
                const race = races[choice - 1];
                if (game.spendMoney(race.cost)) {
                    const win = Math.random() > race.risk;
                    if (win) {
                        game.addMoney(race.reward);
                        game.showNotification(`Won ${race.name}! Got $${race.reward}!`, 'success');
                    } else {
                        game.showNotification(`Lost ${race.name}!`, 'error');
                    }
                }
            }
        });
    }

    // Item handling methods
    useItem(category, index) {
        const item = game.player.items[category][index];
        if (!item) return;

        if (category === 'weapon') {
            game.showNotification(`Equipped ${item.name}!`, 'success');
            // Weapons don't get consumed, just equipped
        } else if (category === 'drug') {
            if (item.effect === 'life') {
                game.changeLife(item.value);
            } else if (item.effect === 'energy') {
                game.changeEnergy(item.value);
            } else {
                game.updateStat(item.effect, item.value);
            }
            game.player.items[category].splice(index, 1);
            game.updateInventory();
            game.showNotification(`Used ${item.name}!`, 'success');
        } else if (category === 'candy') {
            if (item.effect === 'life') {
                game.changeLife(item.value);
            } else if (item.effect === 'energy') {
                game.changeEnergy(item.value);
            } else {
                game.updateStat(item.effect, item.value);
            }
            game.player.items[category].splice(index, 1);
            game.updateInventory();
            game.showNotification(`Ate ${item.name}!`, 'success');
        } else if (category === 'other') {
            game.showNotification(`Used ${item.name}!`, 'success');
            game.player.items[category].splice(index, 1);
            game.updateInventory();
        }

        // Save inventory changes to server
        if (window.autoSave) {
            window.autoSave.saveInventory(game.player.items[category], category, 'use');
        }
    }

    sellItem(category, index) {
        const item = game.player.items[category][index];
        if (!item) return;

        const sellPrice = Math.floor(item.cost * 0.5); // 50% of original cost
        game.addMoney(sellPrice);
        game.player.items[category].splice(index, 1);
        game.updateInventory();
        game.showNotification(`Sold ${item.name} for $${sellPrice}!`, 'success');

        // Save inventory changes to server
        if (window.autoSave) {
            window.autoSave.saveInventory(game.player.items[category], category, 'sell');
        }
    }
}

// Auto-save system
class AutoSave {
    constructor() {
        this.saveInterval = 30000; // Save every 30 seconds
        this.init();
    }

    init() {
        // Load saved game
        this.loadGame();
        
        // Set up auto-save
        setInterval(() => {
            this.saveGame();
        }, this.saveInterval);

        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveGame();
        });
    }

    async saveGame() {
        if (window.game && window.game.saveGameData) {
            await window.game.saveGameData();
        }
    }

    loadGame() {
        const savedData = localStorage.getItem('crimeCityGame');
        if (savedData) {
            try {
                const gameData = JSON.parse(savedData);
                if (gameData.player) {
                    Object.assign(game.player, gameData.player);
                    game.updateDisplay();
                    game.showNotification('Game loaded successfully!', 'success');
                }
            } catch (error) {
                console.error('Error loading game:', error);
            }
        }
    }

    // Save specific progress
    saveProgress(progressData) {
        if (window.gameAuthManager && window.gameAuthManager.authToken) {
            window.gameAuthManager.saveGameProgress(progressData);
        }
    }

    // Save education progress
    saveEducation(course, completed, progress, stats) {
        if (window.gameAuthManager && window.gameAuthManager.authToken) {
            window.gameAuthManager.saveEducationProgress(course, completed, progress, stats);
        }
    }

    // Save inventory changes
    saveInventory(items, category, action) {
        if (window.gameAuthManager && window.gameAuthManager.authToken) {
            window.gameAuthManager.saveInventoryChanges(items, category, action);
        }
    }
}

// Energy regeneration system
class EnergySystem {
    constructor() {
        this.regenerationRate = 1; // Energy per minute
        this.lastUpdate = Date.now();
        this.init();
    }

    init() {
        setInterval(() => {
            this.updateEnergy();
        }, 60000); // Update every minute
    }

    updateEnergy() {
        const now = Date.now();
        const timePassed = (now - this.lastUpdate) / 60000; // Minutes passed
        const energyGain = Math.floor(timePassed * this.regenerationRate);
        
        if (energyGain > 0) {
            game.changeEnergy(energyGain);
            this.lastUpdate = now;
        }
    }
}

// Time and progression system
class TimeSystem {
    constructor() {
        this.lastUpdate = Date.now();
        this.init();
    }

    init() {
        setInterval(() => {
            this.updateTime();
        }, 300000); // Update every 5 minutes
    }

    updateTime() {
        const now = Date.now();
        const timePassed = (now - this.lastUpdate) / 300000; // 5-minute intervals
        
        if (timePassed >= 1) {
            // Age progression
            game.player.age += Math.floor(timePassed);
            
            // Jail time reduction
            if (game.player.jailTime > 0) {
                game.player.jailTime -= Math.floor(timePassed);
                if (game.player.jailTime <= 0) {
                    game.player.jailTime = 0;
                    game.showNotification('You have been released from jail!', 'success');
                }
            }
            
            // Hospital time reduction
            if (game.player.hospitalTime > 0) {
                game.player.hospitalTime -= Math.floor(timePassed);
                if (game.player.hospitalTime <= 0) {
                    game.player.hospitalTime = 0;
                    game.showNotification('You have been discharged from the hospital!', 'success');
                }
            }
            
            // Job income
            if (game.player.job.name !== "None" && game.player.job.income > 0) {
                const income = game.player.job.income * Math.floor(timePassed);
                game.addMoney(income);
                game.showNotification(`Job income: +$${income}`, 'info');
            }
            
            // Property fees
            if (game.player.property.fees > 0) {
                const fees = game.player.property.fees * Math.floor(timePassed);
                if (game.spendMoney(fees)) {
                    game.showNotification(`Property fees: -$${fees}`, 'warning');
                } else {
                    game.showNotification('Cannot pay property fees! Property may be repossessed!', 'error');
                }
            }
            
            // Level progression
            this.checkLevelUp();
            
            this.lastUpdate = now;
            game.updateDisplay();
        }
    }

    checkLevelUp() {
        const requiredPoints = game.player.level * 1000;
        if (game.player.points >= requiredPoints) {
            game.player.level++;
            game.player.points -= requiredPoints;
            game.showNotification(`Level up! Now level ${game.player.level}!`, 'success');
            
            // Level up bonuses
            game.changeLife(20);
            game.changeEnergy(20);
            game.updateStat('strength', 10);
            game.updateStat('defense', 10);
            game.updateStat('speed', 10);
            game.updateStat('dexterity', 10);
        }
    }
}

// Admin functions
async function verifyAdminKey() {
    const adminKey = document.getElementById('adminKey').value;
    
    if (!adminKey) {
        game.showNotification('Please enter an admin key', 'error');
        return;
    }

    try {
        const response = await fetch('/api/admin/verify-admin-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ adminKey })
        });

        const data = await response.json();

        if (response.ok) {
            game.showNotification('Admin access granted!', 'success');
            document.getElementById('adminStatus').style.display = 'block';
            document.getElementById('adminStatus').innerHTML = `
                <h4>✅ Admin Access Granted</h4>
                <p>Role: ${data.role}</p>
                <p>Permissions: ${data.permissions}</p>
            `;
        } else {
            game.showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('Admin key verification failed:', error);
        game.showNotification('Failed to verify admin key', 'error');
    }
}

async function useAdminCode() {
    const adminCode = document.getElementById('adminCode').value;
    
    if (!adminCode || adminCode.length !== 8) {
        game.showNotification('Please enter a valid 8-digit code', 'error');
        return;
    }

    try {
        const response = await fetch('/api/admin/use-admin-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ code: adminCode })
        });

        const data = await response.json();

        if (response.ok) {
            game.showNotification('Admin access granted!', 'success');
            document.getElementById('adminStatus').style.display = 'block';
            document.getElementById('adminStatus').innerHTML = `
                <h4>✅ Admin Access Granted</h4>
                <p>Role: ${data.role}</p>
                <p>Permissions: ${data.permissions}</p>
            `;
        } else {
            game.showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('Admin code verification failed:', error);
        game.showNotification('Failed to use admin code', 'error');
    }
}

// Custom Settings Tabs System
class SettingsTabs {
    constructor() {
        this.currentTab = 'appearance';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.updateRangeValues();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showTab(btn.dataset.tab);
            });
        });

        // Range sliders
        document.querySelectorAll('input[type="range"]').forEach(range => {
            range.addEventListener('input', (e) => {
                this.updateRangeValue(e.target);
            });
        });

        // Theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectTheme(option.dataset.theme);
            });
        });

        // Settings change handlers
        this.setupSettingsHandlers();
    }

    showTab(tabName) {
        // Update navigation
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
        this.saveSettings();
    }

    updateRangeValue(range) {
        const valueSpan = document.getElementById(range.id + 'Value');
        if (valueSpan) {
            valueSpan.textContent = range.value + (range.id.includes('Volume') ? '%' : '');
        }
    }

    updateRangeValues() {
        document.querySelectorAll('input[type="range"]').forEach(range => {
            this.updateRangeValue(range);
        });
    }

    selectTheme(theme) {
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector(`[data-theme="${theme}"]`).classList.add('selected');
        
        // Apply theme
        this.applyTheme(theme);
        this.saveSettings();
    }

    applyTheme(theme) {
        const body = document.body;
        body.className = body.className.replace(/theme-\w+/g, '');
        body.classList.add(`theme-${theme}`);
    }

    setupSettingsHandlers() {
        // Auto-save settings on change
        document.querySelectorAll('input, select').forEach(element => {
            element.addEventListener('change', () => {
                this.saveSettings();
            });
        });

        // Special handlers for specific settings
        document.getElementById('uiScale')?.addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--ui-scale', e.target.value + '%');
        });

        document.getElementById('accentColor')?.addEventListener('change', (e) => {
            document.documentElement.style.setProperty('--accent-color', e.target.value);
        });
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
        
        // Load all settings
        Object.keys(settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = settings[key];
                } else {
                    element.value = settings[key];
                }
            }
        });

        // Apply loaded settings
        this.updateRangeValues();
        if (settings.theme) {
            this.selectTheme(settings.theme);
        }
    }

    saveSettings() {
        const settings = {};
        
        // Collect all settings
        document.querySelectorAll('input, select').forEach(element => {
            if (element.id) {
                if (element.type === 'checkbox') {
                    settings[element.id] = element.checked;
                } else {
                    settings[element.id] = element.value;
                }
            }
        });

        localStorage.setItem('gameSettings', JSON.stringify(settings));
    }
}

// Settings Functions
function exportGameData() {
    const gameData = {
        player: window.game?.player || {},
        settings: JSON.parse(localStorage.getItem('gameSettings') || '{}'),
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(gameData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `crime-city-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    game.showNotification('Game data exported successfully!', 'success');
}

function importGameData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.player) {
                        Object.assign(window.game.player, data.player);
                        window.game.updateDisplay();
                    }
                    if (data.settings) {
                        localStorage.setItem('gameSettings', JSON.stringify(data.settings));
                        location.reload();
                    }
                    game.showNotification('Game data imported successfully!', 'success');
                } catch (error) {
                    game.showNotification('Invalid backup file!', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function changePassword() {
    const newPassword = prompt('Enter new password:');
    if (newPassword && newPassword.length >= 6) {
        // Here you would typically send to server
        game.showNotification('Password change request sent!', 'success');
    } else {
        game.showNotification('Password must be at least 6 characters!', 'error');
    }
}

function enable2FA() {
    if (game.player.twoFactorEnabled) {
        if (confirm('2FA is already enabled. Do you want to disable it?')) {
            game.player.twoFactorEnabled = false;
            game.showNotification('2FA disabled successfully!', 'success');
            return;
        }
        return;
    }

    const setupCode = Math.floor(100000 + Math.random() * 900000).toString();
    game.player.twoFactorCode = setupCode;
    
    if (confirm(`2FA Setup Code: ${setupCode}\n\nSave this code securely!\n\nDo you want to enable 2FA?`)) {
        const verifyCode = prompt('Enter the setup code to verify:');
        if (verifyCode === setupCode) {
            game.player.twoFactorEnabled = true;
            game.showNotification('2FA enabled successfully! Your account is now more secure.', 'success');
        } else {
            game.showNotification('Invalid code! 2FA setup cancelled.', 'error');
        }
    }
}

function clearCache() {
    if (confirm('Are you sure you want to clear the cache?')) {
        localStorage.removeItem('crimeCityGame');
        game.showNotification('Cache cleared!', 'success');
    }
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings?')) {
        localStorage.removeItem('gameSettings');
        location.reload();
    }
}

function openSupport() {
    window.open('mailto:support@crimecity.com', '_blank');
}

function reportBug() {
    window.open('mailto:bugs@crimecity.com?subject=Bug Report', '_blank');
}

// API Keys System
class APIKeysManager {
    constructor() {
        this.apiKeys = [];
        this.init();
    }

    init() {
        this.loadAPIKeys();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Integration tab navigation
        document.querySelectorAll('.integration-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showIntegrationTab(btn.dataset.integration);
            });
        });

        // Set minimum date for expiry
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('apiKeyExpiry').min = today;
    }

    showIntegrationTab(tabName) {
        // Update navigation
        document.querySelectorAll('.integration-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-integration="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.integration-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    loadAPIKeys() {
        const savedKeys = localStorage.getItem('userAPIKeys');
        this.apiKeys = savedKeys ? JSON.parse(savedKeys) : [];
        this.displayAPIKeys();
    }

    displayAPIKeys() {
        const container = document.getElementById('apiKeysList');
        
        if (this.apiKeys.length === 0) {
            container.innerHTML = `
                <div class="api-key-item">
                    <div class="api-key-header">
                        <div class="api-key-name">No API Keys</div>
                    </div>
                    <p style="color: #cccccc; text-align: center; padding: 2rem;">
                        You haven't created any API keys yet. Click "Create API Key" to get started.
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.apiKeys.map(key => `
            <div class="api-key-item">
                <div class="api-key-header">
                    <div class="api-key-name">${key.name}</div>
                    <div class="api-key-status ${key.status}">${key.status.toUpperCase()}</div>
                </div>
                
                <div class="api-key-details">
                    <div class="api-key-detail">
                        <label>API Key</label>
                        <span id="key-${key.id}">${key.key}</span>
                    </div>
                    <div class="api-key-detail">
                        <label>Access Level</label>
                        <span>${key.accessLevel}</span>
                    </div>
                    <div class="api-key-detail">
                        <label>Created</label>
                        <span>${new Date(key.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="api-key-detail">
                        <label>Expires</label>
                        <span>${key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}</span>
                    </div>
                </div>
                
                ${key.description ? `<p style="color: #cccccc; margin: 1rem 0;">${key.description}</p>` : ''}
                
                <div class="api-key-actions">
                    <button class="api-key-btn copy" onclick="copyAPIKey('${key.id}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="api-key-btn regenerate" onclick="regenerateAPIKey('${key.id}')">
                        <i class="fas fa-sync"></i> Regenerate
                    </button>
                    <button class="api-key-btn delete" onclick="deleteAPIKey('${key.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    generateAPIKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 64; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    createAPIKey(name, description, accessLevel, expiresAt) {
        const newKey = {
            id: Date.now().toString(),
            name: name,
            description: description || '',
            key: this.generateAPIKey(),
            accessLevel: accessLevel,
            status: 'active',
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt || null,
            lastUsed: null,
            usageCount: 0
        };

        this.apiKeys.push(newKey);
        this.saveAPIKeys();
        this.displayAPIKeys();
        
        return newKey;
    }

    deleteAPIKey(keyId) {
        if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            this.apiKeys = this.apiKeys.filter(key => key.id !== keyId);
            this.saveAPIKeys();
            this.displayAPIKeys();
            game.showNotification('API key deleted successfully!', 'success');
        }
    }

    regenerateAPIKey(keyId) {
        if (confirm('Are you sure you want to regenerate this API key? The old key will become invalid.')) {
            const keyIndex = this.apiKeys.findIndex(key => key.id === keyId);
            if (keyIndex !== -1) {
                this.apiKeys[keyIndex].key = this.generateAPIKey();
                this.apiKeys[keyIndex].lastUsed = null;
                this.apiKeys[keyIndex].usageCount = 0;
                this.saveAPIKeys();
                this.displayAPIKeys();
                game.showNotification('API key regenerated successfully!', 'success');
            }
        }
    }

    copyAPIKey(keyId) {
        const key = this.apiKeys.find(k => k.id === keyId);
        if (key) {
            navigator.clipboard.writeText(key.key).then(() => {
                game.showNotification('API key copied to clipboard!', 'success');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = key.key;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                game.showNotification('API key copied to clipboard!', 'success');
            });
        }
    }

    saveAPIKeys() {
        localStorage.setItem('userAPIKeys', JSON.stringify(this.apiKeys));
    }
}

// Global API Keys Functions
function showCreateAPIKeyModal() {
    document.getElementById('create-api-key-modal').style.display = 'flex';
}

function closeCreateAPIKeyModal() {
    document.getElementById('create-api-key-modal').style.display = 'none';
    // Reset form
    document.getElementById('apiKeyName').value = '';
    document.getElementById('apiKeyDescription').value = '';
    document.getElementById('publicOnly').checked = true;
    document.getElementById('apiKeyExpiry').value = '';
}

function createAPIKey() {
    const name = document.getElementById('apiKeyName').value;
    const description = document.getElementById('apiKeyDescription').value;
    const accessLevel = document.querySelector('input[name="accessLevel"]:checked').value;
    const expiresAt = document.getElementById('apiKeyExpiry').value;

    if (!name.trim()) {
        game.showNotification('Please enter a name for the API key!', 'error');
        return;
    }

    const newKey = window.apiKeysManager.createAPIKey(name, description, accessLevel, expiresAt);
    
    closeCreateAPIKeyModal();
    game.showNotification(`API key "${name}" created successfully!`, 'success');
    
    // Show the new key in a special modal
    showAPIKeyCreatedModal(newKey);
}

function showAPIKeyCreatedModal(apiKey) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h3><i class="fas fa-key"></i> API Key Created Successfully!</h3>
            <div style="background: #222; border: 2px solid #ff6b35; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
                <p style="color: #ff6b35; font-weight: bold; margin-bottom: 0.5rem;">Your API Key:</p>
                <code style="color: #ffffff; font-family: monospace; word-break: break-all; display: block; background: #333; padding: 0.5rem; border-radius: 4px;">${apiKey.key}</code>
            </div>
            <div style="background: #ff6b35; color: #ffffff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Important:</strong> Copy this API key now! You won't be able to see it again for security reasons.
            </div>
            <div class="modal-actions">
                <button class="game-btn secondary" onclick="this.closest('.modal').remove()">Close</button>
                <button class="game-btn primary" onclick="copyAPIKey('${apiKey.id}'); this.closest('.modal').remove()">
                    <i class="fas fa-copy"></i> Copy & Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function refreshAPIKeys() {
    window.apiKeysManager.loadAPIKeys();
    game.showNotification('API keys refreshed!', 'success');
}

function copyAPIKey(keyId) {
    window.apiKeysManager.copyAPIKey(keyId);
}

function deleteAPIKey(keyId) {
    window.apiKeysManager.deleteAPIKey(keyId);
}

function regenerateAPIKey(keyId) {
    window.apiKeysManager.regenerateAPIKey(keyId);
}

// Comprehensive Game Systems
class BattleSystem {
    constructor() {
        this.battleLog = [];
        this.opponents = [];
        this.tournaments = [];
        this.init();
    }

    init() {
        this.generateOpponents();
        this.generateTournaments();
    }

    generateOpponents() {
        this.opponents = [
            { name: "Street Thug", level: 1, stats: { strength: 15, defense: 10, speed: 12 }, reward: 50 },
            { name: "Gang Member", level: 3, stats: { strength: 25, defense: 20, speed: 18 }, reward: 150 },
            { name: "Criminal Mastermind", level: 5, stats: { strength: 40, defense: 35, speed: 30 }, reward: 300 },
            { name: "Crime Boss", level: 8, stats: { strength: 60, defense: 50, speed: 45 }, reward: 500 }
        ];
    }

    generateTournaments() {
        this.tournaments = [
            { name: "Street Fighter Tournament", level: 1, entryFee: 100, prize: 500, participants: 8 },
            { name: "Criminal Championship", level: 5, entryFee: 500, prize: 2000, participants: 16 },
            { name: "Crime City Masters", level: 10, entryFee: 1000, prize: 5000, participants: 32 }
        ];
    }

    findOpponent() {
        if (game.player.energy < 10) {
            game.showNotification('Not enough energy to battle!', 'error');
            return;
        }

        const availableOpponents = this.opponents.filter(opp => opp.level <= game.player.level + 2);
        if (availableOpponents.length === 0) {
            game.showNotification('No suitable opponents found!', 'error');
            return;
        }

        const opponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
        this.startBattle(opponent);
    }

    startBattle(opponent) {
        game.player.energy -= 10;
        
        const playerPower = this.calculatePower(game.player.stats);
        const opponentPower = this.calculatePower(opponent.stats);
        
        const playerChance = playerPower / (playerPower + opponentPower);
        const isWin = Math.random() < playerChance;
        
        if (isWin) {
            this.battleWin(opponent);
        } else {
            this.battleLoss(opponent);
        }
        
        this.addToBattleLog(opponent, isWin);
        game.updateDisplay();
    }

    calculatePower(stats) {
        return (stats.strength || 0) + (stats.defense || 0) + (stats.speed || 0) + (stats.dexterity || 0);
    }

    battleWin(opponent) {
        const reward = opponent.reward;
        game.player.money += reward;
        game.player.experience += 20;
        
        // Update battle stats
        if (!game.player.battleStats) {
            game.player.battleStats = { wins: 0, losses: 0, damageDealt: 0, criticalHits: 0, dodges: 0 };
        }
        game.player.battleStats.wins++;
        
        game.showNotification(`Victory! You defeated ${opponent.name} and earned $${reward}!`, 'success');
        this.checkLevelUp();
    }

    battleLoss(opponent) {
        const damage = Math.floor(Math.random() * 20) + 10;
        game.player.life = Math.max(0, game.player.life - damage);
        
        // Update battle stats
        if (!game.player.battleStats) {
            game.player.battleStats = { wins: 0, losses: 0, damageDealt: 0, criticalHits: 0, dodges: 0 };
        }
        game.player.battleStats.losses++;
        
        game.showNotification(`Defeat! You lost to ${opponent.name} and took ${damage} damage!`, 'error');
        
        if (game.player.life <= 0) {
            this.sendToHospital();
        }
    }

    sendToHospital() {
        game.showNotification('You have been severely injured and sent to the hospital!', 'error');
        game.player.life = 50;
        game.player.energy = 0;
        // Add hospital time
        if (!game.player.cooldowns) game.player.cooldowns = {};
        game.player.cooldowns.hospital = Date.now() + (30 * 60 * 1000); // 30 minutes
    }

    addToBattleLog(opponent, isWin) {
        const logEntry = {
            opponent: opponent.name,
            result: isWin ? 'Victory' : 'Defeat',
            timestamp: new Date().toLocaleString()
        };
        this.battleLog.unshift(logEntry);
        if (this.battleLog.length > 10) this.battleLog.pop();
        
        this.updateBattleLogDisplay();
    }

    updateBattleLogDisplay() {
        const logContent = document.querySelector('.log-content');
        if (this.battleLog.length === 0) {
            logContent.innerHTML = '<p>No battles yet. Start fighting to see your battle history!</p>';
            return;
        }
        
        logContent.innerHTML = this.battleLog.map(entry => 
            `<div class="log-entry">
                <span class="log-result ${entry.result.toLowerCase()}">${entry.result}</span>
                <span class="log-opponent">vs ${entry.opponent}</span>
                <span class="log-time">${entry.timestamp}</span>
            </div>`
        ).join('');
    }

    startTraining() {
        if (game.player.energy < 5) {
            game.showNotification('Not enough energy to train!', 'error');
            return;
        }

        game.player.energy -= 5;
        const statGain = Math.floor(Math.random() * 3) + 1;
        const stat = ['strength', 'defense', 'speed', 'dexterity'][Math.floor(Math.random() * 4)];
        
        game.player.stats[stat] += statGain;
        game.player.experience += 10;
        
        game.showNotification(`Training complete! +${statGain} ${stat}!`, 'success');
        this.checkLevelUp();
        game.updateDisplay();
    }

    joinTournament() {
        const availableTournaments = this.tournaments.filter(t => t.level <= game.player.level);
        if (availableTournaments.length === 0) {
            game.showNotification('No tournaments available for your level!', 'error');
            return;
        }

        const tournament = availableTournaments[0];
        if (game.player.money < tournament.entryFee) {
            game.showNotification(`Not enough money! Entry fee: $${tournament.entryFee}`, 'error');
            return;
        }

        game.player.money -= tournament.entryFee;
        game.showNotification(`Joined ${tournament.name}! Entry fee: $${tournament.entryFee}`, 'success');
        // Tournament logic would go here
    }

    checkLevelUp() {
        if (game.player.experience >= game.player.experienceToNext) {
            game.player.level++;
            game.player.experience -= game.player.experienceToNext;
            game.player.experienceToNext = Math.floor(game.player.experienceToNext * 1.2);
            
            // Stat increases on level up
            game.player.stats.strength += 2;
            game.player.stats.defense += 2;
            game.player.stats.speed += 2;
            game.player.stats.dexterity += 2;
            
            game.showNotification(`Level Up! You are now level ${game.player.level}!`, 'success');
        }
    }
}

class CrimeSystem {
    constructor() {
        this.crimes = {
            shoplifting: { risk: 0.1, reward: [50, 200], energy: 5, experience: 10 },
            pickpocketing: { risk: 0.15, reward: [30, 150], energy: 5, experience: 8 },
            armed_robbery: { risk: 0.4, reward: [500, 2000], energy: 15, experience: 50 },
            drug_dealing: { risk: 0.25, reward: [200, 800], energy: 10, experience: 30 }
        };
        this.crimeStats = {
            successful: 0,
            failed: 0,
            arrested: 0,
            escaped: 0,
            totalEarnings: 0
        };
    }

    commitCrime(crimeType) {
        const crime = this.crimes[crimeType];
        if (!crime) {
            game.showNotification('Invalid crime type!', 'error');
            return;
        }

        if (game.player.energy < crime.energy) {
            game.showNotification(`Not enough energy! Need ${crime.energy} energy.`, 'error');
            return;
        }

        if (game.player.cooldowns && game.player.cooldowns.crime > Date.now()) {
            const remaining = Math.ceil((game.player.cooldowns.crime - Date.now()) / 60000);
            game.showNotification(`Crime cooldown: ${remaining} minutes remaining`, 'error');
            return;
        }

        game.player.energy -= crime.energy;
        
        const isSuccess = Math.random() > crime.risk;
        const isArrested = Math.random() < crime.risk * 0.5; // 50% chance of arrest on failure
        
        if (isSuccess) {
            this.crimeSuccess(crimeType, crime);
        } else if (isArrested) {
            this.crimeArrested(crimeType);
        } else {
            this.crimeFailed(crimeType);
        }
        
        // Set cooldown
        if (!game.player.cooldowns) game.player.cooldowns = {};
        game.player.cooldowns.crime = Date.now() + (5 * 60 * 1000); // 5 minutes
        
        game.updateDisplay();
    }

    crimeSuccess(crimeType, crime) {
        const reward = Math.floor(Math.random() * (crime.reward[1] - crime.reward[0] + 1)) + crime.reward[0];
        game.player.money += reward;
        game.player.experience += crime.experience;
        
        this.crimeStats.successful++;
        this.crimeStats.totalEarnings += reward;
        
        game.showNotification(`Crime successful! Earned $${reward}!`, 'success');
        this.checkLevelUp();
    }

    crimeFailed(crimeType) {
        this.crimeStats.failed++;
        game.showNotification(`Crime failed! You got away but earned nothing.`, 'error');
    }

    crimeArrested(crimeType) {
        this.crimeStats.arrested++;
        
        const sentenceHours = Math.max(1, Math.floor(Math.random() * 24) + 1);
        const bailCost = Math.floor(Math.random() * 5000) + 1000;
        
        // Use JailSystem to handle arrest
        if (window.jailSystem) {
            window.jailSystem.arrestPlayer(crimeType, sentenceHours, bailCost);
        } else {
            game.showNotification('You have been arrested!', 'error');
            // Fallback to old system
            if (!game.player.cooldowns) game.player.cooldowns = {};
            game.player.cooldowns.jail = Date.now() + (60 * 60 * 1000); // 1 hour in jail
            game.player.energy = 0;
        }
    }

    checkLevelUp() {
        if (game.player.experience >= game.player.experienceToNext) {
            game.player.level++;
            game.player.experience -= game.player.experienceToNext;
            game.player.experienceToNext = Math.floor(game.player.experienceToNext * 1.2);
            
            game.showNotification(`Level Up! You are now level ${game.player.level}!`, 'success');
        }
    }
}

class JobSystem {
    constructor() {
        this.jobSkills = {
            leadership: 0,
            communication: 0,
            technical: 0,
            physical: 0,
            creativity: 0,
            problemSolving: 0
        };
        this.jobCategories = {
            entry: "Entry Level",
            skilled: "Skilled Labor", 
            professional: "Professional",
            executive: "Executive",
            criminal: "Criminal",
            government: "Government"
        };
        this.jobs = [
            // Entry Level Jobs
            { 
                name: "Street Cleaner", 
                category: "entry",
                level: 1,
                income: 50, 
                energy: 10,
                requirements: { level: 1, physical: 0 }, 
                description: "Clean the streets and earn some money",
                skills: { physical: 2, problemSolving: 1 },
                hours: 8,
                difficulty: 1,
                reputation: 0
            },
            { 
                name: "Fast Food Worker", 
                category: "entry",
                level: 1,
                income: 75, 
                energy: 12,
                requirements: { level: 1, communication: 0 }, 
                description: "Serve customers at a fast food restaurant",
                skills: { communication: 3, physical: 1 },
                hours: 6,
                difficulty: 1,
                reputation: 0
            },
            { 
                name: "Retail Clerk", 
                category: "entry",
                level: 2,
                income: 80, 
                energy: 15,
                requirements: { level: 2, communication: 5 }, 
                description: "Help customers in a retail store",
                skills: { communication: 4, problemSolving: 2 },
                hours: 7,
                difficulty: 2,
                reputation: 1
            },
            
            // Skilled Labor Jobs
            { 
                name: "Delivery Driver", 
                category: "skilled",
                level: 3,
                income: 120, 
                energy: 18,
                requirements: { level: 3, physical: 10 }, 
                description: "Deliver packages around the city",
                skills: { physical: 3, problemSolving: 2 },
                hours: 8,
                difficulty: 3,
                reputation: 2
            },
            { 
                name: "Mechanic", 
                category: "skilled",
                level: 4,
                income: 150, 
                energy: 20,
                requirements: { level: 4, technical: 15 }, 
                description: "Repair and maintain vehicles",
                skills: { technical: 5, problemSolving: 4 },
                hours: 9,
                difficulty: 4,
                reputation: 3
            },
            { 
                name: "Construction Worker", 
                category: "skilled",
                level: 5,
                income: 180, 
                energy: 25,
                requirements: { level: 5, physical: 20 }, 
                description: "Build and repair structures",
                skills: { physical: 6, technical: 3 },
                hours: 10,
                difficulty: 4,
                reputation: 3
            },
            
            // Professional Jobs
            { 
                name: "Security Guard", 
                category: "professional",
                level: 6,
                income: 200, 
                energy: 22,
                requirements: { level: 6, physical: 25, leadership: 10 }, 
                description: "Protect buildings and property",
                skills: { leadership: 4, physical: 3, problemSolving: 3 },
                hours: 8,
                difficulty: 5,
                reputation: 4
            },
            { 
                name: "Taxi Driver", 
                category: "professional",
                level: 7,
                income: 220, 
                energy: 20,
                requirements: { level: 7, communication: 20 }, 
                description: "Drive people around the city",
                skills: { communication: 5, problemSolving: 4 },
                hours: 8,
                difficulty: 3,
                reputation: 2
            },
            { 
                name: "Police Officer", 
                category: "professional",
                level: 8,
                income: 300, 
                energy: 30,
                requirements: { level: 8, physical: 30, leadership: 20 }, 
                description: "Maintain law and order",
                skills: { leadership: 6, physical: 5, problemSolving: 5 },
                hours: 12,
                difficulty: 7,
                reputation: 8
            },
            { 
                name: "Firefighter", 
                category: "professional",
                level: 9,
                income: 350, 
                energy: 35,
                requirements: { level: 9, physical: 35, leadership: 15 }, 
                description: "Save lives and property",
                skills: { leadership: 5, physical: 7, problemSolving: 6 },
                hours: 12,
                difficulty: 8,
                reputation: 9
            },
            { 
                name: "Doctor", 
                category: "professional",
                level: 10,
                income: 500, 
                energy: 40,
                requirements: { level: 10, technical: 40, communication: 30 }, 
                description: "Heal the sick and injured",
                skills: { technical: 8, communication: 6, problemSolving: 7 },
                hours: 10,
                difficulty: 9,
                reputation: 10
            },
            
            // Executive Jobs
            { 
                name: "Lawyer", 
                category: "executive",
                level: 12,
                income: 600, 
                energy: 35,
                requirements: { level: 12, communication: 50, leadership: 30 }, 
                description: "Defend clients in court",
                skills: { communication: 8, leadership: 6, problemSolving: 8 },
                hours: 10,
                difficulty: 8,
                reputation: 12
            },
            { 
                name: "Business Executive", 
                category: "executive",
                level: 15,
                income: 800, 
                energy: 45,
                requirements: { level: 15, leadership: 60, communication: 40 }, 
                description: "Manage companies and make deals",
                skills: { leadership: 10, communication: 8, creativity: 6 },
                hours: 12,
                difficulty: 9,
                reputation: 15
            },
            { 
                name: "CEO", 
                category: "executive",
                level: 20,
                income: 1200, 
                energy: 50,
                requirements: { level: 20, leadership: 80, communication: 60 }, 
                description: "Lead a major corporation",
                skills: { leadership: 12, communication: 10, creativity: 8 },
                hours: 14,
                difficulty: 10,
                reputation: 20
            },
            
            // Criminal Jobs
            { 
                name: "Drug Dealer", 
                category: "criminal",
                level: 5,
                income: 300, 
                energy: 20,
                requirements: { level: 5, reputation: -10 }, 
                description: "Sell illegal substances",
                skills: { communication: 4, problemSolving: 3, creativity: 2 },
                hours: 6,
                difficulty: 6,
                reputation: -5,
                risk: 8
            },
            { 
                name: "Thief", 
                category: "criminal",
                level: 4,
                income: 250, 
                energy: 18,
                requirements: { level: 4, physical: 15 }, 
                description: "Steal valuable items",
                skills: { physical: 5, problemSolving: 4, creativity: 3 },
                hours: 4,
                difficulty: 7,
                reputation: -8,
                risk: 9
            },
            { 
                name: "Hitman", 
                category: "criminal",
                level: 10,
                income: 1000, 
                energy: 30,
                requirements: { level: 10, physical: 40, reputation: -20 }, 
                description: "Eliminate targets for money",
                skills: { physical: 8, problemSolving: 6, leadership: 4 },
                hours: 8,
                difficulty: 9,
                reputation: -15,
                risk: 10
            },
            
            // Government Jobs
            { 
                name: "Government Clerk", 
                category: "government",
                level: 8,
                income: 400, 
                energy: 25,
                requirements: { level: 8, reputation: 20 }, 
                description: "Handle government paperwork",
                skills: { communication: 5, technical: 4, problemSolving: 4 },
                hours: 8,
                difficulty: 5,
                reputation: 6
            },
            { 
                name: "Mayor", 
                category: "government",
                level: 25,
                income: 1500, 
                energy: 60,
                requirements: { level: 25, leadership: 100, reputation: 50 }, 
                description: "Lead the city government",
                skills: { leadership: 15, communication: 12, creativity: 10 },
                hours: 16,
                difficulty: 10,
                reputation: 25
            }
        ];
        this.currentJob = null;
        this.jobStats = {
            totalEarnings: 0,
            hoursWorked: 0,
            promotions: 0,
            skillsLearned: 0,
            jobsCompleted: 0,
            reputationGained: 0
        };
        this.jobHistory = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateJobSkillsDisplay();
    }

    setupEventListeners() {
        // Job category filters
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('job-category-btn')) {
                const category = e.target.dataset.category;
                this.filterJobsByCategory(category);
            }
        });
    }

    findJob() {
        const availableJobs = this.jobs.filter(job => {
            return Object.keys(job.requirements).every(stat => {
                if (stat === 'level') {
                    return game.player.level >= job.requirements[stat];
                } else if (stat === 'reputation') {
                    return game.player.reputation >= job.requirements[stat];
                } else {
                    return (game.player.stats[stat] || 0) >= job.requirements[stat];
                }
            });
        });

        if (availableJobs.length === 0) {
            game.showNotification('No jobs available for your current stats!', 'error');
            return;
        }

        this.displayAvailableJobs(availableJobs);
    }

    filterJobsByCategory(category) {
        const availableJobs = this.jobs.filter(job => {
            if (category === 'all') return true;
            return job.category === category;
        });

        this.displayAvailableJobs(availableJobs);
    }

    updateJobSkillsDisplay() {
        const skillsContainer = document.getElementById('jobSkills');
        if (skillsContainer) {
            skillsContainer.innerHTML = Object.entries(this.jobSkills).map(([skill, value]) => `
                <div class="skill-item">
                    <span class="skill-name">${skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
                    <div class="skill-bar">
                        <div class="skill-fill" style="width: ${(value / 100) * 100}%"></div>
                    </div>
                    <span class="skill-value">${value}/100</span>
                </div>
            `).join('');
        }
    }

    displayAvailableJobs(jobs) {
        const jobList = document.getElementById('jobList');
        jobList.innerHTML = jobs.map(job => `
            <div class="job-item enhanced">
                <div class="job-header">
                    <h4>${job.name}</h4>
                    <span class="job-category">${this.jobCategories[job.category]}</span>
                </div>
                <div class="job-details">
                    <div class="job-info">
                        <p><strong>Level:</strong> ${job.level} | <strong>Income:</strong> $${job.income}/hour</p>
                        <p><strong>Energy:</strong> ${job.energy} | <strong>Hours:</strong> ${job.hours} | <strong>Difficulty:</strong> ${job.difficulty}/10</p>
                        <p><strong>Description:</strong> ${job.description}</p>
                    </div>
                    <div class="job-requirements">
                        <h5>Requirements:</h5>
                        <ul>
                            ${Object.entries(job.requirements).map(([stat, req]) => 
                                `<li>${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${req}</li>`
                            ).join('')}
                        </ul>
                    </div>
                    <div class="job-skills">
                        <h5>Skills Gained:</h5>
                        <div class="skill-gains">
                            ${Object.entries(job.skills || {}).map(([skill, gain]) => 
                                `<span class="skill-gain">${skill}: +${gain}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="job-reputation">
                        <p><strong>Reputation:</strong> ${job.reputation > 0 ? '+' : ''}${job.reputation}</p>
                        ${job.risk ? `<p><strong>Risk Level:</strong> ${job.risk}/10</p>` : ''}
                    </div>
                </div>
                <button class="game-btn primary" onclick="jobSystem.acceptJob('${job.name}')">
                    <i class="fas fa-briefcase"></i> Accept Job
                </button>
            </div>
        `).join('');
    }

    acceptJob(jobName) {
        const job = this.jobs.find(j => j.name === jobName);
        if (!job) return;

        // Check if player meets requirements
        const meetsRequirements = Object.keys(job.requirements).every(stat => {
            if (stat === 'level') {
                return game.player.level >= job.requirements[stat];
            } else if (stat === 'reputation') {
                return game.player.reputation >= job.requirements[stat];
            } else {
                return (game.player.stats[stat] || 0) >= job.requirements[stat];
            }
        });

        if (!meetsRequirements) {
            game.showNotification('You do not meet the requirements for this job!', 'error');
            return;
        }

        this.currentJob = job;
        this.jobHistory.push({
            job: job.name,
            startTime: Date.now(),
            category: job.category
        });
        this.updateCurrentJobDisplay();
        game.showNotification(`You are now working as a ${job.name}!`, 'success');
    }

    work() {
        if (!this.currentJob) {
            game.showNotification('You need a job first!', 'error');
            return;
        }

        if (game.player.energy < this.currentJob.energy) {
            game.showNotification(`Not enough energy! Need ${this.currentJob.energy} energy.`, 'error');
            return;
        }

        if (game.player.cooldowns && game.player.cooldowns.job > Date.now()) {
            const remaining = Math.ceil((game.player.cooldowns.job - Date.now()) / 60000);
            game.showNotification(`Work cooldown: ${remaining} minutes remaining`, 'error');
            return;
        }

        // Calculate success chance based on difficulty and player stats
        const successChance = this.calculateWorkSuccess();
        const isSuccessful = Math.random() < successChance;

        game.player.energy -= this.currentJob.energy;
        game.player.experience += 15;
        
        if (isSuccessful) {
            // Successful work
            const earnings = this.currentJob.income;
            game.player.money += earnings;
            this.jobStats.totalEarnings += earnings;
            this.jobStats.hoursWorked += 1;
            this.jobStats.jobsCompleted += 1;

            // Gain job skills
            this.gainJobSkills();

            // Update reputation
            if (this.currentJob.reputation !== 0) {
                game.player.reputation += this.currentJob.reputation;
                this.jobStats.reputationGained += this.currentJob.reputation;
            }

            // Check for criminal job risks
            if (this.currentJob.category === 'criminal' && this.currentJob.risk) {
                this.handleCriminalJobRisk();
            }

            game.showNotification(`Successfully worked as ${this.currentJob.name} and earned $${earnings}!`, 'success');
        } else {
            // Failed work
            const partialEarnings = Math.floor(this.currentJob.income * 0.3);
            game.player.money += partialEarnings;
            this.jobStats.totalEarnings += partialEarnings;
            
            game.showNotification(`Work was challenging. You earned $${partialEarnings} (reduced pay).`, 'warning');
        }
        
        // Set cooldown
        if (!game.player.cooldowns) game.player.cooldowns = {};
        game.player.cooldowns.job = Date.now() + (30 * 60 * 1000); // 30 minutes
        
        this.checkLevelUp();
        this.updateJobSkillsDisplay();
        game.updateDisplay();
    }

    calculateWorkSuccess() {
        const baseSuccess = 0.8; // 80% base success rate
        const difficultyPenalty = this.currentJob.difficulty * 0.05; // 5% penalty per difficulty point
        const skillBonus = this.calculateSkillBonus();
        
        return Math.max(0.1, Math.min(0.95, baseSuccess - difficultyPenalty + skillBonus));
    }

    calculateSkillBonus() {
        let bonus = 0;
        Object.entries(this.jobSkills).forEach(([skill, value]) => {
            bonus += value * 0.001; // 0.1% bonus per skill point
        });
        return Math.min(0.2, bonus); // Max 20% bonus
    }

    gainJobSkills() {
        if (this.currentJob.skills) {
            Object.entries(this.currentJob.skills).forEach(([skill, gain]) => {
                this.jobSkills[skill] = Math.min(100, this.jobSkills[skill] + gain);
                this.jobStats.skillsLearned += gain;
            });
        }
    }

    handleCriminalJobRisk() {
        const riskChance = this.currentJob.risk * 0.1; // 10% risk per risk point
        if (Math.random() < riskChance) {
            // Criminal job risk triggered
            const consequences = [
                { type: 'arrest', message: 'You were caught! The police arrested you.', reputation: -10, jailTime: 2 },
                { type: 'fine', message: 'You were fined for illegal activities.', money: -500, reputation: -5 },
                { type: 'injury', message: 'You were injured during the job.', health: -20, reputation: -2 }
            ];
            
            const consequence = consequences[Math.floor(Math.random() * consequences.length)];
            
            if (consequence.type === 'arrest') {
                // Trigger arrest system
                if (window.jailSystem) {
                    window.jailSystem.arrestPlayer('Illegal Job Activity', consequence.jailTime * 60, 1000);
                }
            } else if (consequence.type === 'fine') {
                game.player.money += consequence.money;
            } else if (consequence.type === 'injury') {
                game.player.life += consequence.health;
            }
            
            game.player.reputation += consequence.reputation;
            game.showNotification(consequence.message, 'error');
        }
    }

    updateCurrentJobDisplay() {
        const currentJobDiv = document.getElementById('currentJob');
        if (this.currentJob) {
            currentJobDiv.innerHTML = `
                <h3>Current Job</h3>
                <div class="job-info">
                    <h4>${this.currentJob.name}</h4>
                    <p>Income: $${this.currentJob.income}/hour</p>
                    <p>Energy Cost: ${this.currentJob.energy}</p>
                    <button class="game-btn" onclick="jobSystem.work()">Work</button>
                    <button class="game-btn" onclick="jobSystem.quitJob()">Quit Job</button>
                </div>
            `;
        } else {
            currentJobDiv.innerHTML = `
                <h3>Current Job</h3>
                <div class="job-info">
                    <p>No job currently</p>
                    <button class="game-btn" onclick="jobSystem.findJob()">Find Job</button>
                </div>
            `;
        }
    }

    quitJob() {
        this.currentJob = null;
        this.updateCurrentJobDisplay();
        game.showNotification('You quit your job!', 'info');
    }

    checkLevelUp() {
        if (game.player.experience >= game.player.experienceToNext) {
            game.player.level++;
            game.player.experience -= game.player.experienceToNext;
            game.player.experienceToNext = Math.floor(game.player.experienceToNext * 1.2);
            
            game.showNotification(`Level Up! You are now level ${game.player.level}!`, 'success');
        }
    }
}

class MarketSystem {
    constructor() {
        this.items = {
            weapons: [
                // Melee Weapons
                { name: "Knife", price: 500, damage: 15, accuracy: 85, range: 1, type: "melee", category: "melee", description: "Basic melee weapon", durability: 100, weight: 1 },
                { name: "Baseball Bat", price: 800, damage: 20, accuracy: 75, range: 2, type: "melee", category: "melee", description: "Heavy melee weapon", durability: 80, weight: 3 },
                { name: "Machete", price: 1200, damage: 25, accuracy: 80, range: 1, type: "melee", category: "melee", description: "Sharp cutting weapon", durability: 90, weight: 2 },
                
                // Pistols
                { name: "Pistol", price: 2500, damage: 25, accuracy: 70, range: 15, type: "firearm", category: "pistol", description: "Standard handgun", durability: 100, weight: 2, ammo: 12 },
                { name: "Combat Pistol", price: 4500, damage: 30, accuracy: 75, range: 18, type: "firearm", category: "pistol", description: "Military grade pistol", durability: 95, weight: 2, ammo: 15 },
                { name: "Pistol .50", price: 8000, damage: 45, accuracy: 65, range: 20, type: "firearm", category: "pistol", description: "High caliber handgun", durability: 90, weight: 3, ammo: 9 },
                
                // SMGs
                { name: "SMG", price: 12000, damage: 35, accuracy: 60, range: 25, type: "firearm", category: "smg", description: "Submachine gun", durability: 85, weight: 4, ammo: 30 },
                { name: "Assault SMG", price: 18000, damage: 40, accuracy: 65, range: 30, type: "firearm", category: "smg", description: "Rapid fire SMG", durability: 80, weight: 5, ammo: 30 },
                
                // Assault Rifles
                { name: "Assault Rifle", price: 25000, damage: 50, accuracy: 70, range: 40, type: "firearm", category: "rifle", description: "Standard assault rifle", durability: 90, weight: 6, ammo: 30 },
                { name: "Carbine Rifle", price: 35000, damage: 55, accuracy: 75, range: 45, type: "firearm", category: "rifle", description: "Compact assault rifle", durability: 85, weight: 5, ammo: 30 },
                { name: "Advanced Rifle", price: 45000, damage: 60, accuracy: 80, range: 50, type: "firearm", category: "rifle", description: "High-tech assault rifle", durability: 95, weight: 6, ammo: 30 },
                { name: "Bullpup Rifle", price: 40000, damage: 58, accuracy: 78, range: 48, type: "firearm", category: "rifle", description: "Bullpup design rifle", durability: 88, weight: 5, ammo: 30 },
                
                // Shotguns
                { name: "Shotgun", price: 15000, damage: 80, accuracy: 50, range: 12, type: "firearm", category: "shotgun", description: "Close range weapon", durability: 80, weight: 7, ammo: 8 },
                { name: "Pump Shotgun", price: 20000, damage: 85, accuracy: 55, range: 15, type: "firearm", category: "shotgun", description: "Pump action shotgun", durability: 85, weight: 8, ammo: 8 },
                
                // Sniper Rifles
                { name: "Sniper Rifle", price: 75000, damage: 120, accuracy: 95, range: 100, type: "firearm", category: "sniper", description: "Long range precision weapon", durability: 90, weight: 10, ammo: 5 },
                { name: "Heavy Sniper", price: 120000, damage: 150, accuracy: 90, range: 120, type: "firearm", category: "sniper", description: "Anti-materiel sniper rifle", durability: 85, weight: 15, ammo: 3 }
            ],
            armor: [
                { name: "Leather Jacket", price: 200, defense: 5, durability: 100, type: "light" },
                { name: "Kevlar Vest", price: 800, defense: 15, durability: 200, type: "medium" },
                { name: "Bulletproof Vest", price: 1500, defense: 25, durability: 300, type: "heavy" },
                { name: "Combat Armor", price: 3000, defense: 40, durability: 500, type: "heavy" }
            ],
            drugs: [
                { name: "Xanax", price: 50, effect: "energy", value: 250, duration: 3600000, addiction: 0.3, description: "Best for training; provides 250 additional energy. Highly addictive." },
                { name: "Ecstasy", price: 80, effect: "happiness", value: 2.0, duration: 7200000, addiction: 0.1, description: "Doubles happiness. Not too addictive." },
                { name: "Vicodin", price: 120, effect: "defense", value: 2.0, duration: 5400000, addiction: 0.05, description: "Reduces energy use; doubles defense stats temporarily. Not very addictive." },
                { name: "Cannabis", price: 25, effect: "training", value: 1.2, duration: 1800000, addiction: 0.15, description: "Low-cost option for training when addicted." },
                { name: "LSD", price: 150, effect: "perception", value: 3.0, duration: 10800000, addiction: 0.2, description: "Hallucinogenic effects; unpredictable results." },
                { name: "Opium", price: 200, effect: "pain_relief", value: -100, duration: 7200000, addiction: 0.4, description: "Pain relief and relaxation; highly addictive." },
                { name: "PCP", price: 100, effect: "strength", value: 1.5, duration: 3600000, addiction: 0.25, description: "Dissociative effects; increases strength but decreases control." },
                { name: "Shrooms", price: 60, effect: "spirituality", value: 2.0, duration: 10800000, addiction: 0.1, description: "Natural psychedelic; spiritual effects." },
                { name: "Speed", price: 75, effect: "speed", value: 2.0, duration: 1800000, addiction: 0.35, description: "Stimulant; increases speed and energy but causes crashes." },
                { name: "Ketamine", price: 180, effect: "dissociation", value: 2.0, duration: 5400000, addiction: 0.3, description: "Dissociative anesthetic; numbs pain and reality." }
            ],
            misc: [
                { name: "Lockpick", price: 30, effect: "crime_bonus", value: 5, uses: 10 },
                { name: "First Aid Kit", price: 75, effect: "heal", value: 50, uses: 1 },
                { name: "Energy Drink", price: 20, effect: "energy", value: 25, uses: 1 },
                { name: "Phone", price: 200, effect: "communication", value: 1, uses: 1 }
            ]
        };
        this.properties = [
            { name: "Small Apartment", price: 50000, income: 100, maintenance: 50, type: "residential" },
            { name: "Medium House", price: 150000, income: 300, maintenance: 100, type: "residential" },
            { name: "Large Mansion", price: 500000, income: 800, maintenance: 200, type: "residential" },
            { name: "Small Business", price: 200000, income: 500, maintenance: 150, type: "commercial" },
            { name: "Restaurant", price: 400000, income: 1000, maintenance: 300, type: "commercial" },
            { name: "Nightclub", price: 800000, income: 2000, maintenance: 500, type: "commercial" }
        ];
        this.currentCategory = 'weapons';
    }

    showMarket() {
        this.updateMarketDisplay();
    }

    updateMarketDisplay() {
        // Update buy tab
        this.updateBuyTab();
        // Update sell tab
        this.updateSellTab();
        // Update property tab
        this.updatePropertyTab();
    }

    updateBuyTab() {
        const itemList = document.getElementById('buyItemList');
        
        if (this.currentCategory === 'drugs') {
            this.updateDrugCollection();
            return;
        }
        
        const items = this.items[this.currentCategory] || [];
        
        itemList.innerHTML = items.map(item => `
            <div class="item-card">
                <h4>${item.name}</h4>
                <p>Price: $${item.price}</p>
                ${item.damage ? `<p>Damage: ${item.damage}</p>` : ''}
                ${item.defense ? `<p>Defense: ${item.defense}</p>` : ''}
                ${item.effect ? `<p>Effect: ${item.effect}</p>` : ''}
                ${item.durability ? `<p>Durability: ${item.durability}</p>` : ''}
                <button class="game-btn" onclick="marketSystem.buyItem('${item.name}', '${this.currentCategory}')">Buy</button>
            </div>
        `).join('');
    }

    updateDrugCollection() {
        const itemList = document.getElementById('buyItemList');
        
        itemList.innerHTML = `
            <div class="drug-collection-section">
                <h4><i class="fas fa-search"></i> Collect Drugs</h4>
                <p>Choose a location and drug to collect. Higher risk locations offer better rewards.</p>
                
                <div class="collection-locations">
                    <h5>Available Locations</h5>
                    <div class="location-grid" id="collectionLocations">
                        ${this.getCollectionLocations()}
                    </div>
                </div>
                
                <div class="drug-selection">
                    <h5>Select Drug to Collect</h5>
                    <div class="drug-options" id="drugCollectionOptions">
                        ${this.getDrugOptions()}
                    </div>
                </div>
            </div>
        `;
    }

    getCollectionLocations() {
        const locations = [
            { name: "Pharmacy", successRate: 80, risk: "Low" },
            { name: "Hospital", successRate: 70, risk: "Medium" },
            { name: "University Lab", successRate: 60, risk: "Medium" },
            { name: "Chemical Plant", successRate: 50, risk: "High" },
            { name: "Research Facility", successRate: 40, risk: "Very High" }
        ];
        
        return locations.map(location => `
            <div class="location-item" onclick="selectCollectionLocation('${location.name}')">
                <h5>${location.name}</h5>
                <p>Success Rate: ${location.successRate}%</p>
                <p>Risk: ${location.risk}</p>
            </div>
        `).join('');
    }

    getDrugOptions() {
        const drugs = this.items.drugs;
        return drugs.map(drug => `
            <div class="drug-option" onclick="selectCollectionDrug('${drug.name}')">
                <h5>${drug.name}</h5>
                <p>${drug.description}</p>
                <p>Market Price: $${drug.price}</p>
                <p>Addiction Rate: ${Math.floor(drug.addiction * 100)}%</p>
            </div>
        `).join('');
    }

    updateSellTab() {
        const sellList = document.getElementById('sellItemList');
        const inventory = game.player.items;
        let allItems = [];
        
        Object.keys(inventory).forEach(category => {
            inventory[category].forEach(item => {
                allItems.push({ ...item, category });
            });
        });
        
        // Add drug dealing section
        const drugDealingSection = this.getDrugDealingSection();
        
        if (allItems.length === 0) {
            sellList.innerHTML = `
                <p>No items to sell</p>
                ${drugDealingSection}
            `;
            return;
        }
        
        sellList.innerHTML = `
            <div class="regular-items">
                <h4>Regular Items</h4>
                ${allItems.map(item => `
                    <div class="item-card">
                        <h4>${item.name}</h4>
                        <p>Category: ${item.category}</p>
                        <p>Quantity: ${item.quantity || 1}</p>
                        <p>Sell Price: $${Math.floor((item.price || 0) * 0.7)}</p>
                        <button class="game-btn" onclick="marketSystem.sellItem('${item.name}', '${item.category}')">Sell</button>
                    </div>
                `).join('')}
            </div>
            ${drugDealingSection}
        `;
    }

    getDrugDealingSection() {
        return `
            <div class="drug-dealing-section">
                <h4><i class="fas fa-dollar-sign"></i> Deal Drugs</h4>
                <p>Choose a location and drug to sell. Higher risk locations offer better prices.</p>
                
                <div class="dealing-locations">
                    <h5>Dealing Locations</h5>
                    <div class="location-grid" id="dealingLocations">
                        ${this.getDealingLocations()}
                    </div>
                </div>
                
                <div class="drug-selection">
                    <h5>Select Drug to Sell</h5>
                    <div class="drug-options" id="drugDealingOptions">
                        ${this.getAvailableDrugs()}
                    </div>
                </div>
            </div>
        `;
    }

    getDealingLocations() {
        const locations = [
            { name: "Downtown Alley", successRate: 80, risk: "Low" },
            { name: "Warehouse District", successRate: 70, risk: "Medium" },
            { name: "Abandoned Building", successRate: 60, risk: "Medium" },
            { name: "Park at Night", successRate: 50, risk: "High" },
            { name: "Under the Bridge", successRate: 40, risk: "Very High" }
        ];
        
        return locations.map(location => `
            <div class="location-item" onclick="selectDealingLocation('${location.name}')">
                <h5>${location.name}</h5>
                <p>Success Rate: ${location.successRate}%</p>
                <p>Risk: ${location.risk}</p>
            </div>
        `).join('');
    }

    getAvailableDrugs() {
        const playerDrugs = game.player.drugs;
        const availableDrugs = Object.keys(playerDrugs).filter(drugType => 
            playerDrugs[drugType].quantity > 0
        );
        
        if (availableDrugs.length === 0) {
            return '<p>You have no drugs to sell!</p>';
        }
        
        return availableDrugs.map(drugType => {
            const drug = this.items.drugs.find(d => d.name.toLowerCase() === drugType);
            const playerDrug = playerDrugs[drugType];
            if (!drug) return '';
            
            return `
                <div class="drug-option" onclick="selectDealingDrug('${drug.name}')">
                    <h5>${drug.name}</h5>
                    <p>Quantity: ${playerDrug.quantity}</p>
                    <p>Market Price: $${drug.price}</p>
                    <p>Addiction Rate: ${Math.floor(drug.addiction * 100)}%</p>
                </div>
            `;
        }).join('');
    }

    updatePropertyTab() {
        const propertyList = document.getElementById('propertyList');
        
        propertyList.innerHTML = this.properties.map(property => `
            <div class="item-card">
                <h4>${property.name}</h4>
                <p>Price: $${property.price.toLocaleString()}</p>
                <p>Income: $${property.income}/day</p>
                <p>Maintenance: $${property.maintenance}/day</p>
                <p>Type: ${property.type}</p>
                <button class="game-btn" onclick="marketSystem.buyProperty('${property.name}')">Buy Property</button>
            </div>
        `).join('');
    }

    buyItem(itemName, category) {
        const item = this.items[category].find(i => i.name === itemName);
        if (!item) return;

        if (game.player.money < item.price) {
            game.showNotification(`Not enough money! Need $${item.price}`, 'error');
            return;
        }

        game.player.money -= item.price;
        
        // Add to inventory
        const existingItem = game.player.items[category].find(i => i.name === itemName);
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            game.player.items[category].push({ ...item, quantity: 1 });
        }

        game.showNotification(`Bought ${itemName} for $${item.price}!`, 'success');
        game.updateDisplay();
        this.updateSellTab();
    }

    sellItem(itemName, category) {
        const itemIndex = game.player.items[category].findIndex(i => i.name === itemName);
        if (itemIndex === -1) return;

        const item = game.player.items[category][itemIndex];
        const sellPrice = Math.floor((item.price || 0) * 0.7);
        
        game.player.money += sellPrice;
        
        if (item.quantity > 1) {
            item.quantity--;
        } else {
            game.player.items[category].splice(itemIndex, 1);
        }

        game.showNotification(`Sold ${itemName} for $${sellPrice}!`, 'success');
        game.updateDisplay();
        this.updateSellTab();
    }

    buyProperty(propertyName) {
        const property = this.properties.find(p => p.name === propertyName);
        if (!property) return;

        if (game.player.money < property.price) {
            game.showNotification(`Not enough money! Need $${property.price.toLocaleString()}`, 'error');
            return;
        }

        game.player.money -= property.price;
        game.player.property = {
            name: property.name,
            cost: property.price,
            fees: property.maintenance,
            income: property.income,
            type: property.type
        };

        game.showNotification(`Bought ${propertyName} for $${property.price.toLocaleString()}!`, 'success');
        game.updateDisplay();
    }

    setCategory(category) {
        this.currentCategory = category;
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        this.updateBuyTab();
    }
}

class DrugSystem {
    constructor() {
        this.drugDatabase = {
            xanax: {
                name: "Xanax",
                description: "Best for training; provides 250 additional energy. Highly addictive.",
                effects: { energy: 250, addiction: 0.3 },
                duration: 3600000, // 1 hour
                price: 50,
                rarity: "common",
                addictionRate: 0.3,
                withdrawalEffects: { energy: -50, happiness: -20 }
            },
            ecstasy: {
                name: "Ecstasy",
                description: "Doubles happiness. Not too addictive.",
                effects: { happiness: 2.0, addiction: 0.1 },
                duration: 7200000, // 2 hours
                price: 80,
                rarity: "uncommon",
                addictionRate: 0.1,
                withdrawalEffects: { happiness: -30 }
            },
            vicodin: {
                name: "Vicodin",
                description: "Reduces energy use; doubles defense stats temporarily. Not very addictive.",
                effects: { defense: 2.0, energyCost: 0.5, addiction: 0.05 },
                duration: 5400000, // 1.5 hours
                price: 120,
                rarity: "rare",
                addictionRate: 0.05,
                withdrawalEffects: { defense: -10, pain: 20 }
            },
            cannabis: {
                name: "Cannabis",
                description: "Low-cost option for training when addicted.",
                effects: { training: 1.2, addiction: 0.15 },
                duration: 1800000, // 30 minutes
                price: 25,
                rarity: "common",
                addictionRate: 0.15,
                withdrawalEffects: { training: -0.1, anxiety: 10 }
            },
            lsd: {
                name: "LSD",
                description: "Hallucinogenic effects; unpredictable results.",
                effects: { perception: 3.0, creativity: 2.0, addiction: 0.2 },
                duration: 10800000, // 3 hours
                price: 150,
                rarity: "rare",
                addictionRate: 0.2,
                withdrawalEffects: { perception: -0.5, depression: 25 }
            },
            opium: {
                name: "Opium",
                description: "Pain relief and relaxation; highly addictive.",
                effects: { pain: -100, relaxation: 2.0, addiction: 0.4 },
                duration: 7200000, // 2 hours
                price: 200,
                rarity: "rare",
                addictionRate: 0.4,
                withdrawalEffects: { pain: 50, anxiety: 30 }
            },
            pcp: {
                name: "PCP",
                description: "Dissociative effects; increases strength but decreases control.",
                effects: { strength: 1.5, control: 0.5, addiction: 0.25 },
                duration: 3600000, // 1 hour
                price: 100,
                rarity: "uncommon",
                addictionRate: 0.25,
                withdrawalEffects: { strength: -5, paranoia: 20 }
            },
            shrooms: {
                name: "Shrooms",
                description: "Natural psychedelic; spiritual effects.",
                effects: { spirituality: 2.0, creativity: 1.5, addiction: 0.1 },
                duration: 10800000, // 3 hours
                price: 60,
                rarity: "uncommon",
                addictionRate: 0.1,
                withdrawalEffects: { spirituality: -0.3, confusion: 15 }
            },
            speed: {
                name: "Speed",
                description: "Stimulant; increases speed and energy but causes crashes.",
                effects: { speed: 2.0, energy: 100, addiction: 0.35 },
                duration: 1800000, // 30 minutes
                price: 75,
                rarity: "common",
                addictionRate: 0.35,
                withdrawalEffects: { speed: -0.3, energy: -50, depression: 20 }
            },
            ketamine: {
                name: "Ketamine",
                description: "Dissociative anesthetic; numbs pain and reality.",
                effects: { pain: -80, dissociation: 2.0, addiction: 0.3 },
                duration: 5400000, // 1.5 hours
                price: 180,
                rarity: "rare",
                addictionRate: 0.3,
                withdrawalEffects: { pain: 40, dissociation: -0.5, depression: 25 }
            }
        };
        
        this.dealingLocations = [
            "Downtown Alley",
            "Warehouse District",
            "Abandoned Building",
            "Park at Night",
            "Under the Bridge"
        ];
        
        this.collectionLocations = [
            "Pharmacy",
            "Hospital",
            "University Lab",
            "Chemical Plant",
            "Research Facility"
        ];
    }

    useDrug(drugType) {
        const drug = this.drugDatabase[drugType];
        const playerDrug = game.player.drugs[drugType];
        
        if (!drug || !playerDrug) {
            game.showNotification('Invalid drug type!', 'error');
            return;
        }

        if (playerDrug.quantity <= 0) {
            game.showNotification(`You don't have any ${drug.name}!`, 'error');
            return;
        }

        // Check for overdose
        if (this.checkOverdose(drugType)) {
            game.showNotification(`Overdose! You took too much ${drug.name}!`, 'error');
            this.handleOverdose(drugType);
            return;
        }

        // Use the drug
        playerDrug.quantity--;
        playerDrug.lastUsed = Date.now();
        
        // Apply effects
        this.applyDrugEffects(drugType, drug);
        
        // Increase addiction
        playerDrug.addiction += drug.addictionRate;
        game.player.addictionLevel += drug.addictionRate;
        
        // Add to active effects
        game.player.drugEffects.push({
            drug: drugType,
            effects: drug.effects,
            duration: drug.duration,
            startTime: Date.now()
        });

        game.showNotification(`Used ${drug.name}! Effects: ${this.getEffectDescription(drug.effects)}`, 'success');
        this.updateDrugDisplay();
        game.updateDisplay();
    }

    applyDrugEffects(drugType, drug) {
        const effects = drug.effects;
        
        // Apply energy effects
        if (effects.energy) {
            game.player.energy = Math.min(game.player.maxEnergy + effects.energy, game.player.maxEnergy + 250);
        }
        
        // Apply happiness effects
        if (effects.happiness) {
            if (typeof effects.happiness === 'number') {
                game.player.happiness = (game.player.happiness || 50) + effects.happiness;
            } else if (typeof effects.happiness === 'object') {
                game.player.happiness = (game.player.happiness || 50) * effects.happiness;
            }
        }
        
        // Apply stat multipliers
        if (effects.strength) {
            game.player.tempStats = game.player.tempStats || {};
            game.player.tempStats.strength = (game.player.tempStats.strength || 1) * effects.strength;
        }
        
        if (effects.defense) {
            game.player.tempStats = game.player.tempStats || {};
            game.player.tempStats.defense = (game.player.tempStats.defense || 1) * effects.defense;
        }
        
        if (effects.speed) {
            game.player.tempStats = game.player.tempStats || {};
            game.player.tempStats.speed = (game.player.tempStats.speed || 1) * effects.speed;
        }
    }

    checkOverdose(drugType) {
        const playerDrug = game.player.drugs[drugType];
        const timeSinceLastUse = Date.now() - playerDrug.lastUsed;
        
        // Overdose if used within 5 minutes of last use
        return timeSinceLastUse < 300000 && playerDrug.addiction > 0.5;
    }

    handleOverdose(drugType) {
        const damage = Math.floor(Math.random() * 30) + 20;
        game.player.life = Math.max(0, game.player.life - damage);
        
        // Remove some of the drug
        game.player.drugs[drugType].quantity = Math.max(0, game.player.drugs[drugType].quantity - 2);
        
        game.showNotification(`Overdose! Lost ${damage} life and 2 ${this.drugDatabase[drugType].name}!`, 'error');
        
        if (game.player.life <= 0) {
            this.sendToHospital();
        }
    }

    sendToHospital() {
        game.showNotification('You have overdosed and been sent to the hospital!', 'error');
        game.player.life = 50;
        game.player.energy = 0;
        
        if (!game.player.cooldowns) game.player.cooldowns = {};
        game.player.cooldowns.hospital = Date.now() + (60 * 60 * 1000); // 1 hour
    }

    getEffectDescription(effects) {
        const descriptions = [];
        
        if (effects.energy) descriptions.push(`+${effects.energy} Energy`);
        if (effects.happiness) descriptions.push(`${typeof effects.happiness === 'number' ? '+' : 'x'}${effects.happiness} Happiness`);
        if (effects.strength) descriptions.push(`x${effects.strength} Strength`);
        if (effects.defense) descriptions.push(`x${effects.defense} Defense`);
        if (effects.speed) descriptions.push(`x${effects.speed} Speed`);
        
        return descriptions.join(', ');
    }

    collectDrug(drugType, location) {
        const drug = this.drugDatabase[drugType];
        if (!drug) return;

        // Calculate success rate based on location and player stats
        const successRate = this.calculateCollectionSuccess(location);
        const isSuccess = Math.random() < successRate;
        
        if (isSuccess) {
            const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 drugs
            game.player.drugs[drugType].quantity += quantity;
            
            game.showNotification(`Successfully collected ${quantity} ${drug.name} from ${location}!`, 'success');
        } else {
            // Risk of getting caught
            if (Math.random() < 0.3) {
                game.showNotification(`Caught collecting drugs! You've been arrested!`, 'error');
                this.sendToJail();
            } else {
                game.showNotification(`Failed to collect drugs from ${location}.`, 'error');
            }
        }
        
        this.updateDrugDisplay();
        game.updateDisplay();
    }

    calculateCollectionSuccess(location) {
        let baseRate = 0.6; // 60% base success rate
        
        // Location modifiers
        const locationModifiers = {
            "Pharmacy": 0.8,
            "Hospital": 0.7,
            "University Lab": 0.6,
            "Chemical Plant": 0.5,
            "Research Facility": 0.4
        };
        
        baseRate *= (locationModifiers[location] || 0.6);
        
        // Player stat modifiers
        const stealthBonus = (game.player.stats.dexterity || 0) / 1000;
        const intelligenceBonus = (game.player.stats.intelligence || 0) / 1000;
        
        return Math.min(0.95, baseRate + stealthBonus + intelligenceBonus);
    }

    dealDrug(drugType, location) {
        const drug = this.drugDatabase[drugType];
        const playerDrug = game.player.drugs[drugType];
        
        if (!drug || !playerDrug || playerDrug.quantity <= 0) {
            game.showNotification(`You don't have any ${drug.name} to sell!`, 'error');
            return;
        }

        // Calculate dealing success
        const successRate = this.calculateDealingSuccess(location);
        const isSuccess = Math.random() < successRate;
        
        if (isSuccess) {
            const quantity = Math.min(playerDrug.quantity, Math.floor(Math.random() * 5) + 1);
            const price = drug.price * (0.8 + Math.random() * 0.4); // 80-120% of base price
            const totalEarnings = Math.floor(price * quantity);
            
            playerDrug.quantity -= quantity;
            game.player.money += totalEarnings;
            
            game.showNotification(`Sold ${quantity} ${drug.name} for $${totalEarnings}!`, 'success');
        } else {
            // Risk of getting caught dealing
            if (Math.random() < 0.4) {
                game.showNotification(`Caught dealing drugs! You've been arrested!`, 'error');
                this.sendToJail();
            } else {
                game.showNotification(`Failed to sell drugs at ${location}.`, 'error');
            }
        }
        
        this.updateDrugDisplay();
        game.updateDisplay();
    }

    calculateDealingSuccess(location) {
        let baseRate = 0.7; // 70% base success rate
        
        // Location modifiers
        const locationModifiers = {
            "Downtown Alley": 0.8,
            "Warehouse District": 0.7,
            "Abandoned Building": 0.6,
            "Park at Night": 0.5,
            "Under the Bridge": 0.4
        };
        
        baseRate *= (locationModifiers[location] || 0.7);
        
        // Player stat modifiers
        const charismaBonus = (game.player.stats.charisma || 0) / 1000;
        const streetSmartsBonus = (game.player.stats.intelligence || 0) / 1000;
        
        return Math.min(0.95, baseRate + charismaBonus + streetSmartsBonus);
    }

    sendToJail() {
        game.showNotification('You have been arrested for drug-related activities!', 'error');
        
        if (!game.player.cooldowns) game.player.cooldowns = {};
        game.player.cooldowns.jail = Date.now() + (2 * 60 * 60 * 1000); // 2 hours in jail
        
        // Confiscate some drugs
        Object.keys(game.player.drugs).forEach(drugType => {
            const drug = game.player.drugs[drugType];
            if (drug.quantity > 0) {
                const confiscated = Math.floor(drug.quantity * 0.3); // 30% confiscated
                drug.quantity = Math.max(0, drug.quantity - confiscated);
            }
        });
    }

    updateDrugDisplay() {
        // This would update the drug inventory display
        // Implementation depends on where you want to show the drugs
    }

    processDrugEffects() {
        const now = Date.now();
        game.player.drugEffects = game.player.drugEffects.filter(effect => {
            const timeLeft = effect.duration - (now - effect.startTime);
            return timeLeft > 0;
        });
        
        // Process withdrawal effects
        this.processWithdrawalEffects();
    }

    processWithdrawalEffects() {
        Object.keys(game.player.drugs).forEach(drugType => {
            const playerDrug = game.player.drugs[drugType];
            const drug = this.drugDatabase[drugType];
            
            if (playerDrug.addiction > 0.5) {
                // Apply withdrawal effects
                const withdrawal = drug.withdrawalEffects;
                
                if (withdrawal.energy) {
                    game.player.energy = Math.max(0, game.player.energy + withdrawal.energy);
                }
                
                if (withdrawal.happiness) {
                    game.player.happiness = Math.max(0, (game.player.happiness || 50) + withdrawal.happiness);
                }
                
                // Reduce addiction over time
                playerDrug.addiction = Math.max(0, playerDrug.addiction - 0.01);
            }
        });
    }

    populateCollectionModal() {
        const locationsContainer = document.getElementById('collectionLocations');
        const drugsContainer = document.getElementById('drugCollectionOptions');
        
        // Populate locations
        locationsContainer.innerHTML = this.collectionLocations.map(location => `
            <div class="location-item" onclick="selectCollectionLocation('${location}')">
                <h5>${location}</h5>
                <p>Success Rate: ${Math.floor(this.calculateCollectionSuccess(location) * 100)}%</p>
            </div>
        `).join('');
        
        // Populate drug options
        drugsContainer.innerHTML = Object.keys(this.drugDatabase).map(drugType => {
            const drug = this.drugDatabase[drugType];
            return `
                <div class="drug-option" onclick="selectCollectionDrug('${drugType}')">
                    <h5>${drug.name}</h5>
                    <p>${drug.description}</p>
                    <p>Price: $${drug.price}</p>
                </div>
            `;
        }).join('');
    }

    populateDealingModal() {
        const locationsContainer = document.getElementById('dealingLocations');
        const drugsContainer = document.getElementById('drugDealingOptions');
        
        // Populate locations
        locationsContainer.innerHTML = this.dealingLocations.map(location => `
            <div class="location-item" onclick="selectDealingLocation('${location}')">
                <h5>${location}</h5>
                <p>Success Rate: ${Math.floor(this.calculateDealingSuccess(location) * 100)}%</p>
            </div>
        `).join('');
        
        // Populate drug options (only drugs you have)
        const availableDrugs = Object.keys(game.player.drugs).filter(drugType => 
            game.player.drugs[drugType].quantity > 0
        );
        
        if (availableDrugs.length === 0) {
            drugsContainer.innerHTML = '<p>You have no drugs to sell!</p>';
            return;
        }
        
        drugsContainer.innerHTML = availableDrugs.map(drugType => {
            const drug = this.drugDatabase[drugType];
            const playerDrug = game.player.drugs[drugType];
            return `
                <div class="drug-option" onclick="selectDealingDrug('${drugType}')">
                    <h5>${drug.name}</h5>
                    <p>Quantity: ${playerDrug.quantity}</p>
                    <p>Price: $${drug.price}</p>
                </div>
            `;
        }).join('');
    }

    populateFactionInventory() {
        // Populate faction inventory tabs
        this.populateFactionDrugs();
        this.populateFactionWeapons();
        this.populateFactionArmor();
        this.populateFactionMisc();
        this.populateFactionPermissions();
    }

    populateFactionDrugs() {
        const container = document.getElementById('factionDrugsGrid');
        const factionDrugs = game.player.factionInventory.drugs;
        
        if (Object.keys(factionDrugs).length === 0) {
            container.innerHTML = '<p>No drugs in faction inventory</p>';
            return;
        }
        
        container.innerHTML = Object.keys(factionDrugs).map(drugType => {
            const drug = this.drugDatabase[drugType];
            const quantity = factionDrugs[drugType];
            return `
                <div class="faction-item">
                    <h5>${drug.name}</h5>
                    <p>Quantity: ${quantity}</p>
                    <p>Price: $${drug.price}</p>
                    <button class="game-btn" onclick="withdrawFromFaction('${drugType}', 'drugs', 1)">Withdraw</button>
                </div>
            `;
        }).join('');
    }

    populateFactionWeapons() {
        const container = document.getElementById('factionWeaponsGrid');
        container.innerHTML = '<p>No weapons in faction inventory</p>';
    }

    populateFactionArmor() {
        const container = document.getElementById('factionArmorGrid');
        container.innerHTML = '<p>No armor in faction inventory</p>';
    }

    populateFactionMisc() {
        const container = document.getElementById('factionMiscGrid');
        container.innerHTML = '<p>No miscellaneous items in faction inventory</p>';
    }

    populateFactionPermissions() {
        const container = document.getElementById('factionPermissions');
        const permissions = game.player.factionPermissions;
        
        container.innerHTML = `
            <div class="permission-item ${permissions.canAccessInventory ? 'allowed' : 'denied'}">
                <i class="fas fa-${permissions.canAccessInventory ? 'check' : 'times'}"></i>
                <span>Access Faction Inventory</span>
            </div>
            <div class="permission-item ${permissions.canWithdrawDrugs ? 'allowed' : 'denied'}">
                <i class="fas fa-${permissions.canWithdrawDrugs ? 'check' : 'times'}"></i>
                <span>Withdraw Drugs</span>
            </div>
            <div class="permission-item ${permissions.canWithdrawWeapons ? 'allowed' : 'denied'}">
                <i class="fas fa-${permissions.canWithdrawWeapons ? 'check' : 'times'}"></i>
                <span>Withdraw Weapons</span>
            </div>
            <div class="permission-item ${permissions.canWithdrawArmor ? 'allowed' : 'denied'}">
                <i class="fas fa-${permissions.canWithdrawArmor ? 'check' : 'times'}"></i>
                <span>Withdraw Armor</span>
            </div>
            <div class="permission-item ${permissions.canWithdrawMisc ? 'allowed' : 'denied'}">
                <i class="fas fa-${permissions.canWithdrawMisc ? 'check' : 'times'}"></i>
                <span>Withdraw Miscellaneous</span>
            </div>
        `;
    }

    updateDrugDisplay() {
        const container = document.getElementById('drugGrid');
        if (!container) return;
        
        container.innerHTML = Object.keys(game.player.drugs).map(drugType => {
            const drug = this.drugDatabase[drugType];
            const playerDrug = game.player.drugs[drugType];
            
            if (playerDrug.quantity === 0) return '';
            
            return `
                <div class="drug-item">
                    <h4>${drug.name}</h4>
                    <p>${drug.description}</p>
                    <div class="drug-quantity">Quantity: ${playerDrug.quantity}</div>
                    <div class="drug-addiction">Addiction: ${Math.floor(playerDrug.addiction * 100)}%</div>
                    <button class="game-btn" onclick="useDrug('${drugType}')">Use</button>
                </div>
            `;
        }).join('');
    }

    updateEffectsDisplay() {
        const container = document.getElementById('effectsList');
        if (!container) return;
        
        if (game.player.drugEffects.length === 0) {
            container.innerHTML = '<p>No active drug effects</p>';
            return;
        }
        
        container.innerHTML = game.player.drugEffects.map(effect => {
            const drug = this.drugDatabase[effect.drug];
            const timeLeft = Math.ceil((effect.duration - (Date.now() - effect.startTime)) / 60000);
            
            return `
                <div class="effect-item">
                    <span class="effect-name">${drug.name}</span>
                    <span class="effect-duration">${timeLeft} minutes left</span>
                </div>
            `;
        }).join('');
    }
}

// Global drug system functions
function selectCollectionLocation(location) {
    window.selectedCollectionLocation = location;
    game.showNotification(`Selected location: ${location}`, 'info');
}

function selectCollectionDrug(drugType) {
    if (!window.selectedCollectionLocation) {
        game.showNotification('Please select a location first!', 'error');
        return;
    }
    
    collectDrug(drugType, window.selectedCollectionLocation);
    closeDrugCollection();
}

function selectDealingLocation(location) {
    window.selectedDealingLocation = location;
    game.showNotification(`Selected location: ${location}`, 'info');
}

function selectDealingDrug(drugType) {
    if (!window.selectedDealingLocation) {
        game.showNotification('Please select a location first!', 'error');
        return;
    }
    
    dealDrug(drugType, window.selectedDealingLocation);
    closeDrugDealing();
}

// Housing System
class HousingSystem {
    constructor() {
        this.properties = this.generateProperties();
        this.currentCategory = 'all';
        this.currentLocation = 'all';
        this.maxPrice = 50000000;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updatePropertyDisplay();
    }

    setupEventListeners() {
        // Housing category buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('housing-category-btn')) {
                document.querySelectorAll('.housing-category-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.updatePropertyDisplay();
            }
        });

        // Location filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('location-filter-btn')) {
                document.querySelectorAll('.location-filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.currentLocation = e.target.dataset.location;
                this.updatePropertyDisplay();
            }
        });

        // Price range filter
        const priceRange = document.getElementById('priceRange');
        if (priceRange) {
            priceRange.addEventListener('input', (e) => {
                this.maxPrice = parseInt(e.target.value);
                document.getElementById('priceValue').textContent = this.formatNumber(0);
                document.getElementById('maxPriceValue').textContent = this.formatNumber(this.maxPrice);
                this.updatePropertyDisplay();
            });
        }
    }

    generateProperties() {
        const properties = [];
        
        // City Center Properties (Premium Location)
        properties.push(
            {
                id: 'cc-penthouse-1',
                name: 'City Center Penthouse',
                type: 'luxury',
                location: 'city-center',
                price: 25000000,
                size: '3,500 sq ft',
                bedrooms: 4,
                bathrooms: 3,
                features: ['City Views', 'Rooftop Access', 'Concierge', 'Gym', 'Pool'],
                income: 50000,
                maintenance: 5000,
                status: 'available'
            },
            {
                id: 'cc-apartment-1',
                name: 'Downtown Studio',
                type: 'apartment',
                location: 'city-center',
                price: 850000,
                size: '650 sq ft',
                bedrooms: 1,
                bathrooms: 1,
                features: ['Modern Kitchen', 'City Views', 'Gym Access'],
                income: 2500,
                maintenance: 800,
                status: 'available'
            },
            {
                id: 'cc-office-1',
                name: 'Financial District Office',
                type: 'commercial',
                location: 'city-center',
                price: 15000000,
                size: '2,000 sq ft',
                bedrooms: 0,
                bathrooms: 2,
                features: ['Prime Location', 'Parking', 'Security', 'Meeting Rooms'],
                income: 75000,
                maintenance: 12000,
                status: 'available'
            }
        );

        // East Side Properties (Mixed Area)
        properties.push(
            {
                id: 'es-house-1',
                name: 'East Side Family Home',
                type: 'house',
                location: 'east-side',
                price: 1200000,
                size: '2,200 sq ft',
                bedrooms: 3,
                bathrooms: 2,
                features: ['Garden', 'Garage', 'Fireplace', 'Updated Kitchen'],
                income: 3500,
                maintenance: 1200,
                status: 'available'
            },
            {
                id: 'es-apartment-1',
                name: 'East Side Apartment',
                type: 'apartment',
                location: 'east-side',
                price: 450000,
                size: '900 sq ft',
                bedrooms: 2,
                bathrooms: 1,
                features: ['Balcony', 'Parking', 'Laundry'],
                income: 1800,
                maintenance: 600,
                status: 'available'
            }
        );

        // North Side Properties (Upscale Area)
        properties.push(
            {
                id: 'ns-mansion-1',
                name: 'North Side Mansion',
                type: 'mansion',
                location: 'north-side',
                price: 8500000,
                size: '6,500 sq ft',
                bedrooms: 6,
                bathrooms: 5,
                features: ['Pool', 'Tennis Court', 'Wine Cellar', 'Library', 'Guest House'],
                income: 25000,
                maintenance: 4000,
                status: 'available'
            },
            {
                id: 'ns-house-1',
                name: 'North Side Villa',
                type: 'house',
                location: 'north-side',
                price: 3200000,
                size: '3,800 sq ft',
                bedrooms: 4,
                bathrooms: 3,
                features: ['Pool', 'Garden', 'Garage', 'Fireplace'],
                income: 8500,
                maintenance: 2000,
                status: 'available'
            }
        );

        // West Side Properties (Professional Area)
        properties.push(
            {
                id: 'ws-apartment-1',
                name: 'West Side Loft',
                type: 'apartment',
                location: 'west-side',
                price: 750000,
                size: '1,200 sq ft',
                bedrooms: 2,
                bathrooms: 2,
                features: ['High Ceilings', 'Exposed Brick', 'Modern Design'],
                income: 2800,
                maintenance: 900,
                status: 'available'
            },
            {
                id: 'ws-house-1',
                name: 'West Side Townhouse',
                type: 'house',
                location: 'west-side',
                price: 1800000,
                size: '2,800 sq ft',
                bedrooms: 3,
                bathrooms: 3,
                features: ['Rooftop Deck', 'Garage', 'Modern Kitchen'],
                income: 4500,
                maintenance: 1500,
                status: 'available'
            }
        );

        // Residential District Properties
        properties.push(
            {
                id: 'res-mansion-1',
                name: 'Estate Mansion',
                type: 'mansion',
                location: 'residential',
                price: 15000000,
                size: '8,500 sq ft',
                bedrooms: 8,
                bathrooms: 7,
                features: ['Pool House', 'Tennis Court', 'Golf Course', 'Helipad', 'Wine Cellar'],
                income: 40000,
                maintenance: 6000,
                status: 'available'
            },
            {
                id: 'res-house-1',
                name: 'Suburban Family Home',
                type: 'house',
                location: 'residential',
                price: 950000,
                size: '2,500 sq ft',
                bedrooms: 4,
                bathrooms: 2,
                features: ['Large Yard', 'Garage', 'Fireplace', 'Updated Kitchen'],
                income: 2800,
                maintenance: 1000,
                status: 'available'
            }
        );

        // Metro Cities Properties (Ultra Premium)
        properties.push(
            {
                id: 'mc-penthouse-1',
                name: 'Metro City Sky Villa',
                type: 'luxury',
                location: 'metro-cities',
                price: 45000000,
                size: '5,500 sq ft',
                bedrooms: 5,
                bathrooms: 4,
                features: ['360° Views', 'Private Elevator', 'Rooftop Garden', 'Home Theater', 'Wine Cellar'],
                income: 90000,
                maintenance: 8000,
                status: 'available'
            },
            {
                id: 'mc-apartment-1',
                name: 'Metro City Apartment',
                type: 'apartment',
                location: 'metro-cities',
                price: 2500000,
                size: '1,500 sq ft',
                bedrooms: 2,
                bathrooms: 2,
                features: ['City Views', 'Modern Design', 'Gym Access', 'Concierge'],
                income: 6500,
                maintenance: 2000,
                status: 'available'
            },
            {
                id: 'mc-office-1',
                name: 'Metro City Office Tower',
                type: 'commercial',
                location: 'metro-cities',
                price: 35000000,
                size: '4,000 sq ft',
                bedrooms: 0,
                bathrooms: 3,
                features: ['Prime Location', 'Parking', 'Security', 'Conference Rooms', 'City Views'],
                income: 150000,
                maintenance: 20000,
                status: 'available'
            }
        );

        // Red Light District Properties (Affordable)
        properties.push(
            {
                id: 'rld-apartment-1',
                name: 'Red Light Studio',
                type: 'apartment',
                location: 'red-light',
                price: 180000,
                size: '400 sq ft',
                bedrooms: 1,
                bathrooms: 1,
                features: ['Basic Amenities', 'Street Access'],
                income: 800,
                maintenance: 300,
                status: 'available'
            },
            {
                id: 'rld-house-1',
                name: 'Red Light Row House',
                type: 'house',
                location: 'red-light',
                price: 320000,
                size: '1,200 sq ft',
                bedrooms: 2,
                bathrooms: 1,
                features: ['Basic Kitchen', 'Small Yard'],
                income: 1200,
                maintenance: 500,
                status: 'available'
            }
        );

        // Financial District Properties
        properties.push(
            {
                id: 'fin-apartment-1',
                name: 'Financial District Apartment',
                type: 'apartment',
                location: 'financial',
                price: 1200000,
                size: '1,100 sq ft',
                bedrooms: 2,
                bathrooms: 2,
                features: ['Modern Design', 'Gym Access', 'Concierge'],
                income: 3500,
                maintenance: 1200,
                status: 'available'
            }
        );

        return properties;
    }

    updatePropertyDisplay() {
        const propertyList = document.getElementById('propertyList');
        if (!propertyList) return;

        const filteredProperties = this.getFilteredProperties();
        
        if (filteredProperties.length === 0) {
            propertyList.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #cccccc;">
                    <i class="fas fa-home" style="font-size: 3rem; margin-bottom: 1rem; color: #ff6b35;"></i>
                    <h3>No Properties Found</h3>
                    <p>Try adjusting your filters to see more properties.</p>
                </div>
            `;
            return;
        }

        propertyList.innerHTML = filteredProperties.map(property => this.createPropertyCard(property)).join('');
    }

    getFilteredProperties() {
        return this.properties.filter(property => {
            // Category filter
            if (this.currentCategory !== 'all' && property.type !== this.currentCategory) {
                return false;
            }

            // Location filter
            if (this.currentLocation !== 'all' && property.location !== this.currentLocation) {
                return false;
            }

            // Price filter
            if (property.price > this.maxPrice) {
                return false;
            }

            return true;
        });
    }

    createPropertyCard(property) {
        const statusClass = property.status === 'available' ? 'available' : 'sold';
        const typeClass = property.type;
        
        return `
            <div class="property-card ${typeClass}">
                <div class="property-status ${statusClass}">${property.status.toUpperCase()}</div>
                
                <div class="property-header">
                    <div>
                        <div class="property-title">${property.name}</div>
                        <div class="property-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${this.getLocationName(property.location)}
                        </div>
                    </div>
                    <div class="property-price">$${this.formatNumber(property.price)}</div>
                </div>

                <div class="property-details">
                    <div class="property-detail">
                        <div class="property-detail-label">Size</div>
                        <div class="property-detail-value">${property.size}</div>
                    </div>
                    <div class="property-detail">
                        <div class="property-detail-label">Bedrooms</div>
                        <div class="property-detail-value">${property.bedrooms}</div>
                    </div>
                    <div class="property-detail">
                        <div class="property-detail-label">Bathrooms</div>
                        <div class="property-detail-value">${property.bathrooms}</div>
                    </div>
                    <div class="property-detail">
                        <div class="property-detail-label">Monthly Income</div>
                        <div class="property-detail-value">$${this.formatNumber(property.income)}</div>
                    </div>
                </div>

                <div class="property-features">
                    <h4>Features</h4>
                    <div class="feature-list">
                        ${property.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                    </div>
                </div>

                <div class="property-actions">
                    <button class="property-btn primary" onclick="buyProperty('${property.id}')">
                        <i class="fas fa-shopping-cart"></i>
                        Buy Property
                    </button>
                    <button class="property-btn secondary" onclick="viewPropertyDetails('${property.id}')">
                        <i class="fas fa-info-circle"></i>
                        Details
                    </button>
                </div>
            </div>
        `;
    }

    getLocationName(location) {
        const locationNames = {
            'city-center': 'City Center',
            'east-side': 'East Side',
            'north-side': 'North Side',
            'west-side': 'West Side',
            'residential': 'Residential District',
            'red-light': 'Red Light District',
            'financial': 'Financial District',
            'metro-cities': 'Metro Cities'
        };
        return locationNames[location] || location;
    }

    formatNumber(num) {
        return num.toLocaleString();
    }

    buyProperty(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) return;

        if (property.status !== 'available') {
            game.showNotification('This property is no longer available!', 'error');
            return;
        }

        if (game.player.money < property.price) {
            game.showNotification(`You need $${this.formatNumber(property.price - game.player.money)} more to buy this property!`, 'error');
            return;
        }

        // Confirm purchase
        if (confirm(`Are you sure you want to buy ${property.name} for $${this.formatNumber(property.price)}?`)) {
            // Deduct money
            game.player.money -= property.price;
            
            // Add to player properties
            if (!game.player.properties) {
                game.player.properties = [];
            }
            game.player.properties.push({
                id: property.id,
                name: property.name,
                type: property.type,
                location: property.location,
                price: property.price,
                income: property.income,
                maintenance: property.maintenance,
                purchased: Date.now()
            });

            // Mark property as sold
            property.status = 'sold';

            // Update display
            this.updatePropertyDisplay();
            game.updateDisplay();

            game.showNotification(`Congratulations! You now own ${property.name}!`, 'success');
        }
    }

    viewPropertyDetails(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) return;

        const details = `
            <div style="text-align: left;">
                <h3 style="color: #ff6b35; margin-bottom: 1rem;">${property.name}</h3>
                <p><strong>Location:</strong> ${this.getLocationName(property.location)}</p>
                <p><strong>Type:</strong> ${property.type.charAt(0).toUpperCase() + property.type.slice(1)}</p>
                <p><strong>Size:</strong> ${property.size}</p>
                <p><strong>Bedrooms:</strong> ${property.bedrooms}</p>
                <p><strong>Bathrooms:</strong> ${property.bathrooms}</p>
                <p><strong>Monthly Income:</strong> $${this.formatNumber(property.income)}</p>
                <p><strong>Monthly Maintenance:</strong> $${this.formatNumber(property.maintenance)}</p>
                <p><strong>Net Monthly Income:</strong> $${this.formatNumber(property.income - property.maintenance)}</p>
                <p><strong>Features:</strong> ${property.features.join(', ')}</p>
            </div>
        `;

        game.showModal('Property Details', details, [
            {
                text: 'Close',
                class: 'secondary',
                onclick: 'closeModal()'
            },
            {
                text: 'Buy Property',
                class: 'primary',
                onclick: `buyProperty('${property.id}'); closeModal();`
            }
        ]);
    }
}

// Newspaper System
class NewspaperSystem {
    constructor() {
        this.articles = [];
        this.currentCategory = 'headlines';
        this.circulation = 50000;
        this.reputation = 85;
        this.init();
    }

    init() {
        this.generateArticles();
        this.updateNewspaperDisplay();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Category tab buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-tab-btn')) {
                document.querySelectorAll('.category-tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.updateNewsList();
            }
        });

        // News item clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.news-item')) {
                const articleId = e.target.closest('.news-item').dataset.articleId;
                this.showArticleDetails(articleId);
            }
        });
    }

    generateArticles() {
        this.articles = [
            // Headlines
            {
                id: 'headline_1',
                title: 'City Crime Rate Drops 15% This Month',
                category: 'headlines',
                summary: 'Police report significant decrease in criminal activity across all districts.',
                content: 'The city has seen a remarkable 15% decrease in crime rates this month, according to the latest police statistics. Police Chief Martinez credits the improvement to increased patrols and community outreach programs. "We\'re seeing positive results from our new community policing initiatives," said Martinez. The decrease was most notable in the downtown and residential areas.',
                author: 'Sarah Johnson',
                date: new Date().toLocaleDateString(),
                priority: 'high'
            },
            {
                id: 'headline_2',
                title: 'New Business District Opens Downtown',
                category: 'headlines',
                summary: 'Major economic development project brings hundreds of jobs to the city.',
                content: 'The new downtown business district officially opened today, bringing over 500 new jobs to the city. The $50 million development includes office buildings, retail spaces, and a new convention center. Mayor Thompson praised the project as a "game-changer for our local economy." The district is expected to generate millions in tax revenue annually.',
                author: 'Mike Chen',
                date: new Date().toLocaleDateString(),
                priority: 'high'
            },

            // Crime
            {
                id: 'crime_1',
                title: 'Bank Robbery Suspects Arrested',
                category: 'crime',
                summary: 'Three suspects in custody after failed bank heist attempt.',
                content: 'Police have arrested three suspects in connection with yesterday\'s attempted bank robbery. The suspects were caught after a high-speed chase through the city. No injuries were reported, and all stolen money was recovered. The suspects face multiple charges including armed robbery and evading arrest.',
                author: 'Detective Williams',
                date: new Date().toLocaleDateString(),
                priority: 'medium'
            },

            // Business
            {
                id: 'business_1',
                title: 'Tech Startup Raises $10M in Funding',
                category: 'business',
                summary: 'Local technology company secures major investment for expansion.',
                content: 'TechCorp, a local software development company, has secured $10 million in Series A funding. The investment will be used to expand operations and hire 50 new employees. CEO Jennifer Lee said the funding will help the company compete on a national level. The company specializes in artificial intelligence applications.',
                author: 'Business Reporter',
                date: new Date().toLocaleDateString(),
                priority: 'medium'
            },

            // Sports
            {
                id: 'sports_1',
                title: 'City Football Team Wins Championship',
                category: 'sports',
                summary: 'Local team brings home the trophy after 20-year drought.',
                content: 'The City Lions have won their first championship in 20 years, defeating the rival team 28-21 in a thrilling overtime victory. Quarterback Marcus Johnson threw for 300 yards and three touchdowns. The victory parade is scheduled for this weekend. "This is a dream come true," said team captain David Rodriguez.',
                author: 'Sports Desk',
                date: new Date().toLocaleDateString(),
                priority: 'high'
            },

            // Politics
            {
                id: 'politics_1',
                title: 'City Council Approves New Budget',
                category: 'politics',
                summary: 'Increased funding for education and infrastructure projects.',
                content: 'The City Council has approved a $2 billion budget for the upcoming fiscal year, with significant increases in education and infrastructure spending. The budget includes $500 million for school improvements and $300 million for road repairs. Council members voted 7-2 in favor of the budget after hours of debate.',
                author: 'Political Correspondent',
                date: new Date().toLocaleDateString(),
                priority: 'medium'
            },

            // Entertainment
            {
                id: 'entertainment_1',
                title: 'New Concert Hall Opens with Star-Studded Gala',
                category: 'entertainment',
                summary: 'Celebrities and dignitaries attend grand opening of cultural center.',
                content: 'The new City Concert Hall opened its doors last night with a star-studded gala featuring performances by world-renowned artists. The $100 million facility boasts state-of-the-art acoustics and seating for 2,000 people. "This is a cultural milestone for our city," said Mayor Thompson. The hall will host classical, jazz, and contemporary music performances.',
                author: 'Arts Critic',
                date: new Date().toLocaleDateString(),
                priority: 'low'
            }
        ];
    }

    updateNewspaperDisplay() {
        const currentDate = document.getElementById('currentDate');
        const circulation = document.getElementById('circulation');
        const paperReputation = document.getElementById('paperReputation');

        if (currentDate) currentDate.textContent = `Today's Edition - ${new Date().toLocaleDateString()}`;
        if (circulation) circulation.textContent = this.circulation.toLocaleString();
        if (paperReputation) paperReputation.textContent = `${this.reputation}%`;

        this.updateNewsList();
    }

    updateNewsList() {
        const newsList = document.getElementById('newsList');
        if (!newsList) return;

        let filteredArticles = this.articles;
        if (this.currentCategory !== 'headlines') {
            filteredArticles = this.articles.filter(article => article.category === this.currentCategory);
        }

        newsList.innerHTML = filteredArticles.map(article => `
            <div class="news-item" data-article-id="${article.id}">
                <h4>${article.title}</h4>
                <div class="news-meta">
                    <span class="news-category">${article.category}</span>
                    <span class="news-date">${article.date}</span>
                    <span class="news-author">${article.author}</span>
                </div>
                <p class="news-summary">${article.summary}</p>
                <div class="news-actions">
                    <button class="news-btn" onclick="viewArticleDetails('${article.id}')">
                        <i class="fas fa-newspaper"></i> Read More
                    </button>
                </div>
            </div>
        `).join('');
    }

    showArticleDetails(articleId) {
        const article = this.articles.find(a => a.id === articleId);
        if (!article) return;

        const modal = document.getElementById('articleModal');
        const title = document.getElementById('articleTitle');
        const category = document.getElementById('articleCategory');
        const date = document.getElementById('articleDate');
        const author = document.getElementById('articleAuthor');
        const content = document.getElementById('articleContent');

        if (title) title.textContent = article.title;
        if (category) category.textContent = article.category;
        if (date) date.textContent = article.date;
        if (author) author.textContent = article.author;
        if (content) content.innerHTML = `<p>${article.content}</p>`;

        if (modal) modal.classList.add('active');
    }

    closeArticleModal() {
        const modal = document.getElementById('articleModal');
        if (modal) modal.classList.remove('active');
    }

    shareArticle() {
        game.showNotification('Article shared successfully!', 'success');
    }

    saveArticle() {
        game.showNotification('Article saved to your collection!', 'success');
    }
}

// Mission System
class MissionSystem {
    constructor() {
        this.activeMissions = [];
        this.completedMissions = [];
        this.availableMissions = [];
        this.currentCategory = 'all';
        this.missionStats = {
            total: 0,
            completed: 0,
            failed: 0,
            successRate: 0,
            totalRewards: 0,
            bestStreak: 0,
            currentStreak: 0,
            rank: 'Rookie'
        };
        this.init();
    }

    init() {
        this.generateAvailableMissions();
        this.updateMissionDisplay();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Category tab buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-tab-btn')) {
                document.querySelectorAll('.category-tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.updateMissionList();
            }
        });

        // Mission item clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mission-item')) {
                const missionId = e.target.closest('.mission-item').dataset.missionId;
                this.showMissionDetails(missionId);
            }
        });
    }

    generateAvailableMissions() {
        this.availableMissions = [
            // Combat Missions
            {
                id: 'combat_1',
                title: 'Street Fighter',
                description: 'Defeat 3 opponents in street fights to prove your combat skills.',
                category: 'combat',
                difficulty: 'Easy',
                reward: 500,
                timeLimit: 24,
                requirements: ['strength >= 50'],
                objectives: [
                    { type: 'battle', target: 3, current: 0, description: 'Win 3 battles' }
                ]
            },
            {
                id: 'combat_2',
                title: 'Arena Champion',
                description: 'Win 5 consecutive battles in the arena to become a champion.',
                category: 'combat',
                difficulty: 'Medium',
                reward: 1500,
                timeLimit: 48,
                requirements: ['strength >= 100', 'defense >= 80'],
                objectives: [
                    { type: 'battle_streak', target: 5, current: 0, description: 'Win 5 battles in a row' }
                ]
            },
            {
                id: 'combat_3',
                title: 'Ultimate Warrior',
                description: 'Defeat 10 opponents without losing a single battle.',
                category: 'combat',
                difficulty: 'Hard',
                reward: 5000,
                timeLimit: 72,
                requirements: ['strength >= 150', 'defense >= 120', 'speed >= 100'],
                objectives: [
                    { type: 'battle_perfect', target: 10, current: 0, description: 'Win 10 battles without losing' }
                ]
            },

            // Crime Missions
            {
                id: 'crime_1',
                title: 'Petty Thief',
                description: 'Successfully commit 5 petty crimes without getting caught.',
                category: 'crime',
                difficulty: 'Easy',
                reward: 300,
                timeLimit: 12,
                requirements: ['dexterity >= 30'],
                objectives: [
                    { type: 'crime_success', target: 5, current: 0, description: 'Successfully commit 5 crimes' }
                ]
            },
            {
                id: 'crime_2',
                title: 'Master Thief',
                description: 'Steal valuable items worth $10,000 in total value.',
                category: 'crime',
                difficulty: 'Medium',
                reward: 2000,
                timeLimit: 36,
                requirements: ['dexterity >= 80', 'stealth >= 60'],
                objectives: [
                    { type: 'steal_value', target: 10000, current: 0, description: 'Steal items worth $10,000' }
                ]
            },
            {
                id: 'crime_3',
                title: 'Criminal Mastermind',
                description: 'Plan and execute a major heist worth $50,000.',
                category: 'crime',
                difficulty: 'Hard',
                reward: 10000,
                timeLimit: 96,
                requirements: ['dexterity >= 120', 'intelligence >= 100', 'stealth >= 80'],
                objectives: [
                    { type: 'heist_value', target: 50000, current: 0, description: 'Execute heist worth $50,000' }
                ]
            },

            // Business Missions
            {
                id: 'business_1',
                title: 'Entrepreneur',
                description: 'Start a small business and earn $5,000 in profit.',
                category: 'business',
                difficulty: 'Easy',
                reward: 1000,
                timeLimit: 48,
                requirements: ['intelligence >= 50'],
                objectives: [
                    { type: 'business_profit', target: 5000, current: 0, description: 'Earn $5,000 in business profit' }
                ]
            },
            {
                id: 'business_2',
                title: 'Market Dominator',
                description: 'Control 3 different business sectors in the city.',
                category: 'business',
                difficulty: 'Medium',
                reward: 3000,
                timeLimit: 72,
                requirements: ['intelligence >= 100', 'money >= 50000'],
                objectives: [
                    { type: 'business_control', target: 3, current: 0, description: 'Control 3 business sectors' }
                ]
            },

            // Social Missions
            {
                id: 'social_1',
                title: 'Social Butterfly',
                description: 'Make 10 new friends and build your social network.',
                category: 'social',
                difficulty: 'Easy',
                reward: 400,
                timeLimit: 24,
                requirements: ['charisma >= 30'],
                objectives: [
                    { type: 'make_friends', target: 10, current: 0, description: 'Make 10 new friends' }
                ]
            },
            {
                id: 'social_2',
                title: 'Influencer',
                description: 'Gain 1000 reputation points through social activities.',
                category: 'social',
                difficulty: 'Medium',
                reward: 1500,
                timeLimit: 48,
                requirements: ['charisma >= 80', 'reputation >= 100'],
                objectives: [
                    { type: 'gain_reputation', target: 1000, current: 0, description: 'Gain 1000 reputation points' }
                ]
            },

            // Special Missions
            {
                id: 'special_1',
                title: 'City Savior',
                description: 'Help the city by completing 5 different community service tasks.',
                category: 'special',
                difficulty: 'Medium',
                reward: 2000,
                timeLimit: 60,
                requirements: ['reputation >= 50', 'respect >= 30'],
                objectives: [
                    { type: 'community_service', target: 5, current: 0, description: 'Complete 5 community service tasks' }
                ]
            },
            {
                id: 'special_2',
                title: 'Legendary Hero',
                description: 'Achieve legendary status by completing all major city objectives.',
                category: 'special',
                difficulty: 'Hard',
                reward: 25000,
                timeLimit: 168,
                requirements: ['level >= 50', 'reputation >= 500', 'respect >= 300'],
                objectives: [
                    { type: 'legendary_status', target: 1, current: 0, description: 'Achieve legendary status' }
                ]
            }
        ];
    }

    updateMissionDisplay() {
        const activeMissions = document.getElementById('activeMissions');
        const completedMissions = document.getElementById('completedMissions');
        const successRate = document.getElementById('successRate');
        const totalRewards = document.getElementById('totalRewards');
        const totalMissions = document.getElementById('totalMissions');
        const bestStreak = document.getElementById('bestStreak');
        const currentStreak = document.getElementById('currentStreak');
        const missionRank = document.getElementById('missionRank');

        if (activeMissions) activeMissions.textContent = this.activeMissions.length;
        if (completedMissions) completedMissions.textContent = this.missionStats.completed;
        if (successRate) successRate.textContent = `${this.missionStats.successRate}%`;
        if (totalRewards) totalRewards.textContent = `$${this.missionStats.totalRewards.toLocaleString()}`;
        if (totalMissions) totalMissions.textContent = this.missionStats.total;
        if (bestStreak) bestStreak.textContent = this.missionStats.bestStreak;
        if (currentStreak) currentStreak.textContent = this.missionStats.currentStreak;
        if (missionRank) missionRank.textContent = this.missionStats.rank;

        this.updateMissionList();
    }

    updateMissionList() {
        const missionList = document.getElementById('missionList');
        if (!missionList) return;

        let filteredMissions = this.availableMissions;
        if (this.currentCategory !== 'all') {
            filteredMissions = this.availableMissions.filter(mission => mission.category === this.currentCategory);
        }

        missionList.innerHTML = filteredMissions.map(mission => `
            <div class="mission-item" data-mission-id="${mission.id}">
                <h4>${mission.title}</h4>
                <p>${mission.description}</p>
                <div class="mission-meta">
                    <span class="mission-difficulty">${mission.difficulty}</span>
                    <span class="mission-reward">$${mission.reward.toLocaleString()}</span>
                    <span class="mission-category">${mission.category}</span>
                </div>
                <div class="mission-actions">
                    <button class="mission-btn" onclick="viewMissionDetails('${mission.id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    showMissionDetails(missionId) {
        const mission = this.availableMissions.find(m => m.id === missionId);
        if (!mission) return;

        const modal = document.getElementById('missionModal');
        const title = document.getElementById('missionTitle');
        const description = document.getElementById('missionDescription');
        const difficulty = document.getElementById('missionDifficulty');
        const reward = document.getElementById('missionReward');
        const timeLimit = document.getElementById('missionTimeLimit');
        const requirements = document.getElementById('missionRequirements');

        if (title) title.textContent = mission.title;
        if (description) description.textContent = mission.description;
        if (difficulty) difficulty.textContent = mission.difficulty;
        if (reward) reward.textContent = `$${mission.reward.toLocaleString()}`;
        if (timeLimit) timeLimit.textContent = mission.timeLimit ? `${mission.timeLimit} hours` : 'No limit';
        if (requirements) {
            requirements.innerHTML = mission.requirements.map(req => `<li>${req}</li>`).join('');
        }

        if (modal) modal.classList.add('active');
    }

    acceptMission(missionId) {
        const mission = this.availableMissions.find(m => m.id === missionId);
        if (!mission) return;

        // Check requirements
        if (!this.checkRequirements(mission.requirements)) {
            game.showNotification('You do not meet the mission requirements!', 'error');
            return;
        }

        // Add to active missions
        const activeMission = {
            ...mission,
            startTime: Date.now(),
            progress: mission.objectives.map(obj => ({ ...obj }))
        };
        this.activeMissions.push(activeMission);

        // Remove from available missions
        this.availableMissions = this.availableMissions.filter(m => m.id !== missionId);

        this.closeMissionModal();
        this.updateMissionDisplay();
        game.showNotification(`Mission "${mission.title}" accepted!`, 'success');
    }

    checkRequirements(requirements) {
        return requirements.every(req => {
            if (req.includes('strength >=')) {
                const value = parseInt(req.split('>=')[1]);
                return game.player.stats.strength >= value;
            }
            if (req.includes('defense >=')) {
                const value = parseInt(req.split('>=')[1]);
                return game.player.stats.defense >= value;
            }
            if (req.includes('speed >=')) {
                const value = parseInt(req.split('>=')[1]);
                return game.player.stats.speed >= value;
            }
            if (req.includes('dexterity >=')) {
                const value = parseInt(req.split('>=')[1]);
                return game.player.stats.dexterity >= value;
            }
            if (req.includes('intelligence >=')) {
                const value = parseInt(req.split('>=')[1]);
                return game.player.workingStats.intelligence >= value;
            }
            if (req.includes('money >=')) {
                const value = parseInt(req.split('>=')[1]);
                return game.player.money >= value;
            }
            if (req.includes('level >=')) {
                const value = parseInt(req.split('>=')[1]);
                return game.player.level >= value;
            }
            if (req.includes('reputation >=')) {
                const value = parseInt(req.split('>=')[1]);
                return game.player.reputation >= value;
            }
            if (req.includes('respect >=')) {
                const value = parseInt(req.split('>=')[1]);
                return game.player.respect >= value;
            }
            return true;
        });
    }

    closeMissionModal() {
        const modal = document.getElementById('missionModal');
        if (modal) modal.classList.remove('active');
    }

    completeMission(missionId) {
        const missionIndex = this.activeMissions.findIndex(m => m.id === missionId);
        if (missionIndex === -1) return;

        const mission = this.activeMissions[missionIndex];
        
        // Remove from active missions
        this.activeMissions.splice(missionIndex, 1);
        
        // Add to completed missions
        this.completedMissions.push(mission);
        
        // Update stats
        this.missionStats.completed++;
        this.missionStats.total++;
        this.missionStats.totalRewards += mission.reward;
        this.missionStats.currentStreak++;
        if (this.missionStats.currentStreak > this.missionStats.bestStreak) {
            this.missionStats.bestStreak = this.missionStats.currentStreak;
        }
        
        // Calculate success rate
        this.missionStats.successRate = Math.round((this.missionStats.completed / this.missionStats.total) * 100);
        
        // Update rank
        this.updateMissionRank();
        
        // Give rewards
        game.player.money += mission.reward;
        game.player.points += Math.floor(mission.reward / 10);
        
        this.updateMissionDisplay();
        game.updateDisplay();
        game.showNotification(`Mission "${mission.title}" completed! Earned $${mission.reward.toLocaleString()}`, 'success');
    }

    failMission(missionId) {
        const missionIndex = this.activeMissions.findIndex(m => m.id === missionId);
        if (missionIndex === -1) return;

        const mission = this.activeMissions[missionIndex];
        
        // Remove from active missions
        this.activeMissions.splice(missionIndex, 1);
        
        // Update stats
        this.missionStats.failed++;
        this.missionStats.total++;
        this.missionStats.currentStreak = 0;
        
        // Calculate success rate
        this.missionStats.successRate = Math.round((this.missionStats.completed / this.missionStats.total) * 100);
        
        this.updateMissionDisplay();
        game.showNotification(`Mission "${mission.title}" failed!`, 'error');
    }

    updateMissionRank() {
        const completed = this.missionStats.completed;
        if (completed >= 100) this.missionStats.rank = 'Legendary';
        else if (completed >= 50) this.missionStats.rank = 'Master';
        else if (completed >= 25) this.missionStats.rank = 'Expert';
        else if (completed >= 10) this.missionStats.rank = 'Professional';
        else if (completed >= 5) this.missionStats.rank = 'Experienced';
        else this.missionStats.rank = 'Rookie';
    }
}

// Jail System
class JailSystem {
    constructor() {
        this.prisonRecords = [];
        this.isInJail = false;
        this.jailTime = 0;
        this.bailAmount = 0;
        this.crime = '';
        this.timesArrested = 0;
        this.totalTimeServed = 0;
        this.escapeAttempts = 0;
        this.rehabPoints = 0;
        this.init();
    }

    init() {
        this.updateJailDisplay();
        this.updatePrisonRecords();
    }

    updateJailDisplay() {
        const jailStatus = document.getElementById('jailStatus');
        const jailTimeRemaining = document.getElementById('jailTimeRemaining');
        const bailAmount = document.getElementById('bailAmount');
        const jailCrime = document.getElementById('jailCrime');
        const timesArrested = document.getElementById('timesArrested');
        const totalTimeServed = document.getElementById('totalTimeServed');
        const escapeAttempts = document.getElementById('escapeAttempts');
        const rehabPoints = document.getElementById('rehabPoints');
        
        if (jailStatus) {
            jailStatus.textContent = this.isInJail ? 'In Prison' : 'Free';
        }
        
        if (jailTimeRemaining) {
            jailTimeRemaining.textContent = this.isInJail ? `${this.jailTime} hours` : '0 hours';
        }
        
        if (bailAmount) {
            bailAmount.textContent = `$${this.bailAmount.toLocaleString()}`;
        }
        
        if (jailCrime) {
            jailCrime.textContent = this.crime || 'None';
        }
        
        if (timesArrested) {
            timesArrested.textContent = this.timesArrested;
        }
        
        if (totalTimeServed) {
            totalTimeServed.textContent = `${this.totalTimeServed} hours`;
        }
        
        if (escapeAttempts) {
            escapeAttempts.textContent = this.escapeAttempts;
        }
        
        if (rehabPoints) {
            rehabPoints.textContent = this.rehabPoints;
        }
        
        // Update button states
        this.updateButtonStates();
    }

    updateButtonStates() {
        const payBailBtn = document.getElementById('payBailBtn');
        const waitReleaseBtn = document.getElementById('waitReleaseBtn');
        const escapeBtn = document.getElementById('escapeBtn');
        const libraryBtn = document.getElementById('libraryBtn');
        const exerciseBtn = document.getElementById('exerciseBtn');
        const counselingBtn = document.getElementById('counselingBtn');
        const workBtn = document.getElementById('workBtn');
        const socializeBtn = document.getElementById('socializeBtn');
        const meditationBtn = document.getElementById('meditationBtn');
        
        const canAffordBail = game.player.money >= this.bailAmount;
        
        if (payBailBtn) {
            payBailBtn.disabled = !this.isInJail || !canAffordBail;
        }
        
        if (waitReleaseBtn) {
            waitReleaseBtn.disabled = !this.isInJail;
        }
        
        if (escapeBtn) {
            escapeBtn.disabled = !this.isInJail;
        }
        
        const inJailButtons = [libraryBtn, exerciseBtn, counselingBtn, workBtn, socializeBtn, meditationBtn];
        inJailButtons.forEach(btn => {
            if (btn) {
                btn.disabled = !this.isInJail;
            }
        });
        
        // Update bail cost display
        const bailCost = document.getElementById('bailCost');
        if (bailCost) {
            bailCost.textContent = `$${this.bailAmount.toLocaleString()}`;
        }
        
        // Update wait time display
        const waitTime = document.getElementById('waitTime');
        if (waitTime) {
            waitTime.textContent = this.isInJail ? `${this.jailTime} hours` : '0 hours';
        }
    }

    updatePrisonRecords() {
        const recordsList = document.getElementById('prisonRecordsList');
        if (!recordsList) return;
        
        if (this.prisonRecords.length === 0) {
            recordsList.innerHTML = '<p style="color: #cccccc; text-align: center; padding: 2rem;">No prison records found</p>';
            return;
        }
        
        recordsList.innerHTML = this.prisonRecords.map(record => `
            <div class="record-item">
                <div class="record-info">
                    <div class="record-date">${record.date}</div>
                    <div class="record-type">${record.type}</div>
                </div>
                <div class="record-cost">${record.details}</div>
            </div>
        `).join('');
    }

    addPrisonRecord(type, details) {
        const record = {
            date: new Date().toLocaleDateString(),
            type: type,
            details: details
        };
        this.prisonRecords.push(record);
        this.updatePrisonRecords();
    }

    arrestPlayer(crime, sentenceHours, bailCost) {
        this.isInJail = true;
        this.jailTime = sentenceHours;
        this.bailAmount = bailCost;
        this.crime = crime;
        this.timesArrested++;
        
        this.addPrisonRecord('Arrest', `Arrested for ${crime}. Sentence: ${sentenceHours} hours, Bail: $${bailCost.toLocaleString()}`);
        this.updateJailDisplay();
        
        game.showNotification(`You have been arrested for ${crime}!`, 'error');
    }

    payBail() {
        if (!this.isInJail) {
            game.showNotification('You are not in jail!', 'warning');
            return;
        }
        
        if (game.player.money < this.bailAmount) {
            game.showNotification('Insufficient funds to pay bail!', 'error');
            return;
        }
        
        game.player.money -= this.bailAmount;
        this.releasePlayer();
        
        this.addPrisonRecord('Bail Paid', `Paid $${this.bailAmount.toLocaleString()} bail for early release`);
        game.showNotification('Bail paid! You have been released from prison.', 'success');
        game.updateDisplay();
    }

    waitForRelease() {
        if (!this.isInJail) {
            game.showNotification('You are not in jail!', 'warning');
            return;
        }
        
        // Reduce jail time by 1 hour
        this.jailTime = Math.max(0, this.jailTime - 1);
        this.totalTimeServed++;
        
        if (this.jailTime <= 0) {
            this.releasePlayer();
            game.showNotification('Your sentence is complete! You have been released.', 'success');
        } else {
            game.showNotification(`Time served. ${this.jailTime} hours remaining.`, 'info');
        }
        
        this.updateJailDisplay();
        game.updateDisplay();
    }

    attemptEscape() {
        if (!this.isInJail) {
            game.showNotification('You are not in jail!', 'warning');
            return;
        }
        
        this.escapeAttempts++;
        const escapeChance = Math.random();
        const successRate = 0.3; // 30% chance of success
        
        if (escapeChance < successRate) {
            this.releasePlayer();
            this.addPrisonRecord('Escape', 'Successfully escaped from prison');
            game.showNotification('Escape successful! You are now free.', 'success');
        } else {
            // Failed escape - add more time
            this.jailTime += 2;
            this.addPrisonRecord('Escape Attempt', 'Failed escape attempt. Sentence extended by 2 hours');
            game.showNotification('Escape failed! Your sentence has been extended by 2 hours.', 'error');
        }
        
        this.updateJailDisplay();
        game.updateDisplay();
    }

    libraryStudy() {
        if (!this.isInJail) {
            game.showNotification('You are not in jail!', 'warning');
            return;
        }
        
        if (game.player.energy < 10) {
            game.showNotification('Not enough energy to study!', 'error');
            return;
        }
        
        game.player.energy -= 10;
        this.rehabPoints += 5;
        
        this.addPrisonRecord('Library Study', 'Studied in prison library. Gained 5 rehabilitation points');
        game.showNotification('Library study completed. Rehabilitation points gained.', 'success');
        this.updateJailDisplay();
        game.updateDisplay();
    }

    prisonExercise() {
        if (!this.isInJail) {
            game.showNotification('You are not in jail!', 'warning');
            return;
        }
        
        if (game.player.energy < 5) {
            game.showNotification('Not enough energy to exercise!', 'error');
            return;
        }
        
        game.player.energy -= 5;
        this.rehabPoints += 3;
        game.player.stats.strength += 1;
        
        this.addPrisonRecord('Exercise', 'Worked out in prison gym. Gained 3 rehabilitation points');
        game.showNotification('Exercise completed. Strength and rehabilitation points gained.', 'success');
        this.updateJailDisplay();
        game.updateDisplay();
    }

    prisonCounseling() {
        if (!this.isInJail) {
            game.showNotification('You are not in jail!', 'warning');
            return;
        }
        
        if (game.player.energy < 15) {
            game.showNotification('Not enough energy for counseling!', 'error');
            return;
        }
        
        game.player.energy -= 15;
        this.rehabPoints += 10;
        
        this.addPrisonRecord('Counseling', 'Attended rehabilitation counseling. Gained 10 rehabilitation points');
        game.showNotification('Counseling session completed. Significant rehabilitation progress made.', 'success');
        this.updateJailDisplay();
        game.updateDisplay();
    }

    workProgram() {
        if (!this.isInJail) {
            game.showNotification('You are not in jail!', 'warning');
            return;
        }
        
        if (game.player.energy < 20) {
            game.showNotification('Not enough energy for work program!', 'error');
            return;
        }
        
        game.player.energy -= 20;
        this.rehabPoints += 2;
        
        const earnings = Math.floor(Math.random() * 50) + 10; // $10-60
        game.player.money += earnings;
        
        this.addPrisonRecord('Work Program', `Participated in work program. Earned $${earnings}`);
        game.showNotification(`Work program completed. Earned $${earnings} and 2 rehabilitation points.`, 'success');
        this.updateJailDisplay();
        game.updateDisplay();
    }

    prisonSocialize() {
        if (!this.isInJail) {
            game.showNotification('You are not in jail!', 'warning');
            return;
        }
        
        if (game.player.energy < 5) {
            game.showNotification('Not enough energy to socialize!', 'error');
            return;
        }
        
        game.player.energy -= 5;
        this.rehabPoints += 1;
        
        this.addPrisonRecord('Socialization', 'Interacted with other prisoners. Gained 1 rehabilitation point');
        game.showNotification('Socialization completed. Rehabilitation points gained.', 'success');
        this.updateJailDisplay();
        game.updateDisplay();
    }

    prisonMeditation() {
        if (!this.isInJail) {
            game.showNotification('You are not in jail!', 'warning');
            return;
        }
        
        if (game.player.energy < 3) {
            game.showNotification('Not enough energy to meditate!', 'error');
            return;
        }
        
        game.player.energy -= 3;
        this.rehabPoints += 2;
        game.player.health = Math.min(100, game.player.health + 5);
        
        this.addPrisonRecord('Meditation', 'Practiced meditation. Gained 2 rehabilitation points and improved health');
        game.showNotification('Meditation completed. Rehabilitation points gained and health improved.', 'success');
        this.updateJailDisplay();
        game.updateDisplay();
    }

    releasePlayer() {
        this.isInJail = false;
        this.jailTime = 0;
        this.bailAmount = 0;
        this.crime = '';
        this.updateJailDisplay();
    }

    // Called by crime system when player is arrested
    static arrestPlayer(crime, sentenceHours, bailCost) {
        if (window.jailSystem) {
            window.jailSystem.arrestPlayer(crime, sentenceHours, bailCost);
        }
    }
}

// Hospital System
class HospitalSystem {
    constructor() {
        this.medicalRecords = [];
        this.healthInsurance = false;
        this.insuranceExpiry = null;
        this.init();
    }

    init() {
        this.updateHealthDisplay();
        this.updateMedicalRecords();
    }

    updateHealthDisplay() {
        const health = game.player.health || 100;
        const injuries = game.player.injuries || 0;
        const maxHealth = 100;
        
        // Update health bar
        const healthBar = document.getElementById('healthBar');
        const healthText = document.getElementById('healthText');
        if (healthBar && healthText) {
            const healthPercent = (health / maxHealth) * 100;
            healthBar.style.width = `${healthPercent}%`;
            healthText.textContent = `${health}/${maxHealth}`;
        }
        
        // Update injury bar
        const injuryBar = document.getElementById('injuryBar');
        const injuryText = document.getElementById('injuryText');
        if (injuryBar && injuryText) {
            const injuryPercent = (injuries / maxHealth) * 100;
            injuryBar.style.width = `${injuryPercent}%`;
            injuryText.textContent = `${injuries}/${maxHealth}`;
        }
        
        // Update medical condition
        const condition = document.getElementById('medicalCondition');
        const treatmentTime = document.getElementById('treatmentTime');
        const medicalBills = document.getElementById('medicalBills');
        
        if (condition) {
            if (injuries > 80) condition.textContent = 'Critical';
            else if (injuries > 50) condition.textContent = 'Severe';
            else if (injuries > 20) condition.textContent = 'Moderate';
            else if (injuries > 0) condition.textContent = 'Minor';
            else condition.textContent = 'Healthy';
        }
        
        if (treatmentTime) {
            if (injuries > 50) treatmentTime.textContent = '6+ hours';
            else if (injuries > 20) treatmentTime.textContent = '2-4 hours';
            else if (injuries > 0) treatmentTime.textContent = '30-60 min';
            else treatmentTime.textContent = 'None';
        }
        
        if (medicalBills) {
            const bills = game.player.medicalBills || 0;
            medicalBills.textContent = `$${bills.toLocaleString()}`;
        }
    }

    updateMedicalRecords() {
        const recordsList = document.getElementById('medicalRecordsList');
        if (!recordsList) return;
        
        if (this.medicalRecords.length === 0) {
            recordsList.innerHTML = '<p style="color: #cccccc; text-align: center; padding: 2rem;">No medical records found</p>';
            return;
        }
        
        recordsList.innerHTML = this.medicalRecords.map(record => `
            <div class="record-item">
                <div class="record-info">
                    <div class="record-date">${record.date}</div>
                    <div class="record-type">${record.type}</div>
                </div>
                <div class="record-cost">$${record.cost.toLocaleString()}</div>
            </div>
        `).join('');
    }

    addMedicalRecord(type, cost) {
        const record = {
            date: new Date().toLocaleDateString(),
            type: type,
            cost: cost
        };
        this.medicalRecords.push(record);
        
        // Update medical bills
        game.player.medicalBills = (game.player.medicalBills || 0) + cost;
        
        this.updateMedicalRecords();
        this.updateHealthDisplay();
    }

    emergencyTreatment() {
        const cost = 5000;
        if (game.player.money < cost) {
            game.showNotification('Insufficient funds for emergency treatment!', 'error');
            return;
        }
        
        game.player.money -= cost;
        game.player.health = Math.min(100, game.player.health + 50);
        game.player.injuries = Math.max(0, game.player.injuries - 30);
        
        this.addMedicalRecord('Emergency Treatment', cost);
        game.showNotification('Emergency treatment completed! Health restored.', 'success');
        game.updateDisplay();
    }

    traumaSurgery() {
        const cost = 15000;
        if (game.player.money < cost) {
            game.showNotification('Insufficient funds for trauma surgery!', 'error');
            return;
        }
        
        if (game.player.energy < 20) {
            game.showNotification('Not enough energy for surgery!', 'error');
            return;
        }
        
        game.player.money -= cost;
        game.player.energy -= 20;
        game.player.health = Math.min(100, game.player.health + 80);
        game.player.injuries = Math.max(0, game.player.injuries - 60);
        
        this.addMedicalRecord('Trauma Surgery', cost);
        game.showNotification('Trauma surgery completed! Major injuries treated.', 'success');
        game.updateDisplay();
    }

    intensiveCare() {
        const cost = 25000;
        if (game.player.money < cost) {
            game.showNotification('Insufficient funds for intensive care!', 'error');
            return;
        }
        
        if (game.player.energy < 40) {
            game.showNotification('Not enough energy for intensive care!', 'error');
            return;
        }
        
        game.player.money -= cost;
        game.player.energy -= 40;
        game.player.health = 100;
        game.player.injuries = 0;
        
        this.addMedicalRecord('Intensive Care', cost);
        game.showNotification('Intensive care completed! Full recovery achieved.', 'success');
        game.updateDisplay();
    }

    painRelief() {
        const cost = 500;
        if (game.player.money < cost) {
            game.showNotification('Insufficient funds for pain relief!', 'error');
            return;
        }
        
        game.player.money -= cost;
        game.player.injuries = Math.max(0, game.player.injuries - 10);
        
        this.addMedicalRecord('Pain Relief', cost);
        game.showNotification('Pain relief administered. Discomfort reduced.', 'success');
        game.updateDisplay();
    }

    physicalTherapy() {
        const cost = 2000;
        if (game.player.money < cost) {
            game.showNotification('Insufficient funds for physical therapy!', 'error');
            return;
        }
        
        if (game.player.energy < 10) {
            game.showNotification('Not enough energy for physical therapy!', 'error');
            return;
        }
        
        game.player.money -= cost;
        game.player.energy -= 10;
        game.player.health = Math.min(100, game.player.health + 20);
        game.player.injuries = Math.max(0, game.player.injuries - 15);
        
        this.addMedicalRecord('Physical Therapy', cost);
        game.showNotification('Physical therapy session completed. Mobility improved.', 'success');
        game.updateDisplay();
    }

    mentalHealth() {
        const cost = 1500;
        if (game.player.money < cost) {
            game.showNotification('Insufficient funds for mental health services!', 'error');
            return;
        }
        
        game.player.money -= cost;
        game.player.health = Math.min(100, game.player.health + 10);
        
        this.addMedicalRecord('Mental Health Counseling', cost);
        game.showNotification('Mental health counseling completed. Well-being improved.', 'success');
        game.updateDisplay();
    }

    healthCheckup() {
        const cost = 1000;
        if (game.player.money < cost) {
            game.showNotification('Insufficient funds for health checkup!', 'error');
            return;
        }
        
        game.player.money -= cost;
        
        // Reveal hidden health issues
        const hiddenIssues = Math.random() < 0.3;
        if (hiddenIssues) {
            game.player.injuries = Math.min(100, game.player.injuries + 5);
            game.showNotification('Health checkup revealed some minor issues.', 'warning');
        } else {
            game.showNotification('Health checkup completed. You are in good health.', 'success');
        }
        
        this.addMedicalRecord('Health Checkup', cost);
        game.updateDisplay();
    }

    vaccination() {
        const cost = 300;
        if (game.player.money < cost) {
            game.showNotification('Insufficient funds for vaccination!', 'error');
            return;
        }
        
        game.player.money -= cost;
        game.player.health = Math.min(100, game.player.health + 5);
        
        this.addMedicalRecord('Vaccination', cost);
        game.showNotification('Vaccination administered. Immunity boosted.', 'success');
        game.updateDisplay();
    }

    healthInsurance() {
        const monthlyCost = 500;
        if (game.player.money < monthlyCost) {
            game.showNotification('Insufficient funds for health insurance!', 'error');
            return;
        }
        
        if (this.healthInsurance) {
            game.showNotification('You already have health insurance!', 'warning');
            return;
        }
        
        game.player.money -= monthlyCost;
        this.healthInsurance = true;
        this.insuranceExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        
        this.addMedicalRecord('Health Insurance (Monthly)', monthlyCost);
        game.showNotification('Health insurance activated! Medical costs reduced by 50% for 30 days.', 'success');
        game.updateDisplay();
    }

    getInsuranceDiscount() {
        if (!this.healthInsurance) return 1;
        if (this.insuranceExpiry && new Date() > this.insuranceExpiry) {
            this.healthInsurance = false;
            this.insuranceExpiry = null;
            return 1;
        }
        return 0.5; // 50% discount
    }
}

// Character Customization System
class CharacterCustomizationSystem {
    constructor() {
        this.character = this.initializeCharacter();
        this.currentTab = 'appearance';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateClothingDisplay();
        this.updateAccessoriesDisplay();
        this.updateMakeupDisplay();
    }

    setupEventListeners() {
        // Character tab buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('character-tab-btn')) {
                document.querySelectorAll('.character-tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                document.querySelectorAll('.character-tab').forEach(tab => tab.classList.remove('active'));
                document.getElementById(e.target.dataset.tab).classList.add('active');
                this.currentTab = e.target.dataset.tab;
            }
        });

        // Update value displays when sliders change
        document.addEventListener('input', (e) => {
            if (e.target.type === 'range') {
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay && valueDisplay.classList.contains('value-display')) {
                    valueDisplay.textContent = e.target.value;
                }
            }
        });
    }

    initializeCharacter() {
        return {
            // Basic appearance
            sex: 0, // 0 = male, 1 = female
            face: 0,
            skin: 0,
            
            // Hair & facial features
            hair_1: 0,
            hair_2: 0,
            hair_color_1: 0,
            hair_color_2: 0,
            eye_color: 0,
            eyebrows_1: 0,
            eyebrows_2: 0,
            eyebrows_3: 0,
            eyebrows_4: 0,
            beard_1: 0,
            beard_2: 0,
            beard_3: 0,
            beard_4: 0,
            
            // Body features
            age_1: 0,
            age_2: 0,
            complexion_1: 0,
            complexion_2: 0,
            blemishes_1: 0,
            blemishes_2: 0,
            sun_1: 0,
            sun_2: 0,
            moles_1: 0,
            moles_2: 0,
            chest_1: 0,
            chest_2: 0,
            chest_3: 0,
            bodyb_1: 0,
            bodyb_2: 0,
            
            // Makeup & style
            makeup_1: 0,
            makeup_2: 0,
            makeup_3: 0,
            makeup_4: 0,
            lipstick_1: 0,
            lipstick_2: 0,
            lipstick_3: 0,
            lipstick_4: 0,
            blush_1: 0,
            blush_2: 0,
            blush_3: 0,
            
            // Clothing
            tshirt_1: 0,
            tshirt_2: 0,
            torso_1: 0,
            torso_2: 0,
            decals_1: 0,
            decals_2: 0,
            arms: 0,
            arms_2: 0,
            pants_1: 0,
            pants_2: 0,
            shoes_1: 0,
            shoes_2: 0,
            mask_1: 0,
            mask_2: 0,
            bproof_1: 0,
            bproof_2: 0,
            chain_1: 0,
            chain_2: 0,
            bags_1: 0,
            bags_2: 0,
            
            // Accessories
            helmet_1: -1,
            helmet_2: 0,
            glasses_1: 0,
            glasses_2: 0,
            watches_1: -1,
            watches_2: 0,
            bracelets_1: -1,
            bracelets_2: 0,
            ears_1: -1,
            ears_2: 0
        };
    }

    // Locale labels based on the FiveM skinchanger script
    getLocaleLabels() {
        return {
            'sex': 'Sex',
            'face': 'Face',
            'skin': 'Skin',
            'wrinkles': 'Wrinkles',
            'wrinkle_thickness': 'Wrinkle Thickness',
            'beard_type': 'Beard Type',
            'beard_size': 'Beard Size',
            'beard_color_1': 'Beard Color 1',
            'beard_color_2': 'Beard Color 2',
            'hair_1': 'Hair 1',
            'hair_2': 'Hair 2',
            'hair_color_1': 'Hair Color 1',
            'hair_color_2': 'Hair Color 2',
            'eye_color': 'Eye Color',
            'eyebrow_type': 'Eyebrow Type',
            'eyebrow_size': 'Eyebrow Size',
            'eyebrow_color_1': 'Eyebrow Color 1',
            'eyebrow_color_2': 'Eyebrow Color 2',
            'makeup_type': 'Makeup Type',
            'makeup_thickness': 'Makeup Thickness',
            'makeup_color_1': 'Makeup Color 1',
            'makeup_color_2': 'Makeup Color 2',
            'lipstick_type': 'Lipstick Type',
            'lipstick_thickness': 'Lipstick Thickness',
            'lipstick_color_1': 'Lipstick Color 1',
            'lipstick_color_2': 'Lipstick Color 2',
            'ear_accessories': 'Ear Accessories',
            'ear_accessories_color': 'Ear Accessories Color',
            'tshirt_1': 'T-Shirt 1',
            'tshirt_2': 'T-Shirt 2',
            'torso_1': 'Torso 1',
            'torso_2': 'Torso 2',
            'decals_1': 'Decals 1',
            'decals_2': 'Decals 2',
            'arms': 'Arms',
            'arms_2': 'Arms 2',
            'pants_1': 'Pants 1',
            'pants_2': 'Pants 2',
            'shoes_1': 'Shoes 1',
            'shoes_2': 'Shoes 2',
            'mask_1': 'Mask 1',
            'mask_2': 'Mask 2',
            'bproof_1': 'Bulletproof Vest 1',
            'bproof_2': 'Bulletproof Vest 2',
            'chain_1': 'Chain 1',
            'chain_2': 'Chain 2',
            'helmet_1': 'Helmet 1',
            'helmet_2': 'Helmet 2',
            'watches_1': 'Watches 1',
            'watches_2': 'Watches 2',
            'bracelets_1': 'Bracelets 1',
            'bracelets_2': 'Bracelets 2',
            'glasses_1': 'Glasses 1',
            'glasses_2': 'Glasses 2',
            'bag': 'Bag',
            'bag_color': 'Bag Color',
            'blemishes': 'Blemishes',
            'blemishes_size': 'Blemishes Thickness',
            'ageing': 'Ageing',
            'ageing_1': 'Ageing Thickness',
            'blush': 'Blush',
            'blush_1': 'Blush Thickness',
            'blush_color': 'Blush Color',
            'complexion': 'Complexion',
            'complexion_1': 'Complexion Thickness',
            'sun': 'Sun',
            'sun_1': 'Sun Thickness',
            'freckles': 'Freckles',
            'freckles_1': 'Freckles Thickness',
            'chest_hair': 'Chest Hair',
            'chest_hair_1': 'Chest Hair Thickness',
            'chest_color': 'Chest Hair Color',
            'bodyb': 'Body Blemishes',
            'bodyb_size': 'Body Blemishes Thickness'
        };
    }

    updateCharacter(component, value) {
        this.character[component] = parseInt(value);
        this.updateCharacterPreview();
    }

    setGender(gender) {
        this.character.sex = gender === 'male' ? 0 : 1;
        
        // Update gender buttons
        document.querySelectorAll('.gender-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-gender="${gender}"]`).classList.add('active');
        
        this.updateCharacterPreview();
        game.showNotification(`Character gender set to ${gender}!`, 'success');
    }

    updateCharacterPreview() {
        // This would update the 3D character model
        // For now, we'll just log the character data
        console.log('Character updated:', this.character);
    }

    updateClothingDisplay() {
        const clothingGrid = document.getElementById('clothingGrid');
        if (!clothingGrid) return;

        const clothingItems = [
            { id: 'tshirt-1', name: 'Basic T-Shirt', category: 'tops', price: 50 },
            { id: 'tshirt-2', name: 'Graphic T-Shirt', category: 'tops', price: 75 },
            { id: 'torso-1', name: 'Casual Shirt', category: 'tops', price: 100 },
            { id: 'torso-2', name: 'Formal Shirt', category: 'tops', price: 150 },
            { id: 'pants-1', name: 'Jeans', category: 'bottoms', price: 80 },
            { id: 'pants-2', name: 'Dress Pants', category: 'bottoms', price: 120 },
            { id: 'shoes-1', name: 'Sneakers', category: 'shoes', price: 60 },
            { id: 'shoes-2', name: 'Dress Shoes', category: 'shoes', price: 100 }
        ];

        clothingGrid.innerHTML = clothingItems.map(item => `
            <div class="clothing-item" onclick="equipClothing('${item.id}')">
                <h4>${item.name}</h4>
                <p>$${item.price}</p>
                <p style="color: #ff6b35; font-size: 0.8rem;">${item.category.toUpperCase()}</p>
            </div>
        `).join('');
    }

    updateAccessoriesDisplay() {
        const accessoriesGrid = document.getElementById('accessoriesGrid');
        if (!accessoriesGrid) return;

        const accessories = [
            { id: 'helmet-1', name: 'Baseball Cap', category: 'hats', price: 30 },
            { id: 'helmet-2', name: 'Beanie', category: 'hats', price: 25 },
            { id: 'glasses-1', name: 'Sunglasses', category: 'glasses', price: 80 },
            { id: 'glasses-2', name: 'Reading Glasses', category: 'glasses', price: 60 },
            { id: 'watches-1', name: 'Sports Watch', category: 'watches', price: 150 },
            { id: 'watches-2', name: 'Luxury Watch', category: 'watches', price: 500 },
            { id: 'chain-1', name: 'Gold Chain', category: 'jewelry', price: 200 },
            { id: 'chain-2', name: 'Silver Chain', category: 'jewelry', price: 120 }
        ];

        accessoriesGrid.innerHTML = accessories.map(item => `
            <div class="accessory-item" onclick="equipAccessory('${item.id}')">
                <h4>${item.name}</h4>
                <p>$${item.price}</p>
                <p style="color: #ff6b35; font-size: 0.8rem;">${item.category.toUpperCase()}</p>
            </div>
        `).join('');
    }

    updateMakeupDisplay() {
        const makeupControls = document.getElementById('makeupControls');
        if (!makeupControls) return;

        makeupControls.innerHTML = `
            <div class="makeup-control">
                <h4>Makeup</h4>
                <div class="control-item">
                    <label>Makeup Type</label>
                    <input type="range" id="makeup_1" min="0" max="39" value="0" onchange="updateCharacter('makeup_1', this.value)">
                    <span class="value-display">0</span>
                </div>
                <div class="control-item">
                    <label>Makeup Thickness</label>
                    <input type="range" id="makeup_2" min="0" max="10" value="0" onchange="updateCharacter('makeup_2', this.value)">
                    <span class="value-display">0</span>
                </div>
                <div class="control-item">
                    <label>Makeup Color 1</label>
                    <input type="range" id="makeup_3" min="0" max="63" value="0" onchange="updateCharacter('makeup_3', this.value)">
                    <span class="value-display">0</span>
                </div>
                <div class="control-item">
                    <label>Makeup Color 2</label>
                    <input type="range" id="makeup_4" min="0" max="63" value="0" onchange="updateCharacter('makeup_4', this.value)">
                    <span class="value-display">0</span>
                </div>
            </div>
            
            <div class="makeup-control">
                <h4>Lipstick</h4>
                <div class="control-item">
                    <label>Lipstick Type</label>
                    <input type="range" id="lipstick_1" min="0" max="9" value="0" onchange="updateCharacter('lipstick_1', this.value)">
                    <span class="value-display">0</span>
                </div>
                <div class="control-item">
                    <label>Lipstick Thickness</label>
                    <input type="range" id="lipstick_2" min="0" max="10" value="0" onchange="updateCharacter('lipstick_2', this.value)">
                    <span class="value-display">0</span>
                </div>
                <div class="control-item">
                    <label>Lipstick Color 1</label>
                    <input type="range" id="lipstick_3" min="0" max="63" value="0" onchange="updateCharacter('lipstick_3', this.value)">
                    <span class="value-display">0</span>
                </div>
                <div class="control-item">
                    <label>Lipstick Color 2</label>
                    <input type="range" id="lipstick_4" min="0" max="63" value="0" onchange="updateCharacter('lipstick_4', this.value)">
                    <span class="value-display">0</span>
                </div>
            </div>
            
            <div class="makeup-control">
                <h4>Blush</h4>
                <div class="control-item">
                    <label>Blush</label>
                    <input type="range" id="blush_1" min="0" max="6" value="0" onchange="updateCharacter('blush_1', this.value)">
                    <span class="value-display">0</span>
                </div>
                <div class="control-item">
                    <label>Blush Thickness</label>
                    <input type="range" id="blush_2" min="0" max="10" value="0" onchange="updateCharacter('blush_2', this.value)">
                    <span class="value-display">0</span>
                </div>
                <div class="control-item">
                    <label>Blush Color</label>
                    <input type="range" id="blush_3" min="0" max="63" value="0" onchange="updateCharacter('blush_3', this.value)">
                    <span class="value-display">0</span>
                </div>
            </div>
        `;
    }

    saveCharacter() {
        // Save character data to game state
        if (!game.player.character) {
            game.player.character = {};
        }
        
        game.player.character = { ...this.character };
        game.showNotification('Character saved successfully!', 'success');
        
        // Save to localStorage
        localStorage.setItem('characterData', JSON.stringify(this.character));
    }

    randomizeCharacter() {
        // Randomize all character attributes
        const components = Object.keys(this.character);
        components.forEach(component => {
            if (component === 'sex') {
                this.character[component] = Math.random() < 0.5 ? 0 : 1;
            } else if (component.includes('color') || component.includes('_3') || component.includes('_4')) {
                this.character[component] = Math.floor(Math.random() * 64);
            } else if (component.includes('_1') && !component.includes('color')) {
                this.character[component] = Math.floor(Math.random() * 50);
            } else if (component.includes('_2') && !component.includes('color')) {
                this.character[component] = Math.floor(Math.random() * 11);
            } else {
                this.character[component] = Math.floor(Math.random() * 46);
            }
        });

        this.updateAllSliders();
        this.updateCharacterPreview();
        game.showNotification('Character randomized!', 'success');
    }

    resetCharacter() {
        this.character = this.initializeCharacter();
        this.updateAllSliders();
        this.updateCharacterPreview();
        game.showNotification('Character reset to default!', 'info');
    }

    exportCharacter() {
        const characterData = JSON.stringify(this.character, null, 2);
        const blob = new Blob([characterData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'character.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        game.showNotification('Character exported!', 'success');
    }

    updateAllSliders() {
        // Update all slider values to match character data
        Object.keys(this.character).forEach(component => {
            const slider = document.getElementById(component);
            if (slider) {
                slider.value = this.character[component];
                const valueDisplay = slider.nextElementSibling;
                if (valueDisplay && valueDisplay.classList.contains('value-display')) {
                    valueDisplay.textContent = this.character[component];
                }
            }
        });
    }

    rotateCharacter(direction) {
        // Rotate character model
        const model = document.getElementById('characterModel');
        if (model) {
            const currentRotation = model.style.transform || 'rotateY(0deg)';
            const currentAngle = parseInt(currentRotation.match(/-?\d+/)) || 0;
            const newAngle = direction === 'left' ? currentAngle - 45 : currentAngle + 45;
            model.style.transform = `rotateY(${newAngle}deg)`;
        }
    }

    resetCamera() {
        const model = document.getElementById('characterModel');
        if (model) {
            model.style.transform = 'rotateY(0deg)';
        }
    }
}

// Education System
class EducationSystem {
    constructor() {
        this.courses = this.generateCourses();
        this.currentTab = 'courses';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCoursesDisplay();
        this.updateProgressDisplay();
        this.updateCertificatesDisplay();
        this.updateLibraryDisplay();
    }

    setupEventListeners() {
        // Education tab buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('education-tab-btn')) {
                document.querySelectorAll('.education-tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                document.querySelectorAll('.education-tab').forEach(tab => tab.classList.remove('active'));
                document.getElementById(e.target.dataset.tab).classList.add('active');
                this.currentTab = e.target.dataset.tab;
            }
        });
    }

    generateCourses() {
        return [
            {
                id: 'biology-101',
                name: 'Introduction to Biology',
                category: 'biology',
                description: 'Learn the fundamentals of biological sciences, including cell structure, genetics, and evolution.',
                duration: 4, // weeks
                cost: 500,
                prerequisites: [],
                benefits: ['+5 Intelligence', '+3 Health', 'Medical Knowledge'],
                difficulty: 'Beginner',
                instructor: 'Dr. Sarah Johnson',
                maxStudents: 50,
                currentStudents: 23
            },
            {
                id: 'business-101',
                name: 'Business Fundamentals',
                category: 'business',
                description: 'Master the basics of business operations, management, and entrepreneurship.',
                duration: 6,
                cost: 750,
                prerequisites: [],
                benefits: ['+8 Intelligence', '+5 Charisma', 'Business Skills'],
                difficulty: 'Beginner',
                instructor: 'Prof. Michael Chen',
                maxStudents: 40,
                currentStudents: 31
            },
            {
                id: 'combat-training',
                name: 'Combat Training',
                category: 'combat',
                description: 'Intensive physical and tactical training for combat situations.',
                duration: 8,
                cost: 1000,
                prerequisites: [],
                benefits: ['+10 Strength', '+8 Endurance', 'Combat Skills'],
                difficulty: 'Intermediate',
                instructor: 'Sgt. Marcus Williams',
                maxStudents: 25,
                currentStudents: 18
            },
            {
                id: 'computer-science',
                name: 'Computer Science',
                category: 'computer',
                description: 'Learn programming, algorithms, and computer systems.',
                duration: 12,
                cost: 1200,
                prerequisites: [],
                benefits: ['+12 Intelligence', '+8 Technical', 'Programming Skills'],
                difficulty: 'Intermediate',
                instructor: 'Dr. Alex Rodriguez',
                maxStudents: 30,
                currentStudents: 27
            },
            {
                id: 'general-studies',
                name: 'General Studies',
                category: 'general',
                description: 'Broad education covering various subjects and life skills.',
                duration: 10,
                cost: 600,
                prerequisites: [],
                benefits: ['+6 Intelligence', '+4 Charisma', '+3 Wisdom'],
                difficulty: 'Beginner',
                instructor: 'Dr. Emily Davis',
                maxStudents: 60,
                currentStudents: 45
            },
            {
                id: 'health-fitness',
                name: 'Health & Fitness',
                category: 'health',
                description: 'Comprehensive health education and physical fitness training.',
                duration: 6,
                cost: 400,
                prerequisites: [],
                benefits: ['+8 Health', '+6 Endurance', 'Medical Knowledge'],
                difficulty: 'Beginner',
                instructor: 'Dr. Lisa Thompson',
                maxStudents: 35,
                currentStudents: 28
            },
            {
                id: 'history-101',
                name: 'World History',
                category: 'history',
                description: 'Study of historical events, cultures, and their impact on society.',
                duration: 8,
                cost: 550,
                prerequisites: [],
                benefits: ['+7 Intelligence', '+5 Wisdom', 'Cultural Knowledge'],
                difficulty: 'Beginner',
                instructor: 'Prof. Robert Anderson',
                maxStudents: 45,
                currentStudents: 32
            },
            {
                id: 'law-101',
                name: 'Legal Studies',
                category: 'law',
                description: 'Introduction to legal systems, rights, and responsibilities.',
                duration: 10,
                cost: 800,
                prerequisites: [],
                benefits: ['+9 Intelligence', '+6 Charisma', 'Legal Knowledge'],
                difficulty: 'Intermediate',
                instructor: 'Judge Patricia Martinez',
                maxStudents: 25,
                currentStudents: 19
            },
            {
                id: 'mathematics',
                name: 'Advanced Mathematics',
                category: 'mathematics',
                description: 'Complex mathematical concepts and problem-solving techniques.',
                duration: 12,
                cost: 900,
                prerequisites: [],
                benefits: ['+10 Intelligence', '+8 Technical', 'Analytical Skills'],
                difficulty: 'Advanced',
                instructor: 'Dr. James Wilson',
                maxStudents: 20,
                currentStudents: 15
            },
            {
                id: 'psychology',
                name: 'Psychology',
                category: 'psychology',
                description: 'Study of human behavior, mental processes, and social interactions.',
                duration: 8,
                cost: 650,
                prerequisites: [],
                benefits: ['+8 Intelligence', '+6 Charisma', 'Social Skills'],
                difficulty: 'Intermediate',
                instructor: 'Dr. Maria Garcia',
                maxStudents: 30,
                currentStudents: 24
            },
            {
                id: 'self-defense',
                name: 'Self Defense',
                category: 'self-defense',
                description: 'Personal protection techniques and situational awareness.',
                duration: 6,
                cost: 350,
                prerequisites: [],
                benefits: ['+6 Strength', '+5 Agility', 'Defense Skills'],
                difficulty: 'Beginner',
                instructor: 'Master David Kim',
                maxStudents: 20,
                currentStudents: 16
            },
            {
                id: 'sports-science',
                name: 'Sports Science',
                category: 'sports',
                description: 'Scientific approach to athletic performance and physical training.',
                duration: 8,
                cost: 700,
                prerequisites: [],
                benefits: ['+8 Strength', '+6 Endurance', 'Athletic Skills'],
                difficulty: 'Intermediate',
                instructor: 'Coach Jennifer Lee',
                maxStudents: 25,
                currentStudents: 20
            }
        ];
    }

    updateCoursesDisplay() {
        const coursesGrid = document.getElementById('coursesGrid');
        if (!coursesGrid) return;

        coursesGrid.innerHTML = this.courses.map(course => this.createCourseCard(course)).join('');
    }

    createCourseCard(course) {
        const isEnrolled = game.player.education?.enrolled?.includes(course.id) || false;
        const canEnroll = !isEnrolled && game.player.money >= course.cost;
        const isCompleted = game.player.education?.completed?.includes(course.id) || false;

        return `
            <div class="course-card">
                <div class="course-header">
                    <div>
                        <h3 class="course-title">${course.name}</h3>
                        <span class="course-category ${course.category}">${course.category.toUpperCase()}</span>
                    </div>
                </div>
                
                <div class="course-details">
                    <div class="course-detail">
                        <div class="course-detail-label">Duration</div>
                        <div class="course-detail-value">${course.duration} weeks</div>
                    </div>
                    <div class="course-detail">
                        <div class="course-detail-label">Cost</div>
                        <div class="course-detail-value">$${this.formatNumber(course.cost)}</div>
                    </div>
                    <div class="course-detail">
                        <div class="course-detail-label">Difficulty</div>
                        <div class="course-detail-value">${course.difficulty}</div>
                    </div>
                    <div class="course-detail">
                        <div class="course-detail-label">Students</div>
                        <div class="course-detail-value">${course.currentStudents}/${course.maxStudents}</div>
                    </div>
                </div>
                
                <div class="course-description">
                    ${course.description}
                </div>
                
                <div class="course-benefits">
                    <h4>Benefits:</h4>
                    <div class="benefits-list">
                        ${course.benefits.map(benefit => `<span class="benefit-tag">${benefit}</span>`).join('')}
                    </div>
                </div>
                
                <div class="course-actions">
                    ${isCompleted ? 
                        '<button class="course-btn secondary" disabled><i class="fas fa-check"></i> Completed</button>' :
                        isEnrolled ? 
                            '<button class="course-btn secondary" disabled><i class="fas fa-user-graduate"></i> Enrolled</button>' :
                            canEnroll ?
                                `<button class="course-btn primary" onclick="enrollInCourse('${course.id}')"><i class="fas fa-plus"></i> Enroll</button>` :
                                '<button class="course-btn disabled" disabled><i class="fas fa-lock"></i> Insufficient Funds</button>'
                    }
                    <button class="course-btn secondary" onclick="viewCourseDetails('${course.id}')"><i class="fas fa-info"></i> Details</button>
                </div>
            </div>
        `;
    }

    updateProgressDisplay() {
        const progressContent = document.getElementById('progressContent');
        if (!progressContent) return;

        const education = game.player.education || { enrolled: [], completed: [], certificates: [] };
        const totalCourses = this.courses.length;
        const completedCourses = education.completed?.length || 0;
        const enrolledCourses = education.enrolled?.length || 0;
        const certificates = education.certificates?.length || 0;

        progressContent.innerHTML = `
            <div class="progress-stats">
                <div class="progress-stat">
                    <h4>Total Courses</h4>
                    <div class="stat-value">${totalCourses}</div>
                    <div class="stat-label">Available</div>
                </div>
                <div class="progress-stat">
                    <h4>Completed</h4>
                    <div class="stat-value">${completedCourses}</div>
                    <div class="stat-label">Courses</div>
                </div>
                <div class="progress-stat">
                    <h4>Enrolled</h4>
                    <div class="stat-value">${enrolledCourses}</div>
                    <div class="stat-label">Active</div>
                </div>
                <div class="progress-stat">
                    <h4>Certificates</h4>
                    <div class="stat-value">${certificates}</div>
                    <div class="stat-label">Earned</div>
                </div>
            </div>
            
            ${enrolledCourses > 0 ? `
                <div class="course-progress">
                    <h4>Current Courses</h4>
                    ${education.enrolled?.map(courseId => {
                        const course = this.courses.find(c => c.id === courseId);
                        if (!course) return '';
                        const progress = Math.floor(Math.random() * 100); // Simulated progress
                        return `
                            <div style="margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <span style="color: #ff6b35; font-weight: bold;">${course.name}</span>
                                    <span style="color: #cccccc;">${progress}%</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${progress}%"></div>
                                </div>
                            </div>
                        `;
                    }).join('') || ''}
                </div>
            ` : `
                <div style="text-align: center; padding: 2rem; color: #cccccc;">
                    <i class="fas fa-graduation-cap" style="font-size: 3rem; margin-bottom: 1rem; color: #ff6b35;"></i>
                    <h3>No Active Courses</h3>
                    <p>Enroll in a course to start your education journey!</p>
                </div>
            `}
        `;
    }

    updateCertificatesDisplay() {
        const certificatesContent = document.getElementById('certificatesContent');
        if (!certificatesContent) return;

        const certificates = game.player.education?.certificates || [];
        
        if (certificates.length === 0) {
            certificatesContent.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #cccccc;">
                    <i class="fas fa-certificate" style="font-size: 3rem; margin-bottom: 1rem; color: #ff6b35;"></i>
                    <h3>No Certificates Yet</h3>
                    <p>Complete courses to earn certificates!</p>
                </div>
            `;
            return;
        }

        certificatesContent.innerHTML = `
            <div class="certificates-grid">
                ${certificates.map(cert => this.createCertificateCard(cert)).join('')}
            </div>
        `;
    }

    createCertificateCard(certificate) {
        return `
            <div class="certificate-card">
                <div class="certificate-header">
                    <div>
                        <h3 class="certificate-title">${certificate.name}</h3>
                        <div class="certificate-date">Earned: ${new Date(certificate.date).toLocaleDateString()}</div>
                    </div>
                </div>
                
                <div class="certificate-details">
                    <div class="certificate-detail">
                        <span class="certificate-detail-label">Course:</span>
                        <span class="certificate-detail-value">${certificate.course}</span>
                    </div>
                    <div class="certificate-detail">
                        <span class="certificate-detail-label">Grade:</span>
                        <span class="certificate-detail-value">${certificate.grade}</span>
                    </div>
                    <div class="certificate-detail">
                        <span class="certificate-detail-label">Instructor:</span>
                        <span class="certificate-detail-value">${certificate.instructor}</span>
                    </div>
                </div>
                
                <div class="certificate-actions">
                    <button class="certificate-btn primary" onclick="viewCertificate('${certificate.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="certificate-btn secondary" onclick="downloadCertificate('${certificate.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `;
    }

    updateLibraryDisplay() {
        const libraryContent = document.getElementById('libraryContent');
        if (!libraryContent) return;

        libraryContent.innerHTML = `
            <div class="library-categories">
                <button class="library-category-btn active" data-category="all">All Resources</button>
                <button class="library-category-btn" data-category="books">Books</button>
                <button class="library-category-btn" data-category="videos">Videos</button>
                <button class="library-category-btn" data-category="articles">Articles</button>
                <button class="library-category-btn" data-category="research">Research</button>
            </div>
            
            <div class="library-resources">
                ${this.generateLibraryResources().map(resource => this.createLibraryResource(resource)).join('')}
            </div>
        `;
    }

    generateLibraryResources() {
        return [
            {
                id: 'lib-1',
                name: 'Advanced Biology Textbook',
                type: 'book',
                category: 'biology',
                description: 'Comprehensive guide to biological sciences with detailed illustrations and case studies.',
                author: 'Dr. Sarah Johnson',
                pages: 450,
                available: true
            },
            {
                id: 'lib-2',
                name: 'Business Strategy Video Series',
                type: 'video',
                category: 'business',
                description: '10-part video series covering modern business strategies and management techniques.',
                author: 'Prof. Michael Chen',
                duration: '8 hours',
                available: true
            },
            {
                id: 'lib-3',
                name: 'Combat Techniques Research Paper',
                type: 'research',
                category: 'combat',
                description: 'Latest research on effective combat techniques and tactical training methods.',
                author: 'Sgt. Marcus Williams',
                pages: 120,
                available: false
            },
            {
                id: 'lib-4',
                name: 'Programming Fundamentals Article',
                type: 'article',
                category: 'computer',
                description: 'Essential programming concepts and best practices for beginners.',
                author: 'Dr. Alex Rodriguez',
                pages: 25,
                available: true
            }
        ];
    }

    createLibraryResource(resource) {
        return `
            <div class="library-resource">
                <h4>${resource.name}</h4>
                <p>${resource.description}</p>
                <div style="margin-bottom: 1rem;">
                    <span class="resource-type">${resource.type.toUpperCase()}</span>
                    <span style="color: #cccccc; margin-left: 1rem;">by ${resource.author}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #cccccc;">
                        ${resource.pages ? `${resource.pages} pages` : resource.duration || 'Available'}
                    </span>
                    <button class="course-btn ${resource.available ? 'primary' : 'disabled'}" 
                            ${resource.available ? `onclick="accessResource('${resource.id}')"` : 'disabled'}>
                        <i class="fas fa-${resource.available ? 'book-open' : 'lock'}"></i>
                        ${resource.available ? 'Access' : 'Unavailable'}
                    </button>
                </div>
            </div>
        `;
    }

    enrollInCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        if (game.player.money < course.cost) {
            game.showNotification('Insufficient funds to enroll in this course!', 'error');
            return;
        }

        if (!game.player.education) {
            game.player.education = { enrolled: [], completed: [], certificates: [] };
        }

        if (game.player.education.enrolled.includes(courseId)) {
            game.showNotification('You are already enrolled in this course!', 'error');
            return;
        }

        if (confirm(`Enroll in ${course.name} for $${this.formatNumber(course.cost)}?`)) {
            game.player.money -= course.cost;
            game.player.education.enrolled.push(courseId);
            
            this.updateCoursesDisplay();
            this.updateProgressDisplay();
            game.updateDisplay();
            game.showNotification(`Successfully enrolled in ${course.name}!`, 'success');
        }
    }

    formatNumber(num) {
        return num.toLocaleString();
    }
}

// Vehicle Control System
class VehicleControlSystem {
    constructor() {
        this.activeVehicle = null;
        this.vehicleState = {
            engine: false,
            hood: false,
            trunk: false,
            doors: [false, false, false, false], // Front Left, Front Right, Rear Left, Rear Right
            windows: [false, false, false, false], // Front Left, Front Right, Rear Left, Rear Right
            interiorLight: false,
            currentSeat: -1 // -1 = Driver, 0 = Passenger, 1 = Rear Left, 2 = Rear Right
        };
        this.init();
    }

    init() {
        this.updateVehicleSelector();
        this.updateVehicleStatus();
    }

    updateVehicleSelector() {
        const vehicleSelector = document.getElementById('vehicleSelector');
        if (!vehicleSelector) return;

        const playerVehicles = game.player.vehicles || [];
        
        if (playerVehicles.length === 0) {
            vehicleSelector.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #cccccc;">
                    <i class="fas fa-car" style="font-size: 3rem; margin-bottom: 1rem; color: #ff6b35;"></i>
                    <h3>No Vehicles Available</h3>
                    <p>Buy your first vehicle from the Vehicles tab!</p>
                </div>
            `;
            return;
        }

        vehicleSelector.innerHTML = playerVehicles.map(vehicle => `
            <div class="vehicle-option ${this.activeVehicle?.id === vehicle.id ? 'active' : ''}" 
                 onclick="selectActiveVehicle('${vehicle.id}')">
                <h5>${vehicle.name}</h5>
                <p>${vehicle.class.toUpperCase()} Class</p>
                <p>Condition: ${vehicle.condition || 100}%</p>
            </div>
        `).join('');
    }

    selectActiveVehicle(vehicleId) {
        const vehicle = game.player.vehicles?.find(v => v.id === vehicleId);
        if (!vehicle) return;

        this.activeVehicle = vehicle;
        this.updateVehicleSelector();
        this.updateVehicleStatus();
        
        game.showNotification(`Selected ${vehicle.name} for vehicle control!`, 'success');
    }

    updateVehicleStatus() {
        const statusGrid = document.getElementById('statusGrid');
        if (!statusGrid) return;

        if (!this.activeVehicle) {
            statusGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #cccccc;">
                    <i class="fas fa-car" style="font-size: 2rem; margin-bottom: 1rem; color: #ff6b35;"></i>
                    <h3>No Vehicle Selected</h3>
                    <p>Select a vehicle to control it!</p>
                </div>
            `;
            return;
        }

        const doorNames = ['Front Left', 'Front Right', 'Rear Left', 'Rear Right'];
        const windowNames = ['Front Left', 'Front Right', 'Rear Left', 'Rear Right'];
        const seatNames = ['Driver', 'Passenger', 'Rear Left', 'Rear Right'];

        statusGrid.innerHTML = `
            <div class="status-item">
                <h5>Engine</h5>
                <p><span class="status-indicator ${this.vehicleState.engine ? 'on' : 'off'}"></span>${this.vehicleState.engine ? 'Running' : 'Off'}</p>
            </div>
            <div class="status-item">
                <h5>Hood</h5>
                <p><span class="status-indicator ${this.vehicleState.hood ? 'open' : 'closed'}"></span>${this.vehicleState.hood ? 'Open' : 'Closed'}</p>
            </div>
            <div class="status-item">
                <h5>Trunk</h5>
                <p><span class="status-indicator ${this.vehicleState.trunk ? 'open' : 'closed'}"></span>${this.vehicleState.trunk ? 'Open' : 'Closed'}</p>
            </div>
            <div class="status-item">
                <h5>Interior Light</h5>
                <p><span class="status-indicator ${this.vehicleState.interiorLight ? 'on' : 'off'}"></span>${this.vehicleState.interiorLight ? 'On' : 'Off'}</p>
            </div>
            <div class="status-item">
                <h5>Current Seat</h5>
                <p>${seatNames[this.vehicleState.currentSeat + 1] || 'Driver'}</p>
            </div>
            <div class="status-item">
                <h5>Vehicle Condition</h5>
                <p>${this.activeVehicle.condition || 100}%</p>
            </div>
            ${this.vehicleState.doors.map((door, index) => `
                <div class="status-item">
                    <h5>Door ${doorNames[index]}</h5>
                    <p><span class="status-indicator ${door ? 'open' : 'closed'}"></span>${door ? 'Open' : 'Closed'}</p>
                </div>
            `).join('')}
            ${this.vehicleState.windows.map((window, index) => `
                <div class="status-item">
                    <h5>Window ${windowNames[index]}</h5>
                    <p><span class="status-indicator ${window ? 'open' : 'closed'}"></span>${window ? 'Down' : 'Up'}</p>
                </div>
            `).join('')}
        `;
    }

    toggleEngine() {
        if (!this.activeVehicle) {
            game.showNotification('No vehicle selected!', 'error');
            return;
        }

        this.vehicleState.engine = !this.vehicleState.engine;
        this.updateVehicleStatus();
        
        const engineBtn = document.getElementById('engineBtn');
        if (engineBtn) {
            engineBtn.classList.toggle('active', this.vehicleState.engine);
            engineBtn.innerHTML = `
                <i class="fas fa-power-off"></i>
                <span>${this.vehicleState.engine ? 'Stop Engine' : 'Start Engine'}</span>
            `;
        }

        game.showNotification(`Engine ${this.vehicleState.engine ? 'started' : 'stopped'}!`, 'success');
    }

    toggleHood() {
        if (!this.activeVehicle) {
            game.showNotification('No vehicle selected!', 'error');
            return;
        }

        this.vehicleState.hood = !this.vehicleState.hood;
        this.updateVehicleStatus();
        game.showNotification(`Hood ${this.vehicleState.hood ? 'opened' : 'closed'}!`, 'info');
    }

    toggleTrunk() {
        if (!this.activeVehicle) {
            game.showNotification('No vehicle selected!', 'error');
            return;
        }

        this.vehicleState.trunk = !this.vehicleState.trunk;
        this.updateVehicleStatus();
        game.showNotification(`Trunk ${this.vehicleState.trunk ? 'opened' : 'closed'}!`, 'info');
    }

    toggleDoor(doorIndex) {
        if (!this.activeVehicle) {
            game.showNotification('No vehicle selected!', 'error');
            return;
        }

        this.vehicleState.doors[doorIndex] = !this.vehicleState.doors[doorIndex];
        this.updateVehicleStatus();
        
        const doorNames = ['Front Left', 'Front Right', 'Rear Left', 'Rear Right'];
        game.showNotification(`${doorNames[doorIndex]} door ${this.vehicleState.doors[doorIndex] ? 'opened' : 'closed'}!`, 'info');
    }

    toggleAllDoors() {
        if (!this.activeVehicle) {
            game.showNotification('No vehicle selected!', 'error');
            return;
        }

        const allOpen = this.vehicleState.doors.every(door => door);
        this.vehicleState.doors = this.vehicleState.doors.map(() => !allOpen);
        this.updateVehicleStatus();
        game.showNotification(`All doors ${allOpen ? 'closed' : 'opened'}!`, 'info');
    }

    toggleWindow(windowIndex) {
        if (!this.activeVehicle) {
            game.showNotification('No vehicle selected!', 'error');
            return;
        }

        this.vehicleState.windows[windowIndex] = !this.vehicleState.windows[windowIndex];
        this.updateVehicleStatus();
        
        const windowNames = ['Front Left', 'Front Right', 'Rear Left', 'Rear Right'];
        game.showNotification(`${windowNames[windowIndex]} window ${this.vehicleState.windows[windowIndex] ? 'rolled down' : 'rolled up'}!`, 'info');
    }

    toggleFrontWindows() {
        if (!this.activeVehicle) {
            game.showNotification('No vehicle selected!', 'error');
            return;
        }

        const frontOpen = this.vehicleState.windows[0] && this.vehicleState.windows[1];
        this.vehicleState.windows[0] = !frontOpen;
        this.vehicleState.windows[1] = !frontOpen;
        this.updateVehicleStatus();
        game.showNotification(`Front windows ${frontOpen ? 'rolled up' : 'rolled down'}!`, 'info');
    }

    toggleBackWindows() {
        if (!this.activeVehicle) {
            game.showNotification('No vehicle selected!', 'error');
            return;
        }

        const backOpen = this.vehicleState.windows[2] && this.vehicleState.windows[3];
        this.vehicleState.windows[2] = !backOpen;
        this.vehicleState.windows[3] = !backOpen;
        this.updateVehicleStatus();
        game.showNotification(`Back windows ${backOpen ? 'rolled up' : 'rolled down'}!`, 'info');
    }

    toggleAllWindows() {
        if (!this.activeVehicle) {
            game.showNotification('No vehicle selected!', 'error');
            return;
        }

        const allOpen = this.vehicleState.windows.every(window => window);
        this.vehicleState.windows = this.vehicleState.windows.map(() => !allOpen);
        this.updateVehicleStatus();
        game.showNotification(`All windows ${allOpen ? 'rolled up' : 'rolled down'}!`, 'info');
    }

    changeSeat(seatIndex) {
        if (!this.activeVehicle) {
            game.showNotification('No vehicle selected!', 'error');
            return;
        }

        this.vehicleState.currentSeat = seatIndex;
        this.updateVehicleStatus();
        
        const seatNames = ['Driver', 'Passenger', 'Rear Left', 'Rear Right'];
        game.showNotification(`Moved to ${seatNames[seatIndex + 1] || 'Driver'} seat!`, 'success');
    }

    toggleInteriorLight() {
        if (!this.activeVehicle) {
            game.showNotification('No vehicle selected!', 'error');
            return;
        }

        this.vehicleState.interiorLight = !this.vehicleState.interiorLight;
        this.updateVehicleStatus();
        
        const lightBtn = document.getElementById('interiorLightBtn');
        if (lightBtn) {
            lightBtn.classList.toggle('active', this.vehicleState.interiorLight);
        }

        game.showNotification(`Interior light ${this.vehicleState.interiorLight ? 'turned on' : 'turned off'}!`, 'info');
    }
}

// Raceway System
class RacewaySystem {
    constructor() {
        this.tracks = this.generateTracks();
        this.vehicles = this.generateVehicles();
        this.activeRaces = [];
        this.leaderboard = [];
        this.currentTab = 'tracks';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTracksDisplay();
        this.updateVehiclesDisplay();
        this.updateRacesDisplay();
        this.updateLeaderboard();
        this.updateGarageDisplay();
    }

    setupEventListeners() {
        // Raceway tab buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('raceway-tab-btn')) {
                document.querySelectorAll('.raceway-tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                document.querySelectorAll('.raceway-tab').forEach(tab => tab.classList.remove('active'));
                document.getElementById(e.target.dataset.tab).classList.add('active');
                this.currentTab = e.target.dataset.tab;
            }
        });
    }

    generateTracks() {
        return [
            {
                id: 'track-1',
                name: 'City Circuit',
                difficulty: 'easy',
                length: '2.5 km',
                laps: 3,
                prize: 5000,
                entryFee: 500,
                description: 'Beginner-friendly city track',
                features: ['Wide turns', 'Good visibility', 'Safe barriers'],
                bestTime: '2:45.123',
                recordHolder: 'Speed Demon'
            },
            {
                id: 'track-2',
                name: 'Mountain Pass',
                difficulty: 'medium',
                length: '4.2 km',
                laps: 2,
                prize: 12000,
                entryFee: 1200,
                description: 'Challenging mountain terrain',
                features: ['Sharp turns', 'Elevation changes', 'Narrow roads'],
                bestTime: '4:12.456',
                recordHolder: 'Mountain King'
            },
            {
                id: 'track-3',
                name: 'Desert Highway',
                difficulty: 'hard',
                length: '6.8 km',
                laps: 1,
                prize: 25000,
                entryFee: 2500,
                description: 'High-speed desert straightaways',
                features: ['Long straights', 'Heat effects', 'Sand hazards'],
                bestTime: '3:28.789',
                recordHolder: 'Desert Storm'
            },
            {
                id: 'track-4',
                name: 'Rainbow Ridge',
                difficulty: 'expert',
                length: '8.5 km',
                laps: 1,
                prize: 50000,
                entryFee: 5000,
                description: 'Ultimate racing challenge',
                features: ['Technical sections', 'Weather changes', 'Precision required'],
                bestTime: '5:15.234',
                recordHolder: 'Rainbow Master'
            },
            {
                id: 'track-5',
                name: 'Night City',
                difficulty: 'medium',
                length: '3.1 km',
                laps: 4,
                prize: 15000,
                entryFee: 1500,
                description: 'Night racing through the city',
                features: ['Low visibility', 'Neon lights', 'Urban obstacles'],
                bestTime: '3:45.567',
                recordHolder: 'Night Rider'
            },
            {
                id: 'track-6',
                name: 'Coastal Run',
                difficulty: 'easy',
                length: '3.8 km',
                laps: 2,
                prize: 8000,
                entryFee: 800,
                description: 'Scenic coastal racing',
                features: ['Ocean views', 'Gentle curves', 'Sea breeze'],
                bestTime: '4:02.890',
                recordHolder: 'Coast Cruiser'
            }
        ];
    }

    generateVehicles() {
        return [
            {
                id: 'vehicle-1',
                name: 'Street Racer',
                class: 'street',
                price: 25000,
                topSpeed: 180,
                acceleration: 75,
                handling: 80,
                description: 'Perfect for beginners',
                features: ['Reliable', 'Easy to control', 'Good fuel economy']
            },
            {
                id: 'vehicle-2',
                name: 'Sport Coupe',
                class: 'sport',
                price: 75000,
                topSpeed: 220,
                acceleration: 85,
                handling: 90,
                description: 'Balanced performance',
                features: ['Great handling', 'Good speed', 'Sporty design']
            },
            {
                id: 'vehicle-3',
                name: 'Super Car',
                class: 'super',
                price: 250000,
                topSpeed: 280,
                acceleration: 95,
                handling: 85,
                description: 'High-performance machine',
                features: ['Extreme speed', 'Advanced aerodynamics', 'Premium materials']
            },
            {
                id: 'vehicle-4',
                name: 'Hyper Car',
                class: 'hyper',
                price: 750000,
                topSpeed: 320,
                acceleration: 98,
                handling: 95,
                description: 'Ultimate racing machine',
                features: ['Cutting-edge technology', 'Maximum performance', 'Exclusive design']
            },
            {
                id: 'vehicle-5',
                name: 'Drift King',
                class: 'sport',
                price: 95000,
                topSpeed: 200,
                acceleration: 80,
                handling: 95,
                description: 'Specialized for drifting',
                features: ['Perfect for turns', 'Drift specialist', 'Rear-wheel drive']
            },
            {
                id: 'vehicle-6',
                name: 'Speed Demon',
                class: 'super',
                price: 180000,
                topSpeed: 300,
                acceleration: 90,
                handling: 80,
                description: 'Pure speed machine',
                features: ['Maximum velocity', 'Aerodynamic design', 'Racing pedigree']
            }
        ];
    }

    updateTracksDisplay() {
        const tracksGrid = document.getElementById('tracksGrid');
        if (!tracksGrid) return;

        tracksGrid.innerHTML = this.tracks.map(track => this.createTrackCard(track)).join('');
    }

    createTrackCard(track) {
        return `
            <div class="track-card">
                <div class="track-header">
                    <div>
                        <div class="track-title">${track.name}</div>
                        <div style="color: #cccccc; font-size: 0.9rem;">${track.description}</div>
                    </div>
                    <div class="track-difficulty ${track.difficulty}">${track.difficulty.toUpperCase()}</div>
                </div>

                <div class="track-details">
                    <div class="track-detail">
                        <div class="track-detail-label">Length</div>
                        <div class="track-detail-value">${track.length}</div>
                    </div>
                    <div class="track-detail">
                        <div class="track-detail-label">Laps</div>
                        <div class="track-detail-value">${track.laps}</div>
                    </div>
                    <div class="track-detail">
                        <div class="track-detail-label">Prize</div>
                        <div class="track-detail-value">$${this.formatNumber(track.prize)}</div>
                    </div>
                    <div class="track-detail">
                        <div class="track-detail-label">Entry Fee</div>
                        <div class="track-detail-value">$${this.formatNumber(track.entryFee)}</div>
                    </div>
                </div>

                <div style="margin-bottom: 1rem;">
                    <h4 style="color: #ff6b35; margin-bottom: 0.5rem; font-size: 1rem;">Features</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${track.features.map(feature => `<span style="background: #333; border: 1px solid #444; border-radius: 15px; padding: 0.25rem 0.75rem; color: #cccccc; font-size: 0.8rem; font-weight: bold;">${feature}</span>`).join('')}
                    </div>
                </div>

                <div style="margin-bottom: 1rem; padding: 0.75rem; background: #333; border-radius: 8px;">
                    <div style="color: #cccccc; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; margin-bottom: 0.25rem;">Best Time</div>
                    <div style="color: #ffffff; font-size: 1rem; font-weight: bold;">${track.bestTime}</div>
                    <div style="color: #ff6b35; font-size: 0.9rem; margin-top: 0.25rem;">by ${track.recordHolder}</div>
                </div>

                <div class="track-actions">
                    <button class="track-btn primary" onclick="joinRace('${track.id}')">
                        <i class="fas fa-play"></i>
                        Join Race
                    </button>
                    <button class="track-btn secondary" onclick="viewTrackDetails('${track.id}')">
                        <i class="fas fa-info-circle"></i>
                        Details
                    </button>
                </div>
            </div>
        `;
    }

    updateVehiclesDisplay() {
        const vehiclesGrid = document.getElementById('vehiclesGrid');
        if (!vehiclesGrid) return;

        vehiclesGrid.innerHTML = this.vehicles.map(vehicle => this.createVehicleCard(vehicle)).join('');
    }

    createVehicleCard(vehicle) {
        return `
            <div class="vehicle-card">
                <div class="vehicle-header">
                    <div>
                        <div class="vehicle-title">${vehicle.name}</div>
                        <div style="color: #cccccc; font-size: 0.9rem;">${vehicle.description}</div>
                    </div>
                    <div class="vehicle-class ${vehicle.class}">${vehicle.class.toUpperCase()}</div>
                </div>

                <div class="vehicle-stats">
                    <div class="vehicle-stat">
                        <div class="vehicle-stat-label">Top Speed</div>
                        <div class="vehicle-stat-value">${vehicle.topSpeed} km/h</div>
                    </div>
                    <div class="vehicle-stat">
                        <div class="vehicle-stat-label">Acceleration</div>
                        <div class="vehicle-stat-value">${vehicle.acceleration}/100</div>
                    </div>
                    <div class="vehicle-stat">
                        <div class="vehicle-stat-label">Handling</div>
                        <div class="vehicle-stat-value">${vehicle.handling}/100</div>
                    </div>
                    <div class="vehicle-stat">
                        <div class="vehicle-stat-label">Price</div>
                        <div class="vehicle-stat-value">$${this.formatNumber(vehicle.price)}</div>
                    </div>
                </div>

                <div style="margin-bottom: 1rem;">
                    <h4 style="color: #ff6b35; margin-bottom: 0.5rem; font-size: 1rem;">Features</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${vehicle.features.map(feature => `<span style="background: #333; border: 1px solid #444; border-radius: 15px; padding: 0.25rem 0.75rem; color: #cccccc; font-size: 0.8rem; font-weight: bold;">${feature}</span>`).join('')}
                    </div>
                </div>

                <div class="vehicle-actions">
                    <button class="vehicle-btn primary" onclick="buyVehicle('${vehicle.id}')">
                        <i class="fas fa-shopping-cart"></i>
                        Buy Vehicle
                    </button>
                    <button class="vehicle-btn secondary" onclick="viewVehicleDetails('${vehicle.id}')">
                        <i class="fas fa-info-circle"></i>
                        Details
                    </button>
                </div>
            </div>
        `;
    }

    updateRacesDisplay() {
        const racesList = document.getElementById('racesList');
        if (!racesList) return;

        if (this.activeRaces.length === 0) {
            racesList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #cccccc;">
                    <i class="fas fa-flag-checkered" style="font-size: 3rem; margin-bottom: 1rem; color: #ff6b35;"></i>
                    <h3>No Active Races</h3>
                    <p>Join a race from the Tracks tab to get started!</p>
                </div>
            `;
            return;
        }

        racesList.innerHTML = this.activeRaces.map(race => this.createRaceItem(race)).join('');
    }

    createRaceItem(race) {
        return `
            <div class="race-item">
                <div class="race-header">
                    <div class="race-title">${race.trackName}</div>
                    <div class="race-status ${race.status}">${race.status.toUpperCase()}</div>
                </div>

                <div class="race-details">
                    <div class="race-detail">
                        <div class="race-detail-label">Position</div>
                        <div class="race-detail-value">${race.position}/${race.totalRacers}</div>
                    </div>
                    <div class="race-detail">
                        <div class="race-detail-label">Time</div>
                        <div class="race-detail-value">${race.time || '--:--'}</div>
                    </div>
                    <div class="race-detail">
                        <div class="race-detail-label">Prize</div>
                        <div class="race-detail-value">$${this.formatNumber(race.prize)}</div>
                    </div>
                    <div class="race-detail">
                        <div class="race-detail-label">Vehicle</div>
                        <div class="race-detail-value">${race.vehicleName}</div>
                    </div>
                </div>

                <div class="race-actions">
                    <button class="race-btn primary" onclick="continueRace('${race.id}')">
                        <i class="fas fa-play"></i>
                        Continue Race
                    </button>
                    <button class="race-btn secondary" onclick="quitRace('${race.id}')">
                        <i class="fas fa-times"></i>
                        Quit Race
                    </button>
                </div>
            </div>
        `;
    }

    updateLeaderboard() {
        const leaderboardContent = document.getElementById('leaderboardContent');
        if (!leaderboardContent) return;

        // Generate sample leaderboard data
        const sampleLeaderboard = [
            { rank: 1, name: 'Speed Demon', wins: 45, races: 67, winRate: '67.2%', bestTime: '2:15.123' },
            { rank: 2, name: 'Mountain King', wins: 38, races: 52, winRate: '73.1%', bestTime: '2:18.456' },
            { rank: 3, name: 'Rainbow Master', wins: 42, races: 58, winRate: '72.4%', bestTime: '2:22.789' },
            { rank: 4, name: 'Desert Storm', wins: 35, races: 48, winRate: '72.9%', bestTime: '2:25.234' },
            { rank: 5, name: 'Night Rider', wins: 31, races: 43, winRate: '72.1%', bestTime: '2:28.567' }
        ];

        leaderboardContent.innerHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Racer</th>
                        <th>Wins</th>
                        <th>Races</th>
                        <th>Win Rate</th>
                        <th>Best Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${sampleLeaderboard.map(racer => `
                        <tr>
                            <td><span class="leaderboard-rank ${racer.rank <= 3 ? ['first', 'second', 'third'][racer.rank - 1] : ''}">#${racer.rank}</span></td>
                            <td>${racer.name}</td>
                            <td>${racer.wins}</td>
                            <td>${racer.races}</td>
                            <td>${racer.winRate}</td>
                            <td>${racer.bestTime}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    updateGarageDisplay() {
        const garageContent = document.getElementById('garageContent');
        if (!garageContent) return;

        // Get player's vehicles from game state
        const playerVehicles = game.player.vehicles || [];

        if (playerVehicles.length === 0) {
            garageContent.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #cccccc;">
                    <i class="fas fa-car" style="font-size: 3rem; margin-bottom: 1rem; color: #ff6b35;"></i>
                    <h3>No Vehicles in Garage</h3>
                    <p>Buy your first vehicle from the Vehicles tab!</p>
                </div>
            `;
            return;
        }

        garageContent.innerHTML = `
            <div class="garage-grid">
                ${playerVehicles.map(vehicle => this.createGarageVehicleCard(vehicle)).join('')}
            </div>
        `;
    }

    createGarageVehicleCard(vehicle) {
        return `
            <div class="garage-vehicle">
                <div class="garage-vehicle-header">
                    <div>
                        <div class="garage-vehicle-title">${vehicle.name}</div>
                        <div style="color: #cccccc; font-size: 0.9rem;">${vehicle.class.toUpperCase()} Class</div>
                    </div>
                    <div class="garage-vehicle-status ${vehicle.status || 'ready'}">${(vehicle.status || 'ready').toUpperCase()}</div>
                </div>

                <div class="garage-vehicle-stats">
                    <div class="garage-vehicle-stat">
                        <div class="garage-vehicle-stat-label">Top Speed</div>
                        <div class="garage-vehicle-stat-value">${vehicle.topSpeed} km/h</div>
                    </div>
                    <div class="garage-vehicle-stat">
                        <div class="garage-vehicle-stat-label">Acceleration</div>
                        <div class="garage-vehicle-stat-value">${vehicle.acceleration}/100</div>
                    </div>
                    <div class="garage-vehicle-stat">
                        <div class="garage-vehicle-stat-label">Handling</div>
                        <div class="garage-vehicle-stat-value">${vehicle.handling}/100</div>
                    </div>
                    <div class="garage-vehicle-stat">
                        <div class="garage-vehicle-stat-label">Condition</div>
                        <div class="garage-vehicle-stat-value">${vehicle.condition || 100}%</div>
                    </div>
                </div>

                <div class="garage-vehicle-actions">
                    <button class="garage-vehicle-btn primary" onclick="selectVehicle('${vehicle.id}')">
                        <i class="fas fa-check"></i>
                        Select Vehicle
                    </button>
                    <button class="garage-vehicle-btn secondary" onclick="repairVehicle('${vehicle.id}')">
                        <i class="fas fa-wrench"></i>
                        Repair
                    </button>
                </div>
            </div>
        `;
    }

    formatNumber(num) {
        return num.toLocaleString();
    }

    joinRace(trackId) {
        const track = this.tracks.find(t => t.id === trackId);
        if (!track) return;

        if (game.player.money < track.entryFee) {
            game.showNotification(`You need $${this.formatNumber(track.entryFee - game.player.money)} more to join this race!`, 'error');
            return;
        }

        // Check if player has a vehicle
        const playerVehicles = game.player.vehicles || [];
        if (playerVehicles.length === 0) {
            game.showNotification('You need to buy a vehicle first!', 'error');
            return;
        }

        // Deduct entry fee
        game.player.money -= track.entryFee;

        // Create race
        const race = {
            id: `race-${Date.now()}`,
            trackId: trackId,
            trackName: track.name,
            status: 'waiting',
            position: 1,
            totalRacers: Math.floor(Math.random() * 8) + 3, // 3-10 racers
            prize: track.prize,
            vehicleName: playerVehicles[0].name,
            time: null
        };

        this.activeRaces.push(race);
        this.updateRacesDisplay();
        game.updateDisplay();

        game.showNotification(`Joined ${track.name}! Race starting soon...`, 'success');
    }

    buyVehicle(vehicleId) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;

        if (game.player.money < vehicle.price) {
            game.showNotification(`You need $${this.formatNumber(vehicle.price - game.player.money)} more to buy this vehicle!`, 'error');
            return;
        }

        if (confirm(`Are you sure you want to buy ${vehicle.name} for $${this.formatNumber(vehicle.price)}?`)) {
            // Deduct money
            game.player.money -= vehicle.price;
            
            // Add to player vehicles
            if (!game.player.vehicles) {
                game.player.vehicles = [];
            }
            game.player.vehicles.push({
                id: vehicle.id,
                name: vehicle.name,
                class: vehicle.class,
                topSpeed: vehicle.topSpeed,
                acceleration: vehicle.acceleration,
                handling: vehicle.handling,
                condition: 100,
                status: 'ready',
                purchased: Date.now()
            });

            // Update displays
            this.updateGarageDisplay();
            game.updateDisplay();

            game.showNotification(`Congratulations! You now own ${vehicle.name}!`, 'success');
        }
    }
}

// GPS System
class GPSSystem {
    constructor() {
        this.currentLocation = 'City Center';
        this.travelTime = 0;
        this.energyCost = 0;
        this.traveling = false;
        this.locations = {
            'City Center': { district: 'city-center', time: 0, energy: 0 },
            'City Hall': { district: 'city-center', time: 2, energy: 5 },
            'Hospital': { district: 'city-center', time: 3, energy: 8 },
            'Jail': { district: 'city-center', time: 4, energy: 10 },
            'Community Center': { district: 'city-center', time: 2, energy: 5 },
            'Visual Center': { district: 'city-center', time: 3, energy: 8 },
            'Big T\'s Gun Shop': { district: 'east-side', time: 8, energy: 15 },
            'CyberForce': { district: 'east-side', time: 10, energy: 20 },
            'Docks': { district: 'east-side', time: 12, energy: 25 },
            'Pawn Shop': { district: 'east-side', time: 6, energy: 12 },
            'Pharmacy': { district: 'east-side', time: 5, energy: 10 },
            'Post Office': { district: 'east-side', time: 4, energy: 8 },
            'Print Store': { district: 'east-side', time: 3, energy: 6 },
            'Rats\'n\'Ribs': { district: 'east-side', time: 7, energy: 14 },
            'Recycling Center': { district: 'east-side', time: 9, energy: 18 },
            'Super Store': { district: 'east-side', time: 6, energy: 12 },
            'Sweet Shop': { district: 'east-side', time: 4, energy: 8 },
            'TC Clothing': { district: 'east-side', time: 5, energy: 10 },
            'Auction House': { district: 'north-side', time: 10, energy: 20 },
            'Church': { district: 'north-side', time: 8, energy: 16 },
            'Qazaar Directory': { district: 'north-side', time: 9, energy: 18 },
            'Education': { district: 'west-side', time: 12, energy: 25 },
            'Global Gym': { district: 'west-side', time: 10, energy: 20 },
            'Travel Agency': { district: 'west-side', time: 8, energy: 16 },
            'Casino': { district: 'red-light', time: 15, energy: 30 },
            'Dump': { district: 'red-light', time: 18, energy: 35 },
            'Loan Shark': { district: 'red-light', time: 20, energy: 40 },
            'Missions': { district: 'red-light', time: 12, energy: 25 },
            'Raceways': { district: 'red-light', time: 16, energy: 32 },
            'Estate Agents': { district: 'residential', time: 14, energy: 28 },
            'Your Mansion': { district: 'residential', time: 16, energy: 32 },
            'Bank': { district: 'financial', time: 6, energy: 12 },
            'Donator House': { district: 'financial', time: 8, energy: 16 },
            'Messaging Inc': { district: 'financial', time: 5, energy: 10 },
            // Waterways - Lakes (6 * 6 * 999 = 35,964)
            'Lake 1': { district: 'waterways', time: 6, energy: 999, terrain: 'water' },
            'Lake 2': { district: 'waterways', time: 6, energy: 999, terrain: 'water' },
            'Lake 3': { district: 'waterways', time: 6, energy: 999, terrain: 'water' },
            'Lake 4': { district: 'waterways', time: 6, energy: 999, terrain: 'water' },
            'Lake 5': { district: 'waterways', time: 6, energy: 999, terrain: 'water' },
            'Lake 6': { district: 'waterways', time: 6, energy: 999, terrain: 'water' },
            // Ocean (8 * 8 * 999999 = 63,999,936)
            'Ocean': { district: 'waterways', time: 8, energy: 999999, terrain: 'water' },
            // Grass/Farmland (88 * 88 * 360.999.4 = 2,792,960,000)
            'Grassland 1': { district: 'terrain', time: 88, energy: 360999, terrain: 'grass' },
            'Grassland 2': { district: 'terrain', time: 88, energy: 360999, terrain: 'grass' },
            'Farmland 1': { district: 'terrain', time: 88, energy: 360999, terrain: 'farmland' },
            'Farmland 2': { district: 'terrain', time: 88, energy: 360999, terrain: 'farmland' },
            // Dirt Paths (4 * 4 * 2999999 = 47,999,984)
            'Dirt Path 1': { district: 'terrain', time: 4, energy: 2999999, terrain: 'dirt' },
            'Dirt Path 2': { district: 'terrain', time: 4, energy: 2999999, terrain: 'dirt' },
            // Roadways (3 * 7 * 42884239 = 900,569,019)
            'Highway 1': { district: 'terrain', time: 3, energy: 42884239, terrain: 'road' },
            'Highway 2': { district: 'terrain', time: 3, energy: 42884239, terrain: 'road' },
            // Expanded Cities (999 * 999 * 12000000 = 119,880,000,000,000)
            'Metro City 1': { district: 'expanded-cities', time: 999, energy: 12000000, terrain: 'city' },
            'Metro City 2': { district: 'expanded-cities', time: 999, energy: 12000000, terrain: 'city' },
            'Metro City 3': { district: 'expanded-cities', time: 999, energy: 12000000, terrain: 'city' },
            'Metro City 4': { district: 'expanded-cities', time: 999, energy: 12000000, terrain: 'city' },
            'Metro City 5': { district: 'expanded-cities', time: 999, energy: 12000000, terrain: 'city' },
            'Metro City 6': { district: 'expanded-cities', time: 999, energy: 12000000, terrain: 'city' }
        };
        this.init();
    }

    init() {
        this.updateGPSDisplay();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Update GPS display when location changes
        setInterval(() => {
            this.updateGPSDisplay();
        }, 1000);
    }

    updateGPSDisplay() {
        const currentLocationEl = document.getElementById('currentLocation');
        const travelTimeEl = document.getElementById('travelTime');
        const energyCostEl = document.getElementById('energyCost');

        if (currentLocationEl) {
            currentLocationEl.textContent = this.currentLocation;
        }

        if (travelTimeEl) {
            travelTimeEl.textContent = `${this.travelTime} min`;
        }

        if (energyCostEl) {
            energyCostEl.textContent = this.energyCost;
        }
    }

    travelToLocation(locationName) {
        if (this.traveling) {
            game.showNotification('You are already traveling!', 'error');
            return;
        }

        if (this.currentLocation === locationName) {
            game.showNotification('You are already at this location!', 'info');
            return;
        }

        const location = this.locations[locationName];
        if (!location) {
            game.showNotification('Location not found!', 'error');
            return;
        }

        // Check if player has enough energy
        if (game.player.energy < location.energy) {
            game.showNotification(`Not enough energy! Need ${location.energy} energy.`, 'error');
            return;
        }

        // Start travel
        this.traveling = true;
        this.travelTime = location.time;
        this.energyCost = location.energy;

        game.showNotification(`Traveling to ${locationName}...`, 'info');
        
        // Deduct energy immediately
        game.player.energy -= location.energy;
        game.player.location = locationName;
        
        // Start travel timer
        const travelInterval = setInterval(() => {
            this.travelTime--;
            this.updateGPSDisplay();
            
            if (this.travelTime <= 0) {
                clearInterval(travelInterval);
                this.arriveAtLocation(locationName);
            }
        }, 60000); // 1 minute intervals

        game.updateDisplay();
    }

    arriveAtLocation(locationName) {
        this.currentLocation = locationName;
        this.traveling = false;
        this.travelTime = 0;
        this.energyCost = 0;
        
        game.showNotification(`Arrived at ${locationName}!`, 'success');
        this.updateGPSDisplay();
        game.updateDisplay();
        
        // Trigger location-specific events
        this.triggerLocationEvents(locationName);
    }

    triggerLocationEvents(locationName) {
        const location = this.locations[locationName];
        if (!location) return;

        // Terrain-specific events
        switch (location.terrain) {
            case 'water':
                if (locationName.includes('Lake')) {
                    game.showNotification('You are at a peaceful lake. You can fish or rest here.', 'info');
                } else if (locationName === 'Ocean') {
                    game.showNotification('You are at the vast ocean. The waves are powerful here.', 'info');
                }
                break;
            case 'grass':
                game.showNotification('You are in open grassland. Fresh air and natural beauty surround you.', 'info');
                break;
            case 'farmland':
                game.showNotification('You are in farmland. You can see crops and agricultural activities.', 'info');
                break;
            case 'dirt':
                game.showNotification('You are on a dirt path. It\'s rough but manageable.', 'info');
                break;
            case 'road':
                game.showNotification('You are on a highway. Fast travel but high energy cost.', 'info');
                break;
            case 'city':
                game.showNotification('You are in a massive metro city. Urban life surrounds you.', 'info');
                break;
        }

        // Original location events
        switch (locationName) {
            case 'Hospital':
                if (game.player.life < 100) {
                    game.showNotification('You can heal at the hospital!', 'info');
                }
                break;
            case 'Jail':
                if (game.player.cooldowns && game.player.cooldowns.jail > Date.now()) {
                    const timeLeft = Math.ceil((game.player.cooldowns.jail - Date.now()) / 60000);
                    game.showNotification(`You are in jail for ${timeLeft} more minutes!`, 'error');
                }
                break;
            case 'Bank':
                game.showNotification('You can manage your money at the bank!', 'info');
                break;
            case 'Global Gym':
                game.showNotification('You can train your stats at the gym!', 'info');
                break;
            case 'Education':
                game.showNotification('You can study courses at the education center!', 'info');
                break;
            case 'Casino':
                game.showNotification('You can gamble at the casino!', 'info');
                break;
            case 'Your Mansion':
                game.showNotification('Welcome home! You can rest and recover here.', 'success');
                break;
        }
    }

    calculateTravelTime(fromLocation, toLocation) {
        const from = this.locations[fromLocation];
        const to = this.locations[toLocation];
        
        if (!from || !to) return 0;
        
        // Base time calculation
        let baseTime = Math.abs(to.time - from.time);
        
        // Terrain-based modifiers
        if (from.terrain && to.terrain) {
            // Water to land or vice versa
            if ((from.terrain === 'water' && to.terrain !== 'water') || 
                (from.terrain !== 'water' && to.terrain === 'water')) {
                baseTime += 10; // Extra time for terrain change
            }
            
            // City to wilderness
            if (from.terrain === 'city' && to.terrain !== 'city') {
                baseTime += 15; // Extra time to leave city
            }
            
            // Wilderness to city
            if (from.terrain !== 'city' && to.terrain === 'city') {
                baseTime += 20; // Extra time to enter city
            }
        }
        
        // Add district penalty
        if (from.district !== to.district) {
            baseTime += 5; // 5 minutes to cross districts
        }
        
        return Math.max(1, baseTime);
    }

    calculateEnergyCost(fromLocation, toLocation) {
        const from = this.locations[fromLocation];
        const to = this.locations[toLocation];
        
        if (!from || !to) return 0;
        
        // Base energy calculation
        let baseEnergy = Math.abs(to.energy - from.energy);
        
        // Terrain-based energy modifiers
        if (from.terrain && to.terrain) {
            // Water travel is very energy intensive
            if (to.terrain === 'water') {
                baseEnergy *= 1.5; // 50% more energy for water travel
            }
            
            // Highway travel is energy intensive but fast
            if (to.terrain === 'road') {
                baseEnergy *= 1.2; // 20% more energy for highway travel
            }
            
            // City travel is very energy intensive
            if (to.terrain === 'city') {
                baseEnergy *= 2.0; // 100% more energy for city travel
            }
            
            // Terrain change penalties
            if (from.terrain !== to.terrain) {
                baseEnergy *= 1.3; // 30% more energy for terrain change
            }
        }
        
        // Add district penalty
        if (from.district !== to.district) {
            baseEnergy += 10; // 10 energy to cross districts
        }
        
        return Math.max(5, baseEnergy);
    }

    getNearbyLocations() {
        const current = this.locations[this.currentLocation];
        if (!current) return [];
        
        return Object.keys(this.locations).filter(location => {
            const locationData = this.locations[location];
            return locationData.district === current.district && location !== this.currentLocation;
        });
    }

    getDistrictLocations(district) {
        return Object.keys(this.locations).filter(location => {
            return this.locations[location].district === district;
        });
    }
}

// Housing System Functions
function buyProperty(propertyId) {
    window.housingSystem.buyProperty(propertyId);
}

function viewPropertyDetails(propertyId) {
    window.housingSystem.viewPropertyDetails(propertyId);
}

// Newspaper System Functions
function viewArticleDetails(articleId) {
    window.newspaperSystem.showArticleDetails(articleId);
}

function closeArticleModal() {
    window.newspaperSystem.closeArticleModal();
}

function shareArticle() {
    window.newspaperSystem.shareArticle();
}

function saveArticle() {
    window.newspaperSystem.saveArticle();
}

// Mission System Functions
function viewMissionDetails(missionId) {
    window.missionSystem.showMissionDetails(missionId);
}

function acceptMission() {
    const modal = document.getElementById('missionModal');
    const missionId = modal.dataset.missionId;
    if (missionId) {
        window.missionSystem.acceptMission(missionId);
    }
}

function closeMissionModal() {
    window.missionSystem.closeMissionModal();
}

// Jail System Functions
function payBail() {
    window.jailSystem.payBail();
}

function waitForRelease() {
    window.jailSystem.waitForRelease();
}

function attemptEscape() {
    window.jailSystem.attemptEscape();
}

function libraryStudy() {
    window.jailSystem.libraryStudy();
}

function prisonExercise() {
    window.jailSystem.prisonExercise();
}

function prisonCounseling() {
    window.jailSystem.prisonCounseling();
}

function workProgram() {
    window.jailSystem.workProgram();
}

function prisonSocialize() {
    window.jailSystem.prisonSocialize();
}

function prisonMeditation() {
    window.jailSystem.prisonMeditation();
}

// Hospital System Functions
function emergencyTreatment() {
    window.hospitalSystem.emergencyTreatment();
}

function traumaSurgery() {
    window.hospitalSystem.traumaSurgery();
}

function intensiveCare() {
    window.hospitalSystem.intensiveCare();
}

function painRelief() {
    window.hospitalSystem.painRelief();
}

function physicalTherapy() {
    window.hospitalSystem.physicalTherapy();
}

function mentalHealth() {
    window.hospitalSystem.mentalHealth();
}

function healthCheckup() {
    window.hospitalSystem.healthCheckup();
}

function vaccination() {
    window.hospitalSystem.vaccination();
}

function healthInsurance() {
    window.hospitalSystem.healthInsurance();
}

// Character Customization System Functions
function updateCharacter(component, value) {
    window.characterCustomizationSystem.updateCharacter(component, value);
}

function setGender(gender) {
    window.characterCustomizationSystem.setGender(gender);
}

function equipClothing(itemId) {
    // Equip clothing item
    game.showNotification(`Equipped ${itemId}!`, 'success');
}

function equipAccessory(itemId) {
    // Equip accessory item
    game.showNotification(`Equipped ${itemId}!`, 'success');
}

function saveCharacter() {
    window.characterCustomizationSystem.saveCharacter();
}

function randomizeCharacter() {
    window.characterCustomizationSystem.randomizeCharacter();
}

function resetCharacter() {
    window.characterCustomizationSystem.resetCharacter();
}

function exportCharacter() {
    window.characterCustomizationSystem.exportCharacter();
}

function rotateCharacter(direction) {
    window.characterCustomizationSystem.rotateCharacter(direction);
}

function resetCamera() {
    window.characterCustomizationSystem.resetCamera();
}

// Education System Functions
function enrollInCourse(courseId) {
    window.educationSystem.enrollInCourse(courseId);
}

function viewCourseDetails(courseId) {
    const course = window.educationSystem.courses.find(c => c.id === courseId);
    if (!course) return;

    const details = `
        <div style="text-align: left;">
            <h3 style="color: #ff6b35; margin-bottom: 1rem;">${course.name}</h3>
            <p><strong>Category:</strong> ${course.category.charAt(0).toUpperCase() + course.category.slice(1)}</p>
            <p><strong>Duration:</strong> ${course.duration} weeks</p>
            <p><strong>Cost:</strong> $${window.educationSystem.formatNumber(course.cost)}</p>
            <p><strong>Difficulty:</strong> ${course.difficulty}</p>
            <p><strong>Instructor:</strong> ${course.instructor}</p>
            <p><strong>Students:</strong> ${course.currentStudents}/${course.maxStudents}</p>
            <p><strong>Description:</strong> ${course.description}</p>
            <p><strong>Benefits:</strong> ${course.benefits.join(', ')}</p>
        </div>
    `;

    game.showModal('Course Details', details, [
        {
            text: 'Close',
            class: 'secondary',
            onclick: 'closeModal()'
        },
        {
            text: 'Enroll',
            class: 'primary',
            onclick: `enrollInCourse('${course.id}'); closeModal();`
        }
    ]);
}

function viewCertificate(certificateId) {
    const certificate = game.player.education?.certificates?.find(c => c.id === certificateId);
    if (!certificate) return;

    const details = `
        <div style="text-align: left;">
            <h3 style="color: #ff6b35; margin-bottom: 1rem;">${certificate.name}</h3>
            <p><strong>Course:</strong> ${certificate.course}</p>
            <p><strong>Grade:</strong> ${certificate.grade}</p>
            <p><strong>Instructor:</strong> ${certificate.instructor}</p>
            <p><strong>Date Earned:</strong> ${new Date(certificate.date).toLocaleDateString()}</p>
        </div>
    `;

    game.showModal('Certificate Details', details, [
        {
            text: 'Close',
            class: 'secondary',
            onclick: 'closeModal()'
        }
    ]);
}

function downloadCertificate(certificateId) {
    const certificates = {
        'combat': { name: 'Combat Training Certificate', course: 'Combat Training' },
        'business': { name: 'Business Management Certificate', course: 'Business' },
        'computer': { name: 'Computer Science Certificate', course: 'Computer Science' },
        'health': { name: 'Health & Fitness Certificate', course: 'Health & Fitness' },
        'math': { name: 'Mathematics Certificate', course: 'Mathematics' }
    };

    const cert = certificates[certificateId];
    if (!cert) {
        game.showNotification('Invalid certificate!', 'error');
        return;
    }

    // Check if player completed the course
    if (!game.player.education || !game.player.education[cert.course] || !game.player.education[cert.course].completed) {
        game.showNotification(`You must complete ${cert.course} course first!`, 'error');
        return;
    }

    // Generate certificate data
    const certificateData = {
        name: cert.name,
        player: game.player.name,
        date: new Date().toLocaleDateString(),
        course: cert.course,
        level: game.player.level
    };

    // Create downloadable certificate
    const certificateText = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              CRIME CITY CERTIFICATE                        ║
║                                                           ║
║  This certifies that                                      ║
║                                                           ║
║  ${certificateData.player.padEnd(50)} ║
║                                                           ║
║  has successfully completed                               ║
║                                                           ║
║  ${cert.name.padEnd(50)} ║
║                                                           ║
║  Course: ${cert.course.padEnd(45)} ║
║  Date: ${certificateData.date.padEnd(47)} ║
║  Level: ${certificateData.level.toString().padEnd(47)} ║
║                                                           ║
║  Crime City Education System                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `;

    // Create download link
    const blob = new Blob([certificateText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    game.showNotification(`Certificate "${cert.name}" downloaded!`, 'success');
}

function accessResource(resourceId) {
    const resources = {
        'weapons': { name: 'Weapon Database', cost: 500, unlock: 'Access to rare weapons' },
        'intel': { name: 'Intelligence Network', cost: 1000, unlock: 'Access to mission intel' },
        'contacts': { name: 'Contact Database', cost: 750, unlock: 'Access to NPC contacts' },
        'maps': { name: 'City Maps', cost: 300, unlock: 'Access to detailed city maps' },
        'hacking': { name: 'Hacking Tools', cost: 2000, unlock: 'Access to hacking resources' }
    };

    const resource = resources[resourceId];
    if (!resource) {
        game.showNotification('Invalid resource!', 'error');
        return;
    }

    if (!game.player.resources) {
        game.player.resources = [];
    }

    if (game.player.resources.includes(resourceId)) {
        game.showNotification(`You already have access to ${resource.name}!`, 'info');
        return;
    }

    if (game.player.money >= resource.cost) {
        if (confirm(`Purchase access to ${resource.name}?\n\nCost: $${resource.cost.toLocaleString()}\nUnlock: ${resource.unlock}\n\nProceed?`)) {
            if (game.spendMoney(resource.cost)) {
                game.player.resources.push(resourceId);
                game.showNotification(`Access granted to ${resource.name}!`, 'success');
                game.updateDisplay();
            }
        }
    } else {
        game.showNotification(`Not enough money! Need $${resource.cost.toLocaleString()}.`, 'error');
    }
}

// Vehicle Control System Functions
function selectActiveVehicle(vehicleId) {
    window.vehicleControlSystem.selectActiveVehicle(vehicleId);
}

function toggleEngine() {
    window.vehicleControlSystem.toggleEngine();
}

function toggleHood() {
    window.vehicleControlSystem.toggleHood();
}

function toggleTrunk() {
    window.vehicleControlSystem.toggleTrunk();
}

function toggleDoor(doorIndex) {
    window.vehicleControlSystem.toggleDoor(doorIndex);
}

function toggleAllDoors() {
    window.vehicleControlSystem.toggleAllDoors();
}

function toggleWindow(windowIndex) {
    window.vehicleControlSystem.toggleWindow(windowIndex);
}

function toggleFrontWindows() {
    window.vehicleControlSystem.toggleFrontWindows();
}

function toggleBackWindows() {
    window.vehicleControlSystem.toggleBackWindows();
}

function toggleAllWindows() {
    window.vehicleControlSystem.toggleAllWindows();
}

function changeSeat(seatIndex) {
    window.vehicleControlSystem.changeSeat(seatIndex);
}

function toggleInteriorLight() {
    window.vehicleControlSystem.toggleInteriorLight();
}

// Raceway System Functions
function joinRace(trackId) {
    window.racewaySystem.joinRace(trackId);
}

function buyVehicle(vehicleId) {
    window.racewaySystem.buyVehicle(vehicleId);
}

function viewTrackDetails(trackId) {
    const track = window.racewaySystem.tracks.find(t => t.id === trackId);
    if (!track) return;

    const details = `
        <div style="text-align: left;">
            <h3 style="color: #ff6b35; margin-bottom: 1rem;">${track.name}</h3>
            <p><strong>Difficulty:</strong> ${track.difficulty.charAt(0).toUpperCase() + track.difficulty.slice(1)}</p>
            <p><strong>Length:</strong> ${track.length}</p>
            <p><strong>Laps:</strong> ${track.laps}</p>
            <p><strong>Prize:</strong> $${window.racewaySystem.formatNumber(track.prize)}</p>
            <p><strong>Entry Fee:</strong> $${window.racewaySystem.formatNumber(track.entryFee)}</p>
            <p><strong>Best Time:</strong> ${track.bestTime} by ${track.recordHolder}</p>
            <p><strong>Features:</strong> ${track.features.join(', ')}</p>
        </div>
    `;

    game.showModal('Track Details', details, [
        {
            text: 'Close',
            class: 'secondary',
            onclick: 'closeModal()'
        },
        {
            text: 'Join Race',
            class: 'primary',
            onclick: `joinRace('${track.id}'); closeModal();`
        }
    ]);
}

function viewVehicleDetails(vehicleId) {
    const vehicle = window.racewaySystem.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const details = `
        <div style="text-align: left;">
            <h3 style="color: #ff6b35; margin-bottom: 1rem;">${vehicle.name}</h3>
            <p><strong>Class:</strong> ${vehicle.class.charAt(0).toUpperCase() + vehicle.class.slice(1)}</p>
            <p><strong>Top Speed:</strong> ${vehicle.topSpeed} km/h</p>
            <p><strong>Acceleration:</strong> ${vehicle.acceleration}/100</p>
            <p><strong>Handling:</strong> ${vehicle.handling}/100</p>
            <p><strong>Price:</strong> $${window.racewaySystem.formatNumber(vehicle.price)}</p>
            <p><strong>Features:</strong> ${vehicle.features.join(', ')}</p>
        </div>
    `;

    game.showModal('Vehicle Details', details, [
        {
            text: 'Close',
            class: 'secondary',
            onclick: 'closeModal()'
        },
        {
            text: 'Buy Vehicle',
            class: 'primary',
            onclick: `buyVehicle('${vehicle.id}'); closeModal();`
        }
    ]);
}

function continueRace(raceId) {
    const race = window.racewaySystem.activeRaces.find(r => r.id === raceId);
    if (!race) return;

    // Simulate race progress
    race.status = 'racing';
    race.time = `${Math.floor(Math.random() * 5) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}.${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // Random position change
    race.position = Math.floor(Math.random() * race.totalRacers) + 1;
    
    window.racewaySystem.updateRacesDisplay();
    game.showNotification(`Race in progress! Current position: ${race.position}`, 'info');
}

function quitRace(raceId) {
    const raceIndex = window.racewaySystem.activeRaces.findIndex(r => r.id === raceId);
    if (raceIndex === -1) return;

    window.racewaySystem.activeRaces.splice(raceIndex, 1);
    window.racewaySystem.updateRacesDisplay();
    game.showNotification('You quit the race!', 'info');
}

function selectVehicle(vehicleId) {
    const vehicle = game.player.vehicles?.find(v => v.id === vehicleId);
    if (!vehicle) return;

    // Set as active vehicle
    game.player.activeVehicle = vehicleId;
    game.showNotification(`Selected ${vehicle.name} as your racing vehicle!`, 'success');
}

function repairVehicle(vehicleId) {
    const vehicle = game.player.vehicles?.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const repairCost = Math.floor((100 - vehicle.condition) * 100);
    if (game.player.money < repairCost) {
        game.showNotification(`You need $${repairCost} to repair this vehicle!`, 'error');
        return;
    }

    if (confirm(`Repair ${vehicle.name} for $${repairCost}?`)) {
        game.player.money -= repairCost;
        vehicle.condition = 100;
        vehicle.status = 'ready';
        
        window.racewaySystem.updateGarageDisplay();
        game.updateDisplay();
        game.showNotification(`${vehicle.name} has been fully repaired!`, 'success');
    }
}

// GPS System Functions
function travelToLocation(locationName) {
    window.gpsSystem.travelToLocation(locationName);
}

function toggleMapView() {
    const cityMap = document.getElementById('cityMap');
    if (cityMap) {
        cityMap.classList.toggle('map-view-toggle');
    }
}

function showQuickTravel() {
    // Create quick travel modal
    const modal = document.createElement('div');
    modal.className = 'quick-travel-modal';
    modal.id = 'quickTravelModal';
    
    const content = document.createElement('div');
    content.className = 'quick-travel-content';
    
    content.innerHTML = `
        <h3><i class="fas fa-route"></i> Quick Travel</h3>
        <div class="quick-travel-grid" id="quickTravelGrid">
            <!-- Quick travel options will be populated here -->
        </div>
        <div style="text-align: center; margin-top: 1rem;">
            <button class="game-btn secondary" onclick="closeQuickTravel()">Close</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Populate quick travel options
    populateQuickTravel();
}

function closeQuickTravel() {
    const modal = document.getElementById('quickTravelModal');
    if (modal) {
        modal.remove();
    }
}

function populateQuickTravel() {
    const grid = document.getElementById('quickTravelGrid');
    if (!grid) return;
    
    const currentLocation = window.gpsSystem.currentLocation;
    const nearbyLocations = window.gpsSystem.getNearbyLocations();
    
    let html = '';
    
    // Add nearby locations first
    if (nearbyLocations.length > 0) {
        html += '<h4 style="color: #ff6b35; margin-bottom: 1rem; grid-column: 1 / -1;">Nearby Locations</h4>';
        nearbyLocations.forEach(location => {
            const locationData = window.gpsSystem.locations[location];
            html += `
                <div class="quick-travel-item" onclick="quickTravelTo('${location}')">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <strong>${location}</strong>
                        <br>
                        <small>${locationData.time} min, ${locationData.energy} energy</small>
                    </div>
                </div>
            `;
        });
    }
    
    // Add all districts
    const districts = ['city-center', 'east-side', 'north-side', 'west-side', 'red-light', 'residential', 'financial', 'waterways', 'terrain', 'expanded-cities'];
    districts.forEach(district => {
        const districtLocations = window.gpsSystem.getDistrictLocations(district);
        if (districtLocations.length > 0) {
            const districtName = district.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            html += `<h4 style="color: #ff6b35; margin-bottom: 1rem; grid-column: 1 / -1;">${districtName}</h4>`;
            
            districtLocations.forEach(location => {
                if (location !== currentLocation) {
                    const locationData = window.gpsSystem.locations[location];
                    html += `
                        <div class="quick-travel-item" onclick="quickTravelTo('${location}')">
                            <i class="fas fa-map-marker-alt"></i>
                            <div>
                                <strong>${location}</strong>
                                <br>
                                <small>${locationData.time} min, ${locationData.energy} energy</small>
                            </div>
                        </div>
                    `;
                }
            });
        }
    });
    
    grid.innerHTML = html;
}

function quickTravelTo(locationName) {
    closeQuickTravel();
    travelToLocation(locationName);
}

// Market tab functionality
function showMarketTab(tabName) {
    document.querySelectorAll('.market-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.market-tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    if (tabName === 'buy') {
        window.marketSystem.updateBuyTab();
    } else if (tabName === 'sell') {
        window.marketSystem.updateSellTab();
    } else if (tabName === 'property') {
        window.marketSystem.updatePropertyTab();
    }
}

function setItemCategory(category) {
    window.marketSystem.setCategory(category);
}

// Global functions for the new game systems
function findOpponent() {
    window.battleSystem.findOpponent();
}

function startTraining() {
    window.battleSystem.startTraining();
}

function joinTournament() {
    window.battleSystem.joinTournament();
}

async function commitCrime(crimeType) {
    try {
        const response = await fetch('/api/game/crime', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ crimeType })
        });

        const data = await response.json();
        
        if (response.ok) {
            if (data.result.success) {
                game.showNotification(`Crime successful! Earned $${data.result.reward}`, 'success');
            } else if (data.result.arrested) {
                game.showNotification('You were arrested! Lost 20 life points.', 'error');
            } else {
                game.showNotification('Crime failed!', 'error');
            }
            game.updateDisplay();
        } else {
            game.showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('Crime error:', error);
        game.showNotification('Crime failed!', 'error');
    }
}

async function findJob() {
    try {
        // Show available jobs
        const jobs = [
            { name: 'Fast Food Worker', requirements: 'Manual Labor: 50', pay: 15 },
            { name: 'Security Guard', requirements: 'Strength: 60, Defense: 50', pay: 25 },
            { name: 'Delivery Driver', requirements: 'Speed: 60, Dexterity: 50', pay: 20 },
            { name: 'Construction Worker', requirements: 'Manual Labor: 80, Strength: 70', pay: 35 },
            { name: 'Software Developer', requirements: 'Intelligence: 80, Endurance: 60', pay: 50 }
        ];

        let jobList = 'Available Jobs:\n\n';
        jobs.forEach((job, index) => {
            jobList += `${index + 1}. ${job.name}\n   Requirements: ${job.requirements}\n   Pay: $${job.pay}/hour\n\n`;
        });

        const choice = prompt(jobList + 'Enter job number (1-5) or 0 to cancel:');
        const jobIndex = parseInt(choice) - 1;

        if (jobIndex >= 0 && jobIndex < jobs.length) {
            const selectedJob = jobs[jobIndex];
            
            const response = await fetch('/api/game/job/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ jobName: selectedJob.name })
            });

            const data = await response.json();
            
            if (response.ok) {
                game.showNotification(`Successfully applied for ${selectedJob.name}!`, 'success');
                game.updateDisplay();
            } else {
                game.showNotification(data.error, 'error');
            }
        }
    } catch (error) {
        console.error('Job application error:', error);
        game.showNotification('Job application failed!', 'error');
    }
}

async function work() {
    try {
        const response = await fetch('/api/game/job/work', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            game.showNotification(`Work completed! Earned $${data.earnings}`, 'success');
            game.updateDisplay();
        } else {
            game.showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('Work error:', error);
        game.showNotification('Work failed!', 'error');
    }
}

async function enrollInCourse(courseName) {
    try {
        const response = await fetch('/api/game/education/enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ course: courseName })
        });

        const data = await response.json();
        
        if (response.ok) {
            game.showNotification(`Enrolled in ${courseName}! Cost: $${data.cost}`, 'success');
            game.updateDisplay();
        } else {
            game.showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('Education enrollment error:', error);
        game.showNotification('Enrollment failed!', 'error');
    }
}

async function completeCourse(courseName) {
    try {
        const response = await fetch('/api/game/education/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ course: courseName })
        });

        const data = await response.json();
        
        if (response.ok) {
            game.showNotification(`Course completed! Stats improved.`, 'success');
            game.updateDisplay();
        } else {
            game.showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('Course completion error:', error);
        game.showNotification('Course completion failed!', 'error');
    }
}

async function buyProperty(propertyName) {
    try {
        const response = await fetch('/api/game/property/buy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ propertyName })
        });

        const data = await response.json();
        
        if (response.ok) {
            game.showNotification(`Property purchased: ${propertyName}!`, 'success');
            game.updateDisplay();
        } else {
            game.showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('Property purchase error:', error);
        game.showNotification('Property purchase failed!', 'error');
    }
}

async function createFaction(factionName) {
    try {
        const response = await fetch('/api/game/faction/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ factionName })
        });

        const data = await response.json();
        
        if (response.ok) {
            game.showNotification(`Faction "${factionName}" created successfully!`, 'success');
            game.updateDisplay();
        } else {
            game.showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('Faction creation error:', error);
        game.showNotification('Faction creation failed!', 'error');
    }
}

function factionWar() {
    if (!game.player.faction || !game.player.faction.name) {
        game.showNotification('You must be in a faction to start a war!', 'error');
        return;
    }

    const enemyFactions = [
        { name: 'The Syndicate', power: 150, reward: 50000 },
        { name: 'Street Kings', power: 80, reward: 25000 },
        { name: 'The Cartel', power: 200, reward: 75000 },
        { name: 'Night Runners', power: 100, reward: 35000 },
        { name: 'Iron Fist', power: 180, reward: 60000 }
    ];

    let factionList = 'Enemy Factions:\n\n';
    enemyFactions.forEach((faction, index) => {
        factionList += `${index + 1}. ${faction.name}\n   Power: ${faction.power} | Reward: $${faction.reward.toLocaleString()}\n\n`;
    });

    const choice = prompt(factionList + 'Enter faction number to declare war (1-5) or 0 to cancel:');
    const factionIndex = parseInt(choice) - 1;

    if (factionIndex >= 0 && factionIndex < enemyFactions.length) {
        const enemy = enemyFactions[factionIndex];
        const playerPower = (game.player.stats.strength + game.player.stats.defense + game.player.stats.speed) / 3;
        const winChance = Math.min(0.9, Math.max(0.1, playerPower / enemy.power));

        if (confirm(`Declare war on ${enemy.name}?\n\nYour Power: ${Math.floor(playerPower)}\nEnemy Power: ${enemy.power}\nWin Chance: ${Math.floor(winChance * 100)}%\nReward: $${enemy.reward.toLocaleString()}\n\nProceed?`)) {
            if (game.player.energy >= 50) {
                game.player.energy -= 50;
                const won = Math.random() < winChance;

                if (won) {
                    game.addMoney(enemy.reward);
                    game.player.factionStats.warsWon += 1;
                    game.showNotification(`War won against ${enemy.name}! Earned $${enemy.reward.toLocaleString()}!`, 'success');
                } else {
                    game.changeLife(-20);
                    game.player.factionStats.warsLost += 1;
                    game.showNotification(`War lost against ${enemy.name}! Lost 20 life points.`, 'error');
                }
                game.updateDisplay();
            } else {
                game.showNotification('Not enough energy! Need 50 energy.', 'error');
            }
        }
    }
}

function factionRaid() {
    if (!game.player.faction || !game.player.faction.name) {
        game.showNotification('You must be in a faction to start a raid!', 'error');
        return;
    }

    const raidTargets = [
        { name: 'Bank', difficulty: 'Hard', reward: 100000, energy: 60 },
        { name: 'Jewelry Store', difficulty: 'Medium', reward: 50000, energy: 40 },
        { name: 'Warehouse', difficulty: 'Easy', reward: 25000, energy: 30 },
        { name: 'Armored Truck', difficulty: 'Very Hard', reward: 200000, energy: 80 }
    ];

    let targetList = 'Raid Targets:\n\n';
    raidTargets.forEach((target, index) => {
        targetList += `${index + 1}. ${target.name}\n   Difficulty: ${target.difficulty} | Reward: $${target.reward.toLocaleString()} | Energy: ${target.energy}\n\n`;
    });

    const choice = prompt(targetList + 'Enter target number (1-4) or 0 to cancel:');
    const targetIndex = parseInt(choice) - 1;

    if (targetIndex >= 0 && targetIndex < raidTargets.length) {
        const target = raidTargets[targetIndex];
        
        if (game.player.energy >= target.energy) {
            game.player.energy -= target.energy;
            const successRate = target.difficulty === 'Easy' ? 0.8 : target.difficulty === 'Medium' ? 0.6 : target.difficulty === 'Hard' ? 0.4 : 0.2;
            const success = Math.random() < successRate;

            if (success) {
                game.addMoney(target.reward);
                game.showNotification(`Raid successful! Earned $${target.reward.toLocaleString()} from ${target.name}!`, 'success');
            } else {
                game.changeLife(-15);
                game.showNotification(`Raid failed! Lost 15 life points.`, 'error');
            }
            game.updateDisplay();
        } else {
            game.showNotification(`Not enough energy! Need ${target.energy} energy.`, 'error');
        }
    }
}

function factionRecruit() {
    if (!game.player.faction || !game.player.faction.name || !game.player.faction.created) {
        game.showNotification('You must own a faction to recruit members!', 'error');
        return;
    }

    const recruitCost = 10000;
    if (game.player.money >= recruitCost) {
        if (confirm(`Recruit a new member?\n\nCost: $${recruitCost.toLocaleString()}\n\nThis will add a member to your faction. Proceed?`)) {
            if (game.spendMoney(recruitCost)) {
                if (!game.player.faction.members) game.player.faction.members = [game.player.name];
                game.player.faction.members.push(`Member ${game.player.faction.members.length}`);
                game.player.factionStats.membersRecruited += 1;
                game.showNotification(`Recruited a new member! Your faction now has ${game.player.faction.members.length} members.`, 'success');
                game.updateDisplay();
            }
        }
    } else {
        game.showNotification(`Not enough money! Need $${recruitCost.toLocaleString()}.`, 'error');
    }
}

function factionUpgrade() {
    if (!game.player.faction || !game.player.faction.name || !game.player.faction.created) {
        game.showNotification('You must own a faction to upgrade it!', 'error');
        return;
    }

    const upgrades = [
        { name: 'Increase Territory', cost: 50000, effect: 'Adds 1 territory' },
        { name: 'Improve Facilities', cost: 100000, effect: 'Increases member capacity' },
        { name: 'Weapon Stockpile', cost: 75000, effect: 'Improves faction combat power' },
        { name: 'Security System', cost: 50000, effect: 'Reduces raid success rate against you' }
    ];

    let upgradeList = 'Faction Upgrades:\n\n';
    upgrades.forEach((upgrade, index) => {
        upgradeList += `${index + 1}. ${upgrade.name}\n   Cost: $${upgrade.cost.toLocaleString()} | Effect: ${upgrade.effect}\n\n`;
    });

    const choice = prompt(upgradeList + 'Enter upgrade number (1-4) or 0 to cancel:');
    const upgradeIndex = parseInt(choice) - 1;

    if (upgradeIndex >= 0 && upgradeIndex < upgrades.length) {
        const upgrade = upgrades[upgradeIndex];
        if (game.spendMoney(upgrade.cost)) {
            if (upgrade.name === 'Increase Territory') {
                if (!game.player.faction.territory) game.player.faction.territory = 0;
                game.player.faction.territory += 1;
                game.player.factionStats.territoryControlled += 1;
            }
            game.showNotification(`Upgraded: ${upgrade.name}!`, 'success');
            game.updateDisplay();
        }
    }
}

function factionSearch() {
    const allFactions = [
        { name: 'The Syndicate', members: 15, territory: 3, leader: 'Shadow' },
        { name: 'Street Kings', members: 8, territory: 1, leader: 'Razor' },
        { name: 'The Cartel', members: 25, territory: 5, leader: 'Viper' },
        { name: 'Night Runners', members: 12, territory: 2, leader: 'Ghost' },
        { name: 'Iron Fist', members: 20, territory: 4, leader: 'Blade' },
        { name: 'Crimson Shadows', members: 18, territory: 3, leader: 'Scarlet' },
        { name: 'Black Hand', members: 22, territory: 4, leader: 'Reaper' }
    ];

    let factionList = 'All Factions:\n\n';
    allFactions.forEach((faction, index) => {
        factionList += `${index + 1}. ${faction.name}\n   Leader: ${faction.leader} | Members: ${faction.members} | Territory: ${faction.territory}\n\n`;
    });

    alert(factionList);
}

function findFaction() {
    factionSearch();
}

function createFaction() {
    if (game.player.money < 30000000) {
        game.showNotification('You need $30,000,000 to create a faction!', 'error');
        return;
    }
    
    if (confirm('Create a faction for $30,000,000?')) {
        game.player.money -= 30000000;
        game.showNotification('Faction created successfully!', 'success');
        game.updateDisplay();
    }
}

// Drug System Functions (Integrated into Market)
function showDrugCollection() {
    // Switch to market tab and drugs category
    showMarketTab('buy');
    setItemCategory('drugs');
}

function showDrugDealing() {
    // Switch to market tab and sell section
    showMarketTab('sell');
}

function showFactionInventory() {
    if (game.player.faction.name === "None") {
        game.showNotification('You must be in a faction to access faction inventory!', 'error');
        return;
    }
    
    // Switch to market tab and faction section
    showMarketTab('faction');
}

function useDrug(drugType) {
    window.drugSystem.useDrug(drugType);
}

function collectDrug(drugType, location) {
    window.drugSystem.collectDrug(drugType, location);
    // Refresh the market display
    window.marketSystem.updateBuyTab();
}

function dealDrug(drugType, location) {
    window.drugSystem.dealDrug(drugType, location);
    // Refresh the market display
    window.marketSystem.updateSellTab();
}

function withdrawFromFaction(drugType, category, quantity) {
    if (!game.player.factionPermissions.canWithdrawDrugs && category === 'drugs') {
        game.showNotification('You do not have permission to withdraw drugs from faction inventory!', 'error');
        return;
    }
    
    if (!game.player.factionPermissions.canWithdrawWeapons && category === 'weapons') {
        game.showNotification('You do not have permission to withdraw weapons from faction inventory!', 'error');
        return;
    }
    
    if (!game.player.factionPermissions.canWithdrawArmor && category === 'armor') {
        game.showNotification('You do not have permission to withdraw armor from faction inventory!', 'error');
        return;
    }
    
    if (!game.player.factionPermissions.canWithdrawMisc && category === 'misc') {
        game.showNotification('You do not have permission to withdraw miscellaneous items from faction inventory!', 'error');
        return;
    }
    
    // Withdraw logic would go here
    game.showNotification(`Withdrew ${quantity} ${drugType} from faction inventory!`, 'success');
}

function depositToFaction(drugType, category, quantity) {
    if (!game.player.factionPermissions.canAccessInventory) {
        game.showNotification('You do not have permission to access faction inventory!', 'error');
        return;
    }
    
    // Deposit logic would go here
    game.showNotification(`Deposited ${quantity} ${drugType} to faction inventory!`, 'success');
}

// AI-Robot City Management System
class FactionSystem {
    constructor() {
        this.factions = [];
        this.wars = [];
        this.raids = [];
    }

    createFaction(name, description) {
        if (game.player.money < 30000000) {
            game.showNotification('You need $30,000,000 to create a faction!', 'error');
            return;
        }

        const faction = {
            name: name,
            description: description,
            leader: game.player.name,
            members: [game.player.name],
            money: 0,
            territory: 0,
            wars: 0,
            raids: 0,
            created: new Date().toISOString()
        };

        this.factions.push(faction);
        game.player.money -= 30000000;
        game.player.faction = faction;
        
        game.showNotification(`Faction "${name}" created successfully!`, 'success');
        game.updateDisplay();
    }

    joinFaction(factionName) {
        const faction = this.factions.find(f => f.name === factionName);
        if (!faction) {
            game.showNotification('Faction not found!', 'error');
            return;
        }

        if (faction.members.includes(game.player.name)) {
            game.showNotification('You are already a member of this faction!', 'error');
            return;
        }

        faction.members.push(game.player.name);
        game.player.faction = faction;
        
        game.showNotification(`Joined faction "${factionName}"!`, 'success');
        game.updateDisplay();
    }

    leaveFaction() {
        if (!game.player.faction) {
            game.showNotification('You are not in a faction!', 'error');
            return;
        }

        const faction = game.player.faction;
        faction.members = faction.members.filter(member => member !== game.player.name);
        game.player.faction = null;
        
        game.showNotification(`Left faction "${faction.name}"!`, 'success');
        game.updateDisplay();
    }

    startWar(targetFaction) {
        if (!game.player.faction) {
            game.showNotification('You must be in a faction to start a war!', 'error');
            return;
        }

        const war = {
            attacker: game.player.faction.name,
            defender: targetFaction,
            startTime: new Date().toISOString(),
            status: 'active'
        };

        this.wars.push(war);
        game.player.faction.wars++;
        
        game.showNotification(`War declared on "${targetFaction}"!`, 'success');
        game.updateDisplay();
    }

    startRaid(target) {
        if (!game.player.faction) {
            game.showNotification('You must be in a faction to start a raid!', 'error');
            return;
        }

        const raid = {
            faction: game.player.faction.name,
            target: target,
            startTime: new Date().toISOString(),
            status: 'active'
        };

        this.raids.push(raid);
        game.player.faction.raids++;
        
        game.showNotification(`Raid started on "${target}"!`, 'success');
        game.updateDisplay();
    }
}

class AIRobotSystem {
    constructor() {
        this.robots = [];
        this.constructionQueue = [];
        this.cityZones = {
            residential: { capacity: 1000, current: 0, growth: 0.02 },
            commercial: { capacity: 500, current: 0, growth: 0.015 },
            industrial: { capacity: 300, current: 0, growth: 0.01 },
            government: { capacity: 100, current: 0, growth: 0.005 }
        };
        this.constructionProjects = [];
        this.cityStats = {
            population: 0,
            housing: 0,
            employment: 0,
            infrastructure: 0,
            happiness: 50,
            crime: 10,
            pollution: 5
        };
        this.autoSaveInterval = null;
        this.init();
    }

    init() {
        this.spawnInitialRobots();
        this.startConstructionCycle();
        this.startAutoSave();
        this.setupEventListeners();
        this.loadCityState();
        this.updateCityDisplay();
        this.startLiveUpdates();
    }

    spawnInitialRobots() {
        // Create different types of AI robots
        this.robots = [
            {
                id: 'builder-001',
                type: 'construction',
                name: 'Builder Bot Alpha',
                status: 'active',
                location: 'residential',
                efficiency: 0.8,
                specialization: 'housing',
                currentTask: null,
                tasksCompleted: 0
            },
            {
                id: 'planner-001',
                type: 'planning',
                name: 'City Planner Bot',
                status: 'active',
                location: 'city_hall',
                efficiency: 0.9,
                specialization: 'urban_planning',
                currentTask: null,
                tasksCompleted: 0
            },
            {
                id: 'maintainer-001',
                type: 'maintenance',
                name: 'Maintenance Bot',
                status: 'active',
                location: 'industrial',
                efficiency: 0.7,
                specialization: 'infrastructure',
                currentTask: null,
                tasksCompleted: 0
            },
            {
                id: 'security-001',
                type: 'security',
                name: 'Security Bot',
                status: 'active',
                location: 'commercial',
                efficiency: 0.85,
                specialization: 'law_enforcement',
                currentTask: null,
                tasksCompleted: 0
            }
        ];
    }

    startConstructionCycle() {
        setInterval(() => {
            this.processConstructionQueue();
            this.assignRobotTasks();
            this.updateCityStats();
            this.generateNewProjects();
        }, 5000); // Every 5 seconds
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.saveCityState();
        }, 10000); // Auto-save every 10 seconds
    }

    processConstructionQueue() {
        this.constructionQueue.forEach((project, index) => {
            if (project.status === 'in_progress') {
                project.progress += this.calculateProgress(project);
                
                if (project.progress >= 100) {
                    this.completeConstruction(project);
                    this.constructionQueue.splice(index, 1);
                }
            }
        });
    }

    calculateProgress(project) {
        const baseProgress = 2; // Base 2% progress per cycle
        const robotBonus = this.getRobotEfficiency(project.type);
        const zoneBonus = this.getZoneBonus(project.zone);
        
        return baseProgress * robotBonus * zoneBonus;
    }

    getRobotEfficiency(projectType) {
        const relevantRobots = this.robots.filter(robot => 
            robot.specialization === projectType || robot.type === 'construction'
        );
        
        if (relevantRobots.length === 0) return 0.5;
        
        const totalEfficiency = relevantRobots.reduce((sum, robot) => sum + robot.efficiency, 0);
        return Math.min(2.0, totalEfficiency / relevantRobots.length);
    }

    getZoneBonus(zone) {
        const zoneData = this.cityZones[zone];
        if (!zoneData) return 1.0;
        
        const capacityRatio = zoneData.current / zoneData.capacity;
        return Math.max(0.5, 1.0 - (capacityRatio * 0.5));
    }

    completeConstruction(project) {
        // Add completed building to city
        this.cityZones[project.zone].current += project.capacity;
        this.cityStats.housing += project.housingUnits || 0;
        this.cityStats.population += project.population || 0;
        this.cityStats.employment += project.jobs || 0;
        
        // Update robot stats
        const assignedRobot = this.robots.find(robot => robot.currentTask === project.id);
        if (assignedRobot) {
            assignedRobot.tasksCompleted++;
            assignedRobot.currentTask = null;
        }
        
        // Mark project as completed
        project.status = 'completed';
        
        // Add live construction update
        this.addConstructionUpdate(
            `🏗️ ${project.name} completed in ${project.zone}! Added ${project.housingUnits || 0} housing units and ${project.jobs || 0} jobs.`,
            'success'
        );
        
        console.log(`🏗️ Construction completed: ${project.name} in ${project.zone}`);
    }

    assignRobotTasks() {
        this.robots.forEach(robot => {
            if (!robot.currentTask) {
                const availableProject = this.findAvailableProject(robot);
                if (availableProject) {
                    robot.currentTask = availableProject.id;
                    availableProject.status = 'in_progress';
                    availableProject.assignedRobot = robot.id;
                }
            }
        });
    }

    findAvailableProject(robot) {
        return this.constructionQueue.find(project => 
            project.status === 'queued' && 
            (robot.specialization === project.type || robot.type === 'construction')
        );
    }

    generateNewProjects() {
        // Generate new construction projects based on city needs
        const needs = this.analyzeCityNeeds();
        
        needs.forEach(need => {
            if (Math.random() < 0.3) { // 30% chance to generate new project
                const project = this.createConstructionProject(need);
                this.constructionQueue.push(project);
            }
        });
    }

    analyzeCityNeeds() {
        const needs = [];
        
        // Housing needs
        if (this.cityStats.population > this.cityStats.housing * 0.8) {
            needs.push({ type: 'housing', priority: 'high', zone: 'residential' });
        }
        
        // Employment needs
        if (this.cityStats.population > this.cityStats.employment * 1.2) {
            needs.push({ type: 'commercial', priority: 'medium', zone: 'commercial' });
        }
        
        // Infrastructure needs
        if (this.cityStats.infrastructure < this.cityStats.population * 0.1) {
            needs.push({ type: 'infrastructure', priority: 'high', zone: 'industrial' });
        }
        
        // Government needs
        if (this.cityStats.population > 1000 && this.cityZones.government.current < 50) {
            needs.push({ type: 'government', priority: 'medium', zone: 'government' });
        }
        
        return needs;
    }

    createConstructionProject(need) {
        const projectTypes = {
            housing: {
                name: 'Residential Complex',
                type: 'housing',
                capacity: 50,
                housingUnits: 25,
                population: 75,
                jobs: 5,
                cost: 50000,
                duration: 300 // 5 minutes
            },
            commercial: {
                name: 'Business District',
                type: 'commercial',
                capacity: 30,
                housingUnits: 0,
                population: 0,
                jobs: 50,
                cost: 75000,
                duration: 400
            },
            infrastructure: {
                name: 'Infrastructure Project',
                type: 'infrastructure',
                capacity: 20,
                housingUnits: 0,
                population: 0,
                jobs: 25,
                cost: 100000,
                duration: 600
            },
            government: {
                name: 'Government Building',
                type: 'government',
                capacity: 10,
                housingUnits: 0,
                population: 0,
                jobs: 15,
                cost: 150000,
                duration: 800
            }
        };
        
        const template = projectTypes[need.type];
        return {
            id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: template.name,
            type: template.type,
            zone: need.zone,
            priority: need.priority,
            status: 'queued',
            progress: 0,
            capacity: template.capacity,
            housingUnits: template.housingUnits,
            population: template.population,
            jobs: template.jobs,
            cost: template.cost,
            duration: template.duration,
            startTime: Date.now(),
            assignedRobot: null
        };
    }

    updateCityStats() {
        // Update city statistics based on current state
        this.cityStats.happiness = Math.max(0, Math.min(100, 
            50 + (this.cityStats.employment / Math.max(1, this.cityStats.population)) * 20
        ));
        
        this.cityStats.crime = Math.max(0, Math.min(100,
            10 + (this.cityStats.population / 1000) * 5 - (this.cityStats.happiness / 10)
        ));
        
        this.cityStats.pollution = Math.max(0, Math.min(100,
            5 + (this.cityZones.industrial.current / 10) * 2
        ));
    }

    saveCityState() {
        const cityState = {
            robots: this.robots,
            constructionQueue: this.constructionQueue,
            cityZones: this.cityZones,
            cityStats: this.cityStats,
            lastSaved: Date.now()
        };
        
        localStorage.setItem('aiRobotCityState', JSON.stringify(cityState));
        console.log('🤖 AI-Robot city state auto-saved');
    }

    loadCityState() {
        const savedState = localStorage.getItem('aiRobotCityState');
        if (savedState) {
            const cityState = JSON.parse(savedState);
            this.robots = cityState.robots || this.robots;
            this.constructionQueue = cityState.constructionQueue || [];
            this.cityZones = cityState.cityZones || this.cityZones;
            this.cityStats = cityState.cityStats || this.cityStats;
            console.log('🤖 AI-Robot city state loaded');
        }
    }

    setupEventListeners() {
        // Add event listeners for AI-Robot system
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('ai-robot-btn')) {
                this.handleRobotAction(e.target.dataset.action);
            }
        });
    }

    handleRobotAction(action) {
        switch (action) {
            case 'view_robots':
                this.showRobotStatus();
                break;
            case 'view_construction':
                this.showConstructionStatus();
                break;
            case 'view_city_stats':
                this.showCityStats();
                break;
            case 'emergency_construction':
                this.triggerEmergencyConstruction();
                break;
        }
    }

    showRobotStatus() {
        const robotStatus = this.robots.map(robot => `
            <div class="robot-card">
                <h4>${robot.name}</h4>
                <p><strong>Type:</strong> ${robot.type}</p>
                <p><strong>Status:</strong> ${robot.status}</p>
                <p><strong>Location:</strong> ${robot.location}</p>
                <p><strong>Efficiency:</strong> ${(robot.efficiency * 100).toFixed(1)}%</p>
                <p><strong>Tasks Completed:</strong> ${robot.tasksCompleted}</p>
                <p><strong>Current Task:</strong> ${robot.currentTask || 'Idle'}</p>
            </div>
        `).join('');
        
        this.showModal('AI-Robot Status', robotStatus);
    }

    showConstructionStatus() {
        const constructionStatus = this.constructionQueue.map(project => `
            <div class="construction-card">
                <h4>${project.name}</h4>
                <p><strong>Type:</strong> ${project.type}</p>
                <p><strong>Zone:</strong> ${project.zone}</p>
                <p><strong>Status:</strong> ${project.status}</p>
                <p><strong>Progress:</strong> ${project.progress.toFixed(1)}%</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${project.progress}%"></div>
                </div>
            </div>
        `).join('');
        
        this.showModal('Construction Status', constructionStatus);
    }

    showCityStats() {
        const cityStatsHtml = `
            <div class="city-stats">
                <h3>City Statistics</h3>
                <div class="stat-grid">
                    <div class="stat-item">
                        <span class="stat-label">Population:</span>
                        <span class="stat-value">${this.cityStats.population.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Housing Units:</span>
                        <span class="stat-value">${this.cityStats.housing.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Employment:</span>
                        <span class="stat-value">${this.cityStats.employment.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Happiness:</span>
                        <span class="stat-value">${this.cityStats.happiness.toFixed(1)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Crime Rate:</span>
                        <span class="stat-value">${this.cityStats.crime.toFixed(1)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Pollution:</span>
                        <span class="stat-value">${this.cityStats.pollution.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal('City Statistics', cityStatsHtml);
    }

    triggerEmergencyConstruction() {
        // Create emergency construction projects
        const emergencyProjects = [
            this.createConstructionProject({ type: 'housing', priority: 'high', zone: 'residential' }),
            this.createConstructionProject({ type: 'commercial', priority: 'high', zone: 'commercial' }),
            this.createConstructionProject({ type: 'infrastructure', priority: 'high', zone: 'industrial' })
        ];
        
        emergencyProjects.forEach(project => {
            project.priority = 'emergency';
            project.duration = Math.floor(project.duration * 0.5); // 50% faster
            this.constructionQueue.unshift(project); // Add to front of queue
        });
        
        console.log('🚨 Emergency construction initiated!');
    }

    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'ai-robot-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    startLiveUpdates() {
        // Update city display every 2 seconds
        setInterval(() => {
            this.updateCityDisplay();
            this.updateConstructionFeed();
        }, 2000);
    }

    updateCityDisplay() {
        // Update city statistics display
        const populationEl = document.getElementById('cityPopulation');
        const housingEl = document.getElementById('cityHousing');
        const employmentEl = document.getElementById('cityEmployment');
        const happinessEl = document.getElementById('cityHappiness');

        if (populationEl) populationEl.textContent = this.cityStats.population.toLocaleString();
        if (housingEl) housingEl.textContent = this.cityStats.housing.toLocaleString();
        if (employmentEl) employmentEl.textContent = this.cityStats.employment.toLocaleString();
        if (happinessEl) happinessEl.textContent = `${this.cityStats.happiness.toFixed(1)}%`;
    }

    updateConstructionFeed() {
        const feedContainer = document.getElementById('constructionFeed');
        if (!feedContainer) return;

        // Add new construction updates
        const activeProjects = this.constructionQueue.filter(project => project.status === 'in_progress');
        
        if (activeProjects.length > 0) {
            const latestProject = activeProjects[activeProjects.length - 1];
            const feedItem = document.createElement('div');
            feedItem.className = 'construction-item';
            feedItem.innerHTML = `
                <i class="fas fa-hammer"></i>
                <span>${latestProject.name} - ${latestProject.progress.toFixed(1)}% complete in ${latestProject.zone}</span>
            `;
            
            // Only add if it's a new update
            if (!feedContainer.querySelector(`[data-project="${latestProject.id}"]`)) {
                feedItem.setAttribute('data-project', latestProject.id);
                feedContainer.appendChild(feedItem);
                
                // Keep only last 5 items
                const items = feedContainer.querySelectorAll('.construction-item');
                if (items.length > 5) {
                    items[0].remove();
                }
            }
        }

        // Add completed construction notifications
        this.constructionQueue.forEach(project => {
            if (project.status === 'completed' && !feedContainer.querySelector(`[data-completed="${project.id}"]`)) {
                const completedItem = document.createElement('div');
                completedItem.className = 'construction-item';
                completedItem.setAttribute('data-completed', project.id);
                completedItem.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <span>✅ ${project.name} completed in ${project.zone}!</span>
                `;
                feedContainer.appendChild(completedItem);
                
                // Keep only last 5 items
                const items = feedContainer.querySelectorAll('.construction-item');
                if (items.length > 5) {
                    items[0].remove();
                }
            }
        });
    }

    addConstructionUpdate(message, type = 'info') {
        const feedContainer = document.getElementById('constructionFeed');
        if (!feedContainer) return;

        const icons = {
            info: 'fas fa-info-circle',
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle'
        };

        const colors = {
            info: '#00d4ff',
            success: '#00ff88',
            warning: '#ffaa00',
            error: '#ff4444'
        };

        const updateItem = document.createElement('div');
        updateItem.className = 'construction-item';
        updateItem.innerHTML = `
            <i class="${icons[type]}" style="color: ${colors[type]}"></i>
            <span>${message}</span>
        `;
        
        feedContainer.appendChild(updateItem);
        
        // Keep only last 5 items
        const items = feedContainer.querySelectorAll('.construction-item');
        if (items.length > 5) {
            items[0].remove();
        }
    }
}

// Initialize all systems
document.addEventListener('DOMContentLoaded', () => {
    // Initialize authentication system first
    window.authSystem = new AuthenticationSystem();
    
    // Initialize AI-Robot system
    window.aiRobotSystem = new AIRobotSystem();
    
    // Initialize game systems
    new Navigation();
    const gameActions = new GameActions();
    const autoSave = new AutoSave();
    new EnergySystem();
    new TimeSystem();
    new SettingsTabs();
    new APIKeysManager();
    
    // Initialize new game systems
    window.battleSystem = new BattleSystem();
    window.crimeSystem = new CrimeSystem();
    window.jobSystem = new JobSystem();
    window.marketSystem = new MarketSystem();
    window.drugSystem = new DrugSystem();
    window.gpsSystem = new GPSSystem();
    window.housingSystem = new HousingSystem();
    window.racewaySystem = new RacewaySystem();
    window.vehicleControlSystem = new VehicleControlSystem();
    window.educationSystem = new EducationSystem();
    window.hospitalSystem = new HospitalSystem();
    window.jailSystem = new JailSystem();
    window.missionSystem = new MissionSystem();
    window.newspaperSystem = new NewspaperSystem();
    window.characterCustomizationSystem = new CharacterCustomizationSystem();
    window.factionSystem = new FactionSystem();
    
    // Make systems globally available
    window.gameActions = gameActions;
    window.autoSave = autoSave;
    window.gameAuthManager = window.gameAuthManager;
    
    // Setup market tab event listeners
    document.querySelectorAll('.market-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            showMarketTab(e.target.dataset.tab);
        });
    });
    
    // Setup category button event listeners
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            setItemCategory(e.target.dataset.category);
        });
    });
    
    // Initial display update
    game.updateDisplay();
    game.updateInventory();
    
    // Show welcome message
    setTimeout(() => {
        game.showNotification('Welcome to Crime City!', 'success');
    }, 1000);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Number keys for quick navigation
    const shortcuts = {
        '1': 'home',
        '2': 'city',
        '3': 'education',
        '4': 'casino',
        '5': 'gym',
        '6': 'crimes',
        '7': 'missions',
        '8': 'faction',
        '9': 'jail',
        '0': 'hospital',
        'i': 'items'
    };

    if (shortcuts[e.key]) {
        const nav = new Navigation();
        nav.showSection(shortcuts[e.key]);
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameState, Navigation, GameActions, AutoSave, EnergySystem };
}
