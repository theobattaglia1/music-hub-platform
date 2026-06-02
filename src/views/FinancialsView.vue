<template>
  <WorkspacePage
    artist-scoped-header
    eyebrow="Business Workspace"
    title="Financials"
    subtitle="Budgets, invoices, payouts, and forecast visibility in one operating surface."
  >
    <template #actions>
      <button class="workspace-header-primary-btn" @click="createInvoice">New Invoice</button>
      <button class="workspace-header-secondary-btn" @click="exportReport">Export Report</button>
    </template>

    <template #stats>
      <article class="stat-card">
        <span>Outstanding</span>
        <strong>${{ formatCurrency(kpis.outstanding) }}</strong>
      </article>
      <article class="stat-card">
        <span>Paid This Month</span>
        <strong>${{ formatCurrency(kpis.paidThisMonth) }}</strong>
      </article>
      <article class="stat-card">
        <span>Forecasted Revenue</span>
        <strong>${{ formatCurrency(kpis.forecastedRevenue) }}</strong>
      </article>
      <article class="stat-card">
        <span>Upcoming Payouts</span>
        <strong>{{ kpis.upcomingPayouts }}</strong>
      </article>
    </template>

    <template #toolbar>
      <div class="toolbar-copy">
        <strong>Invoice Pipeline</strong>
        <span>{{ filteredInvoices.length }} visible records</span>
      </div>

      <label class="status-filter">
        <span>Status</span>
        <select v-model="statusFilter">
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </label>
    </template>

    <section class="financial-layout" @contextmenu.prevent="openFinancialsWorkspaceMenu">
      <section class="workspace-panel invoice-panel">
        <div class="panel-head">
          <div>
            <h2>Invoices</h2>
            <p>Track outgoing billing, due dates, and collections status.</p>
          </div>
        </div>

        <div class="invoice-table">
          <div v-if="filteredInvoices.length === 0" class="empty-state">
            No invoices for this status.
          </div>
          <article
            v-for="invoice in filteredInvoices"
            :key="invoice.id"
            class="invoice-row"
            @contextmenu.prevent.stop="openInvoiceMenu($event, invoice)"
          >
            <div class="invoice-main">
              <h3>{{ invoice.title }}</h3>
              <p>{{ invoice.client }}</p>
            </div>
            <div class="invoice-amount">${{ formatCurrency(invoice.amount) }}</div>
            <div class="invoice-date">{{ invoice.dueDate }}</div>
            <span class="invoice-status" :class="invoice.status">{{ invoice.status }}</span>
          </article>
        </div>
      </section>

      <aside class="workspace-panel summary-panel">
        <div class="panel-head">
          <div>
            <h2>Cash Snapshot</h2>
            <p>Short-term operating posture across billing and payouts.</p>
          </div>
        </div>

        <div class="snapshot-list">
          <article class="snapshot-row">
            <span>Collection Rate</span>
            <strong>82%</strong>
          </article>
          <article class="snapshot-row">
            <span>Average Invoice Size</span>
            <strong>${{ formatCurrency(29850) }}</strong>
          </article>
          <article class="snapshot-row">
            <span>Next Payout Window</span>
            <strong>Mar 12</strong>
          </article>
          <article class="snapshot-row">
            <span>Budget Health</span>
            <strong>On Track</strong>
          </article>
        </div>
      </aside>
    </section>
  </WorkspacePage>
</template>

<script setup>
import { computed, inject, ref } from "vue";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";

const showToast = inject("showToast", () => {});
const showContextMenu = inject("showContextMenu", () => {});
const statusFilter = ref("all");

const kpis = {
  outstanding: 128420,
  paidThisMonth: 73450,
  forecastedRevenue: 241600,
  upcomingPayouts: 5,
};

const invoices = ref([
  {
    id: "inv-1001",
    title: "Streaming Royalty Payout",
    client: "Atlantic Distribution",
    amount: 32400,
    dueDate: "Mar 5",
    status: "sent",
  },
  {
    id: "inv-1002",
    title: "Production Retainer",
    client: "Lunar Studios",
    amount: 18500,
    dueDate: "Mar 8",
    status: "draft",
  },
  {
    id: "inv-1003",
    title: "Campaign Services",
    client: "Highline Media",
    amount: 42000,
    dueDate: "Feb 24",
    status: "overdue",
  },
  {
    id: "inv-1004",
    title: "Merchandising License",
    client: "Orbit Supply Co.",
    amount: 26500,
    dueDate: "Feb 21",
    status: "paid",
  },
]);

const filteredInvoices = computed(() => {
  if (statusFilter.value === "all") return invoices.value;
  return invoices.value.filter((invoice) => invoice.status === statusFilter.value);
});

const formatCurrency = (value) => Number(value).toLocaleString("en-US");
const formatStatusLabel = (status) =>
  `${String(status || "").slice(0, 1).toUpperCase()}${String(status || "").slice(1)}`;

const createInvoice = () => {
  showToast({
    message: "Invoice composer is the next financial workflow to wire up.",
    type: "info",
  });
};

const exportReport = () => {
  showToast({ message: "Financial export queued", type: "success" });
};

const editInvoice = (invoice) => {
  showToast({
    message: `Invoice editor for "${invoice.title}" is the next finance workflow to wire up.`,
    type: "info",
  });
};

