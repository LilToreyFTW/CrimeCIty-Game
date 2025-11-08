// Authentication JavaScript
class AuthManager {
    constructor() {
        this.currentTab = 'login';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.getCurrentIP();
        this.checkExistingAuth();
    }

    setupEventListeners() {
        // Tab switching is handled by onclick attributes in HTML

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Password confirmation
        document.getElementById('confirmPassword').addEventListener('input', () => {
            this.validatePasswordMatch();
        });

        // Email confirmation
        document.getElementById('registerEmailConfirm').addEventListener('input', () => {
            this.validateEmailMatch();
        });

        // Date of birth validation
        document.getElementById('registerDateOfBirth').addEventListener('input', () => {
            this.validateDateOfBirth();
        });
    }

    showTab(tabName) {
        // Update tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tabName}Form`).classList.add('active');

        this.currentTab = tabName;
        this.hideMessages();
    }

    async getCurrentIP() {
        try {
            const response = await fetch('/api/ip/current');
            const data = await response.json();
            
            document.getElementById('currentIP').textContent = data.ip;
            this.checkSecurityStatus(data.ip);
        } catch (error) {
            console.error('Failed to get IP:', error);
            document.getElementById('currentIP').textContent = 'Unknown';
            document.getElementById('securityStatus').textContent = 'Unable to verify';
        }
    }

    async checkSecurityStatus(ip) {
        try {
            const response = await fetch('/api/ip/suspicious');
            const data = await response.json();
            
            if (data.suspicious.isSuspicious) {
                document.getElementById('securityStatus').textContent = '⚠️ Suspicious Activity Detected';
                document.getElementById('securityStatus').style.color = '#ffc107';
            } else {
                document.getElementById('securityStatus').textContent = '✅ Secure Connection';
                document.getElementById('securityStatus').style.color = '#28a745';
            }
        } catch (error) {
            document.getElementById('securityStatus').textContent = '❓ Unknown';
            document.getElementById('securityStatus').style.color = '#6c757d';
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showError('Passwords do not match');
            return false;
        }
        
        this.hideMessages();
        return true;
    }

    validateEmailMatch() {
        const email = document.getElementById('registerEmail').value;
        const emailConfirm = document.getElementById('registerEmailConfirm').value;
        
        if (emailConfirm && email !== emailConfirm) {
            this.showError('Email addresses do not match');
            return false;
        }
        
        this.hideMessages();
        return true;
    }

    validateDateOfBirth() {
        const dateOfBirth = document.getElementById('registerDateOfBirth').value;
        
        if (dateOfBirth) {
            // Check MM/DD/YYYY format
            const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}$/;
            
            if (!dateRegex.test(dateOfBirth)) {
                this.showError('Date of birth must be in MM/DD/YYYY format (e.g., 02/08/1999)');
                return false;
            }
            
            // Check if date is valid
            const [month, day, year] = dateOfBirth.split('/').map(Number);
            const date = new Date(year, month - 1, day);
            
            if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
                this.showError('Invalid date. Please enter a valid date.');
                return false;
            }
            
            // Check if user is at least 13 years old
            const today = new Date();
            const age = today.getFullYear() - year;
            const monthDiff = today.getMonth() - (month - 1);
            const dayDiff = today.getDate() - day;
            
            if (age < 13 || (age === 13 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
                this.showError('You must be at least 13 years old to register');
                return false;
            }
            
            // Check if date is not in the future
            if (date > today) {
                this.showError('Date of birth cannot be in the future');
                return false;
            }
        }
        
        this.hideMessages();
        return true;
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        this.setLoading('login', true);

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
                // Store token
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                this.showSuccess('Login successful! Redirecting...');
                
                // Redirect to game after 2 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                if (data.warning) {
                    this.showWarning(data.error + ' ' + data.warning);
                } else if (data.details) {
                    this.showWarning(`${data.error}: ${data.warning}`);
                } else {
                    this.showError(data.error);
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        } finally {
            this.setLoading('login', false);
        }
    }

    async handleRegister() {
        const email = document.getElementById('registerEmail').value;
        const emailConfirm = document.getElementById('registerEmailConfirm').value;
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const dateOfBirth = document.getElementById('registerDateOfBirth').value;

        if (!email || !emailConfirm || !username || !password || !confirmPassword || !dateOfBirth) {
            this.showError('Please fill in all fields');
            return;
        }

        if (email !== emailConfirm) {
            this.showError('Email addresses do not match');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        // Validate date of birth
        if (!this.validateDateOfBirth()) {
            return;
        }

        this.setLoading('register', true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, username, password, dateOfBirth })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                this.showSuccess('Account created successfully! Redirecting...');
                
                // Redirect to game after 2 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                if (data.warning) {
                    this.showWarning(data.error + ' ' + data.warning);
                } else {
                    this.showError(data.error);
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Registration failed. Please try again.');
        } finally {
            this.setLoading('register', false);
        }
    }

    setLoading(formType, isLoading) {
        const btn = document.getElementById(`${formType}Btn`);
        const btnText = document.getElementById(`${formType}BtnText`);
        const loading = document.getElementById(`${formType}Loading`);

        if (isLoading) {
            btn.disabled = true;
            btnText.style.display = 'none';
            loading.style.display = 'inline-block';
        } else {
            btn.disabled = false;
            btnText.style.display = 'inline';
            loading.style.display = 'none';
        }
    }

    showError(message) {
        this.hideMessages();
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    showSuccess(message) {
        this.hideMessages();
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }

    showWarning(message) {
        this.hideMessages();
        const warningDiv = document.getElementById('warningMessage');
        warningDiv.textContent = message;
        warningDiv.style.display = 'block';
    }

    hideMessages() {
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('successMessage').style.display = 'none';
        document.getElementById('warningMessage').style.display = 'none';
    }

    async checkExistingAuth() {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const response = await fetch('/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    // User is already authenticated, redirect to game
                    window.location.href = '/';
                } else {
                    // Token is invalid, remove it
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error('Auth verification failed:', error);
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
        }
    }
}

// Global functions for onclick handlers
function showTab(tabName) {
    authManager.showTab(tabName);
}

// Initialize authentication manager
const authManager = new AuthManager();
