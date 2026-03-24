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
            }
            
            return data.user;
        } catch (err) {
            if (!window.location.pathname.endsWith('index.html')) {
                window.location.href = 'index.html';
            }
        }
    };

    // --- 2. CUSTOMER: BOOKING & TRACKING ---
    const bookingForm = document.getElementById('booking-form');
    const myOrdersContainer = document.getElementById('my-orders-list');

    const populateBookingDropdown = async () => {
        const select = document.getElementById('booking-service-select');
        if (!select) return;

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
    };

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                service: document.getElementById('booking-service-select').value,
                vehiclePlate: document.getElementById('vehicle-plate').value,
                slot: document.getElementById('booking-slot').value // Typically a date/time string
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
        if (!myOrdersContainer) return;
        const res = await fetch('/api/orders/my-orders');
        const data = await res.json();

        while (myOrdersContainer.firstChild) {
            myOrdersContainer.removeChild(myOrdersContainer.firstChild);
        }

        if (data.data) {
            data.data.forEach(order => {
                const div = document.createElement('div');
                div.className = 'log-entry mt-1';
                
                const info = document.createElement('span');
                info.textContent = `${order.service.name} - ${order.vehiclePlate} | Status: `;
                
                const statusBadge = document.createElement('b');
                statusBadge.textContent = order.status.toUpperCase();
                // Color coding logic
                statusBadge.style.color = order.status === 'completed' ? '#2ecc71' : '#f39c12';

                div.append(info, statusBadge);
                myOrdersContainer.appendChild(div);
            });
        }
    };

    // --- 3. ATTENDANT: TASK MANAGEMENT ---
    const taskList = document.getElementById('attendant-task-list');

    const renderAttendantTasks = async () => {
        if (!taskList) return;
        // This endpoint should return orders assigned to 'req.user._id'
        const res = await fetch('/api/tasks/my-tasks'); 
        const data = await res.json();

        while (taskList.firstChild) {
            taskList.removeChild(taskList.firstChild);
        }

        if (data.data) {
            data.data.forEach(task => {
                const row = document.createElement('div');
                row.className = 'log-entry mt-2 d-flex justify-between';

                const details = document.createElement('div');
                details.textContent = `${task.vehiclePlate} (${task.service.name})`;

                const btnGroup = document.createElement('div');

                if (task.status === 'assigned') {
                    const startBtn = document.createElement('button');
                    startBtn.textContent = "Start Wash";
                    startBtn.className = "btn-small";
                    startBtn.onclick = () => updateTaskStatus(task._id, 'started');
                    btnGroup.appendChild(startBtn);
                } else if (task.status === 'started') {
                    const doneBtn = document.createElement('button');
                    doneBtn.textContent = "Mark Completed";
                    doneBtn.className = "btn-small success";
                    doneBtn.onclick = () => updateTaskStatus(task._id, 'completed');
                    btnGroup.appendChild(doneBtn);
                } else {
                    const statusText = document.createElement('span');
                    statusText.textContent = "Finished";
                    btnGroup.appendChild(statusText);
                }

                row.append(details, btnGroup);
                taskList.appendChild(row);
            });
        }
    };

    window.updateTaskStatus = async (taskId, newStatus) => {
        const res = await fetch(`/api/tasks/status/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            if (newStatus === 'completed') {
                alert("Task completed! Customer has been notified via email.");
            }
            renderAttendantTasks();
        }
    };

    // --- 4. ADMIN: SERVICE & STAFF ---
    const serviceForm = document.getElementById('service-form');
    const serviceList = document.getElementById('services-list-container');

    const renderServices = async () => {
        if (!serviceList) return;
        const res = await fetch('/api/admin/services');
        const data = await res.json();
        while (serviceList.firstChild) { serviceList.removeChild(serviceList.firstChild); }
        if (data.services) {
            data.services.forEach(svc => {
                const div = document.createElement('div');
                div.className = 'log-entry mt-1';
                const content = document.createElement('span');
                content.textContent = `${svc.name} - ₦${svc.price}`;
                div.appendChild(content);
                serviceList.appendChild(div);
            });
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