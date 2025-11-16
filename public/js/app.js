/**
 * QR Scanner Web Application - Main JavaScript
 */

// ============================================
// CONFIGURATION
// ============================================

// Auto-detect API and WS URLs based on current domain
function getDefaultUrls() {
    const host = window.location.host;
    const protocol = window.location.protocol;
    
    // If on deployed domain, use secure WebSocket
    if (host !== 'localhost:3000' && host !== 'localhost') {
        return {
            apiUrl: `${protocol}//` + host + '/api',
            wsUrl: (protocol === 'https:' ? 'wss:' : 'ws:') + '//' + host
        };
    }
    
    // Local development
    return {
        apiUrl: 'http://localhost:3000/api',
        wsUrl: 'ws://localhost:3000'
    };
}

const defaultUrls = getDefaultUrls();

const CONFIG = {
    apiUrl: localStorage.getItem('apiUrl') || defaultUrls.apiUrl,
    wsUrl: localStorage.getItem('wsUrl') || defaultUrls.wsUrl,
    cameraId: localStorage.getItem('cameraId') || 'camera_1',
    deduplicationTime: parseInt(localStorage.getItem('deduplicationTime')) || 500,
    scanInterval: parseInt(localStorage.getItem('scanInterval')) || 100,
    confidenceThreshold: parseFloat(localStorage.getItem('confidenceThreshold')) || 0.7,
};

// ============================================
// GLOBAL STATE
// ============================================

const STATE = {
    ws: null,
    wsConnected: false,
    videoStream: null,
    cameraActive: false,
    scans: [],
    stats: {},
    currentPage: 1,
    itemsPerPage: 20,
    scanTimeout: null,
    demoInterval: null,
    lastScanTime: 0
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 QR Scanner App Initialized');
    
    // Load settings from localStorage
    loadSettings();
    
    // Setup event listeners
    setupEventListeners();
    
    // Connect to WebSocket
    connectWebSocket();
    
    // Load initial data
    loadInitialData();
});

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabChange);
    });

    // Scanner tab
    document.getElementById('startCameraBtn')?.addEventListener('click', startCamera);
    document.getElementById('stopCameraBtn')?.addEventListener('click', stopCamera);
    document.getElementById('manualSubmitBtn')?.addEventListener('click', submitManualScan);
    document.getElementById('manualQRInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitManualScan();
    });

    // Demo mode button (for testing without camera)
    const cameraPreview = document.querySelector('.camera-preview');
    if (cameraPreview) {
        const demoBtn = document.createElement('button');
        demoBtn.className = 'btn btn-sm btn-secondary';
        demoBtn.innerHTML = '<i class="fas fa-flask"></i> Demo Mode';
        demoBtn.style.marginLeft = '5px';
        demoBtn.addEventListener('click', startDemoMode);
        document.querySelector('.camera-controls').appendChild(demoBtn);
    }

    // Batch tab
    document.getElementById('batchSubmitBtn')?.addEventListener('click', submitBatchScan);

    // Stats tab
    document.getElementById('refreshStatsBtn')?.addEventListener('click', loadStatistics);
    document.getElementById('statsHours')?.addEventListener('change', loadStatistics);

    // History tab
    document.getElementById('historySearch')?.addEventListener('input', filterHistory);
    document.getElementById('exportHistoryBtn')?.addEventListener('click', exportHistory);

    // Settings tab
    document.getElementById('testConnectionBtn')?.addEventListener('click', testConnection);
    document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
    document.getElementById('clearCacheBtn')?.addEventListener('click', clearCache);
    document.getElementById('clearHistoryBtn')?.addEventListener('click', clearHistory);
    document.getElementById('confidenceThreshold')?.addEventListener('input', (e) => {
        document.getElementById('confidenceValue').textContent = e.target.value;
    });

    // Modal
    document.querySelector('.modal-close')?.addEventListener('click', closeModal);
    document.getElementById('modalCancelBtn')?.addEventListener('click', closeModal);
}

// ============================================
// TAB MANAGEMENT
// ============================================

function handleTabChange(e) {
    const tabName = e.currentTarget.dataset.tab;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update active tab pane
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === tabName);
    });

    // Load data for specific tabs
    if (tabName === 'stats') {
        loadStatistics();
    } else if (tabName === 'history') {
        loadHistory();
    }
}

