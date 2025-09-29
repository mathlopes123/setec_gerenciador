// API Configuration
const API_URL =
  "https://script.google.com/macros/s/AKfycbzXOjj-YgixwSgj1JdmME7MngZtZ8sN5CeRVvVN9WJIA_G0786KKma3t-QA7_dhCeb9/exec"

let allTasks = []
const modifiedTasks = {}

// Column names
const STATUS_COLUMN_NAME = "Situacao"
const ID_COLUMN_NAME = "RowIndex"

// Status options
const STATUS_OPTIONS = ["A Fazer", "Em Andamento", "Concluído"]

// Chart instances
let statusChartInstance = null
let categoryChartInstance = null

const STATUS_COLORS = {
  "A Fazer": "rgb(239, 68, 68)",
  "Em Andamento": "rgb(245, 158, 11)",
  Concluído: "rgb(34, 197, 94)",
}

// Data fetching and loading
async function fetchData() {
  try {
    document.getElementById("loading").style.display = "block"
    document.getElementById("tabela").style.display = "none"
    document.getElementById("tasks-tbody").innerHTML = ""

    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error(`Erro de rede: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    allTasks = data
    renderTable(allTasks)
    updateStatistics(allTasks)
  } catch (error) {
    console.error("Erro ao buscar dados da API:", error)
    document.getElementById("tasks-tbody").innerHTML =
      `<tr><td colspan="6" class="text-center text-danger">Falha ao carregar dados. Verifique o console.</td></tr>`
    showAlert("Falha ao carregar dados. Verifique a URL da API.", "error"); // Adicionado alerta
  } finally {
    document.getElementById("loading").style.display = "none"
    document.getElementById("tabela").style.display = "table"
  }
}

// Table rendering
function renderTable(tasksToRender) {
  const tableBody = document.getElementById("tasks-tbody")
  let html = ""

  if (tasksToRender.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-info">Nenhuma tarefa encontrada.</td></tr>`
    return
  }

  const DESCRICAO_KEY = "Descrição"
  const CATEGORIA_KEY = "Categoria"
  const PRIORIDADE_KEY = "Prioridade"
  const OBSERVACOES_KEY = "Observações"

  tasksToRender.forEach((task) => {
    const rowId = task[ID_COLUMN_NAME]
    const currentStatus = task[STATUS_COLUMN_NAME] || STATUS_OPTIONS[0]

    const statusToRender = modifiedTasks[rowId] ? modifiedTasks[rowId].newStatus : currentStatus
    const isModified = !!modifiedTasks[rowId]

    const statusOptionsHtml = STATUS_OPTIONS.map(
      (status) => `
            <option value="${status}" ${status === statusToRender ? "selected" : ""}>${status}</option>
        `,
    ).join("")

    const actionButton = isModified
      ? `<button class="btn btn-primary btn-sm" style="padding: 8px 15px;" onclick="submitStatusUpdate(${rowId})">💾 Salvar</button>`
      : "—"

    html += `
            <tr data-row-index="${rowId}" class="${isModified ? "table-warning" : ""}">
                <td>${task[DESCRICAO_KEY] || ""}</td>
                <td>${task[CATEGORIA_KEY] || ""}</td>
                <td>${task[PRIORIDADE_KEY] || ""}</td>
                <td>${task[OBSERVACOES_KEY] || ""}</td>
                
                <td>
                    <select class="filter-group" id="status-${rowId}" 
                            data-original-status="${currentStatus}" 
                            onchange="handleStatusChange(${rowId}, this.value)">
                        ${statusOptionsHtml}
                    </select>
                </td>
                
                <td>${actionButton}</td>
            </tr>
        `
  })

  tableBody.innerHTML = html
  clearFilters(false)
}

// Filtering functions
function filterTable() {
  const searchText = document.getElementById("filterText").value.toLowerCase()
  const statusFilter = document.getElementById("filterStatus").value
  const priorityFilter = document.getElementById("filterPriority").value
  const categoryFilter = document.getElementById("filterCategory").value

  const filteredTasks = allTasks.filter((task) => {
    const matchesText =
      !searchText ||
      (task["Descrição"] && task["Descrição"].toLowerCase().includes(searchText)) ||
      (task["Observações"] && task["Observações"].toLowerCase().includes(searchText))

    const currentStatus = modifiedTasks[task.RowIndex]
      ? modifiedTasks[task.RowIndex].newStatus
      : task[STATUS_COLUMN_NAME]
    const matchesStatus = statusFilter === "Todos" || !statusFilter || currentStatus === statusFilter

    const matchesPriority = priorityFilter === "Todas" || !priorityFilter || task["Prioridade"] === priorityFilter

    const matchesCategory = categoryFilter === "Todas" || !categoryFilter || task["Categoria"] === categoryFilter

    return matchesText && matchesStatus && matchesPriority && matchesCategory
  })

  renderTable(filteredTasks)
  updateStatistics(filteredTasks)
}

function clearFilters(shouldRender = true) {
  document.getElementById("filterText").value = ""
  document.getElementById("filterStatus").value = "Todos"
  document.getElementById("filterPriority").value = "Todas"
  document.getElementById("filterCategory").value = "Todas"

  if (shouldRender) {
    renderTable(allTasks)
    updateStatistics(allTasks); // Adicionado para atualizar estatísticas ao limpar filtros
  }
}

// Status update functions
function handleStatusChange(rowId, newStatus) {
  const rowIndex = Number(rowId)

  if (isNaN(rowIndex) || rowIndex < 2) return

  const task = allTasks.find((t) => t.RowIndex === rowIndex)
  if (!task) return

  const originalStatus = task[STATUS_COLUMN_NAME]

  if (newStatus !== originalStatus) {
    modifiedTasks[rowIndex] = {
      rowIndex: rowIndex,
      newStatus: newStatus,
    }
  } else {
    delete modifiedTasks[rowIndex]
  }

  filterTable()
}

async function submitStatusUpdate(rowId) {
  const taskToUpdate = modifiedTasks[rowId]

  if (!taskToUpdate) {
    showAlert("Nenhuma modificação pendente para salvar.", "error")
    return
  }

  const payload = {
    action: "updateStatus",
    rowIndex: taskToUpdate.rowIndex,
    newStatus: taskToUpdate.newStatus,
  }

  try {
    document.getElementById("loading-message").textContent = "Salvando..."
    document.getElementById("loading").style.display = "block"
    document.getElementById("tabela").style.display = "none"

    const response = await fetch(API_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Erro ao salvar: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (result.success) {
      showAlert(`Sucesso: ${result.message}`, "success")
      delete modifiedTasks[rowId]
      await fetchData()
    } else {
      showAlert(`Erro ao salvar no Sheets: ${result.message}`, "error")
    }
  } catch (error) {
    console.error("Erro no POST:", error)
    showAlert("Erro fatal ao tentar salvar os dados. Verifique o console.", "error")
  } finally {
    document.getElementById("loading").style.display = "none"
  }
}

// Statistics and charts
function updateStatistics(tasks) {
  const statusCounts = {}
  const categoryCounts = {}

  let totalTasks = 0

  tasks.forEach((task) => {
    const status = modifiedTasks[task.RowIndex]
      ? modifiedTasks[task.RowIndex].newStatus
      : task[STATUS_COLUMN_NAME] || "A Fazer"
    const category = task["Categoria"] || "Não Definido"

    totalTasks++

    statusCounts[status] = (statusCounts[status] || 0) + 1
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  renderStatsGrid(totalTasks, statusCounts)
  renderStatusChart(statusCounts)
  renderCategoryChart(categoryCounts)
}

function renderStatsGrid(totalTasks, statusCounts) {
  const statsGrid = document.getElementById("statsGrid")
  statsGrid.innerHTML = ""

  const completed = statusCounts["Concluído"] || 0
  const pending = totalTasks - completed
  const progress = totalTasks > 0 ? ((completed / totalTasks) * 100).toFixed(0) : 0

  const statsData = [
    { label: "Total de Tarefas", number: totalTasks, color: "#4a5568" },
    { label: "Tarefas Concluídas", number: completed, color: "#22c55e" },
    { label: "Tarefas Pendentes", number: pending, color: "#ef4444" },
    { label: "Progresso (%)", number: `${progress}%`, color: "#f59e0b" },
  ]

  statsGrid.innerHTML = statsData
    .map(
      (stat) => `
        <div class="stat-card" style="border-left: 4px solid ${stat.color};">
            <div class="stat-number" style="color: ${stat.color};">${stat.number}</div>
            <div class="stat-label">${stat.label}</div>
        </div>
    `,
    )
    .join("")
}

function renderStatusChart(statusCounts) {
  // CORRIGIDO: Certifica que a variável global Chart está disponível
  if (typeof Chart === 'undefined') {
    console.error("Chart.js não está carregado. Verifique a tag <script> no seu HTML.");
    return;
  }
  
  const ctx = document.getElementById("statusChart").getContext("2d")

  if (statusChartInstance) {
    statusChartInstance.destroy()
  }

  const labels = Object.keys(statusCounts)
  const data = Object.values(statusCounts)
  const backgroundColors = labels.map((label) => STATUS_COLORS[label] || "rgb(156, 163, 175)")

  statusChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: false,
        },
      },
    },
  })
}

