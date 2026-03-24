document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & GLOBALS ---
    const BANK_DETAILS = "GTBank | Sparkle Wash | 0123456789";

    // --- 2. AUTHENTICATION CHECK ---
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
            console.error("Auth Error:", err);
            if (!window.location.pathname.endsWith('index.html')) {
                window.location.href = 'index.html';
            }
        }
    };

    // --- 3. CUSTOMER LOGIC ---
    const bookingForm = document.getElementById('booking-form');

    const populateBookingDropdown = async () => {
        const select = document.getElementById('service-select');
        const slotSelect = document.getElementById('slot-select');
        if (!select) return;

        while (select.firstChild) select.removeChild(select.firstChild);
        
        const placeholder = document.createElement('option');
        placeholder.value = "";
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
            while (slotSelect.firstChild) slotSelect.removeChild(slotSelect.firstChild);
            slots.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                slotSelect.appendChild(opt);
            });
        }
    };

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                service: document.getElementById('service-select').value,
                vehiclePlate: document.getElementById('plate-number').value,
                slot: document.getElementById('slot-select').value
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Booking confirmed!");
                bookingForm.reset();
                renderMyOrders();
            }
        });
    }

    const renderMyOrders = async () => {
        const orderHistoryBody = document.getElementById('order-history');
        if (!orderHistoryBody) return;
        
        const res = await fetch('/api/orders/my-orders');
        const data = await res.json();
        while (orderHistoryBody.firstChild) orderHistoryBody.removeChild(orderHistoryBody.firstChild);

        if (data.data) {
            data.data.forEach(order => {
                const tr = document.createElement('tr');
                tr.append(createTd(order.vehiclePlate), createTd(order.service?.name || 'N/A'));
                
                const statusTd = document.createElement('td');
                const badge = document.createElement('span');
                badge.textContent = order.status.toUpperCase();
                badge.className = `badge-${order.status}`; 
                statusTd.appendChild(badge);

                const actionTd = document.createElement('td');
                if (order.status === 'completed' && !order.paymentConfirmed) {
                    const info = document.createElement('div');
                    info.className = 'text-xs text-muted';
                    info.textContent = `Pay to: ${BANK_DETAILS}`;
                    const payBtn = createBtn("Confirm I've Paid", "btn-small btn-success mt-1", () => notifyPayment(order._id));
                    actionTd.append(info, payBtn);
                } else if (order.paymentConfirmed) {
                    actionTd.textContent = "✅ Payment Verified";
                } else {
                    actionTd.textContent = "Processing...";
                }

                tr.append(statusTd, actionTd);
                orderHistoryBody.appendChild(tr);
            });
        }
    };

    const notifyPayment = async (orderId) => {
        const res = await fetch(`/api/orders/paid/${orderId}`, { method: 'PATCH' });
        if (res.ok) {
            alert("Admin notified of your payment.");
            renderMyOrders();
        }
    };

    // --- 4. ATTENDANT LOGIC ---
    const renderAttendantTasks = async () => {
        const attendantTaskBody = document.getElementById('attendant-tasks');
        if (!attendantTaskBody) return;
        
        const res = await fetch('/api/tasks/my-tasks'); 
        const data = await res.json();
        while (attendantTaskBody.firstChild) attendantTaskBody.removeChild(attendantTaskBody.firstChild);

        if (data.data) {
            data.data.forEach(task => {
                const tr = document.createElement('tr');
                tr.append(createTd(task.vehiclePlate), createTd(task.service?.name || 'N/A'), createTd(task.status.toUpperCase()));

                const actionTd = document.createElement('td');
                if (task.status === 'assigned') {
                    actionTd.appendChild(createBtn("Start Wash", "btn-small", () => updateTaskStatus(task._id, 'started')));
                } else if (task.status === 'started') {
                    actionTd.appendChild(createBtn("Mark Complete", "btn-small btn-success", () => updateTaskStatus(task._id, 'completed')));
                } else {
                    actionTd.textContent = "✓ Task Finished";
                }
                tr.appendChild(actionTd);
                attendantTaskBody.appendChild(tr);
            });
        }
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        const res = await fetch(`/api/tasks/status/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) renderAttendantTasks();
    };

    // --- 5. ADMIN LOGIC ---
    const renderDailyActivity = async () => {
        const activityBody = document.getElementById('daily-activity-body');
        if (!activityBody) return;

        const [orderRes, staffRes] = await Promise.all([
            fetch('/api/admin/orders'),
            fetch('/api/admin/attendants')
        ]);
        const orders = await orderRes.json();
        const staff = await staffRes.json();

        while (activityBody.firstChild) activityBody.removeChild(activityBody.firstChild);

        orders.data?.forEach(order => {
            const tr = document.createElement('tr');
            tr.append(createTd(order.vehiclePlate), createTd(order.service?.name || 'N/A'));

            const staffTd = document.createElement('td');
            if (order.status === 'pending') {
                const select = document.createElement('select');
                const def = document.createElement('option');
                def.textContent = "Assign Staff...";
                select.appendChild(def);
                staff.attendants?.forEach(att => {
                    const opt = document.createElement('option');
                    opt.value = att._id; opt.textContent = att.username;
                    select.appendChild(opt);
                });
                select.onchange = (e) => assignOrder(order._id, e.target.value);
                staffTd.appendChild(select);
            } else {
                staffTd.textContent = order.attendant?.username || 'Unassigned';
            }

            const statusTd = document.createElement('td');
            if (order.status === 'completed' && !order.paymentConfirmed) {
                statusTd.appendChild(createBtn("Verify Payment", "btn-small btn-primary", () => adminConfirmPayment(order._id)));
            } else {
                statusTd.textContent = order.status.toUpperCase();
            }

            tr.append(staffTd, statusTd);
            activityBody.appendChild(tr);
        });
    };

    const adminConfirmPayment = async (orderId) => {
        const res = await fetch(`/api/admin/confirm-payment/${orderId}`, { method: 'PATCH' });
        if (res.ok) {
            alert("Payment successfully verified.");
            renderDailyActivity();
        }
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

    // --- 6. UTILITIES & LOGOUT ---
    function createTd(text) {
        const td = document.createElement('td');
        td.textContent = text;
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
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = 'index.html';
        });
    }

    checkAuth();
});