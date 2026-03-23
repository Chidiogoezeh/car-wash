document.addEventListener('DOMContentLoaded', () => {
    // --- 1. GLOBALS & AUTH CHECK ---
    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            
            if (!data.success) {
                if (!window.location.pathname.endsWith('index.html')) {
                    window.location.href = 'index.html';
                }
                return null;
            }

            const display = document.getElementById('user-display');
            if (display) display.textContent = `Welcome, ${data.user.username}`;
            return data.user;
        } catch (err) {
            if (!window.location.pathname.endsWith('index.html')) {
                window.location.href = 'index.html';
            }
        }
    };

    // --- 3. ADMIN: SERVICE & LOG MANAGEMENT ---
    const serviceForm = document.getElementById('service-form');
    const attendantForm = document.getElementById('attendant-form'); // Added missing reference
    const serviceList = document.getElementById('services-list-container');
    const logDateFilter = document.getElementById('activity-date-filter');

    const renderServices = async () => {
        if (!serviceList) return;
        try {
            const res = await fetch('/api/admin/services');
            const data = await res.json();
            
            // Clean container without innerHTML
            while (serviceList.firstChild) {
                serviceList.removeChild(serviceList.firstChild);
            }

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
        } catch (err) {
            console.error("Error rendering services:", err);
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
            if (res.ok) { 
                serviceForm.reset(); 
                renderServices(); 
                alert("Service added successfully!");
            }
        });
        renderServices();
    }

    // --- NEW: ATTENDANT GENERATION LOGIC ---
    if (attendantForm) {
        attendantForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                username: document.getElementById('att-name').value,
                email: document.getElementById('att-email').value
            };

            const res = await fetch('/api/admin/attendant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                attendantForm.reset();
            } else {
                alert("Error: " + data.message);
            }
        });
    }

    if (logDateFilter) {
        logDateFilter.addEventListener('change', async (e) => {
            const date = e.target.value;
            const res = await fetch(`/api/admin/logs?date=${date}`);
            const data = await res.json();
            const tbody = document.getElementById('daily-activity-body');
            if (!tbody) return;
            
            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }

            if (data.logs) {
                data.logs.forEach(log => {
                    const tr = document.createElement('tr');
                    const fields = [
                        log.action, 
                        log.username, 
                        log.device, 
                        new Date(log.createdAt).toLocaleTimeString()
                    ];
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

    // --- 6. LOGOUT ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = 'index.html';
        });
    }

    checkAuth();
});