// ============================================
// CAMERA & SCANNING
// ============================================

async function startCamera() {
    try {
        const constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        const video = document.getElementById('videoStream');
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.play().catch(e => console.warn('Play warning:', e));
        
        STATE.videoStream = stream;
        STATE.cameraActive = true;

        document.getElementById('startCameraBtn').style.display = 'none';
        document.getElementById('stopCameraBtn').style.display = 'inline-flex';

        showToast('✓ Camera started', 'success');
        
        // Delay before starting scan to ensure video is ready
        setTimeout(scanQRFromCamera, 500);

    } catch (error) {
        console.error('Camera error details:', error);
        
        let errorMsg = 'Could not access camera';
        if (error.name === 'NotAllowedError') {
            errorMsg = 'Camera access denied. Please grant permission in settings.';
        } else if (error.name === 'NotFoundError') {
            errorMsg = 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
            errorMsg = 'Camera is in use by another application.';
        }
        
        showToast('✗ ' + errorMsg, 'error');
    }
}

function stopCamera() {
    if (STATE.videoStream) {
        STATE.videoStream.getTracks().forEach(track => track.stop());
        STATE.videoStream = null;
    }

    if (STATE.demoInterval) {
        clearInterval(STATE.demoInterval);
        STATE.demoInterval = null;
    }

    STATE.cameraActive = false;
    clearTimeout(STATE.scanTimeout);

    document.getElementById('startCameraBtn').style.display = 'inline-flex';
    document.getElementById('stopCameraBtn').style.display = 'none';

    showToast('Camera stopped', 'info');
}

function scanQRFromCamera() {
    if (!STATE.cameraActive) return;

    const video = document.getElementById('videoStream');
    const canvas = document.getElementById('canvasStream');
    const context = canvas.getContext('2d');

    // Set canvas size to video size
    if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        scanQRCode(imageData.data, canvas.width, canvas.height);
    }

    STATE.scanTimeout = setTimeout(scanQRFromCamera, CONFIG.scanInterval);
}

// ============================================
// API CALLS
// ============================================

async function scanQRCode(imageData, width, height) {
    try {
        // Convert Uint8Array to base64
        let base64String = '';
        const bytes = new Uint8Array(imageData);
        for (let i = 0; i < bytes.byteLength; i++) {
            base64String += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(base64String);

        const response = await fetch(`${CONFIG.apiUrl}/qr/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageData: base64,
                width: width,
                height: height,
                cameraId: CONFIG.cameraId
            })
        });

        const result = await response.json();

        if (result.success) {
            addScanResult(result, 'success');
        }
    } catch (error) {
        console.error('Scan error:', error);
    }
}

async function submitManualScan() {
    const qrCode = document.getElementById('manualQRInput').value.trim();
    const productName = document.getElementById('manualProductName').value.trim();
    const productId = document.getElementById('manualProductId').value.trim();

    if (!qrCode) {
        showToast('Please enter QR code', 'warning');
        return;
    }

    try {
        const response = await fetch(`${CONFIG.apiUrl}/qr/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageData: '',
                width: 0,
                height: 0,
                cameraId: CONFIG.cameraId
            })
        });

        const result = {
            success: true,
            qrCode: qrCode,
            productName: productName || 'N/A',
            productId: productId || 'N/A',
            timestamp: new Date().toISOString(),
            processingTime: 0,
            confidence: 1.0
        };

        addScanResult(result, 'success');

        // Clear form
        document.getElementById('manualQRInput').value = '';
        document.getElementById('manualProductName').value = '';
        document.getElementById('manualProductId').value = '';

        showToast(`QR code recorded: ${qrCode}`, 'success');

    } catch (error) {
        console.error('Manual scan error:', error);
        showToast('Failed to record QR code', 'error');
    }
}

