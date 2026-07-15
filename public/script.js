const totalAttacksElement = document.getElementById("totalAttacks");
const sqlCountElement = document.getElementById("sqlCount");
const xssCountElement = document.getElementById("xssCount");
const pathCountElement = document.getElementById("pathCount");

const logsTableBody = document.getElementById("logsTableBody");
const statusMessage = document.getElementById("statusMessage");
const refreshButton = document.getElementById("refreshButton");

const countAttackType = (logs, attackType) => {
  return logs.filter((log) => log.attackTypes?.includes(attackType)).length;
};

const formatDate = (dateValue) => {
  return new Date(dateValue).toLocaleString();
};

const renderSummary = (logs) => {
  totalAttacksElement.textContent = logs.length;

  sqlCountElement.textContent = countAttackType(logs, "SQL_INJECTION");

  xssCountElement.textContent = countAttackType(logs, "XSS");

  pathCountElement.textContent = countAttackType(logs, "PATH_TRAVERSAL");
};

const renderLogs = (logs) => {
  logsTableBody.innerHTML = "";

  if (logs.length === 0) {
    logsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-row">
          No attack logs found.
        </td>
      </tr>
    `;

    return;
  }

  logs.forEach((log) => {
    const row = document.createElement("tr");

    const actionClass =
      log.action === "BLOCK" ? "action-block" : "action-monitor";

    row.innerHTML = `
      <td>${formatDate(log.createdAt)}</td>
      <td>${log.ipAddress || "UNKNOWN"}</td>
      <td>${log.method || "-"}</td>
      <td>${log.endpoint || "-"}</td>
      <td class="attack-type">
        ${(log.attackTypes || []).join(", ")}
      </td>
      <td class="risk-score">
        ${log.riskScore ?? 0}
      </td>
      <td>
        <span class="${actionClass}">
          ${log.action || "-"}
        </span>
      </td>
    `;

    logsTableBody.appendChild(row);
  });
};

const fetchAttackLogs = async () => {
  try {
    statusMessage.textContent = "Loading attack logs...";
    refreshButton.disabled = true;

    const response = await fetch("/api/ids/logs");

    if (!response.ok) {
      throw new Error("Failed to fetch attack logs.");
    }

    const result = await response.json();
    const logs = result.data || [];

    renderSummary(logs);
    renderLogs(logs);

    statusMessage.textContent = `Showing ${logs.length} recent attack log(s).`;
  } catch (error) {
    console.error(error);

    statusMessage.textContent = "Unable to load attack logs.";

    logsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-row">
          Failed to load dashboard data.
        </td>
      </tr>
    `;
  } finally {
    refreshButton.disabled = false;
  }
};

refreshButton.addEventListener("click", fetchAttackLogs);

fetchAttackLogs();
