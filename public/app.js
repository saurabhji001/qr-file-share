const API_URL = 'http://localhost:5000';

let currentSession = null;
let scannedChunks = {};
let videoStream = null;

// DOM Elements
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const chunkSize = document.getElementById('chunkSize');
const generateBtn = document.getElementById('generateBtn');
const loadingGen = document.getElementById('loadingGen');
const qrSection = document.getElementById('qrSection');
const totalChunks = document.getElementById('totalChunks');
const fileHash = document.getElementById('fileHash');
const qrGallery = document.getElementById('qrGallery');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const printBtn = document.getElementById('printBtn');

const startCameraBtn = document.getElementById('startCameraBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const qrDataInput = document.getElementById('qrDataInput');
const addManualBtn = document.getElementById('addManualBtn');
const chunkListSection = document.getElementById('chunkListSection');
const chunksList = document.getElementById('chunksList');
const reassembleBtn = document.getElementById('reassembleBtn');
const clearBtn = document.getElementById('clearBtn');
const loadingReassemble = document.getElementById('loadingReassemble');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

const modal = document.getElementById('qrModal');
const closeBtn = document.querySelector('.close');

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    tab.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
  });
});

// File upload
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    handleFileSelect();
  }
});

fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect() {
  const file = fileInput.files[0];
  if (file) {
    fileName.textContent = file.name;
    fileSize.textContent = formatBytes(file.size);
    fileInfo.style.display = 'block';
    generateBtn.disabled = false;
  }
}

// Generate QR codes
generateBt.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('chunkSize', chunkSize.value);

  loadingGen.style.display = 'block';
  generateBtn.disabled = true;

  try {
    const response = await fetch(`${API_URL}/api/generate-qr`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Failed to generate QR codes');

    const data = await response.json();
    currentSession = data;

    // Display results
    totalChunks.textContent = data.totalChunks;
    fileHash.textContent = data.fileHash;
    displayQRCodes(data.qrCodes);
    qrSection.style.display = 'block';

    showNotification(`Successfully generated ${data.totalChunks} QR codes!`, 'success');
  } catch (error) {
    showNotification(error.message, 'error');
  } finally {
    loadingGen.style.display = 'none';
  }
});

function displayQRCodes(qrCodes) {
  qrGallery.innerHTML = '';
  
  qrCodes.forEach(qr => {
    const card = document.createElement('div');
    card.className = 'qr-card';
    card.innerHTML = `
      <p><strong>Chunk ${qr.chunk}/${qr.total}</strong></p>
      <img src="${qr.qrDataUrl}" alt="QR Code ${qr.chunk}" onclick="showQRModal('${qr.qrDataUrl}', ${qr.chunk})">
      <p>${(qr.size / 1024).toFixed(2)} KB</p>
    `;
    qrGallery.appendChild(card);
  });
}

function showQRModal(dataUrl, chunkNum) {
  document.getElementById('modalQRContainer').innerHTML = `
    <h2>QR Code - Chunk ${chunkNum}</h2>
    <img src="${dataUrl}" alt="QR Code ${chunkNum}" style="max-width: 400px;">
  `;
  modal.style.display = 'block';
}

closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// Download all QR codes as ZIP
downloadAllBtn.addEventListener('click', async () => {
  if (!currentSession) return;
  
  showNotification('Preparing download...', 'info');
  // In a production app, you'd create a ZIP file here
  // For now, we'll just download them individually
});

// Print QR codes
printBtn.addEventListener('click', () => {
  window.print();
});

// Camera
startCameraBtn.addEventListener('click', startCamera);
stopCameraBtn.addEventListener('click', stopCamera);

async function startCamera() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = videoStream;
    video.style.display = 'block';
    startCameraBtn.style.display = 'none';
    stopCameraBtn.style.display = 'inline-block';

    // Start scanning
    scanQRCodes();
  } catch (error) {
    showNotification('Camera access denied', 'error');
  }
}

function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
  }
  video.style.display = 'none';
  startCameraBtn.style.display = 'inline-block';
  stopCameraBtn.style.display = 'none';
}

function scanQRCodes() {
  const ctx = canvas.getContext('2d');
  const scanInterval = setInterval(() => {
    if (!videoStream) {
      clearInterval(scanInterval);
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // QR code scanning would be done here with jsQR library
    } catch (error) {
      // Continue scanning
    }
  }, 500);
}

// Manual QR input
addManualBtn.addEventListener('click', () => {
  const data = qrDataInput.value.trim();
  if (!data) {
    showNotification('Please paste QR data', 'error');
    return;
  }

  try {
    const chunk = JSON.parse(data);
    addChunkToList(chunk);
    qrDataInput.value = '';
  } catch (error) {
    showNotification('Invalid QR data format', 'error');
  }
});

function addChunkToList(chunk) {
  if (!chunk.file || !chunk.chunk || !chunk.total) {
    showNotification('Invalid chunk data', 'error');
    return;
  }

  scannedChunks[chunk.chunk] = chunk;
  updateChunksList();
  chunkListSection.style.display = 'block';

  // Check if all chunks are scanned
  if (Object.keys(scannedChunks).length === chunk.total) {
    reassembleBtn.disabled = false;
    showNotification('All chunks scanned!', 'success');
  }
}

function updateChunksList() {
  chunksList.innerHTML = '';
  const totalExpected = Object.values(scannedChunks)[0]?.total || 0;

  for (let i = 1; i <= totalExpected; i++) {
    const item = document.createElement('div');
    item.className = 'chunk-item';
    
    if (scannedChunks[i]) {
      item.classList.add('success');
      item.innerHTML = `
        <p class="chunk-number">${i}</p>
        <p>✓ Scanned</p>
      `;
    } else {
      item.innerHTML = `
        <p class="chunk-number">${i}</p>
        <p>Pending</p>
      `;
    }
    chunksList.appendChild(item);
  }

  // Update progress
  const scanned = Object.keys(scannedChunks).length;
  const percentage = totalExpected > 0 ? (scanned / totalExpected) * 100 : 0;
  progressFill.style.width = percentage + '%';
  progressText.textContent = `${scanned} / ${totalExpected} chunks scanned`;
}

clearBtn.addEventListener('click', () => {
  scannedChunks = {};
  chunkListSection.style.display = 'none';
  chunksList.innerHTML = '';
  reassembleBtn.disabled = true;
});

reassembleBtn.addEventListener('click', reassembleFile);

async function reassembleFile() {
  if (Object.keys(scannedChunks).length === 0) return;

  loadingReassemble.style.display = 'block';
  reassembleBtn.disabled = true;

  try {
    const firstChunk = Object.values(scannedChunks)[0];
    const chunksArray = Object.values(scannedChunks).sort((a, b) => a.chunk - b.chunk);

    const response = await fetch(`${API_URL}/api/reassemble`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chunks: chunksArray,
        fileName: firstChunk.file,
        fileHash: firstChunk.fileHash
      })
    });

    if (!response.ok) throw new Error('Failed to reassemble file');

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = firstChunk.file;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showNotification('File reassembled and downloaded!', 'success');
  } catch (error) {
    showNotification(error.message, 'error');
  } finally {
    loadingReassemble.style.display = 'none';
  }
}

// Utility functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function showNotification(message, type = 'info') {
  // Simple notification (can be enhanced with a proper notification system)
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Initialize
console.log('QR File Share app loaded');
