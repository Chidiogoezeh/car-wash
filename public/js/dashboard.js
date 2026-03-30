document.addEventListener('DOMContentLoaded', () => {
    // --- 1. UI TOGGLE LOGIC ---
    const setupToggles = (buttonIds, sectionIds) => {
        const buttons = buttonIds.map(id => document.getElementById(id));
        const sections = sectionIds.map(id => document.getElementById(id));

        if (!buttons[0] || !sections[0]) return;

        buttons.forEach((btn, index) => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                // Remove active class from all buttons and hide all sections in this group
                buttons.forEach(b => b?.classList.remove('active'));
                sections.forEach(s => s?.classList.add('hidden'));

                // Activate the clicked button and its corresponding section
                btn.classList.add('active');
                if (sections[index]) sections[index].classList.remove('hidden');
            });
        });
    };

    // Initialize Toggles for all User Roles
    setupToggles(['toggle-booking', 'toggle-status'], ['section-booking', 'section-status']); // Customer
    setupToggles(['toggle-tasks', 'toggle-settings'], ['section-tasks', 'section-settings']); // Attendant
    setupToggles(
        ['toggle-wash', 'toggle-orders', 'toggle-staff', 'toggle-activity'], 
        ['section-wash', 'section-orders', 'section-staff', 'section-activity']
    ); // Admin

    // --- 2. GLOBAL UTILITIES ---
    const showMessage = (containerId, message, isError = true) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.textContent = ''; 
        const div = document.createElement('div');
        div.className = isError ? 'feedback-error' : 'feedback-success';
        div.textContent = message;
        container.appendChild(div);
        
        setTimeout(() => { if (div) div.remove(); }, 5000);
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
                renderAdminOrders();
                setupAdminActions();
                const filter = document.getElementById('activity-date-filter');
                if (filter) {
                    const today = new Date().toISOString().split('T')[0];
                    filter.value = today;
                    renderDailyActivity(today);
                }
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
            
            svcSelect.textContent = '';
            const defaultSvc = document.createElement('option');
            defaultSvc.disabled = true;
            defaultSvc.selected = true;
            defaultSvc.textContent = 'Select Wash Type';
            svcSelect.appendChild(defaultSvc);

            (data.services || []).forEach(svc => {
                const opt = document.createElement('option');
                opt.value = svc._id;
                opt.textContent = `${svc.name} - ₦${Number(svc.price).toLocaleString()}`;
                svcSelect.appendChild(opt);
            });

            const slots = ["09:00 AM", "12:00 PM", "03:00 PM", "06:00 PM"];
            slotSelect.textContent = '';
            const defaultSlot = document.createElement('option');
            defaultSlot.disabled = true;
            defaultSlot.selected = true;
            defaultSlot.textContent = 'Select a slot';
            slotSelect.appendChild(defaultSlot);

            slots.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s; 
                opt.textContent = s;
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
            body.textContent = '';
            (result.data || []).forEach(order => {
                const tr = document.createElement('tr');
                tr.append(
                    createCell(order.vehiclePlate),
                    createCell(order.service?.name),
                    createCell(order.status.toUpperCase())
                );
                
                const payCell = document.createElement('td');
                if (order.paymentConfirmed) {
                    const badge = document.createElement('span');
                    badge.className = 'status-badge status-completed';
                    badge.textContent = 'PAID';
                    payCell.appendChild(badge);
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
    };

    // --- 5. ATTENDANT DASHBOARD LOGIC ---
    const renderAttendantTasks = async () => {
        const body = document.getElementById('attendant-tasks');
        if (!body) return;
        try {
            const res = await fetch('/api/tasks/my-tasks');
            const result = await res.json();
            body.textContent = '';
            (result.data || []).forEach(task => {
                const tr = document.createElement('tr');
                tr.append(
                    createCell(task.vehiclePlate),
                    createCell(task.service?.name)
                );
                const actionCell = document.createElement('td');
                if (task.status === 'completed') {
                    const badge = document.createElement('span');
                    badge.className = 'status-badge status-completed';
                    badge.textContent = 'Finished';
                    actionCell.appendChild(badge);
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
    const renderAdminOrders = async () => {
        const tableBody = document.getElementById('admin-orders-table');
        if (!tableBody) return;

        try {
            const [ordersRes, staffRes] = await Promise.all([
                fetch('/api/admin/orders'),
                fetch('/api/admin/attendants')
            ]);
            const ordersData = await ordersRes.json();
            const staffData = await staffRes.json();
            
            tableBody.textContent = '';

            (ordersData.data || []).forEach(order => {
                const tr = document.createElement('tr');
                tr.append(
                    createCell(order.vehiclePlate),
                    createCell(order.service?.name),
                    createCell(order.status.toUpperCase())
                );

                const selectCell = document.createElement('td');
                const select = document.createElement('select');
                
                const defaultOpt = document.createElement('option');
                defaultOpt.textContent = order.attendant ? order.attendant.username : 'Not Assigned';
                defaultOpt.value = order.attendant ? order.attendant._id : '';
                select.appendChild(defaultOpt);

                (staffData.attendants || []).forEach(staff => {
                    if (order.attendant && staff._id === order.attendant._id) return;
                    const opt = document.createElement('option');
                    opt.value = staff._id;
                    opt.textContent = staff.username;
                    select.appendChild(opt);
                });
                selectCell.appendChild(select);
                tr.appendChild(selectCell);

                const actionCell = document.createElement('td');
                const assignBtn = document.createElement('button');
                assignBtn.className = 'btn-small btn-primary';
                assignBtn.textContent = 'Assign';
                assignBtn.onclick = async () => {
                    const attendantId = select.value;
                    if (!attendantId) return alert("Select an attendant first");
                    const res = await fetch(`/api/tasks/assign/${order._id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ attendantId })
                    });
                    if (res.ok) {
                        alert("Task assigned successfully");
                        renderAdminOrders();
                    }
                };
                actionCell.appendChild(assignBtn);
                tr.appendChild(actionCell);

                tableBody.appendChild(tr);
            });
        } catch (err) { console.error(err); }
    };

    const renderAdminServices = async () => {
        const container = document.getElementById('services-list-container');
        if (!container) return;
        try {
            const res = await fetch('/api/admin/services');
            const data = await res.json();
            container.textContent = '';
            (data.services || []).forEach(s => {
                const div = document.createElement('div');
                div.className = 'card mt-1';
                const nameSpan = document.createElement('span');
                nameSpan.textContent = s.name;
                const priceStrong = document.createElement('strong');
                priceStrong.textContent = ` ₦${Number(s.price).toLocaleString()}`;
                div.append(nameSpan, priceStrong);
                container.appendChild(div);
            });
        } catch (err) { console.error(err); }
    };

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
            if (res.ok) { renderAdminServices(); e.target.reset(); }
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
            if (res.ok) { 
                showMessage('admin-error-container', "Staff Member Created!", false); 
                e.target.reset(); 
            }
        });
    };

    const renderDailyActivity = async (date) => {
        const body = document.getElementById('daily-activity-body');
        if (!body) return;
        const res = await fetch(`/api/admin/logs?date=${date}`);
        const data = await res.json();
        body.textContent = '';
        (data.logs || []).forEach(log => {
            const tr = document.createElement('tr');
            tr.append(
                createCell(log.username), 
                createCell(log.action), 
                createCell(log.ip), 
                createCell(new Date(log.createdAt).toLocaleTimeString())
            );
            body.appendChild(tr);
        });
    };

    // --- 7. GLOBAL LISTENERS & LOGOUT ---
    document.getElementById('activity-date-filter')?.addEventListener('change', (e) => renderDailyActivity(e.target.value));

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = 'index.html';
    });

    checkAuth();
});