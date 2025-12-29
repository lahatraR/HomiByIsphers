import { createElement } from './dashboard.dom.js';

export function renderDashboard(app, config, assignedTasks, availableTasks, toggleTask) {
  app.innerHTML = '';

  // Header
  const header = createElement('header', 'app-header', `
    <div class="logo-section"><span class="logo-text">Homi</span></div>
    <div class="user-section"><div class="user-avatar user-initial">${config.user_name.charAt(0)}</div></div>
  `);

  // Welcome
  const welcome = createElement('section', 'welcome-section', `
    <h1 class="welcome-title">${config.page_title}, ${config.user_name}! 👋</h1>
    <p class="welcome-subtitle">Here's what's happening with your tasks today</p>
  `);

  // Stats + Tasks containers
  const tasksSection = createElement('div', 'tasks-section');
  const assignedContainer = createElement('div', 'task-list-items');
  assignedContainer.id = 'assignedTasksList';
  const availableContainer = createElement('div', 'task-list-items');
  availableContainer.id = 'availableTasksList';

  tasksSection.appendChild(assignedContainer);
  tasksSection.appendChild(availableContainer);

  // Append all
  app.appendChild(header);
  app.appendChild(welcome);
  app.appendChild(tasksSection);

  // Render task items
  assignedTasks.forEach(task => renderTaskItem(assignedContainer, task, toggleTask));
  availableTasks.forEach(task => renderTaskItem(availableContainer, task, toggleTask));
}

export function renderTaskItem(container, task, toggleTask) {
  const taskItem = createElement('div', 'task-item', `
    <div class="task-checkbox ${task.completed ? 'checked' : ''}"></div>
    <div class="task-content">
      <div class="task-title">${task.title}</div>
      <div class="task-meta">${task.project} • ${task.dueDate} • ${task.priority}</div>
    </div>
  `);

  taskItem.addEventListener('click', () => { toggleTask(task.id); });
  container.appendChild(taskItem);
}
