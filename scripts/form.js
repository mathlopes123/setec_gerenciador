// Form handling for cadastro page
document.addEventListener("DOMContentLoaded", () => {
  // Set today's date as default
  const today = new Date().toISOString().split("T")[0]
  const dateInput = document.getElementById("data")
  if (dateInput) {
    dateInput.value = today
  }
})

function validateForm() {
  let isValid = true
  const requiredFields = ["descricao", "categoria"]

  // Clear previous errors
  document.querySelectorAll(".form-group").forEach((group) => {
    group.classList.remove("error")
  })

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId)
    if (field) {
      const formGroup = field.closest(".form-group")

      if (!field.value.trim()) {
        formGroup.classList.add("error")
        isValid = false
      }
    }
  })

  return isValid
}

function showAlert(message, type) {
  const alertContainer = document.getElementById("alertContainer")
  if (!alertContainer) return

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

// Form submission
const taskForm = document.getElementById("taskForm")
if (taskForm) {
  taskForm.addEventListener("submit", function (e) {
    e.preventDefault()

    if (!validateForm()) {
      showAlert("Por favor, preencha todos os campos obrigatórios.", "error")
      return
    }

    const submitBtn = document.getElementById("submitBtn")

    // Disable button and show loading
    submitBtn.disabled = true
    submitBtn.classList.add("loading")
    submitBtn.querySelector(".btn-text").textContent = "Cadastrando..."

    showAlert("Enviando tarefa...", "info")

    // Create FormData
    const formData = new FormData(this)

    // Submit to Google Apps Script
    fetch(this.action, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro na resposta do servidor")
        }
        return response.text()
      })
      .then((data) => {
        showAlert("✅ Tarefa cadastrada com sucesso!", "success")

        // Reset form
        this.reset()

        // Set today's date again
        const today = new Date().toISOString().split("T")[0]
        const dateInput = document.getElementById("data")
        const situacaoSelect = document.getElementById("situacao")
        const prioridadeSelect = document.getElementById("prioridade")

        if (dateInput) dateInput.value = today
        if (situacaoSelect) situacaoSelect.value = "Não Iniciada"
        if (prioridadeSelect) prioridadeSelect.value = "Média"

        // Optional: redirect to tasks page after a delay
        setTimeout(() => {
          if (confirm("Tarefa cadastrada! Deseja ir para a página de tarefas?")) {
            window.location.href = "index.html"
          }
        }, 2000)
      })
      .catch((error) => {
        console.error("Erro:", error)
        showAlert("❌ Erro ao cadastrar tarefa. Tente novamente.", "error")
      })
      .finally(() => {
        // Re-enable button after 3 seconds to prevent spam
        setTimeout(() => {
          submitBtn.disabled = false
          submitBtn.classList.remove("loading")
          submitBtn.querySelector(".btn-text").textContent = "✅ Cadastrar Tarefa"
        }, 3000)
      })
  })
}

// Real-time validation
const descricaoField = document.getElementById("descricao")
const categoriaField = document.getElementById("categoria")

if (descricaoField) {
  descricaoField.addEventListener("input", function () {
    const formGroup = this.closest(".form-group")
    if (this.value.trim()) {
      formGroup.classList.remove("error")
    }
  })
}

if (categoriaField) {
  categoriaField.addEventListener("change", function () {
    const formGroup = this.closest(".form-group")
    if (this.value) {
      formGroup.classList.remove("error")
    }
  })
}

// Prevent multiple submissions with Enter key
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
    const submitBtn = document.getElementById("submitBtn")
    if (submitBtn && submitBtn.disabled) {
      e.preventDefault()
    }
  }
})
