// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.authToken = localStorage.getItem('adminToken');
        this.user = JSON.parse(localStorage.getItem('adminUser') || '{}');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('ownerLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleOwnerLogin();
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(link.dataset.section);
            });
        });
    }

    async checkAuth() {
        if (!this.authToken) {
            this.showLogin();
            return;
        }

        try {
            const response = await fetch('/api/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                this.showAdminPanel();
                this.loadDashboard();
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('loginSection').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
    }

    showAdminPanel() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'flex';
    }

    async handleOwnerLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        this.setLoading(true);

        try {
            const response = await fetch('/api/admin/owner-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.authToken = data.token;
                this.user = data.user;
                
                localStorage.setItem('adminToken', this.authToken);
                localStorage.setItem('adminUser', JSON.stringify(this.user));
                
                this.showSuccess('Owner login successful!');
                this.showAdminPanel();
                this.loadDashboard();
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            console.error('Owner login error:', error);
            this.showError('Login failed. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        const btn = document.getElementById('loginBtn');
        const btnText = document.getElementById('loginBtnText');
        const loading = document.getElementById('loginLoading');

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

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        // Load section data
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'admin-keys':
                this.loadAdminKeys();
                break;
            case 'admin-codes':
                this.loadAdminCodes();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    async loadDashboard() {
        try {
            const response = await fetch('/api/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayDashboard(data);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
    }

    displayDashboard(data) {
        // Display stats
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <h3>${data.stats.totalUsers}</h3>
                <p>Total Users</p>
            </div>
            <div class="stat-card">
                <h3>${data.stats.activeUsers}</h3>
                <p>Active Users (24h)</p>
            </div>
            <div class="stat-card">
                <h3>${data.stats.newUsers}</h3>
                <p>New Users (24h)</p>
            </div>
            <div class="stat-card">
                <h3>$${data.stats.totalMoney.toLocaleString()}</h3>
                <p>Total Money in Game</p>
            </div>
        `;

        // Display recent activity
        const tbody = document.querySelector('#recentActivityTable tbody');
        tbody.innerHTML = data.recentActivity.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${new Date(user.last_login).toLocaleString()}</td>
                <td><span class="status-badge status-active">Active</span></td>
            </tr>
        `).join('');
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    displayUsers(users) {
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
                <td><span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="admin-btn ${user.is_active ? 'danger' : 'success'}" onclick="toggleUserStatus(${user.id}, ${user.is_active})">
                        ${user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async loadAdminKeys() {
        try {
            const response = await fetch('/api/admin/admin-keys', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayAdminKeys(data.keys);
            }
        } catch (error) {
            console.error('Failed to load admin keys:', error);
        }
    }

    displayAdminKeys(keys) {
        const container = document.getElementById('adminKeysList');
        container.innerHTML = keys.map(key => `
            <div class="admin-key-display">
                <h4>${key.key_type}</h4>
                <p><strong>Key:</strong> ${key.key_string}</p>
                <p><strong>Status:</strong> ${key.is_active ? 'Active' : 'Inactive'}</p>
                <p><strong>Used by:</strong> ${key.used_by || 'Not used'}</p>
                <p><strong>Used at:</strong> ${key.used_at ? new Date(key.used_at).toLocaleString() : 'Never'}</p>
                <p><strong>Created:</strong> ${new Date(key.created_at).toLocaleString()}</p>
            </div>
        `).join('');
    }

    async loadAdminCodes() {
        try {
            const response = await fetch('/api/admin/admin-codes', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayAdminCodes(data.codes);
            }
        } catch (error) {
            console.error('Failed to load admin codes:', error);
        }
    }

    displayAdminCodes(codes) {
        const container = document.getElementById('adminCodesList');
        container.innerHTML = codes.map(code => `
            <div class="admin-key-display">
                <h4>Code: ${code.code}</h4>
                <p><strong>User ID:</strong> ${code.user_id}</p>
                <p><strong>Status:</strong> ${code.is_active ? 'Active' : 'Used'}</p>
                <p><strong>Expires:</strong> ${new Date(code.expires_at).toLocaleString()}</p>
                <p><strong>Used at:</strong> ${code.used_at ? new Date(code.used_at).toLocaleString() : 'Not used'}</p>
                <p><strong>Created:</strong> ${new Date(code.created_at).toLocaleString()}</p>
            </div>
        `).join('');
    }

    async loadAnalytics() {
        // Analytics implementation
        document.getElementById('analyticsContent').innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Coming Soon</h3>
                    <p>Advanced Analytics</p>
                </div>
            </div>
        `;
    }

    loadSettings() {
        document.getElementById('adminRole').value = this.user.role || 'OWNER';
        document.getElementById('adminPermissions').value = 'ALL';
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

    hideMessages() {
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('successMessage').style.display = 'none';
    }

    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        this.authToken = null;
        this.user = {};
        this.showLogin();
    }
}

// Global functions
async function generateAdminCode() {
    const targetUserId = document.getElementById('targetUserId').value;
    
    if (!targetUserId) {
        alert('Please enter a target user ID');
        return;
    }

    try {
        const response = await fetch('/api/admin/generate-admin-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminPanel.authToken}`
            },
            body: JSON.stringify({ targetUserId })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('generatedCode').style.display = 'block';
            document.getElementById('generatedCode').innerHTML = `
                <h3>Generated Admin Code</h3>
                <p><strong>Code:</strong> ${data.code}</p>
                <p><strong>For User:</strong> ${data.targetUser}</p>
                <p><strong>Expires:</strong> ${data.expiresIn}</p>
            `;
            adminPanel.loadAdminCodes();
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Failed to generate admin code:', error);
        alert('Failed to generate admin code');
    }
}

async function toggleUserStatus(userId, currentStatus) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminPanel.authToken}`
            },
            body: JSON.stringify({ isActive: !currentStatus })
        });

        if (response.ok) {
            adminPanel.loadUsers();
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        console.error('Failed to toggle user status:', error);
        alert('Failed to update user status');
    }
}

// Initialize admin panel
const adminPanel = new AdminPanel();
