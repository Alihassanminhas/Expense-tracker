document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !localStorage.getItem("token")) {
    window.location.href = "login.html";
    return;
  }

  // Display user name
  document.getElementById("userName").textContent = user.name;
  setupAutoHidingMobileNavigation();

  // Set default date picker value to today
  document.getElementById("expenseDate").valueAsDate = new Date();

  // Load initial dashboard data
  loadSummary();
  loadExpenses();

  // Handle new expense form submission
  const expenseForm = document.getElementById("expenseForm");
  const monthlySalaryShortcut = document.getElementById("monthlySalaryShortcut");

  if (monthlySalaryShortcut) {
    monthlySalaryShortcut.addEventListener("click", () => {
      document.getElementById("category").value = "6";
      document.getElementById("title").value = "Monthly salary";
      document.getElementById("addExpense").scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("amount").focus({ preventScroll: true });
    });
  }

  expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const categoryId = parseInt(document.getElementById("category").value, 10);
    const expenseDate = document.getElementById("expenseDate").value;
    const description = document.getElementById("description").value;

    try {
      await ExpenseAPI.create({
        title,
        amount,
        categoryId,
        expenseDate,
        description,
      });

      expenseForm.reset();
      document.getElementById("expenseDate").valueAsDate = new Date();
      loadSummary();
      loadExpenses();
    } catch (error) {
      alert(error.message || "Failed to add expense.");
    }
  });
});

/** Hide the mobile navigation while scrolling down and reveal it while scrolling up. */
function setupAutoHidingMobileNavigation() {
  const navigation = document.getElementById("dashboardNavigation");
  if (!navigation) return;

  let previousScrollPosition = window.scrollY;
  let accumulatedScrollDelta = 0;
  let lastScrollDirection = 0;

  const keepNavigationVisibleOnDesktop = () => {
    if (window.innerWidth >= 768) {
      navigation.style.removeProperty("transform");
      navigation.style.removeProperty("opacity");
      accumulatedScrollDelta = 0;
      previousScrollPosition = window.scrollY;
    }
  };

  window.addEventListener("scroll", () => {
    const currentScrollPosition = window.scrollY;
    const scrollDelta = currentScrollPosition - previousScrollPosition;
    previousScrollPosition = currentScrollPosition;

    if (window.innerWidth >= 768) {
      keepNavigationVisibleOnDesktop();
      return;
    }

    if (currentScrollPosition < 48) {
      navigation.style.removeProperty("transform");
      navigation.style.removeProperty("opacity");
      accumulatedScrollDelta = 0;
      lastScrollDirection = 0;
      return;
    }

    if (scrollDelta === 0) return;
    const scrollDirection = Math.sign(scrollDelta);
    accumulatedScrollDelta = scrollDirection === lastScrollDirection
      ? accumulatedScrollDelta + scrollDelta
      : scrollDelta;
    lastScrollDirection = scrollDirection;

    if (accumulatedScrollDelta > 8) {
      navigation.style.transform = "translateY(-100%)";
      navigation.style.opacity = "0";
    }
    if (accumulatedScrollDelta < -8) {
      navigation.style.removeProperty("transform");
      navigation.style.removeProperty("opacity");
    }
  }, { passive: true });

  window.addEventListener("resize", keepNavigationVisibleOnDesktop);
}

/**
 * Fetch and render spending metrics
 */
async function loadSummary() {
  try {
    const res = await ExpenseAPI.getSummary();
    const summary = res.data;

    document.getElementById("totalSpending").textContent = `$${parseFloat(summary.total_spending).toFixed(2)}`;
    document.getElementById("monthlySpending").textContent = `$${parseFloat(summary.monthly_spending).toFixed(2)}`;
    document.getElementById("weeklySpending").textContent = `$${parseFloat(summary.weekly_spending).toFixed(2)}`;
    document.getElementById("monthlyIncome").textContent = `$${parseFloat(summary.monthly_income).toFixed(2)}`;
  } catch (error) {
    console.error("Failed to load summary:", error);
  }
}

/**
 * Fetch and render user's expense items
 */
