const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const roomTitle = document.getElementById('room-title');
const roomSubtitle = document.getElementById('room-subtitle');
const clearBtn = document.getElementById('clear-chat');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const roomItems = document.querySelectorAll('.room-item');

const ROOMS = {
  general: {
    title: 'Chat Umum',
    subtitle: 'Tanya apa saja, AI akan menjawab',
    endpoint: '/generate-text',
    welcome: 'Selamat datang di Chat Umum! Silakan tanyakan apa saja kepada Gemini AI.'
  },
  image: {
    title: 'Analisis Gambar',
    subtitle: 'Upload gambar dan minta AI menganalisis',
    endpoint: '/generate-from-image',
    welcome: 'Upload gambar dan beri prompt untuk dianalisis oleh Gemini AI.',
    accept: 'image/*'
  },
  document: {
    title: 'Ringkasan Dokumen',
    subtitle: 'Upload dokumen untuk diringkas',
    endpoint: '/generate-from-document',
    welcome: 'Upload dokumen (PDF, DOC, TXT) untuk dibuatkan ringkasan.',
    accept: '.pdf,.doc,.docx,.txt'
  },
  audio: {
    title: 'Transkrip Audio',
    subtitle: 'Upload audio untuk ditranskrip',
    endpoint: '/generate-from-audio',
    welcome: 'Upload file audio untuk dibuatkan transkrip.',
    accept: 'audio/*'
  }
};

let currentRoom = 'general';

function setRoom(roomKey) {
  currentRoom = roomKey;
  const room = ROOMS[roomKey];

  roomItems.forEach(item => {
    item.classList.toggle('active', item.dataset.room === roomKey);
  });

  roomTitle.textContent = room.title;
  roomSubtitle.textContent = room.subtitle;

  chatBox.innerHTML = `
    <div class="welcome-message">
      <div class="welcome-avatar">✨</div>
      <div class="welcome-content">
        <h3>Selamat datang di ${room.title}!</h3>
        <p>${room.welcome}</p>
      </div>
    </div>
  `;

  input.placeholder = roomKey === 'general'
    ? 'Ketik pesan Anda...'
    : 'Jelaskan kebutuhan Anda...';

  if (roomKey === 'general') {
    uploadBtn.style.display = 'none';
  } else {
    uploadBtn.style.display = 'flex';
    uploadBtn.title = `Upload ${room.accept ? room.accept.split(',').pop() : 'file'}`;
  }
}

roomItems.forEach(item => {
  item.addEventListener('click', () => {
    const room = item.dataset.room;
    if (room && ROOMS[room]) {
      setRoom(room);
    }
  });
});

clearBtn.addEventListener('click', () => {
  setRoom(currentRoom);
});

uploadBtn.addEventListener('click', () => {
  const room = ROOMS[currentRoom];
  fileInput.accept = room.accept || '*/*';
  fileInput.click();
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  const room = ROOMS[currentRoom];
  const userMessage = input.value.trim() || 'Tolong proses file ini.';

  appendMessage('user', `📎 ${file.name}`);
  input.value = '';

  const formData = new FormData();
  formData.append(room.endpoint.includes('image') ? 'image' :
                  room.endpoint.includes('document') ? 'document' : 'audio',
                  file);
  formData.append('prompt', userMessage);

  try {
    const response = await fetch(room.endpoint, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      appendMessage('bot', data.result);
    } else if (response.status === 429) {
      appendMessage('bot', '⚠️ ' + (data.message || 'Kuota harian AI telah habis. Silakan coba lagi besok.'));
    } else if (response.status === 503) {
      appendMessage('bot', '😔 ' + (data.message || 'Layanan AI sedang sibuk. Silakan coba lagi sebentar lagi.'));
    } else {
      appendMessage('bot', 'Error: ' + (data.message || 'Terjadi kesalahan'));
    }
  } catch (error) {
    console.error('Error:', error);
    appendMessage('bot', 'Error: Gagal terhubung ke server');
  }

  fileInput.value = '';
});

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  const room = ROOMS[currentRoom];

  if (currentRoom !== 'general') {
    appendMessage('user', userMessage + ' (menunggu file...)');
  } else {
    appendMessage('user', userMessage);
  }
  input.value = '';

  if (currentRoom === 'general') {
    try {
      const response = await fetch(room.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage })
      });

      const data = await response.json();

      if (response.ok) {
        appendMessage('bot', data.result);
      } else if (response.status === 429) {
        appendMessage('bot', '⚠️ ' + (data.message || 'Kuota harian AI telah habis. Silakan coba lagi besok.'));
      } else if (response.status === 503) {
        appendMessage('bot', '😔 ' + (data.message || 'Layanan AI sedang sibuk. Silakan coba lagi sebentar lagi.'));
      } else {
        appendMessage('bot', 'Error: ' + (data.message || 'Terjadi kesalahan'));
      }
    } catch (error) {
      console.error('Error:', error);
      appendMessage('bot', 'Error: Gagal terhubung ke server');
    }
  } else {
    appendMessage('bot', 'Gunakan tombol upload 📎 di sebelah kanan untuk mengirim file.');
  }
});

function appendMessage(sender, text) {
  const welcome = chatBox.querySelector('.welcome-message');
  if (welcome) {
    welcome.remove();
  }

  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('open');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
}

hamburger.addEventListener('click', () => {
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
});

overlay.addEventListener('click', closeSidebar);

roomItems.forEach(item => {
  item.addEventListener('click', () => {
    setRoom(item.dataset.room);
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  });
});

setRoom('general');
