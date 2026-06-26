const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const roomTitle = document.getElementById('room-title');
const roomSubtitle = document.getElementById('room-subtitle');
const clearBtn = document.getElementById('clear-chat');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const filePreview = document.getElementById('file-preview');
const previewFileName = document.getElementById('preview-file-name');
const removeFileBtn = document.getElementById('remove-file-btn');
const previewImage = document.getElementById('preview-image');
const previewIcon = document.getElementById('preview-icon');
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const modelSelect = document.getElementById('model-select');
const roomItems = document.querySelectorAll('.room-item');
const chatIcon = document.getElementById('chat-icon');

const ROOMS = {
  general: {
    title: 'Chat Umum',
    subtitle: 'Tanya apa saja, AI akan menjawab',
    endpoint: '/generate-text',
    welcome: 'Silakan tanyakan apa saja kepada Gemini AI.',
    icon: 'message-circle'
  },
  image: {
    title: 'Analisis Gambar',
    subtitle: 'Upload gambar dan minta AI menganalisis',
    endpoint: '/generate-from-image',
    welcome: 'Upload gambar dan beri prompt untuk dianalisis oleh Gemini AI.',
    accept: 'image/*',
    fileField: 'image',
    icon: 'photo'
  },
  document: {
    title: 'Ringkasan Dokumen',
    subtitle: 'Upload dokumen untuk diringkas',
    endpoint: '/generate-from-document',
    welcome: 'Upload dokumen (PDF, DOC, TXT) untuk dibuatkan ringkasan.',
    accept: '.pdf,.doc,.docx,.txt',
    fileField: 'document',
    icon: 'file-text'
  },
  audio: {
    title: 'Transkrip Audio',
    subtitle: 'Upload audio untuk ditranskrip',
    endpoint: '/generate-from-audio',
    welcome: 'Upload file audio untuk dibuatkan transkrip.',
    accept: 'audio/*',
    fileField: 'audio',
    icon: 'music'
  }
};

let currentRoom = 'general';
let selectedModel = modelSelect.value;
let pendingFile = null;
let previewURL = null;

modelSelect.addEventListener('change', () => {
  selectedModel = modelSelect.value;
});

function icon(name) {
  return `<i class="ti ti-${name}"></i>`;
}

function escapeHtml(text) {
  const el = document.createElement('div');
  el.textContent = text;
  return el.innerHTML;
}

function parseMarkdown(text) {
  let html = text;
  
  // Escape HTML first to prevent XSS
  html = html.replace(/&/g, '&')
             .replace(/</g, '<')
             .replace(/>/g, '>');
  
  // Convert headers (### Header)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Convert bold (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic (*text*)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Convert horizontal rules (---)
  html = html.replace(/^---$/gm, '<hr>');
  
  // Convert unordered lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  
  // Convert numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Convert line breaks to <br> (but not for block elements)
  html = html.replace(/\n/g, '<br>');
  html = html.replace(/<\/h[1-6]><br>/g, '</h$1>');
  html = html.replace(/<\/ul><br>/g, '</ul>');
  html = html.replace(/<\/li><br>/g, '</li>');
  html = html.replace(/<hr><br>/g, '<hr>');
  
  return html;
}

function getInputPlaceholder(roomKey) {
  return roomKey === 'general' ? 'Ketik pesan Anda...' : 'Jelaskan kebutuhan Anda...';
}

function getFilePreviewType(file) {
  if (file.type?.startsWith('image/') || currentRoom === 'image') return 'image';
  if (file.type?.startsWith('audio/') || currentRoom === 'audio') return 'audio';
  return 'file';
}

function getFileIconName(type) {
  if (type === 'audio') return 'music';
  if (type === 'file') return 'file-text';
  return 'paperclip';
}

function clearFilePreview() {
  pendingFile = null;
  if (previewURL) {
    URL.revokeObjectURL(previewURL);
    previewURL = null;
  }
  previewImage.src = '';
  previewImage.hidden = true;
  previewIcon.className = 'ti file-icon';
  previewIcon.hidden = true;
  filePreview.className = 'file-preview';
}

function setRoom(roomKey) {
  currentRoom = roomKey;
  const room = ROOMS[roomKey];

  roomItems.forEach(item => {
    item.classList.toggle('active', item.dataset.room === roomKey);
  });

  roomTitle.textContent = room.title;
  roomSubtitle.textContent = room.subtitle;
  chatIcon.innerHTML = icon(room.icon);

  chatBox.innerHTML = `
    <div class="welcome-message">
      <div class="welcome-avatar">${icon('sparkles')}</div>
      <div class="welcome-content">
        <h3>Selamat datang di ${room.title}!</h3>
        <p>${room.welcome}</p>
      </div>
    </div>
  `;

  clearFilePreview();
  input.placeholder = getInputPlaceholder(roomKey);
  uploadBtn.style.display = roomKey === 'general' ? 'none' : 'flex';
  if (room.accept) {
    uploadBtn.title = `Upload ${room.accept.split(',').pop()}`;
  }
}

