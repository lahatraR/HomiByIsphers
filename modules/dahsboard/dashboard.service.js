import { assignedTasksSample, availableTasksSample } from './dashboard.constants.js';

export const assignedTasks = [...assignedTasksSample];
export const availableTasks = [...availableTasksSample];

export function toggleTask(taskId) {
  const task = [...assignedTasks, ...availableTasks].find(t => t.id === taskId);
  if (task) task.completed = !task.completed;
}
