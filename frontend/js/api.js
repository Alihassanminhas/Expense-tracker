const API_BASE_URL = "http://localhost:5000/api";

/**
 * Universal API Request Handler
 */
async function apiRequest(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid -> Clear local storage & redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (!window.location.pathname.endsWith("login.html") && 
            !window.location.pathname.endsWith("register.html")) {
          window.location.href = "login.html";
        }
      }
      throw new Error(data.message || "An error occurred during request.");
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error.message);
    throw error;
  }
}

// Authentication API calls
const AuthAPI = {
  register: (name, email, password) =>
    apiRequest("/auth/register", "POST", { name, email, password }),
  login: (email, password) =>
    apiRequest("/auth/login", "POST", { email, password }),
};

// Expense API calls
const ExpenseAPI = {
  getAll: () => apiRequest("/expenses"),
  getSummary: () => apiRequest("/expenses/summary"),
  create: (data) => apiRequest("/expenses", "POST", data),
  update: (id, data) => apiRequest("/expenses/:id".replace(":id", id), "PUT", data),
  delete: (id) => apiRequest("/expenses/:id".replace(":id", id), "DELETE"),
};