async function submitBatchScan() {
    const textarea = document.getElementById('batchTextarea').value.trim();
    
    if (!textarea) {
        showToast('Please enter QR codes', 'warning');
        return;
    }

    const scans = textarea.split('\n').filter(s => s.trim());

    try {
        const response = await fetch(`${CONFIG.apiUrl}/qr/batch-scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                scans: scans,
                cameraId: CONFIG.cameraId
            })
        });

        const result = await response.json();

        // Display batch results
        displayBatchResults(result);
        showToast(`Processed ${result.processed} QR codes`, 'success');

    } catch (error) {
        console.error('Batch scan error:', error);
        showToast('Batch scan failed', 'error');
    }
}

async function loadStatistics() {
    try {
        const hours = document.getElementById('statsHours')?.value || 24;
        const cameraId = document.getElementById('statsCameraId')?.value || '';

        const params = new URLSearchParams({ hours });
        if (cameraId) params.append('cameraId', cameraId);

        const response = await fetch(`${CONFIG.apiUrl}/stats/performance?${params}`);
        const result = await response.json();

        if (result.success) {
            updateStatistics(result.data);
        }

    } catch (error) {
        console.error('Statistics error:', error);
        showToast('Failed to load statistics', 'error');
    }
}

async function loadHistory() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/qr/recent?limit=100`);
        const result = await response.json();

        if (result.success) {
            displayHistory(result.data);
        }

    } catch (error) {
        console.error('History error:', error);
        showToast('Failed to load history', 'error');
    }
}

// ============================================
// WEBSOCKET
// ============================================

function connectWebSocket() {
    try {
        const wsUrl = `${CONFIG.wsUrl}/api/qr/stream?cameraId=${CONFIG.cameraId}`;
        STATE.ws = new WebSocket(wsUrl);

        STATE.ws.onopen = () => {
            console.log('✓ WebSocket connected');
            STATE.wsConnected = true;
            updateStatusIndicator(true);
            showToast('Connected to server', 'success');
        };

        STATE.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        };

        STATE.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateStatusIndicator(false);
        };

        STATE.ws.onclose = () => {
            console.log('✗ WebSocket disconnected');
            STATE.wsConnected = false;
            updateStatusIndicator(false);
            
            // Attempt to reconnect
            setTimeout(connectWebSocket, 3000);
        };

    } catch (error) {
        console.error('WebSocket connection error:', error);
    }
}

function handleWebSocketMessage(message) {
    switch (message.type) {
        case 'connected':
            console.log('Connected with client ID:', message.clientId);
            break;
        case 'scan_result':
            addScanResult(message.data, 'success');
            break;
        case 'scan_ack':
            console.log('Scan acknowledged:', message.scanId);
            break;
        case 'stats_update':
            updateStatistics(message.data);
            break;
    }
}

// ============================================
// UI UPDATES
// ============================================

