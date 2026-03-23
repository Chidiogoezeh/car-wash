document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const staffToggleBtn = document.getElementById('staff-toggle-btn');
    const emailInput = document.getElementById('email');

    // --- 1. STAFF ACCESS LOGIC (Requirement #10) ---
    if (staffToggleBtn) {
        staffToggleBtn.addEventListener('click', () => {
            // Check if fields are empty before submitting
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                alert("Please enter your staff credentials above first.");
                emailInput.focus();
            } else {
                // Manually trigger the form submission logic
                loginForm.requestSubmit(); 
            }
        });
    }

    // --- 2. DEVICE FINGERPRINT LOGIC ---
    const getDeviceFingerprint = () => {
        let id = localStorage.getItem('sparkle_device_id');
        if (!id) {
            id = 'dev-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
            localStorage.setItem('sparkle_device_id', id);
        }
        return id;
    };

    // --- 3. LOGIN LOGIC (Unified for all roles) ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await res.json();
                
                if (data.success) {
                    /** * Requirement #10 & #12: Redirection Logic
                     * Opens the correct page directly based on role returned by backend
                     */
                    const role = data.user.role;
                    if (role === 'admin') {
                        window.location.href = 'admin.html';
                    } else if (role === 'attendant') {
                        window.location.href = 'attendant.html';
                    } else {
                        window.location.href = 'customer.html';
                    }
                } else {
                    alert(data.message || "Invalid email or password.");
                }
            } catch (err) {
                console.error("Login Error:", err);
                alert("Server connection failed. Please check your internet.");
            }
        });
    }

    // --- 4. REGISTRATION LOGIC (Customer only) ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
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
                    alert("Registration successful! You may now log in.");
                    window.location.href = 'index.html';
                } else {
                    alert(data.message); 
                }
            } catch (err) {
                console.error("Registration Error:", err);
                alert("Registration failed. Please try again.");
            }
        });
    }
});