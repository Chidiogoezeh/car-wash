document.addEventListener('DOMContentLoaded', () => {
    // --- 1. UI TOGGLE LOGIC ---
    const setupToggles = (buttonIds, sectionIds) => {
        const buttons = buttonIds.map(id => document.getElementById(id));
        const sections = sectionIds.map(id => document.getElementById(id));

        if (!buttons[0] || !sections[0]) return;

        buttons.forEach((btn, index) => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                // Remove active class from all buttons and hide all sections
                buttons.forEach(b => b?.classList.remove('active'));
                sections.forEach(s => s?.classList.add('hidden'));

                // Activate clicked button and its corresponding section
                btn.classList.add('active');
                if (sections[index]) {
                    sections[index].classList.remove('hidden');
                }
            });
        });
    };

    // Initialize Toggles for different dashboards
    setupToggles(['toggle-booking', 'toggle-status'], ['section-booking', 'section-status']);
    setupToggles(['toggle-tasks', 'toggle-settings'], ['section-tasks', 'section-settings']);
    setupToggles(['toggle-wash', 'toggle-staff', 'toggle-activity'], ['section-wash', 'section-staff', 'section-activity']);

    // --- 2. GLOBAL UTILITIES ---
    const showMessage = (containerId, message, isError = true) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.textContent = ''; 
        const div = document.createElement('div');
        div.className = isError ? 'error-banner' : 'success-banner';
        div.textContent = message;
        container.appendChild(div);
        
        setTimeout(() => { if(div) div.remove(); }, 5000);
    };

    const createCell = (text) => {
        const td = document.createElement('td');
        td.textContent = text || 'N/A';
        return td;
    };

    // --- 3. AUTHENTICATION & ROLE PROTECTION (FIXED LOOP) ---
    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            
            const currentPath = window.location.pathname;
            const isLoginPage = currentPath.endsWith('index.html') || currentPath === '/';

            // 1. If NOT logged in
            if (!data || !data.success) {
                if (!isLoginPage) {
                    window.location.href = 'index.html';
                }
                return;
            }

            // 2. If Logged in, verify role-to-path alignment
            const role = data.user.role;
            const display = document.getElementById('user-display');
            if (display) display.textContent = `Welcome, ${data.user.username}`;

            if (role === 'admin' && !currentPath.includes('admin.html')) {
                window.location.href = 'admin.html';
                return;
            } 
            if (role === 'attendant' && !currentPath.includes('attendant.html')) {
                window.location.href = 'attendant.html';
                return;
            }
            if (role === 'customer' && !currentPath.includes('customer.html')) {
                // Only redirect if they are on the login page
                if (isLoginPage) window.location.href = 'customer.html';
            }

            // 3. Initialize specific dashboard views
            if (role === 'customer') {
                populateCustomerDropdowns();
                renderOrderHistory();
                setupBookingForm();
            } else if (role === 'attendant') {
                renderAttendantTasks();
            } else if (role === 'admin') {
                renderAdminServices();
                renderDailyActivity();
            }
        } catch (err) {
            console.error("Auth System Error:", err);
        }
    };

    // --- 4. CUSTOMER DASHBOARD LOGIC ---
    const populateCustomerDropdowns = async () => {
        const svcSelect = document.getElementById('service-select');
        const slotSelect = document.getElementById('slot-select');
        if (!svcSelect || !slotSelect) return;

        try {
            const res = await fetch('/api/admin/services');
            const data = await res.json();

            svcSelect.innerHTML = '<option disabled selected>Select Wash Type</option>'; 
            data.services.forEach(svc => {
                const opt = document.createElement('option');
                opt.value = svc._id;
                opt.textContent = `${svc.name} - ₦${svc.price}`;
                svcSelect.appendChild(opt);
            });

            const slots = ["09:00 AM", "12:00 PM", "03:00 PM", "06:00 PM"];
            slotSelect.innerHTML = '';
            slots.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s; opt.textContent = s;
                slotSelect.appendChild(opt);
            });
        } catch (err) { console.error("Dropdown load error:", err); }
    };

    const setupBookingForm = () => {
        const form = document.getElementById('booking-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                service: document.getElementById('service-select').value,
                slot: document.getElementById('slot-select').value,
                vehiclePlate: document.getElementById('plate-number').value
            };

            try {
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (data.success) {
                    showMessage('message-container', "Booking Confirmed!", false);
                    form.reset();
                    renderOrderHistory();
                } else {
                    showMessage('message-container', data.message);
                }
            } catch (err) { showMessage('message-container', "Booking failed."); }
        });
    };

    const renderOrderHistory = async () => {
        const body = document.getElementById('order-history');
        if (!body) return;

        try {
            const res = await fetch('/api/orders/my-orders');
            const data = await res.json();
            body.innerHTML = '';

            data.data.forEach(order => {
                const tr = document.createElement('tr');
                tr.append(
                    createCell(order.vehiclePlate),
                    createCell(order.service?.name),
                    createCell(order.status),
                    createCell(order.paymentConfirmed ? "✅ PAID" : "⏳ PENDING")
                );
                body.appendChild(tr);
            });
        } catch (err) { console.error(err); }
    };

    // --- 5. ATTENDANT DASHBOARD LOGIC ---
    const renderAttendantTasks = async () => {
        const body = document.getElementById('attendant-tasks');
        if (!body) return;

        try {
            const res = await fetch('/api/tasks/my-tasks');
            const data = await res.json();
            body.innerHTML = '';

            data.data.forEach(task => {
                const tr = document.createElement('tr');
                tr.append(
                    createCell(task.vehiclePlate),
                    createCell(task.service?.name),
                    createCell(task.status)
                );
                body.appendChild(tr);
            });
        } catch (err) { console.error(err); }
    };

    // --- 6. ADMIN DASHBOARD LOGIC ---
    const renderAdminServices = async () => {
        const container = document.getElementById('services-list-container');
        if (!container) return;

        try {
            const res = await fetch('/api/admin/services');
            const data = await res.json();
            container.innerHTML = '';

            data.services.forEach(svc => {
                const div = document.createElement('div');
                div.className = 'card mt-1';
                div.textContent = `${svc.name} - ₦${svc.price}`;
                container.appendChild(div);
            });
        } catch (err) { console.error(err); }
    };

    const renderDailyActivity = async () => {
        const body = document.getElementById('daily-activity-body');
        const filter = document.getElementById('activity-date-filter');
        if (!body || !filter) return;

        filter.addEventListener('change', async () => {
            try {
                const res = await fetch(`/api/admin/logs?date=${filter.value}`);
                const data = await res.json();
                body.innerHTML = '';

                if (data.logs && data.logs.length > 0) {
                    data.logs.forEach(log => {
                        const tr = document.createElement('tr');
                        // Log schema matches: username, action, ip, status
                        tr.append(
                            createCell(log.username),
                            createCell(log.action),
                            createCell(log.status),
                            createCell(new Date(log.createdAt).toLocaleTimeString())
                        );
                        body.appendChild(tr);
                    });
                } else {
                    body.innerHTML = '<tr><td colspan="4">No activity found for this date.</td></tr>';
                }
            } catch (err) { console.error(err); }
        });
    };

    // --- 7. LOGOUT ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = 'index.html';
        });
    }

    // Run Auth Check
    checkAuth();
});