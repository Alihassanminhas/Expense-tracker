document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const registerForm = document.getElementById("registerForm");
  const logoutBtn = document.getElementById("logoutBtn");

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const shouldShowPassword = passwordInput.type === "password";
      passwordInput.type = shouldShowPassword ? "text" : "password";
      togglePassword.textContent = shouldShowPassword ? "Hide" : "Show";
      togglePassword.setAttribute("aria-label", shouldShowPassword ? "Hide password" : "Show password");
      togglePassword.setAttribute("aria-pressed", String(shouldShowPassword));
    });
  }

  // Handle Login Form Submission
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const errorEl = document.getElementById("errorMessage");
      const submitButton = loginForm.querySelector('button[type="submit"]');

      if (errorEl) {
        errorEl.textContent = "";
        errorEl.classList.add("hidden");
      }
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Signing in…";
      }
      loginForm.setAttribute("aria-busy", "true");

      try {
        const response = await AuthAPI.login(email, password);
        if (!response?.user?.token || !response.user.id) {
          throw new Error("The server returned an invalid login response. Please try again.");
        }
        localStorage.setItem("token", response.user.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        window.location.href = "dashboard.html";
      } catch (error) {
        if (errorEl) {
          errorEl.textContent = error instanceof Error ? error.message : "Unable to log in. Please try again.";
          errorEl.classList.remove("hidden");
        }
      } finally {
        loginForm.removeAttribute("aria-busy");
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Sign In";
        }
      }
    });
  }

  // Handle Register Form Submission
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const errorEl = document.getElementById("errorMessage");
      const submitButton = registerForm.querySelector('button[type="submit"]');

      if (errorEl) {
        errorEl.textContent = "";
        errorEl.classList.add("hidden");
      }
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Creating account…";
      }
      registerForm.setAttribute("aria-busy", "true");

      try {
        await AuthAPI.register(name, email, password);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "index.html";
      } catch (error) {
        if (errorEl) {
          errorEl.textContent = error instanceof Error ? error.message : "Unable to create your account. Please try again.";
          errorEl.classList.remove("hidden");
        }
      } finally {
        registerForm.removeAttribute("aria-busy");
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Create account";
        }
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }
});
