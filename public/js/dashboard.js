document.addEventListener('DOMContentLoaded', () => {
    // --- 1. UI TOGGLE LOGIC ---
    const setupToggles = (buttonIds, sectionIds) => {
        const buttons = buttonIds.map(id => document.getElementById(id));
        const sections = sectionIds.map(id => document.getElementById(id));

        if (!buttons[0] || !sections[0]) return;

        buttons.forEach((btn, index) => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                buttons.forEach(b => b?.classList.remove('active'));
                sections.forEach(s => s?.classList.add('hidden'));

                btn.classList.add('active');
                if (sections[index]) sections[index].classList.remove('hidden');
            });
        });
    };

    setupToggles(['toggle-booking', 'toggle-status'], ['section-booking', 'section-status']);
    setupToggles(['toggle-tasks', 'toggle-settings'], ['section-tasks', 'section-settings']);
    setupToggles(['toggle-wash', 'toggle-staff', 'toggle-activity'], ['section-wash', 'section-staff', 'section-activity']);

    // --- 2. GLOBAL UTILITIES ---
    const showMessage = (containerId, message, isError = true) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `<div class="${isError ? 'feedback-error' : 'feedback-success'}">${message}</div>`;
        setTimeout(() => { container.innerHTML = ''; }, 5000);
    };

    const createCell = (text) => {
        const td = document.createElement('td');
        td.textContent = text || '---';
        return td;
    };

    // --- 3. AUTHENTICATION & ROLE PROTECTION ---
    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            
            const currentPath = window.location.pathname;
            const isLoginPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('login.html');

            if (!data || !data.success) {
                if (!isLoginPage) window.location.href = 'index.html';
                return;
            }

            const { role, username } = data.user;
            const display = document.getElementById('user-display');
            if (display) display.textContent = `Welcome, ${username}`;

            // Secure Redirects
            if (role === 'admin' && !currentPath.includes('admin.html')) return window.location.href = 'admin.html';
            if (role === 'attendant' && !currentPath.includes('attendant.html')) return window.location.href = 'attendant.html';
            if (role === 'customer' && isLoginPage) return window.location.href = 'customer.html';

            // Initialize views based on role
            if (role === 'customer') {
                populateCustomerDropdowns();
                renderOrderHistory();
                setupCustomerActions();
            } else if (role === 'attendant') {
                renderAttendantTasks();
                setupAttendantActions();
            } else if (role === 'admin') {
                renderAdminServices();
                const today = new Date().toISOString().split('T')[0];
                const filter = document.getElementById('activity-date-filter');
                if (filter) {
                    filter.value = today;
                    renderDailyActivity(today); 
                }
                setupAdminActions();
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
                opt.textContent = `${svc.name} - ₦${Number(svc.price).toLocaleString()}`;
                svcSelect.appendChild(opt);
            });

            const slots = ["09:00 AM", "12:00 PM", "03:00 PM", "06:00 PM"];
            slotSelect.innerHTML = '<option disabled selected>Select a slot</option>';
            slots.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s; opt.textContent = s;
                slotSelect.appendChild(opt);
            });
        } catch (err) { console.error("Dropdown load failure:", err); }
    };

    const renderOrderHistory = async () => {
        const body = document.getElementById('order-history');
        if (!body) return;
        try {
            const res = await fetch('/api/orders/my-orders');
            const result = await res.json();
            body.innerHTML = '';
            (result.data || []).forEach(order => {
                const tr = document.createElement('tr');
                tr.append(
                    createCell(order.vehiclePlate),
                    createCell(order.service?.name),
                    createCell(order.status.toUpperCase())
                );
                
                const payCell = document.createElement('td');
                if (order.paymentConfirmed) {
                    payCell.innerHTML = '<span class="status-badge status-completed">✅ PAID</span>';
                } else {
                    const payBtn = document.createElement('button');
                    payBtn.className = "btn-small btn-success";
                    payBtn.textContent = "Notify Payment";
                    payBtn.onclick = async () => {
                        payBtn.disabled = true;
                        const confirmPay = await fetch(`/api/orders/paid/${order._id}`, { method: 'PATCH' });
                        if(confirmPay.ok) renderOrderHistory();
                        else payBtn.disabled = false;
                    };
                    payCell.appendChild(payBtn);
                }
                tr.appendChild(payCell);
                body.appendChild(tr);
            });
        } catch (err) { console.error("History Sync Error:", err); }
    };

    const setupCustomerActions = () => {
        document.getElementById('booking-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                service: document.getElementById('service-select').value,
                slot: document.getElementById('slot-select').value,
                vehiclePlate: document.getElementById('plate-number').value
            };
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showMessage('message-container', "Booking Confirmed!", false);
                e.target.reset();
                renderOrderHistory();
            }
        });

        document.getElementById('delete-account-btn')?.addEventListener('click', async () => {
            if (confirm("Permanently delete account? Data is wiped after 30 days.")) {
                const res = await fetch('/api/users/request-deletion', { method: 'POST' });
                if (res.ok) document.getElementById('deletion-notice')?.classList.remove('hidden');
            }
        });
    };

    // --- 5. ATTENDANT DASHBOARD LOGIC ---
    const renderAttendantTasks = async () => {
        const body = document.getElementById('attendant-tasks');
        if (!body) return;
        try {
            const res = await fetch('/api/tasks/my-tasks');
            const result = await res.json();
            body.innerHTML = '';
            (result.data || []).forEach(task => {
                const tr = document.createElement('tr');
                tr.append(
                    createCell(task.vehiclePlate),
                    createCell(task.service?.name)
                );
                const actionCell = document.createElement('td');
                if (task.status === 'completed') {
                    actionCell.innerHTML = '<span class="status-badge status-completed">Finished</span>';
                } else {
                    const doneBtn = document.createElement('button');
                    doneBtn.className = "btn-small btn-primary";
                    doneBtn.textContent = "Mark Done";
                    doneBtn.onclick = async () => {
                        doneBtn.disabled = true;
                        const done = await fetch(`/api/tasks/complete/${task._id}`, { method: 'PATCH' });
                        if(done.ok) renderAttendantTasks();
                        else doneBtn.disabled = false;
                    };
                    actionCell.appendChild(doneBtn);
                }
                tr.appendChild(actionCell);
                body.appendChild(tr);
            });
        } catch (err) { console.error("Task update error:", err); }
    };

    const setupAttendantActions = () => {
        document.getElementById('save-pass-btn')?.addEventListener('click', async () => {
            const newPass = document.getElementById('new-password').value;
            if (newPass.length < 8) return alert("Min. 8 characters required");
            const res = await fetch('/api/users/update-password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPass })
            });
            if (res.ok) {
                alert("Password Updated!");
                document.getElementById('new-password').value = '';
            }
        });
    };

    // --- 6. ADMIN DASHBOARD LOGIC ---
    const setupAdminActions = () => {
        document.getElementById('service-form')?.addEventListener('submit', async (e) => {
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
            if(res.ok) {
                renderAdminServices();
                e.target.reset();
            }
        });

        document.getElementById('attendant-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = { 
                username: document.getElementById('att-name').value, 
                email: document.getElementById('att-email').value,
                password: document.getElementById('att-password').value 
            };
            const res = await fetch('/api/admin/attendant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if(res.ok) {
                showMessage('admin-error-container', "Staff Member Created!", false);
                e.target.reset();
            }
        });
    };

    const renderAdminServices = async () => {
        const container = document.getElementById('services-list-container');
        if (!container) return;
        try {
            const res = await fetch('/api/admin/services');
            const { services } = await res.json();
            container.innerHTML = services.map(s => `
                <div class="card mt-1" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <span>${s.name}</span>
                    <strong>₦${Number(s.price).toLocaleString()}</strong>
                </div>
            `).join('');
        } catch (err) { console.error("Service sync failure:", err); }
    };

    const renderDailyActivity = async (date) => {
        const body = document.getElementById('daily-activity-body');
        if (!body) return;

        try {
            const res = await fetch(`/api/admin/logs?date=${date}`);
            const data = await res.json();
            body.innerHTML = '';
            
            const logs = data.logs || [];
            if (logs.length === 0) {
                body.innerHTML = '<tr><td colspan="4" class="text-center">No logs for this date.</td></tr>';
                return;
            }

            logs.forEach(log => {
                const tr = document.createElement('tr');
                tr.append(
                    createCell(log.username),
                    createCell(log.action),
                    createCell(log.ip),
                    createCell(new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
                );
                body.appendChild(tr);
            });
        } catch (err) { console.error("Audit sync error:", err); }
    };

    // Corrected the listener for date filtering
    document.getElementById('activity-date-filter')?.addEventListener('change', (e) => {
        renderDailyActivity(e.target.value);
    });

    // --- 7. LOGOUT ---
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = 'index.html';
    });

    checkAuth();
});