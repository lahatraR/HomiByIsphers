// --- DOM Elements ---
const taskForm = document.getElementById('taskForm');
const taskTitle = document.getElementById('taskTitle');
const description = document.getElementById('description');
const charCount = document.getElementById('charCount');
const taskDate = document.getElementById('taskDate');
const taskTime = document.getElementById('taskTime');
const priorityOptions = document.querySelectorAll('.priority-option');
const priorityInput = document.getElementById('priority');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const successToast = document.getElementById('successToast');
const recurringCheckbox = document.getElementById('recurring');

let uploadedFiles = [];

// --- Character counter ---
description.addEventListener('input', () => charCount.textContent = description.value.length);

// --- Priority selector ---
priorityOptions.forEach(option => {
  option.addEventListener('click', () => {
    priorityOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    priorityInput.value = option.dataset.priority;
  });
});

// --- File Upload ---
fileUploadArea.addEventListener('click', () => fileInput.click());
fileUploadArea.addEventListener('dragover', e => { e.preventDefault(); fileUploadArea.classList.add('drag-over'); });
fileUploadArea.addEventListener('dragleave', () => fileUploadArea.classList.remove('drag-over'));
fileUploadArea.addEventListener('drop', e => { e.preventDefault(); fileUploadArea.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });
fileInput.addEventListener('change', e => handleFiles(e.target.files));

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if(file.size <= 10 * 1024 * 1024) {
      uploadedFiles.push(file);
      addFileToList(file);
    }
  });
}

function addFileToList(file) {
  const fileItem = document.createElement('div');
  fileItem.className = 'file-item';
  fileItem.innerHTML = `
    <div>${file.name} (${(file.size/1024/1024).toFixed(1)} MB)</div>
    <button type="button" onclick="removeFile('${file.name}')">Remove</button>
  `;
  fileList.appendChild(fileItem);
}

window.removeFile = function(fileName) {
  uploadedFiles = uploadedFiles.filter(f => f.name !== fileName);
  Array.from(fileList.children).forEach(item => {
    if(item.textContent.includes(fileName)) item.remove();
  });
};

// --- Form Submission ---
taskForm.addEventListener('submit', async e => {
  e.preventDefault();
  if(!taskTitle.value.trim()) { alert('Task title is required'); taskTitle.focus(); return; }
  if(!taskDate.value || !taskTime.value) { alert('Please fill date and time'); return; }

  submitBtn.disabled = true;
  submitText.textContent = 'Creating Task...';

  await new Promise(r => setTimeout(r, 2000));

  successToast.classList.add('show');
  taskForm.reset();
  uploadedFiles = [];
  fileList.innerHTML = '';
  charCount.textContent = '0';
  priorityOptions.forEach(opt => opt.classList.remove('selected'));
  priorityOptions[1].classList.add('selected');
  priorityInput.value = 'medium';

  submitBtn.disabled = false;
  submitText.textContent = 'Create Task';

  setTimeout(() => successToast.classList.remove('show'), 5000);
});
