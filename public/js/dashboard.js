document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & GLOBALS ---
    const BANK_DETAILS = "GTBank | Car Wash | 0123456789";

    /**
     * --- 2. UI TOGGLE LOGIC ---
     * Handles switching between sections (forms/tables) using buttons
     */
    const setupToggles = (buttonIds, sectionIds) => {
        const buttons = buttonIds.map(id => document.getElementById(id));
        const sections = sectionIds.map(id => document.getElementById(id));

        if (!buttons[0] || !sections[0]) return;

        buttons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons and hide all sections
                buttons.forEach(b => b.classList.remove('active'));
                sections.forEach(s => s.classList.add('hidden'));

                // Set current active
                btn.classList.add('active');
                sections[index].classList.remove('hidden');
            });
        });
    };

    // Initialize UI for Customer and Admin
    setupToggles(['toggle-booking', 'toggle-status'], ['section-booking', 'section-status']);
    setupToggles(
        ['toggle-wash', 'toggle-staff', 'toggle-activity'], 
        ['section-wash', 'section-staff', 'section-activity']
    );

    /**
     * --- 3. ERROR & MESSAGE HANDLING ---
     */
    const showMessage = (containerId, message, isError = true) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.textContent = ''; 
        const div = document.createElement('div');
        div.className = isError ? 'error-banner' : 'success-banner';
        div.textContent = message;
        container.appendChild(div);
        
        // Auto-remove after 5 seconds
        setTimeout(() => div.remove(), 5000);
    };

    /**
     * --- 4. AUTHENTICATION CHECK ---
     */
    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            
            if (!data || !data.success) {
                if (!window.location.pathname.endsWith('index.html')) {
                    window.location.href = 'index.html';
                }
                return null;
            }

            const display = document.getElementById('user-display');
            if (display) display.textContent = `Welcome, ${data.user.username}`;
            
            const role = data.user.role;
            if (role === 'customer') {
                populateBookingDropdown();
                renderMyOrders();
            } else if (role === 'attendant') {
                renderAttendantTasks();
            } else if (role === 'admin') {
                renderServices();
                renderDailyActivity(); 
            }
            
            return data.user;
        } catch (err) {
            if (err.message !== "Failed to fetch") window.location.href = 'index.html';
        }
    };

    /**
     * --- 5. CUSTOMER LOGIC ---
     */
    const populateBookingDropdown = async () => {
        const select = document.getElementById('service-select');
        const slotSelect = document.getElementById('slot-select');
        if (!select) return;

        select.textContent = '';
        const placeholder = document.createElement('option');
        placeholder.textContent = "-- Select Wash Type --";
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);

        try {
            const res = await fetch('/api/admin/services');
            const data = await res.json();
            if (data.services) {
                data.services.forEach(svc => {
                    const opt = document.createElement('option');
                    opt.value = svc._id;
                    opt.textContent = `${svc.name} (₦${svc.price})`;
                    select.appendChild(opt);
                });
            }
        } catch (err) { console.error("Service load error:", err); }

        const slots = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"];
        if (slotSelect) {
            slotSelect.textContent = '';
            slots.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s; opt.textContent = s;
                slotSelect.appendChild(opt);
            });
        }
    };

    const renderMyOrders = async () => {
        const orderHistoryBody = document.getElementById('order-history');
        if (!orderHistoryBody) return;
        
        try {
            const res = await fetch('/api/orders/my-orders');
            const data = await res.json();
            orderHistoryBody.textContent = ''; 

            if (data.data && data.data.length > 0) {
                data.data.forEach(order => {
                    const tr = document.createElement('tr');
                    
                    // Task Activity / Status Logic
                    const statusTd = document.createElement('td');
                    const badge = document.createElement('span');
                    
                    // Visual feedback for ongoing tasks
                    if (order.status === 'started') {
                        badge.textContent = "WASHING...";
                        badge.className = "status-badge status-started pulse";
                    } else {
                        badge.textContent = order.status.toUpperCase();
                        badge.className = `status-badge status-${order.status}`;
                    }
                    statusTd.appendChild(badge);

                    tr.append(createTd(order.vehiclePlate), createTd(order.service?.name), statusTd);

                    // Payment Action Logic
                    const actionTd = document.createElement('td');
                    if (order.status === 'completed' && !order.paymentConfirmed) {
                        const info = document.createElement('div');
                        info.className = 'text-xs text-muted';
                        info.textContent = `Bank: ${BANK_DETAILS}`;
                        const payBtn = createBtn("Confirm I've Paid", "btn-small btn-success mt-1", () => notifyPayment(order._id));
                        actionTd.append(info, payBtn);
                    } else {
                        actionTd.textContent = order.paymentConfirmed ? "Payment Verified" : "Awaiting Finish";
                    }
                    
                    tr.appendChild(actionTd);
                    orderHistoryBody.appendChild(tr);
                });
            } else {
                const emptyTr = document.createElement('tr');
                const emptyTd = createTd("No active services found.");
                emptyTd.setAttribute('colspan', '4');
                emptyTr.appendChild(emptyTd);
                orderHistoryBody.appendChild(emptyTr);
            }
        } catch (err) { 
            showMessage('error-container', "Failed to sync order history."); 
        }
    };

    const notifyPayment = async (orderId) => {
        const res = await fetch(`/api/orders/paid/${orderId}`, { method: 'PATCH' });
        if (res.ok) {
            alert("Admin notified! Please wait for verification.");
            renderMyOrders();
        }
    };

    /**
     * --- 6. ADMIN LOGIC ---
     */
    const renderDailyActivity = async () => {
        const activityBody = document.getElementById('daily-activity-body');
        if (!activityBody) return;

        try {
            const [orderRes, staffRes] = await Promise.all([
                fetch('/api/admin/orders'),
                fetch('/api/admin/attendants')
            ]);
            
            const orders = await orderRes.json();
            const staff = await staffRes.json();
            activityBody.textContent = '';

            if (orders.data) {
                orders.data.forEach(order => {
                    const tr = document.createElement('tr');
                    tr.append(createTd(order.vehiclePlate), createTd(order.service?.name));

                    // Assignment Cell
                    const staffTd = document.createElement('td');
                    if (order.status === 'pending') {
                        const select = document.createElement('select');
                        select.className = "input-small";
                        const def = document.createElement('option');
                        def.textContent = "Assign Attendant";
                        select.appendChild(def);
                        
                        if (staff.attendants) {
                            staff.attendants.forEach(att => {
                                const opt = document.createElement('option');
                                opt.value = att._id; 
                                opt.textContent = att.username;
                                select.appendChild(opt);
                            });
                        }
                        select.onchange = (e) => assignOrder(order._id, e.target.value);
                        staffTd.appendChild(select);
                    } else {
                        staffTd.textContent = order.attendant?.username || 'System';
                    }

                    // Status Cell
                    const statusTd = document.createElement('td');
                    if (order.status === 'completed' && !order.paymentConfirmed) {
                        statusTd.appendChild(createBtn("Verify $", "btn-small btn-primary", () => adminConfirmPayment(order._id)));
                    } else {
                        statusTd.textContent = order.status.toUpperCase();
                    }

                    tr.append(staffTd, statusTd);
                    activityBody.appendChild(tr);
                });
            }
        } catch (err) { console.error("Admin Load Error:", err); }
    };

    const assignOrder = async (orderId, attendantId) => {
        if (!attendantId) return;
        const res = await fetch('/api/tasks/assign', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, attendantId })
        });
        if (res.ok) renderDailyActivity();
    };

    /**
     * --- 7. UTILITIES & LOGOUT ---
     */
    function createTd(text) {
        const td = document.createElement('td');
        td.textContent = text || 'N/A';
        return td;
    }

    function createBtn(text, cls, fn) {
        const b = document.createElement('button');
        b.textContent = text;
        b.className = cls;
        b.onclick = fn;
        return b;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = 'index.html';
        };
    }

    // Responsive Deletion Request
    const delBtn = document.getElementById('delete-account-btn');
    if (delBtn) {
        delBtn.onclick = () => {
            if(confirm("Permanently request account deletion?")) {
                const notice = document.getElementById('deletion-notice');
                if (notice) notice.classList.remove('hidden');
                delBtn.classList.add('btn-disabled');
                delBtn.disabled = true;
                delBtn.textContent = "Deletion Pending";
            }
        };
    }

    // Start Authentication Check
    checkAuth();
});