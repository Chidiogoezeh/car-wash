document.addEventListener('DOMContentLoaded', () => {
    // 1. GLOBALS & AUTH CHECK
    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            
            if (!data.success) {
                // Only redirect if we aren't already on the login page
                if (!window.location.pathname.endsWith('index.html')) {
                    window.location.href = 'index.html';
                }
                return null;
            }

            // Update UI with user info
            const display = document.getElementById('user-display');
            if (display) display.textContent = `Welcome, ${data.user.username}`;
            return data.user;
        } catch (err) {
            if (!window.location.pathname.endsWith('index.html')) {
                window.location.href = 'index.html';
            }
        }
    };

    // 2. SECURITY
    document.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen') {
            navigator.clipboard.writeText('');
            alert('Screenshots are disabled for security.');
        }
    });

    // 3. ADMIN: SERVICE & LOG MANAGEMENT
    const serviceForm = document.getElementById('service-form');
    const serviceList = document.getElementById('services-list-container');
    const logDateFilter = document.getElementById('activity-date-filter');

    const renderServices = async () => {
        if (!serviceList) return;
        const res = await fetch('/api/admin/services');
        const data = await res.json();
        serviceList.replaceChildren(); 

        if (data.services) {
            data.services.forEach(svc => {
                const div = document.createElement('div');
                div.className = 'log-entry mt-1';
                const strong = document.createElement('strong');
                strong.textContent = svc.name;
                const span = document.createElement('span');
                span.textContent = ` - ₦${svc.price}`;
                div.append(strong, span);
                serviceList.appendChild(div);
            });
        }
    };

    if (serviceForm) {
        serviceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('svc-name').value,
                price: document.getElementById('svc-price').value
            };
            const res = await fetch('/api/admin/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) { serviceForm.reset(); renderServices(); }
        });
        renderServices();
    }

    if (logDateFilter) {
        logDateFilter.addEventListener('change', async (e) => {
            const date = e.target.value;
            const res = await fetch(`/api/admin/logs?date=${date}`);
            const data = await res.json();
            const tbody = document.getElementById('daily-activity-body');
            if (!tbody) return;
            tbody.replaceChildren();

            if (data.logs) {
                data.logs.forEach(log => {
                    const tr = document.createElement('tr');
                    // Keys are to match your AuditLog/Order model exactly
                    const fields = [log.details || 'N/A', log.action, log.username, new Date(log.createdAt).toLocaleTimeString()];
                    fields.forEach(text => {
                        const td = document.createElement('td');
                        td.textContent = text;
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
            }
        });
    }

    // 4. ATTENDANT WORKFLOW
    window.processTask = async (orderId, nextStatus) => {
        const res = await fetch(`/api/tasks/status/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
        });
        if (res.ok) location.reload();
    };

    const savePassBtn = document.getElementById('save-pass-btn');
    if (savePassBtn) {
        savePassBtn.addEventListener('click', async () => {
            const password = document.getElementById('new-password').value;
            if (!password) return alert("Enter a new password");
            
            const res = await fetch('/api/auth/update-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            if (res.ok) {
                alert("Password updated!");
                const modal = document.getElementById('password-modal');
                if (modal) modal.classList.remove('modal-show');
            }
        });
    }

    // 5. CUSTOMER: BOOKING & DELETION
    const delBtn = document.getElementById('delete-account-btn');
    if (delBtn) {
        delBtn.addEventListener('click', async () => {
            if (confirm("Permanently delete account in 30 days? You will be logged out now.")) {
                const res = await fetch('/api/auth/schedule-deletion', { method: 'POST' });
                if (res.ok) {
                    alert("Account scheduled for deletion.");
                    window.location.href = 'index.html';
                }
            }
        });
    }

    // 6. LOGOUT
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = 'index.html';
        });
    }

    checkAuth();
});