function showFilePreview(file) {
  pendingFile = file;
  previewFileName.textContent = file.name;

  const type = getFilePreviewType(file);
  filePreview.className = `file-preview show file-preview--${type}`;

  if (type === 'image') {
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = URL.createObjectURL(file);
    previewImage.src = previewURL;
    previewImage.hidden = false;
    previewIcon.hidden = true;
  } else {
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      previewURL = null;
    }
    previewImage.src = '';
    previewImage.hidden = true;
    previewIcon.className = `ti file-icon ti-${getFileIconName(type)}`;
    previewIcon.hidden = false;
  }

  input.placeholder = `Ketik prompt untuk ${file.name}...`;
  input.focus();
}

function showLoading() {
  chatBox.querySelector('.welcome-message')?.remove();

  const loading = document.createElement('div');
  loading.id = 'loading-indicator';
  loading.classList.add('message', 'bot', 'loading');
  loading.innerHTML = `
    <div class="loading-content">
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="loading-text">Sedang menjawab...</span>
    </div>
  `;
  chatBox.appendChild(loading);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function hideLoading() {
  const loading = document.getElementById('loading-indicator');
  if (loading) loading.remove();
}

function appendMessage(sender, content, isHtml = false) {
  chatBox.querySelector('.welcome-message')?.remove();

  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  
  if (isHtml) {
    msg.innerHTML = content;
  } else if (sender === 'bot') {
    msg.innerHTML = parseMarkdown(content);
  } else {
    msg.textContent = content;
  }
  
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendBotResponse(response, data) {
  if (response.ok) {
    appendMessage('bot', data.result);
    return;
  }

  let iconName = 'alert-circle';
  let fallback = 'Terjadi kesalahan';

  if (response.status === 429) {
    iconName = 'alert-triangle';
    fallback = 'Kuota harian AI telah habis. Silakan coba lagi besok.';
  } else if (response.status === 503) {
    iconName = 'clock-exclamation';
    fallback = 'Layanan AI sedang sibuk. Silakan coba lagi sebentar lagi.';
  }

  const text = data.message || fallback;
  appendMessage('bot', `${icon(iconName)} ${escapeHtml(text)}`, true);
}

async function sendRequest(endpoint, options = {}) {
  try {
    if (options.body && !options.method) {
      options.method = 'POST';
    }

    const response = await fetch(endpoint, options);
    const data = await response.json();
    appendBotResponse(response, data);
  } catch (error) {
    console.error('Error:', error);
    appendMessage('bot', `${icon('wifi-off')} ${escapeHtml('Gagal terhubung ke server')}`, true);
  }
}

clearBtn.addEventListener('click', () => setRoom(currentRoom));

uploadBtn.addEventListener('click', () => {
  const room = ROOMS[currentRoom];
  fileInput.accept = room.accept || '*/*';
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  showFilePreview(file);
  fileInput.value = '';
});

removeFileBtn.addEventListener('click', () => {
  clearFilePreview();
  input.placeholder = getInputPlaceholder(currentRoom);
  input.focus();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  const room = ROOMS[currentRoom];

  if (currentRoom !== 'general' && pendingFile) {
    const fileToSend = pendingFile;
    appendMessage(
      'user',
      `${icon('paperclip')} ${escapeHtml(fileToSend.name)}<br>${icon('message')} ${escapeHtml(userMessage)}`,
      true
    );
    input.value = '';
    clearFilePreview();

    const formData = new FormData();
    formData.append(room.fileField, fileToSend);
    formData.append('prompt', userMessage);
    formData.append('model', selectedModel);

    await sendRequest(room.endpoint, { method: 'POST', body: formData });
  } else if (currentRoom === 'general') {
    appendMessage('user', userMessage);
    input.value = '';

    showLoading();

    await sendRequest(room.endpoint, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userMessage, model: selectedModel })
    });

    hideLoading();
  } else {
    appendMessage('bot', `${icon('upload')} Gunakan tombol upload untuk mengirim file.`, true);
  }
});

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('open');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
}

hamburger.addEventListener('click', () => {
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});

overlay.addEventListener('click', closeSidebar);

roomItems.forEach(item => {
  item.addEventListener('click', () => {
    const room = item.dataset.room;
    if (room && ROOMS[room]) {
      setRoom(room);
      if (window.innerWidth <= 768) closeSidebar();
    }
  });
});

setRoom('general');