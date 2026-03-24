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

    // Initialize Toggles for all three possible dashboards
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
        
        setTimeout(() => div.remove(), 5000);
    };

    const createCell = (text) => {
        const td = document.createElement('td');
        td.textContent = text || 'N/A';
        return td;
    };

    // --- 3. AUTHENTICATION & ROLE PROTECTION ---
    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            
            if (!data || !data.success) {
                window.location.href = 'index.html';
                return;
            }

            const role = data.user.role;
            const display = document.getElementById('user-display');
            if (display) display.textContent = `Welcome, ${data.user.username}`;

            // Initialize views based on role
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

            // Clear and populate Service Dropdown
            svcSelect.textContent = ''; 
            const defaultOpt = document.createElement('option');
            defaultOpt.textContent = "Select Wash Type";
            defaultOpt.disabled = true;
            defaultOpt.selected = true;
            svcSelect.appendChild(defaultOpt);

            data.services.forEach(svc => {
                const opt = document.createElement('option');
                opt.value = svc._id;
                opt.textContent = `${svc.name} - ₦${svc.price}`;
                svcSelect.appendChild(opt);
            });

            // Populate static slots
            const slots = ["09:00 AM", "12:00 PM", "03:00 PM", "06:00 PM"];
            slotSelect.textContent = '';
            slots.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                slotSelect.appendChild(opt);
            });
        } catch (err) {
            console.error("Dropdown load error:", err);
        }
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
            } catch (err) {
                showMessage('message-container', "Booking failed. Try again.");
            }
        });
    };

    const renderOrderHistory = async () => {
        const body = document.getElementById('order-history');
        if (!body) return;

        try {
            const res = await fetch('/api/orders/my-orders');
            const data = await res.json();
            body.textContent = '';

            data.data.forEach(order => {
                const tr = document.createElement('tr');
                tr.append(
                    createCell(order.vehiclePlate),
                    createCell(order.service?.name),
                    createCell(order.status),
                    createCell(order.paymentConfirmed ? "PAID" : "PENDING")
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
            body.textContent = '';

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
            container.textContent = '';

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

        const fetchLogs = async () => {
            const res = await fetch(`/api/admin/logs?date=${filter.value}`);
            const data = await res.json();
            body.textContent = '';

            if (data.logs && data.logs.length > 0) {
                data.logs.forEach(log => {
                    const tr = document.createElement('tr');
                    tr.append(
                        createCell(log.vehiclePlate),
                        createCell(log.serviceName),
                        createCell(log.staff),
                        createCell(log.status)
                    );
                    body.appendChild(tr);
                });
            }
        };

        filter.addEventListener('change', fetchLogs);
    };

    // --- 7. LOGOUT ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = 'index.html';
        });
    }

    // Initialize the app
    checkAuth();
});