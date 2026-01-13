import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Button, Input, Card } from '../components/common';
import { useTaskStore } from '../stores/taskStore';
import { TaskPriorities, type TaskPriority } from '../types';

export const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const { createTask, isLoading } = useTaskStore();
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
    dueTime: string;
    recurring: boolean;
    executorId: string;
  }>({
    title: '',
    description: '',
    priority: TaskPriorities.MEDIUM,
    dueDate: '',
    dueTime: '',
    recurring: false,
    executorId: '',
  });

  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask({
        ...formData,
        attachments: files,
      });
      navigate('/tasks');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const priorities = [
    { value: TaskPriorities.LOW, label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    { value: TaskPriorities.MEDIUM, label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: TaskPriorities.HIGH, label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { value: TaskPriorities.URGENT, label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-300' },
  ];

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Task</h1>
          <p className="text-gray-600">Fill in the details to create a new task</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Information</h2>
            
            <div className="space-y-4">
              <Input
                label="Task Title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the task in detail..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.description.length} characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {priorities.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: priority.value })}
                      className={`
                        px-4 py-2 rounded-lg border-2 font-medium transition-all
                        ${formData.priority === priority.value 
                          ? priority.color + ' ring-2 ring-offset-2 ring-primary-500' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }
                      `}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Due Date"
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Due Time"
                  type="time"
                  name="dueTime"
                  value={formData.dueTime}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="recurring"
                    checked={formData.recurring}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    This is a recurring task
                  </span>
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-2">
                  <span className="text-primary-600 font-medium">Upload files</span>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex items-center space-x-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
            >
              Create Task
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};
