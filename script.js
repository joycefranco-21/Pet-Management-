const STORAGE_KEY = "pet-management-daily-tasks";

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadTasks() {
  const savedTasks = window.localStorage.getItem(STORAGE_KEY);

  if (!savedTasks) {
    return [...initialTasks];
  }

  try {
    const parsedTasks = JSON.parse(savedTasks);
    return Array.isArray(parsedTasks) ? parsedTasks : [...initialTasks];
  } catch {
    return [...initialTasks];
  }
}

function saveTasks() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

const initialTasks = [];

const state = {
  tasks: loadTasks(),
  filter: "all",
};

const refs = {
  todayLabel: document.querySelector("#todayLabel"),
  completionLabel: document.querySelector("#completionLabel"),
  pendingCount: document.querySelector("#pendingCount"),
  completedCount: document.querySelector("#completedCount"),
  totalCount: document.querySelector("#totalCount"),
  progressText: document.querySelector("#progressText"),
  progressFill: document.querySelector("#progressFill"),
  taskForm: document.querySelector("#taskForm"),
  taskList: document.querySelector("#taskList"),
  emptyState: document.querySelector("#emptyState"),
  taskTemplate: document.querySelector("#taskTemplate"),
  filters: document.querySelectorAll("[data-filter]"),
};

function formatToday() {
  const today = new Date();
  refs.todayLabel.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(today);
}

function getVisibleTasks() {
  if (state.filter === "pending") {
    return state.tasks.filter((task) => !task.completed);
  }

  if (state.filter === "done") {
    return state.tasks.filter((task) => task.completed);
  }

  return state.tasks;
}

function updateSummary() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  refs.pendingCount.textContent = String(pending);
  refs.completedCount.textContent = String(completed);
  refs.totalCount.textContent = String(total);
  refs.progressText.textContent = `${completed} of ${total} complete`;
  refs.completionLabel.textContent = `${percentage}%`;
  refs.progressFill.style.width = `${percentage}%`;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks().sort((a, b) => a.time.localeCompare(b.time));

  refs.taskList.innerHTML = "";

  visibleTasks.forEach((task) => {
    const fragment = refs.taskTemplate.content.cloneNode(true);
    const taskCard = fragment.querySelector(".task-card");
    const checkButton = fragment.querySelector(".task-check");
    const title = fragment.querySelector(".task-card__title");
    const badge = fragment.querySelector(".task-card__badge");
    const meta = fragment.querySelector(".task-card__meta");
    const deleteButton = fragment.querySelector(".task-delete");

    taskCard.dataset.id = task.id;
    taskCard.classList.toggle("is-complete", task.completed);
    title.textContent = task.title;
    badge.textContent = task.category;
    meta.textContent = `${task.pet} - ${task.time}`;
    checkButton.setAttribute(
      "aria-label",
      task.completed ? "Mark task as pending" : "Mark task as complete"
    );

    checkButton.addEventListener("click", () => {
      toggleTask(task.id);
    });

    deleteButton.addEventListener("click", () => {
      deleteTask(task.id);
    });

    refs.taskList.appendChild(fragment);
  });

  refs.emptyState.hidden = visibleTasks.length !== 0;
}

function toggleTask(taskId) {
  state.tasks = state.tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  syncUI();
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  syncUI();
}

function createTask(event) {
  event.preventDefault();

  const formData = new FormData(refs.taskForm);
  const task = {
    id: createId(),
    title: formData.get("taskTitle").toString().trim(),
    pet: formData.get("taskPet").toString().trim(),
    category: formData.get("taskCategory").toString(),
    time: formData.get("taskTime").toString(),
    completed: false,
  };

  state.tasks = [...state.tasks, task];
  refs.taskForm.reset();
  refs.taskForm.elements.taskTime.value = "08:00";
  syncUI();
}

function setFilter(nextFilter) {
  state.filter = nextFilter;
  refs.filters.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === nextFilter);
  });
  renderTasks();
}

function syncUI() {
  saveTasks();
  updateSummary();
  renderTasks();
}

refs.taskForm.addEventListener("submit", createTask);
refs.filters.forEach((button) => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

formatToday();
refs.taskForm.elements.taskTime.value = "08:00";
syncUI();
