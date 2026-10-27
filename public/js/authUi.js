document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const staffToggleBtn = document.getElementById("staff-toggle-btn");
  const emailInput = document.getElementById("email");

  const showFeedback = (message, isError = true) => {
    let banner = document.getElementById("auth-feedback");

    if (!banner) {
      banner = document.createElement("div");
      banner.id = "auth-feedback";

      const container =
        document.querySelector(".login-container, .card") || document.body;
      container.prepend(banner);
    }

    banner.textContent = message;
    banner.className = isError ? "feedback-error" : "feedback-success";

    setTimeout(() => banner.remove(), 5000);
  };

  const submitForm = async (form, url, getPayload, onSuccess, errorMessage) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(getPayload()),
        });

        const data = await response.json();

        if (data.success) {
          onSuccess(data);
        } else {
          showFeedback(data.message || errorMessage);
        }
      } catch {
        showFeedback(errorMessage);
      } finally {
        if (button) button.disabled = false;
      }
    });
  };

  if (staffToggleBtn && loginForm) {
    staffToggleBtn.addEventListener("click", () => {
      const password = document.getElementById("password")?.value;

      if (!emailInput?.value || !password) {
        showFeedback("Please enter staff credentials first.");
        emailInput?.focus();
      } else {
        loginForm.requestSubmit();
      }
    });
  }

  if (loginForm) {
    submitForm(
      loginForm,
      "/api/auth/login",
      () => ({
        email: emailInput.value,
        password: document.getElementById("password").value,
      }),
      ({ user }) => {
        const pages = {
          admin: "/admin.html",
          attendant: "/attendant.html",
        };

        window.location.replace(pages[user.role] || "/customer.html");
      },
      "Connection failed. Check your internet or server status.",
    );
  }

  if (registerForm) {
    submitForm(
      registerForm,
      "/api/auth/register",
      () => ({
        username: document.getElementById("reg-username").value,
        email: document.getElementById("reg-email").value,
        password: document.getElementById("reg-password").value,
      }),
      () => {
        sessionStorage.setItem("reg_success", "true");
        window.location.href = "/index.html";
      },
      "Unable to register. Please try again later.",
    );
  }

  const isLoginPage =
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/" ||
    window.location.pathname.endsWith("login.html");

  if (isLoginPage && sessionStorage.getItem("reg_success")) {
    showFeedback("Account created successfully! You can now log in.", false);
    sessionStorage.removeItem("reg_success");
  }
});