async function loadExpenses() {
  const expenseList = document.getElementById("expenseList");

  try {
    const res = await ExpenseAPI.getAll();
    const expenses = res.data;
    renderSpendingChart(expenses);

    if (expenses.length === 0) {
      expenseList.innerHTML = `
        <tr>
          <td colspan="5" class="px-4 py-10 text-center text-gray-500">No expenses yet. Add your first expense below.</td>
        </tr>
      `;
      return;
    }

    expenseList.innerHTML = expenses
      .map(
        (item) => `
        <tr class="transition hover:bg-gray-50">
          <td class="px-4 py-3 font-medium text-gray-900 sm:px-5">${item.title}</td>
          <td class="px-3 py-3">
            <span class="rounded-full px-2 py-1 text-xs font-semibold" style="background-color: ${item.category_color}20; color: ${item.category_color}">
              ${item.category_name || "Uncategorized"}
            </span>
          </td>
          <td class="px-3 py-3 text-gray-600">${new Date(item.expense_date).toLocaleDateString()}</td>
          <td class="px-4 py-3 text-right font-semibold text-gray-900 sm:px-5">$${parseFloat(item.amount).toFixed(2)}</td>
          <td class="px-3 py-3 text-right">
            <button onclick="deleteExpenseItem(${item.id})" class="rounded px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-600">
              Delete
            </button>
          </td>
        </tr>
      `
      )
      .join("");
  } catch (error) {
    const chart = document.getElementById("spendingChart");
    if (chart) chart.innerHTML = '<div class="flex h-44 items-center justify-center text-sm text-red-600">Could not load spending overview.</div>';
    expenseList.innerHTML = `
      <tr>
        <td colspan="5" class="px-4 py-10 text-center text-red-600">Could not load transactions. Please refresh to try again.</td>
      </tr>
    `;
  }
}

/** Render six months of spending totals using the expense data already loaded. */
function renderSpendingChart(expenses) {
  const chart = document.getElementById("spendingChart");
  const chartDescription = document.getElementById("spendingChartDescription");
  if (!chart || !chartDescription) return;

  const currentDate = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5 + index, 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    return {
      key: monthKey,
      label: new Intl.DateTimeFormat(undefined, { month: "short" }).format(monthDate),
      total: 0,
    };
  });
  const monthlyTotals = new Map(months.map(({ key }) => [key, 0]));

  expenses.filter((expense) => Number(expense.category_id) !== 6).forEach((expense) => {
    const monthKey = String(expense.expense_date).slice(0, 7);
    if (monthlyTotals.has(monthKey)) {
      monthlyTotals.set(monthKey, monthlyTotals.get(monthKey) + Number(expense.amount));
    }
  });

  months.forEach((month) => {
    month.total = monthlyTotals.get(month.key) || 0;
  });

  const maximumTotal = Math.max(...months.map(({ total }) => total), 1);
  const hasSpending = months.some(({ total }) => total > 0);
  chartDescription.textContent = hasSpending
    ? `Monthly totals: ${months.map(({ label, total }) => `${label}, $${total.toFixed(2)}`).join("; ")}.`
    : "No spending recorded in the last six months.";
  chart.innerHTML = `
    <div class="relative">
      <div aria-hidden="true" class="absolute inset-x-0 top-0 flex h-36 flex-col justify-between">
        <span class="border-t border-dashed border-gray-200"></span>
        <span class="border-t border-dashed border-gray-200"></span>
        <span class="border-t border-dashed border-gray-200"></span>
        <span class="border-t border-gray-300"></span>
      </div>
      <div class="relative grid h-44 grid-cols-6 gap-2 sm:gap-4">
        ${months.map(({ label, total }) => {
          const barHeight = total > 0 ? Math.max((total / maximumTotal) * 100, 4) : 0;
          return `
            <div class="flex min-w-0 flex-col items-center justify-end">
              <span class="mb-2 truncate text-[10px] font-medium text-gray-500 sm:text-xs">${total > 0 ? `$${total.toFixed(0)}` : ""}</span>
              <div class="flex h-36 w-full items-end justify-center">
                <div class="w-full max-w-10 rounded-t-md bg-emerald-600 transition-[height] duration-300" style="height: ${barHeight}%" title="${label}: $${total.toFixed(2)}"></div>
              </div>
              <span class="mt-2 text-xs font-medium text-gray-500">${label}</span>
            </div>
          `;
        }).join("")}
      </div>
      ${hasSpending ? "" : '<p class="pointer-events-none absolute inset-x-0 top-14 text-center text-xs text-gray-500">Add an expense to see your monthly totals.</p>'}
    </div>
  `;
}

/**
 * Handle expense deletion
 */
async function deleteExpenseItem(id) {
  if (confirm("Are you sure you want to delete this expense?")) {
    try {
      await ExpenseAPI.delete(id);
      loadSummary();
      loadExpenses();
    } catch (error) {
      alert("Failed to delete expense.");
    }
  }
}
