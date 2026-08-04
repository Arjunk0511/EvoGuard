const totalAttacksElement = document.getElementById("totalAttacks");
const sqlCountElement = document.getElementById("sqlCount");
const xssCountElement = document.getElementById("xssCount");
const pathCountElement = document.getElementById("pathCount");

const logsTableBody = document.getElementById("logsTableBody");
const statusMessage = document.getElementById("statusMessage");
const refreshButton = document.getElementById("refreshButton");

const attackChartCanvas = document.getElementById("attackChart");

const attackButtons = document.querySelectorAll(".attack-button");
const simulationResult = document.getElementById("simulationResult");

const blacklistTableBody = document.getElementById("blacklistTableBody");

const blacklistStatusMessage = document.getElementById(
  "blacklistStatusMessage",
);

let attackChart;

const countAttackType = (logs, attackType) => {
  return logs.filter((log) => log.attackTypes?.includes(attackType)).length;
};

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  return new Date(dateValue).toLocaleString();
};

const renderSummary = (logs) => {
  totalAttacksElement.textContent = logs.length;

  sqlCountElement.textContent = countAttackType(logs, "SQL_INJECTION");

  xssCountElement.textContent = countAttackType(logs, "XSS");

  pathCountElement.textContent = countAttackType(logs, "PATH_TRAVERSAL");
};