function renderCategoryChart(categoryCounts) {
  // CORRIGIDO: Certifica que a variável global Chart está disponível
  if (typeof Chart === 'undefined') {
    // Já alertado em renderStatusChart, apenas loga aqui
    return; 
  }
  
  const ctx = document.getElementById("categoryChart").getContext("2d")

  if (categoryChartInstance) {
    categoryChartInstance.destroy()
  }

  const labels = Object.keys(categoryCounts)
  const data = Object.values(categoryCounts)

  categoryChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Tarefas por Categoria",
          data: data,
          backgroundColor: "#4a5568",
          borderColor: "#4a5568",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => {
              if (value % 1 === 0) return value
            },
          },
        },
      },
    },
  })
}

// Alert system
function showAlert(message, type = "info") {
  // Se você não tem um elemento com ID 'alertContainer', esta função falhará silenciosamente
  const alertContainer = document.getElementById("alertContainer")
  if (!alertContainer) {
    console.warn("Elemento #alertContainer não encontrado. Alerta não exibido.");
    alert(message); // Usa alerta padrão se o container não existir
    return;
  }
  
  const alert = document.createElement("div")
  alert.className = `alert alert-${type}`
  alert.textContent = message

  alertContainer.appendChild(alert)

  setTimeout(() => {
    alert.classList.add("show")
  }, 100)

  setTimeout(() => {
    alert.classList.remove("show")
    setTimeout(() => {
      if (alertContainer.contains(alert)) {
        alertContainer.removeChild(alert)
      }
    }, 300)
  }, 4000)
}

// Make functions globally available
window.fetchData = fetchData
window.filterTable = filterTable
window.clearFilters = clearFilters
window.handleStatusChange = handleStatusChange
window.submitStatusUpdate = submitStatusUpdate
window.showAlert = showAlert
window.updateStatistics = updateStatistics // Adicionado updateStatistics

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  const filterStatusSelect = document.getElementById("filterStatus")
  if (filterStatusSelect) {
    filterStatusSelect.innerHTML =
      '<option value="Todos">Todas as situações</option>' +
      STATUS_OPTIONS.map((status) => `<option value="${status}">${status}</option>`).join("")
  }

  fetchData()
})
