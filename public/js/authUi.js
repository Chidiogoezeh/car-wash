document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTIONS ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const staffToggleBtn = document.getElementById('staff-toggle-btn');
    const emailInput = document.getElementById('email');

    /**
     * Helper to show messages/errors without using alerts
     */
    const showFeedback = (message, isError = true) => {
        let banner = document.getElementById('auth-feedback');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'auth-feedback';
            // Prepend to the visible container
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

    // --- 2. STAFF ACCESS TOGGLE ---
    // This allows the "Staff Access" button to trigger the same logic as the login button
    if (staffToggleBtn && loginForm) {
        staffToggleBtn.addEventListener('click', () => {
            const email = emailInput ? emailInput.value : '';
            const password = document.getElementById('password')?.value;

            if (!email || !password) {
                showFeedback("Please enter staff credentials first.");
                emailInput?.focus();
            } else {
                // Programmatically trigger the submit event on the login form
                loginForm.requestSubmit(); 
            }
        });
    }

    // --- 3. LOGIN LOGIC ---
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
                    // CRITICAL: Tells the browser to save the 'token' cookie returned by the server
                    credentials: 'include' 
                }, {
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                
                if (data.success) {
                    // Redirect based on role provided by backend
                    const role = data.user.role;
                    if (role === 'admin') window.location.replace('/admin.html');
                    else if (role === 'attendant') window.location.replace('/attendant.html');
                    else window.location.replace('/customer.html');
                } else {
                    showFeedback(data.message || "Invalid email or password.");
                }
            } catch (err) {
                showFeedback("Connection failed. Check your internet or server status.");
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // --- 4. REGISTRATION LOGIC ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            // We are no longer sending deviceId to avoid the duplicate key error in MongoDB
            const payload = {
                username: document.getElementById('reg-username').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value
            };

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                }, {
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                
                if (data.success) {
                    // Store success flag in sessionStorage to show message after redirect
                    sessionStorage.setItem('reg_success', 'true');
                    window.location.href = '/index.html';
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

    // --- 5. POST-REGISTRATION FEEDBACK ---
    // Check if we just redirected from a successful registration
    const isLoginPage = window.location.pathname.endsWith('index.html') || 
                        window.location.pathname === '/' ||
                        window.location.pathname.endsWith('login.html');

    if (isLoginPage && sessionStorage.getItem('reg_success')) {
        showFeedback("Account created successfully! You can now log in.", false);
        sessionStorage.removeItem('reg_success');
    }
});