const renderAttackChart = (logs) => {
  const chartData = {
    sqlInjection: countAttackType(logs, "SQL_INJECTION"),
    xss: countAttackType(logs, "XSS"),
    pathTraversal: countAttackType(logs, "PATH_TRAVERSAL"),
  };

  if (attackChart) {
    attackChart.destroy();
  }

  attackChart = new Chart(attackChartCanvas, {
    type: "bar",
    data: {
      labels: ["SQL Injection", "XSS", "Path Traversal"],
      datasets: [
        {
          label: "Detected attacks",
          data: [
            chartData.sqlInjection,
            chartData.xss,
            chartData.pathTraversal,
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  });
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

      <td>
        ${
          (log.attackTypes || [])
            .map((attack) => {
              let badgeClass = "";

              if (attack === "SQL_INJECTION") {
                badgeClass = "attack-sql";
              }

              if (attack === "XSS") {
                badgeClass = "attack-xss";
              }

              if (attack === "PATH_TRAVERSAL") {
                badgeClass = "attack-path";
              }

              return `
              <span class="attack-badge ${badgeClass}">
                ${attack.replaceAll("_", " ")}
              </span>
            `;
            })
            .join("") || "-"
        }
      </td>

      <td>
        <span class="risk-score ${
          log.riskScore >= 60
            ? "risk-high"
            : log.riskScore >= 30
              ? "risk-medium"
              : "risk-low"
        }">
          ${log.riskScore ?? 0}
        </span>
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

const renderBlacklist = (blacklistedIPs) => {
  blacklistTableBody.innerHTML = "";

  if (blacklistedIPs.length === 0) {
    blacklistTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-row">
          No active blacklisted IPs found.
        </td>
      </tr>
    `;

    return;
  }

  blacklistedIPs.forEach((entry) => {
    const row = document.createElement("tr");

    const riskStatusClass =
      entry.riskStatus === "CRITICAL" ? "risk-high" : "risk-medium";

    row.innerHTML = `
      <td>${entry.ipAddress || "UNKNOWN"}</td>

      <td>
        <span class="risk-score ${riskStatusClass}">
          ${(entry.riskStatus || "-").replaceAll("_", " ")}
        </span>
      </td>

      <td>
        <span class="risk-score ${
          entry.riskScore >= 60
            ? "risk-high"
            : entry.riskScore >= 30
              ? "risk-medium"
              : "risk-low"
        }">
          ${entry.riskScore ?? 0}
        </span>
      </td>

      <td>${entry.reason || "-"}</td>

      <td>
        ${
          (entry.behaviorTypes || [])
            .map(
              (behavior) => `
              <span class="attack-badge">
                ${behavior.replaceAll("_", " ")}
              </span>
            `,
            )
            .join("") || "-"
        }
      </td>

      <td>${entry.blockedCount ?? 0}</td>

      <td>${formatDate(entry.blacklistedAt)}</td>

      <td>
        <button
          type="button"
          class="remove-blacklist-button"
          data-ip-address="${entry.ipAddress}"
        >
          Remove
        </button>
      </td>
    `;

    blacklistTableBody.appendChild(row);
  });
};

const fetchAttackLogs = async () => {
  try {
    statusMessage.textContent = "Loading attack logs...";

    const response = await fetch("/api/ids/logs");

    if (!response.ok) {
      throw new Error("Failed to fetch attack logs.");
    }

    const result = await response.json();
    const logs = result.data || [];

    renderSummary(logs);
    renderAttackChart(logs);
    renderLogs(logs);

    const lastUpdated = new Date().toLocaleTimeString();

    statusMessage.textContent =
      `Showing ${logs.length} recent attack log(s). ` +
      `Last updated: ${lastUpdated}`;
  } catch (error) {
    console.error("Attack logs error:", error);

    statusMessage.textContent = "Unable to load attack logs.";

    logsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-row">
          Failed to load attack logs.
        </td>
      </tr>
    `;
  }
};

const fetchBlacklist = async () => {
  try {
    blacklistStatusMessage.textContent = "Loading blacklisted IPs...";

    const response = await fetch("/api/blacklist");

    if (!response.ok) {
      throw new Error("Failed to fetch blacklisted IPs.");
    }

    const result = await response.json();
    const blacklistedIPs = result.data || [];

    renderBlacklist(blacklistedIPs);

    const lastUpdated = new Date().toLocaleTimeString();

    blacklistStatusMessage.textContent =
      `Showing ${blacklistedIPs.length} active blacklisted IP(s). ` +
      `Last updated: ${lastUpdated}`;
  } catch (error) {
    console.error("Blacklist error:", error);

    blacklistStatusMessage.textContent = "Unable to load blacklisted IPs.";

    blacklistTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-row">
          Failed to load blacklist data.
        </td>
      </tr>
    `;
  }
};

const removeBlacklistedIP = async (ipAddress) => {
  const confirmed = window.confirm(`Remove ${ipAddress} from the blacklist?`);

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch("/api/blacklist/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ipAddress,
        removalReason: "Removed from dashboard by admin.",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error?.message || "Failed to remove blacklisted IP.",
      );
    }

    await fetchBlacklist();
  } catch (error) {
    console.error("Blacklist removal error:", error);
    window.alert(error.message);
  }
};

blacklistTableBody.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-blacklist-button");

  if (!removeButton) {
    return;
  }

  const ipAddress = removeButton.dataset.ipAddress;

  removeBlacklistedIP(ipAddress);
});

const refreshDashboard = async () => {
  refreshButton.disabled = true;
  refreshButton.textContent = "Refreshing...";

  try {
    await Promise.all([fetchAttackLogs(), fetchBlacklist()]);
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "Refresh Logs";
  }
};

const simulateAttack = async (attackType) => {
  let url = "/api/products";

  let options = {
    method: "GET",
  };

  if (attackType === "sql") {
    url = "/api/products?search=%27%20OR%201%3D1%20--";
  }

  if (attackType === "path") {
    url = "/api/products?file=..%2F..%2Fetc%2Fpasswd";
  }

  if (attackType === "xss") {
    options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "<script>alert('xss')</script>",
      }),
    };
  }

  attackButtons.forEach((button) => {
    button.disabled = true;
  });

  simulationResult.textContent = "Running attack simulation...";

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (result.error?.code === "IP_BLACKLISTED") {
      simulationResult.textContent =
        `Simulation stopped because IP ${result.blacklist?.ipAddress || ""} ` +
        "is already blacklisted.";
    } else if (response.status === 403 && result.detection?.attackTypes) {
      simulationResult.textContent =
        `${result.detection.attackTypes.join(", ")} blocked with ` +
        `risk score ${result.detection.riskScore}.`;
    } else if (response.status === 403 && result.detection?.behaviorTypes) {
      simulationResult.textContent =
        `${result.detection.behaviorTypes.join(", ")} blocked with ` +
        `risk score ${result.detection.riskScore}.`;
    } else {
      simulationResult.textContent =
        "Request was not blocked. Check the detector logic.";
    }

    await refreshDashboard();
  } catch (error) {
    console.error("Attack simulation error:", error);

    simulationResult.textContent = "Attack simulation failed.";
  } finally {
    attackButtons.forEach((button) => {
      button.disabled = false;
    });
  }
};

attackButtons.forEach((button) => {
  button.addEventListener("click", () => {
    simulateAttack(button.dataset.attack);
  });
});

refreshButton.addEventListener("click", refreshDashboard);

// Initial dashboard load
refreshDashboard();

// Automatically refresh dashboard every 5 seconds
setInterval(refreshDashboard, 5000);
