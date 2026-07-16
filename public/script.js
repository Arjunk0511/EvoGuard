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

let attackChart;

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

    if (response.status === 403) {
      simulationResult.textContent = `${result.detection.attackTypes.join(", ")} blocked with risk score ${result.detection.riskScore}.`;
    } else {
      simulationResult.textContent =
        "Request was not blocked. Check the detector logic.";
    }

    await fetchAttackLogs();
  } catch (error) {
    console.error(error);
    simulationResult.textContent = "Attack simulation failed.";
  } finally {
    attackButtons.forEach((button) => {
      button.disabled = false;
    });
  }
};

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
    ${(log.attackTypes || [])
      .map((attack) => {
        let badgeClass = "";

        if (attack === "SQL_INJECTION") badgeClass = "attack-sql";

        if (attack === "XSS") badgeClass = "attack-xss";

        if (attack === "PATH_TRAVERSAL") badgeClass = "attack-path";

        return `<span class="attack-badge ${badgeClass}">
                    ${attack.replace("_", " ")}
                </span>`;
      })
      .join("")}
</td>

<td>
    <span class="risk-score ${
      log.riskScore >= 60
        ? "risk-high"
        : log.riskScore >= 30
          ? "risk-medium"
          : "risk-low"
    }">
        ${log.riskScore}
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

attackButtons.forEach((button) => {
  button.addEventListener("click", () => {
    simulateAttack(button.dataset.attack);
  });
});

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
    renderAttackChart(logs);
    renderLogs(logs);

    const lastUpdated = new Date().toLocaleTimeString();

    statusMessage.textContent = `Showing ${logs.length} recent attack log(s). Last updated: ${lastUpdated}`;
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

// Automatically refresh dashboard every 5 seconds
setInterval(fetchAttackLogs, 5000);

fetchAttackLogs();
