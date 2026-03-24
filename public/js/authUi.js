document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const staffToggleBtn = document.getElementById('staff-toggle-btn');
    const emailInput = document.getElementById('email');

    /**
     * Helper to show messages/errors without using innerHTML
     */
    const showFeedback = (message, isError = true) => {
        // Look for existing banner or create one
        let banner = document.getElementById('auth-feedback');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'auth-feedback';
            const container = document.querySelector('main') || document.querySelector('.card');
            container.prepend(banner);
        }
        
        banner.textContent = message;
        banner.className = isError ? 'feedback-error' : 'feedback-success';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            banner.remove();
        }, 5000);
    };

    // --- 1. STAFF ACCESS LOGIC ---
    if (staffToggleBtn) {
        staffToggleBtn.addEventListener('click', () => {
            const email = emailInput.value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showFeedback("Please enter your staff credentials in the fields above.");
                emailInput.focus();
            } else {
                // Triggers the standard login submission logic
                loginForm.requestSubmit(); 
            }
        });
    }

    // --- 2. DEVICE FINGERPRINT LOGIC ---
    // Rebranded key from 'sparkle_device_id' to 'carwash_device_id'
    const getDeviceFingerprint = () => {
        let id = localStorage.getItem('carwash_device_id');
        if (!id) {
            id = `dev-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
            localStorage.setItem('carwash_device_id', id);
        }
        return id;
    };

    // --- 3. LOGIN LOGIC ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Disable button to prevent double submission
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

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
                    // Role-based redirection
                    const role = data.user.role;
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
                console.error("Login Error:", err);
                showFeedback("Connection failed. Please check your internet.");
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // --- 4. REGISTRATION LOGIC ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

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
                    // Store a temporary success message in session storage to show on index.html
                    sessionStorage.setItem('reg_success', 'true');
                    window.location.href = 'index.html';
                } else {
                    showFeedback(data.message || "Registration failed.");
                }
            } catch (err) {
                console.error("Registration Error:", err);
                showFeedback("Unable to register. Please try again later.");
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // Check for success message from registration redirect
    if (window.location.pathname.endsWith('index.html') && sessionStorage.getItem('reg_success')) {
        showFeedback("Account created! You can now log in.", false);
        sessionStorage.removeItem('reg_success');
    }
});