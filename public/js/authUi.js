document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTIONS ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const staffToggleBtn = document.getElementById('staff-toggle-btn');
    const emailInput = document.getElementById('email');

    /**
     * Helper to show messages/errors without using innerHTML
     */
    const showFeedback = (message, isError = true) => {
        let banner = document.getElementById('auth-feedback');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'auth-feedback';
            // Prepend to the visible card or container
            const container = document.querySelector('.login-container') || 
                              document.querySelector('.card') || 
                              document.body;
            container.prepend(banner);
        }
        
        banner.textContent = message;
        banner.className = isError ? 'feedback-error' : 'feedback-success';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (banner && banner.parentElement) banner.remove();
        }, 5000);
    };

    // --- 2. DEVICE FINGERPRINT LOGIC ---
    const getDeviceFingerprint = () => {
        let id = localStorage.getItem('carwash_device_id');
        if (!id) {
            id = `dev-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
            localStorage.setItem('carwash_device_id', id);
        }
        return id;
    };

    // --- 3. STAFF ACCESS LOGIC ---
    if (staffToggleBtn && loginForm) {
        staffToggleBtn.addEventListener('click', () => {
            const email = emailInput ? emailInput.value : '';
            const password = document.getElementById('password')?.value;

            if (!email || !password) {
                showFeedback("Please enter your staff credentials in the fields above.");
                emailInput?.focus();
            } else {
                loginForm.requestSubmit(); 
            }
        });
    }

    // --- 4. LOGIN LOGIC ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const payload = {
                email: emailInput.value,
                password: document.getElementById('password').value
            };

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                
                if (data.success) {
                    const role = data.user.role;
                    // Redirection based on role
                    if (role === 'admin') {
                        window.location.href = 'admin.html';
                    } else if (role === 'attendant') {
                        window.location.href = 'attendant.html';
                    } else {
                        window.location.href = 'customer.html';
                    }
                } else {
                    showFeedback(data.message || "Invalid email or password.");
                }
            } catch (err) {
                showFeedback("Connection failed. Please check your internet.");
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // --- 5. REGISTRATION LOGIC ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const payload = {
                username: document.getElementById('reg-username').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value,
                deviceId: getDeviceFingerprint() 
            };

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                
                if (data.success) {
                    sessionStorage.setItem('reg_success', 'true');
                    window.location.href = 'index.html';
                } else {
                    showFeedback(data.message || "Registration failed.");
                }
            } catch (err) {
                showFeedback("Unable to register. Please try again later.");
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // --- 6. INITIALIZATION CHECKS ---
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                        window.location.pathname === '/';

    if (isIndexPage && sessionStorage.getItem('reg_success')) {
        showFeedback("Account created! You can now log in.", false);
        sessionStorage.removeItem('reg_success');
    }
});