const setInvoiceStatus = (invoice, status) => {
  invoice.status = status;
  showToast({
    message: `"${invoice.title}" marked ${formatStatusLabel(status).toLowerCase()}.`,
    type: status === "paid" ? "success" : "info",
  });
};

const copyInvoiceAmount = async (invoice) => {
  const value = `$${formatCurrency(invoice.amount)}`;

  try {
    await navigator.clipboard.writeText(value);
    showToast({ message: "Invoice amount copied", type: "success" });
  } catch {
    showToast({ message: value, type: "info" });
  }
};

const deleteInvoice = (invoice) => {
  invoices.value = invoices.value.filter((entry) => entry.id !== invoice.id);
  showToast({ message: `Removed "${invoice.title}"`, type: "success" });
};

const openInvoiceMenu = (event, invoice) => {
  const actions = [
    { label: "Edit Invoice", handler: () => editInvoice(invoice) },
    { label: "Copy Amount", handler: () => void copyInvoiceAmount(invoice) },
  ];

  if (invoice.status !== "sent") {
    actions.push({ label: "Mark Sent", handler: () => setInvoiceStatus(invoice, "sent") });
  }
  if (invoice.status !== "paid") {
    actions.push({ label: "Mark Paid", handler: () => setInvoiceStatus(invoice, "paid") });
  }
  if (invoice.status !== "overdue") {
    actions.push({ label: "Mark Overdue", handler: () => setInvoiceStatus(invoice, "overdue") });
  }

  actions.push(
    { separator: true },
    {
      label: "Delete Invoice",
      destructive: true,
      handler: () => deleteInvoice(invoice),
    },
  );

  showContextMenu(event, actions, "custom");
};

const openFinancialsWorkspaceMenu = (event) => {
  if (event.target.closest(".invoice-row")) return;

  showContextMenu(
    event,
    [
      { label: "New Invoice", handler: () => createInvoice() },
      { label: "Export Report", handler: () => exportReport() },
      { separator: true },
      {
        label: "Show All Invoices",
        handler: () => {
          statusFilter.value = "all";
        },
      },
      {
        label: "Show Draft Invoices",
        handler: () => {
          statusFilter.value = "draft";
        },
      },
      {
        label: "Show Overdue Invoices",
        handler: () => {
          statusFilter.value = "overdue";
        },
      },
    ],
    "custom",
  );
};
</script>

<style scoped>
.status-filter,
.workspace-panel {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(250, 250, 248, 0.82)),
    var(--color-surface);
  color: var(--color-text);
}

.action-btn {
  min-height: var(--control-md);
  padding: 0 var(--control-px);
}

.stat-card {
  min-width: 154px;
  padding: 12px 14px;
  border-radius: calc(var(--radius-control) + 6px);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.76);
  display: grid;
  gap: 4px;
}

.stat-card span,
.toolbar-copy span {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.stat-card strong {
  font-size: 18px;
  font-weight: 520;
  color: var(--color-text);
}

.toolbar-copy {
  display: grid;
  gap: 4px;
}

.toolbar-copy strong {
  font-size: 15px;
  font-weight: 520;
  color: var(--color-text);
}

.status-filter {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: var(--control-md);
  padding: 0 var(--control-px);
  border-radius: var(--radius-pill);
}

.status-filter span {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.status-filter select {
  border: none;
  background: transparent;
  color: var(--color-text);
  font: inherit;
}

.status-filter select:focus {
  outline: none;
}

.financial-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.8fr);
  gap: 16px;
}

.workspace-panel {
  border-radius: var(--radius-card);
  padding: 18px;
  display: grid;
  gap: 16px;
  box-shadow: var(--shadow-1);
}

.panel-head h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 420;
  color: var(--color-text);
}

.panel-head p {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
}

.invoice-table,
.snapshot-list {
  display: grid;
}

.invoice-row {
  display: grid;
  grid-template-columns: minmax(180px, 1.6fr) minmax(110px, 0.8fr) minmax(90px, 0.6fr) minmax(
      88px,
      0.45fr
    );
  align-items: center;
  gap: 10px;
  min-height: 64px;
  border-top: 1px solid var(--color-border);
}

.invoice-main h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.invoice-main p {
  margin: 4px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.invoice-amount {
  font-weight: 600;
  color: var(--color-text);
}

.invoice-date {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.invoice-status {
  justify-self: start;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.invoice-status.paid {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.invoice-status.sent {
  background: rgba(17, 16, 15, 0.06);
  color: var(--color-info);
}

.invoice-status.draft {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.invoice-status.overdue {
  background: rgba(239, 68, 68, 0.14);
  color: rgba(185, 28, 28, 0.92);
}

.snapshot-row {
  min-height: 54px;
  padding: 0 2px;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.snapshot-row span {
  color: var(--color-text-secondary);
}

.snapshot-row strong {
  font-weight: 520;
  color: var(--color-text);
}

.empty-state {
  padding: 20px 0 4px;
  color: var(--color-text-secondary);
}

@media (max-width: 1000px) {
  .financial-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .invoice-row {
    grid-template-columns: 1fr;
    align-items: start;
    padding: 14px 0;
  }
}
</style>
