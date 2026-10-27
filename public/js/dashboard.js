document.addEventListener("DOMContentLoaded", () => {
  // Shared utilities
  const $ = (id) => document.getElementById(id);
  const json = async (url) => (await fetch(url)).json();

  const send = (url, method, body) =>
    fetch(url, {
      method,
      ...(body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });

  const clear = (element) => {
    element.textContent = "";
  };

  const cell = (value) => {
    const td = document.createElement("td");
    td.textContent = value || "---";
    return td;
  };

  const badge = (text, className = "status-badge status-completed") => {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    return span;
  };

  const button = (text, className, onClick) => {
    const btn = document.createElement("button");
    btn.className = className;
    btn.textContent = text;
    btn.addEventListener("click", onClick);
    return btn;
  };

  const showMessage = (id, message, isError = true) => {
    const container = $(id);
    if (!container) return;

    clear(container);
    const div = document.createElement("div");
    div.className = isError ? "feedback-error" : "feedback-success";
    div.textContent = message;
    container.appendChild(div);
    setTimeout(() => div.remove(), 5000);
  };

  const setupToggles = (buttonIds, sectionIds) => {
    const buttons = buttonIds.map($);
    const sections = sectionIds.map($);

    if (!buttons[0] || !sections[0]) return;

    buttons.forEach((btn, index) => {
      if (!btn) return;

      btn.addEventListener("click", () => {
        buttons.forEach((b) => b?.classList.remove("active"));
        sections.forEach((s) => s?.classList.add("hidden"));

        btn.classList.add("active");
        sections[index]?.classList.remove("hidden");
      });
    });
  };

  setupToggles(
    ["toggle-booking", "toggle-status"],
    ["section-booking", "section-status"],
  );

  setupToggles(
    ["toggle-tasks", "toggle-settings"],
    ["section-tasks", "section-settings"],
  );

  setupToggles(
    ["toggle-wash", "toggle-orders", "toggle-staff", "toggle-activity"],
    ["section-wash", "section-orders", "section-staff", "section-activity"],
  );

  // Authentication and role routing
  const checkAuth = async () => {
    try {
      const data = await json("/api/auth/me");
      const path = location.pathname;
      const isLogin =
        path.endsWith("index.html") ||
        path === "/" ||
        path.endsWith("login.html");

      if (!data?.success) {
        if (!isLogin) location.href = "index.html";
        return;
      }

      const { role, username } = data.user;
      const display = $("user-display");
      if (display) display.textContent = `Welcome, ${username}`;

      const dashboards = {
        admin: "admin.html",
        attendant: "attendant.html",
        customer: "customer.html",
      };

      if (
        role !== "customer" &&
        dashboards[role] &&
        !path.includes(dashboards[role])
      ) {
        location.href = dashboards[role];
        return;
      }

      if (role === "customer" && isLogin) {
        location.href = dashboards.customer;
        return;
      }

      if (role === "customer") {
        populateCustomerDropdowns();
        renderOrderHistory();
        setupCustomerActions();
      } else if (role === "attendant") {
        renderAttendantTasks();
        setupAttendantActions();
      } else if (role === "admin") {
        renderAdminServices();
        renderAdminOrders();

        const filter = $("activity-date-filter");
        if (filter) {
          const today = new Date().toISOString().split("T")[0];
          filter.value = today;
          renderDailyActivity(today);
        }

        setupAdminActions();
      }
    } catch (err) {
      console.error("Auth System Error:", err);
    }
  };

  // Customer dashboard
  const populateCustomerDropdowns = async () => {
    const services = $("service-select");
    const slotsSelect = $("slot-select");
    if (!services || !slotsSelect) return;

    try {
      const data = await json("/api/admin/services");
      clear(services);

      const defaultService = new Option("Select Wash Type", "");
      defaultService.disabled = defaultService.selected = true;
      services.appendChild(defaultService);

      (data.services || []).forEach((service) => {
        services.appendChild(
          new Option(
            `${service.name} - ₦${Number(service.price).toLocaleString()}`,
            service._id,
          ),
        );
      });

      clear(slotsSelect);
      const defaultSlot = new Option("Select a slot", "");
      defaultSlot.disabled = defaultSlot.selected = true;
      slotsSelect.appendChild(defaultSlot);

      ["09:00 AM", "12:00 PM", "03:00 PM", "06:00 PM"].forEach((slot) =>
        slotsSelect.appendChild(new Option(slot, slot)),
      );
    } catch (err) {
      console.error("Dropdown load failure:", err);
    }
  };

  const renderOrderHistory = async () => {
    const body = $("order-history");
    if (!body) return;

    try {
      const result = await json("/api/orders/my-orders");
      clear(body);

      (result.data || []).forEach((order) => {
        const row = document.createElement("tr");
        row.append(
          cell(order.vehiclePlate),
          cell(order.service?.name),
          cell(order.status.toUpperCase()),
        );

        const paymentCell = document.createElement("td");

        if (order.paymentConfirmed) {
          paymentCell.appendChild(badge("PAID"));
        } else {
          paymentCell.appendChild(
            button("Notify Payment", "btn-small btn-success", async (event) => {
              const btn = event.currentTarget;
              btn.disabled = true;

              const res = await send(`/api/orders/paid/${order._id}`, "PATCH");

              if (res.ok) renderOrderHistory();
              else btn.disabled = false;
            }),
          );
        }

        row.appendChild(paymentCell);
        body.appendChild(row);
      });
    } catch (err) {
      console.error("History Sync Error:", err);
    }
  };

  const setupCustomerActions = () => {
    $("booking-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const payload = {
        service: $("service-select").value,
        slot: $("slot-select").value,
        vehiclePlate: $("plate-number").value,
      };

      const res = await send("/api/orders", "POST", payload);

      if (res.ok) {
        showMessage("message-container", "Booking Confirmed!", false);
        event.target.reset();
        renderOrderHistory();
      }
    });
  };

  // Attendant dashboard
  const renderAttendantTasks = async () => {
    const body = $("attendant-tasks");
    if (!body) return;

    try {
      const result = await json("/api/tasks/my-tasks");
      clear(body);

      (result.data || []).forEach((task) => {
        const row = document.createElement("tr");
        row.append(cell(task.vehiclePlate), cell(task.service?.name));

        const actionCell = document.createElement("td");

        if (task.status === "completed") {
          actionCell.appendChild(badge("Finished"));
        } else {
          actionCell.appendChild(
            button("Mark Done", "btn-small btn-primary", async (event) => {
              const btn = event.currentTarget;
              btn.disabled = true;

              const res = await send(
                `/api/tasks/complete/${task._id}`,
                "PATCH",
              );

              if (res.ok) renderAttendantTasks();
              else btn.disabled = false;
            }),
          );
        }

        row.appendChild(actionCell);
        body.appendChild(row);
      });
    } catch (err) {
      console.error("Task update error:", err);
    }
  };

  const setupAttendantActions = () => {
    $("save-pass-btn")?.addEventListener("click", async () => {
      const password = $("new-password").value;
      if (password.length < 8) return alert("Min. 8 characters required");

      const res = await send("/api/users/update-password", "PATCH", {
        password,
      });

      if (res.ok) {
        alert("Password Updated!");
        $("new-password").value = "";
      }
    });
  };

  // Admin dashboard
  const renderAdminOrders = async () => {
    const body = $("admin-orders-table");
    if (!body) return;

    try {
      const [orders, staff] = await Promise.all([
        json("/api/admin/orders"),
        json("/api/admin/attendants"),
      ]);

      clear(body);

      (orders.data || []).forEach((order) => {
        const row = document.createElement("tr");
        row.append(
          cell(order.vehiclePlate),
          cell(order.service?.name),
          cell(order.status.toUpperCase()),
        );

        const selectCell = document.createElement("td");
        const select = document.createElement("select");
        const attendant = order.attendant;

        select.appendChild(
          new Option(
            attendant ? attendant.username : "Not Assigned",
            attendant ? attendant._id : "",
          ),
        );

        (staff.attendants || []).forEach((person) => {
          if (!attendant || person._id !== attendant._id) {
            select.appendChild(new Option(person.username, person._id));
          }
        });

        selectCell.appendChild(select);
        row.appendChild(selectCell);

        const actionCell = document.createElement("td");
        actionCell.appendChild(
          button("Assign", "btn-small btn-primary", async () => {
            if (!select.value) return alert("Select an attendant first");

            const res = await send(`/api/tasks/assign/${order._id}`, "PATCH", {
              attendantId: select.value,
            });

            if (res.ok) {
              alert("Task assigned successfully");
              renderAdminOrders();
            }
          }),
        );

        row.appendChild(actionCell);
        body.appendChild(row);
      });
    } catch (err) {
      console.error(err);
    }
  };

  const renderAdminServices = async () => {
    const container = $("services-list-container");
    if (!container) return;

    try {
      const data = await json("/api/admin/services");
      clear(container);

      (data.services || []).forEach((service) => {
        const card = document.createElement("div");
        card.className = "card mt-1";

        const name = document.createElement("span");
        name.textContent = service.name;

        const price = document.createElement("strong");
        price.textContent = ` ₦${Number(service.price).toLocaleString()}`;

        card.append(name, price);
        container.appendChild(card);
      });
    } catch (err) {
      console.error(err);
    }
  };

  const setupAdminActions = () => {
    $("service-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const res = await send("/api/admin/services", "POST", {
        name: $("svc-name").value,
        price: $("svc-price").value,
      });

      if (res.ok) {
        renderAdminServices();
        event.target.reset();
      }
    });

    $("attendant-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const res = await send("/api/admin/attendant", "POST", {
        username: $("att-name").value,
        email: $("att-email").value,
        password: $("att-password").value,
      });

      if (res.ok) {
        showMessage("admin-error-container", "Staff Member Created!", false);
        event.target.reset();
      }
    });
  };

  const renderDailyActivity = async (date) => {
    const body = $("daily-activity-body");
    if (!body) return;

    const data = await json(`/api/admin/logs?date=${date}`);
    clear(body);

    (data.logs || []).forEach((log) => {
      const row = document.createElement("tr");
      row.append(
        cell(log.username),
        cell(log.action),
        cell(log.ip),
        cell(new Date(log.createdAt).toLocaleTimeString()),
      );
      body.appendChild(row);
    });
  };

  // Global listeners
  $("activity-date-filter")?.addEventListener("change", (event) => {
    renderDailyActivity(event.target.value);
  });

  $("logout-btn")?.addEventListener("click", async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "index.html";
  });

  checkAuth();
});
