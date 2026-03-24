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
            
            // ROLE-BASED UI INITIALIZATION
            if (data.user.role === 'customer') {
                populateBookingDropdown();
                renderMyOrders();
            } else if (data.user.role === 'attendant') {
                renderAttendantTasks();
            } else if (data.user.role === 'admin') {
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

    // --- 2. CUSTOMER: BOOKING & TRACKING ---
    const bookingForm = document.getElementById('booking-form');
    const orderHistoryBody = document.getElementById('order-history');

    const populateBookingDropdown = async () => {
        const select = document.getElementById('service-select');
        const slotSelect = document.getElementById('slot-select');
        if (!select) return;

        // Fetch Services from Admin API
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

        // Available Slots
        const slots = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"];
        if (slotSelect) {
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
                alert("Wash booked successfully!");
                bookingForm.reset();
                renderMyOrders();
            }
        });
    }

    const renderMyOrders = async () => {
        if (!orderHistoryBody) return;
        const res = await fetch('/api/orders/my-orders');
        const data = await res.json();

        while (orderHistoryBody.firstChild) { 
            orderHistoryBody.removeChild(orderHistoryBody.firstChild); 
        }

        if (data.data) {
            data.data.forEach(order => {
                const tr = document.createElement('tr');
                
                const plateTd = document.createElement('td');
                plateTd.textContent = order.vehiclePlate;
                
                const serviceTd = document.createElement('td');
                serviceTd.textContent = order.service ? order.service.name : 'N/A';
                
                const statusTd = document.createElement('td');
                const badge = document.createElement('span');
                badge.textContent = order.status.toUpperCase();
                badge.className = `badge-${order.status}`; 
                statusTd.appendChild(badge);

                const actionTd = document.createElement('td');
                actionTd.textContent = order.status === 'completed' ? 'Paid & Notified' : 'Processing...';

                tr.append(plateTd, serviceTd, statusTd, actionTd);
                orderHistoryBody.appendChild(tr);
            });
        }
    };

    // --- 3. ATTENDANT: TASK MANAGEMENT ---
    const attendantTaskBody = document.getElementById('attendant-tasks');

    const renderAttendantTasks = async () => {
        if (!attendantTaskBody) return;
        const res = await fetch('/api/tasks/my-tasks'); 
        const data = await res.json();

        while (attendantTaskBody.firstChild) { 
            attendantTaskBody.removeChild(attendantTaskBody.firstChild); 
        }

        if (data.data) {
            data.data.forEach(task => {
                const tr = document.createElement('tr');
                const plateTd = document.createElement('td');
                plateTd.textContent = task.vehiclePlate;
                
                const typeTd = document.createElement('td');
                typeTd.textContent = task.service ? task.service.name : 'N/A';
                
                const progressTd = document.createElement('td');
                progressTd.textContent = task.status.toUpperCase();

                const actionTd = document.createElement('td');
                if (task.status === 'assigned') {
                    const btn = document.createElement('button');
                    btn.textContent = "Start Wash";
                    btn.className = "btn-small";
                    btn.onclick = () => updateTaskStatus(task._id, 'started');
                    actionTd.appendChild(btn);
                } else if (task.status === 'started') {
                    const btn = document.createElement('button');
                    btn.textContent = "Mark Complete";
                    btn.className = "btn-small btn-success";
                    btn.onclick = () => updateTaskStatus(task._id, 'completed');
                    actionTd.appendChild(btn);
                } else {
                    actionTd.textContent = "✓ Task Finished";
                }

                tr.append(plateTd, typeTd, progressTd, actionTd);
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

        if (res.ok) {
            if (newStatus === 'completed') alert("Task completed! Customer notified.");
            renderAttendantTasks();
        }
    };

    // --- 4. ADMIN: MANAGEMENT & ASSIGNMENT ---
    const serviceList = document.getElementById('services-list-container');
    const activityBody = document.getElementById('daily-activity-body');

    const renderServices = async () => {
        if (!serviceList) return;
        const res = await fetch('/api/admin/services');
        const data = await res.json();
        while (serviceList.firstChild) { serviceList.removeChild(serviceList.firstChild); }
        if (data.services) {
            data.services.forEach(svc => {
                const div = document.createElement('div');
                div.className = 'log-entry mt-1';
                div.textContent = `${svc.name} - ₦${svc.price}`;
                serviceList.appendChild(div);
            });
        }
    };

    const renderDailyActivity = async () => {
        if (!activityBody) return;

        const [orderRes, staffRes] = await Promise.all([
            fetch('/api/admin/orders'),
            fetch('/api/admin/attendants')
        ]);
        
        const orders = await orderRes.json();
        const staff = await staffRes.json();

        while (activityBody.firstChild) { activityBody.removeChild(activityBody.firstChild); }

        if (orders.data) {
            orders.data.forEach(order => {
                const tr = document.createElement('tr');
                const plateTd = document.createElement('td');
                plateTd.textContent = order.vehiclePlate;
                
                const typeTd = document.createElement('td');
                typeTd.textContent = order.service?.name || 'N/A';
                
                const staffTd = document.createElement('td');
                if (order.status === 'pending') {
                    const select = document.createElement('select');
                    const defOpt = document.createElement('option');
                    defOpt.textContent = "Assign Attendant...";
                    select.appendChild(defOpt);

                    staff.attendants?.forEach(att => {
                        const opt = document.createElement('option');
                        opt.value = att._id;
                        opt.textContent = att.username;
                        select.appendChild(opt);
                    });

                    select.onchange = (e) => assignOrder(order._id, e.target.value);
                    staffTd.appendChild(select);
                } else {
                    staffTd.textContent = order.attendant?.username || 'Unassigned';
                }

                const statusTd = document.createElement('td');
                statusTd.textContent = order.status.toUpperCase();

                tr.append(plateTd, typeTd, staffTd, statusTd);
                activityBody.appendChild(tr);
            });
        }
    };

    const assignOrder = async (orderId, attendantId) => {
        if (!attendantId) return;
        const res = await fetch('/api/tasks/assign', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, attendantId })
        });
        if (res.ok) {
            alert("Attendant assigned successfully!");
            renderDailyActivity();
        }
    };

    // --- 5. LOGOUT ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = 'index.html';
        });
    }

    checkAuth();
});