function addScanResult(data, status = 'success') {
    const resultsDiv = document.getElementById('scanResults');
    
    if (resultsDiv.querySelector('.text-muted')) {
        resultsDiv.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = `scan-item ${status}`;
    item.innerHTML = `
        <div class="scan-item-header">
            <span class="scan-item-code">${data.qrCode}</span>
            <span class="scan-item-time">${new Date(data.timestamp).toLocaleTimeString('vi-VN')}</span>
        </div>
        <div class="scan-item-details">
            <p><strong>Sản Phẩm:</strong> ${data.productName || 'N/A'}</p>
            <p><strong>ID:</strong> ${data.productId || 'N/A'}</p>
            <p><strong>Tốc Độ:</strong> ${data.processingTime || 0}ms | <strong>Độ Tin Cậy:</strong> ${((data.confidence || 0) * 100).toFixed(1)}%</p>
        </div>
    `;

    resultsDiv.insertBefore(item, resultsDiv.firstChild);

    // Keep only last 20 items
    while (resultsDiv.children.length > 20) {
        resultsDiv.removeChild(resultsDiv.lastChild);
    }

    STATE.scans.push(data);

    // Gửi dữ liệu lên server qua WebSocket
    if (STATE.wsConnected && STATE.ws) {
        try {
            STATE.ws.send(JSON.stringify({
                type: 'scan',
                qrCode: data.qrCode,
                productName: data.productName,
                productId: data.productId,
                processingTime: data.processingTime,
                confidence: data.confidence
            }));
        } catch (error) {
            console.log('WebSocket send (may not be connected yet):', error.message);
        }
    }
}

function displayBatchResults(result) {
    const batchResultsDiv = document.getElementById('batchResults');
    batchResultsDiv.innerHTML = '';

    let html = `<p><strong>Tổng xử lý:</strong> ${result.processed}</p>`;
    
    result.results.forEach(r => {
        const statusClass = r.status;
        const statusIcon = {
            'success': '✓',
            'duplicate': '⚠',
            'invalid': '✗',
            'error': '✗'
        }[r.status] || '?';

        html += `
            <div class="scan-item ${statusClass}">
                <div class="scan-item-header">
                    <span class="scan-item-code">${r.qrCode}</span>
                    <span>${statusIcon}</span>
                </div>
                <div class="scan-item-details">
                    <p>Status: <span class="status-badge ${statusClass}">${r.status}</span></p>
                </div>
            </div>
        `;
    });

    batchResultsDiv.innerHTML = html;
}

function updateStatistics(stats) {
    document.getElementById('totalScans').textContent = stats.total_scans || 0;
    document.getElementById('uniqueQR').textContent = stats.unique_qr_codes || 0;
    document.getElementById('avgProcessing').textContent = `${(stats.avg_processing_time || 0).toFixed(0)}ms`;
    document.getElementById('avgConfidence').textContent = `${((stats.avg_confidence || 0) * 100).toFixed(1)}%`;
    document.getElementById('scansPerHour').textContent = `${(stats.scans_per_hour || 0).toFixed(0)}/h`;
}

function displayHistory(data) {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No data</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${new Date(item.scan_time).toLocaleString('vi-VN')}</td>
            <td>${item.qr_code}</td>
            <td>${item.product_name || 'N/A'}</td>
            <td>${item.product_id || 'N/A'}</td>
            <td>${item.camera_id || 'N/A'}</td>
            <td>${item.processing_time_ms || 0}</td>
            <td>${((item.confidence || 0) * 100).toFixed(1)}%</td>
            <td>
                <span class="status-badge ${item.status || 'pending'}">
                    ${item.status || 'new'}
                </span>
            </td>
        `;
    });
}

function filterHistory(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#historyTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function exportHistory() {
    const rows = document.querySelectorAll('#historyTable tr');
    let csv = [];

    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const csvRow = [];
        cols.forEach(col => csvRow.push(col.textContent));
        csv.push(csvRow.join(','));
    });

    downloadCSV(csv.join('\n'), 'qr-history.csv');
    showToast('History exported', 'success');
}

function updateStatusIndicator(connected) {
    const indicator = document.getElementById('statusIndicator');
    const dot = indicator.querySelector('.status-dot');
    const text = indicator.querySelector('.status-text');

    if (connected) {
        dot.classList.add('connected');
        text.textContent = 'Online';
    } else {
        dot.classList.remove('connected');
        text.textContent = 'Offline';
    }
}

// ============================================
// SETTINGS
// ============================================

function saveSettings() {
    CONFIG.apiUrl = document.getElementById('apiUrl').value;
    CONFIG.wsUrl = document.getElementById('wsUrl').value;
    CONFIG.cameraId = document.getElementById('cameraId').value;
    CONFIG.deduplicationTime = parseInt(document.getElementById('deduplicationTime').value);
    CONFIG.scanInterval = parseInt(document.getElementById('scanInterval').value);
    CONFIG.confidenceThreshold = parseFloat(document.getElementById('confidenceThreshold').value);

    localStorage.setItem('apiUrl', CONFIG.apiUrl);
    localStorage.setItem('wsUrl', CONFIG.wsUrl);
    localStorage.setItem('cameraId', CONFIG.cameraId);
    localStorage.setItem('deduplicationTime', CONFIG.deduplicationTime);
    localStorage.setItem('scanInterval', CONFIG.scanInterval);
    localStorage.setItem('confidenceThreshold', CONFIG.confidenceThreshold);

    // Reconnect WebSocket if URL changed
    if (STATE.ws) {
        STATE.ws.close();
    }
    connectWebSocket();

    showToast('Settings saved', 'success');
}

function loadSettings() {
    document.getElementById('apiUrl').value = CONFIG.apiUrl;
    document.getElementById('wsUrl').value = CONFIG.wsUrl;
    document.getElementById('cameraId').value = CONFIG.cameraId;
    document.getElementById('deduplicationTime').value = CONFIG.deduplicationTime;
    document.getElementById('scanInterval').value = CONFIG.scanInterval;
    document.getElementById('confidenceThreshold').value = CONFIG.confidenceThreshold;
    document.getElementById('confidenceValue').textContent = CONFIG.confidenceThreshold;
}

async function testConnection() {
    try {
        const response = await fetch(`${CONFIG.apiUrl.replace('/api', '')}/health`);
        if (response.ok) {
            showToast('✓ Connection successful', 'success');
        } else {
            showToast('✗ Connection failed', 'error');
        }
    } catch (error) {
        showToast('✗ Cannot reach server', 'error');
    }
}

async function clearCache() {
    showConfirmModal('Clear Cache?', 'This will clear the deduplication cache.', async () => {
        try {
            await fetch(`${CONFIG.apiUrl}/qr/cache/clear`, { method: 'DELETE' });
            showToast('Cache cleared', 'success');
        } catch (error) {
            showToast('Failed to clear cache', 'error');
        }
    });
}

async function clearHistory() {
    showConfirmModal('Clear History?', 'This action cannot be undone!', async () => {
        try {
            STATE.scans = [];
            document.getElementById('scanResults').innerHTML = '<p class="text-muted">Cleared</p>';
            showToast('History cleared', 'success');
        } catch (error) {
            showToast('Failed to clear history', 'error');
        }
    });
}

// ============================================
// DEMO MODE (for testing without real camera)
// ============================================

function startDemoMode() {
    STATE.cameraActive = true;
    document.getElementById('startCameraBtn').style.display = 'none';
    document.getElementById('stopCameraBtn').style.display = 'inline-flex';
    
    const canvas = document.getElementById('canvasStream');
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;
    
    // Draw demo frame
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#51cf66';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DEMO MODE - Auto Scan Simulation', canvas.width / 2, 50);
    
    showToast('✓ Demo Mode Started - Auto scanning...', 'success');
    
    // Simulate QR scans
    let scanCount = 0;
    const demoProducts = [
        { name: 'Product A', id: 'SKU001' },
        { name: 'Product B', id: 'SKU002' },
        { name: 'Product C', id: 'SKU003' },
        { name: 'Product D', id: 'SKU004' },
        { name: 'Product E', id: 'SKU005' },
    ];
    
    STATE.demoInterval = setInterval(() => {
        if (!STATE.cameraActive) {
            clearInterval(STATE.demoInterval);
            return;
        }
        
        const product = demoProducts[scanCount % demoProducts.length];
        // Create unique QR code with timestamp to avoid UNIQUE constraint
        const uniqueQr = `DEMO-${product.id}-${Date.now()}-${scanCount}`;
        
        const result = {
            success: true,
            scanId: scanCount + 1,
            qrCode: uniqueQr,
            productName: product.name,
            productId: product.id,
            timestamp: new Date().toISOString(),
            processingTime: Math.floor(Math.random() * 100) + 20,
            confidence: 0.85 + Math.random() * 0.15
        };
        
        addScanResult(result, 'success');
        console.log('Demo scan:', uniqueQr);
        scanCount++;
        
        // Draw on canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#51cf66';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DEMO MODE - Scans: ' + scanCount, canvas.width / 2, 50);
        ctx.fillText(uniqueQr.substring(0, 30) + '...', canvas.width / 2, 150);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText(product.name + ' (' + product.id + ')', canvas.width / 2, 200);
        ctx.fillStyle = '#aaa';
        ctx.font = '12px Arial';
        ctx.fillText('Processing: ' + result.processingTime + 'ms', canvas.width / 2, 240);
        
    }, 1500); // Scan mỗi 1.5 giây
}

// ============================================
// UTILITIES
// ============================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').textContent = message;

    const confirmBtn = document.getElementById('modalConfirmBtn');
    confirmBtn.onclick = async () => {
        await onConfirm();
        closeModal();
    };

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

function loadInitialData() {
    loadHistory();
    loadStatistics();
}
