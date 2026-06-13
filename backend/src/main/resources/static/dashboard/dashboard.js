const state = {
  chainId: 1,
  lastJobId: null,
  dailyMetrics: [],
  token: localStorage.getItem("chainsightJwt"),
  currentUser: null
};

const elements = {
  apiBaseInput: document.getElementById("apiBaseInput"),
  refreshButton: document.getElementById("refreshButton"),
  authStatusBadge: document.getElementById("authStatusBadge"),
  authForm: document.getElementById("authForm"),
  authEmailInput: document.getElementById("authEmailInput"),
  authPasswordInput: document.getElementById("authPasswordInput"),
  logoutButton: document.getElementById("logoutButton"),
  web3LoginButton: document.getElementById("web3LoginButton"),
  currentUserEmail: document.getElementById("currentUserEmail"),
  chainIdInput: document.getElementById("chainIdInput"),
  startBlockInput: document.getElementById("startBlockInput"),
  endBlockInput: document.getElementById("endBlockInput"),
  ingestionForm: document.getElementById("ingestionForm"),
  analyticsForm: document.getElementById("analyticsForm"),
  walletForm: document.getElementById("walletForm"),
  fromDateInput: document.getElementById("fromDateInput"),
  toDateInput: document.getElementById("toDateInput"),
  limitInput: document.getElementById("limitInput"),
  walletAddressInput: document.getElementById("walletAddressInput"),
  walletLabelInput: document.getElementById("walletLabelInput"),
  walletSizeInput: document.getElementById("walletSizeInput"),
  trackWalletButton: document.getElementById("trackWalletButton"),
  failedBlocksButton: document.getElementById("failedBlocksButton"),
  lastProcessedBlock: document.getElementById("lastProcessedBlock"),
  indexedBlocks: document.getElementById("indexedBlocks"),
  indexedTransactions: document.getElementById("indexedTransactions"),
  failedBlockCount: document.getElementById("failedBlockCount"),
  jobStatusBadge: document.getElementById("jobStatusBadge"),
  jobId: document.getElementById("jobId"),
  resumeFromBlock: document.getElementById("resumeFromBlock"),
  processedBlocks: document.getElementById("processedBlocks"),
  transactionsInserted: document.getElementById("transactionsInserted"),
  dailyChart: document.getElementById("dailyChart"),
  largestTransactionsBody: document.getElementById("largestTransactionsBody"),
  walletSentCount: document.getElementById("walletSentCount"),
  walletSentValue: document.getElementById("walletSentValue"),
  walletReceivedCount: document.getElementById("walletReceivedCount"),
  walletReceivedValue: document.getElementById("walletReceivedValue"),
  walletNetFlow: document.getElementById("walletNetFlow"),
  walletLastActivity: document.getElementById("walletLastActivity"),
  walletTransactionsBody: document.getElementById("walletTransactionsBody"),
  trackedWalletsList: document.getElementById("trackedWalletsList"),
  failedBlocksList: document.getElementById("failedBlocksList"),
  activityLog: document.getElementById("activityLog")
};

function defaultApiBase() {
  return window.location.protocol === "file:" ? "http://localhost:8080" : "";
}

function apiBase() {
  return elements.apiBaseInput.value.trim().replace(/\/$/, "");
}

function apiUrl(path) {
  return `${apiBase()}${path}`;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isoDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return Number(value).toLocaleString("en-US");
}

function shortHash(value) {
  if (!value || value.length < 14) {
    return value || "-";
  }
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function formatTimestamp(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
}

function statusLabel(status) {
  return status === 1 ? "Success" : status === 0 ? "Failed" : "-";
}

function setBusy(button, busy) {
  button.disabled = busy;
  button.style.opacity = busy ? "0.65" : "1";
}

async function fetchJson(path, options = {}) {
  const { auth = true, ...fetchOptions } = options;
  const headers = { "Content-Type": "application/json", ...(fetchOptions.headers || {}) };
  if (state.token && auth) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(apiUrl(path), {
    ...fetchOptions,
    headers,
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    payload = { message: text || `HTTP ${response.status}` };
  }
  if (!response.ok) {
    throw new Error(payload?.message || payload?.errorCode || `HTTP ${response.status}`);
  }
  return payload;
}

function logEvent(message, tone = "info") {
  const item = document.createElement("li");
  item.className = tone === "error" ? "status-fail" : "status-ok";
  item.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  elements.activityLog.prepend(item);
  while (elements.activityLog.children.length > 6) {
    elements.activityLog.lastElementChild.remove();
  }
}

async function loadStatus() {
  const chainId = Number(elements.chainIdInput.value || 1);
  state.chainId = chainId;
  const status = await fetchJson(`/api/v1/ingestion/status?chainId=${chainId}`);
  elements.lastProcessedBlock.textContent = formatNumber(status.lastProcessedBlock);
  elements.indexedBlocks.textContent = formatNumber(status.indexedBlocks);
  elements.indexedTransactions.textContent = formatNumber(status.indexedTransactions);
  elements.failedBlockCount.textContent = formatNumber(status.failedBlockCount);
}

async function startIngestionJob(event) {
  event.preventDefault();
  const chainId = Number(elements.chainIdInput.value || 1);
  const startBlock = elements.startBlockInput.value;
  const endBlock = elements.endBlockInput.value;

  if (!startBlock || !endBlock) {
    logEvent("Start and end block are required", "error");
    return;
  }

  elements.jobStatusBadge.textContent = "Running";
  setBusy(event.submitter, true);
  try {
    const job = await fetchJson("/api/v1/ingestion/jobs", {
      method: "POST",
      body: JSON.stringify({
        chainId,
        startBlock,
        endBlock
      })
    });
    state.lastJobId = job.jobId;
    renderJob(job);
    await Promise.allSettled([loadStatus(), loadFailedBlocks()]);
    logEvent(`Ingestion job ${job.jobId} accepted`);
  } catch (error) {
    elements.jobStatusBadge.textContent = "Failed";
    logEvent(error.message, "error");
  } finally {
    setBusy(event.submitter, false);
  }
}

function renderJob(job) {
  elements.jobStatusBadge.textContent = job.status || "Unknown";
  elements.jobId.textContent = job.jobId ?? "-";
  elements.resumeFromBlock.textContent = formatNumber(job.resumeFromBlock);
  elements.processedBlocks.textContent = formatNumber(job.processedBlocks);
  elements.transactionsInserted.textContent = formatNumber(job.transactionsInserted);
}

async function loadAnalytics(event) {
  if (event) {
    event.preventDefault();
  }
  const chainId = Number(elements.chainIdInput.value || 1);
  const from = elements.fromDateInput.value;
  const to = elements.toDateInput.value;
  const limit = Number(elements.limitInput.value || 10);

  const dailyPath = `/api/v1/analytics/network/daily?chainId=${chainId}&from=${from}&to=${to}`;
  const largestPath = `/api/v1/analytics/network/largest-transactions?chainId=${chainId}&from=${from}&to=${to}&limit=${limit}`;

  const [daily, largest] = await Promise.all([
    fetchJson(dailyPath),
    fetchJson(largestPath)
  ]);

  state.dailyMetrics = daily.days || [];
  renderDailyChart(state.dailyMetrics);
  renderLargestTransactions(largest.transactions || []);
  logEvent("Analytics refreshed");
}

function renderLargestTransactions(rows) {
  if (!rows.length) {
    elements.largestTransactionsBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No rows</td></tr>';
    return;
  }

  elements.largestTransactionsBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.valueRank}</td>
      <td class="hash-cell" title="${row.transactionHash}">${shortHash(row.transactionHash)}</td>
      <td>${formatNumber(row.blockNumber)}</td>
      <td>${row.valueWei}</td>
      <td>${statusLabel(row.status)}</td>
    </tr>
  `).join("");
}

async function submitAuth(event) {
  event.preventDefault();
  const action = event.submitter.dataset.authAction;
  const email = elements.authEmailInput.value.trim();
  const password = elements.authPasswordInput.value;

  if (!email || !password) {
    logEvent("Email and password are required", "error");
    return;
  }

  const response = await fetchJson(`/api/v1/auth/${action}`, {
    auth: false,
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  state.token = response.accessToken;
  state.currentUser = response.user;
  localStorage.setItem("chainsightJwt", state.token);
  elements.authPasswordInput.value = "";
  renderAuthState();
  await loadTrackedWallets();
  logEvent(`${action === "register" ? "Registered" : "Logged in"} as ${response.user.email}`);
}

async function web3Login() {
  if (!window.ethereum) {
    logEvent("MetaMask is not installed", "error");
    return;
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const walletAddress = accounts[0];
    
    // Fetch nonce from backend
    const nonceResponse = await fetchJson(`/api/v1/auth/nonce?walletAddress=${walletAddress}`, { auth: false });
    const message = `Sign this message to log in to ChainSight. Nonce: ${nonceResponse.nonce}`;
    
    // Request signature
    const signature = await window.ethereum.request({ 
      method: 'personal_sign', 
      params: [message, walletAddress] 
    });
    
    // Send to backend
    const response = await fetchJson(`/api/v1/auth/wallet-login`, {
      auth: false,
      method: "POST",
      body: JSON.stringify({ walletAddress, signature })
    });
    
    state.token = response.accessToken;
    state.currentUser = response.user;
    localStorage.setItem("chainsightJwt", state.token);
    renderAuthState();
    await loadTrackedWallets();
    logEvent(`Logged in with wallet ${shortHash(walletAddress)}`);
  } catch (error) {
    logEvent(error.message, "error");
    throw error;
  }
}

async function loadCurrentUser() {
  if (!state.token) {
    renderAuthState();
    renderTrackedWallets([]);
    return;
  }

  try {
    state.currentUser = await fetchJson("/api/v1/auth/me");
  } catch (error) {
    state.token = null;
    state.currentUser = null;
    localStorage.removeItem("chainsightJwt");
    logEvent("Saved login expired; please log in again", "error");
  }
  renderAuthState();
}

function logout() {
  state.token = null;
  state.currentUser = null;
  localStorage.removeItem("chainsightJwt");
  renderAuthState();
  renderTrackedWallets([]);
  logEvent("Logged out");
}

function renderAuthState() {
  if (state.currentUser) {
    elements.authStatusBadge.textContent = "Signed in";
    elements.currentUserEmail.textContent = state.currentUser.email || shortHash(state.currentUser.walletAddress) || "Unknown User";
  } else {
    elements.authStatusBadge.textContent = "Signed out";
    elements.currentUserEmail.textContent = "-";
  }
}

async function loadWallet(event) {
  if (event) {
    event.preventDefault();
  }

  const address = elements.walletAddressInput.value.trim();
  if (!address) {
    resetWalletView("No wallet loaded");
    return;
  }

  const chainId = Number(elements.chainIdInput.value || 1);
  const size = Number(elements.walletSizeInput.value || 10);
  const encodedAddress = encodeURIComponent(address);
  const summaryPath = `/api/v1/analytics/wallets/${encodedAddress}/summary?chainId=${chainId}`;
  const transactionsPath = `/api/v1/analytics/wallets/${encodedAddress}/transactions?chainId=${chainId}&page=0&size=${size}`;

  const [summary, transactions] = await Promise.all([
    fetchJson(summaryPath),
    fetchJson(transactionsPath)
  ]);

  elements.walletAddressInput.value = summary.address || address.toLowerCase();
  renderWalletSummary(summary);
  renderWalletTransactions(transactions.transactions || []);
  logEvent(`Wallet ${shortHash(elements.walletAddressInput.value)} loaded`);
}

function renderWalletSummary(summary) {
  elements.walletSentCount.textContent = formatNumber(summary.sentCount);
  elements.walletSentValue.textContent = summary.sentValueWei || "-";
  elements.walletReceivedCount.textContent = formatNumber(summary.receivedCount);
  elements.walletReceivedValue.textContent = summary.receivedValueWei || "-";
  elements.walletNetFlow.textContent = summary.netFlowWei || "-";
  elements.walletLastActivity.textContent = formatTimestamp(summary.lastActivityAt);
}

function renderWalletTransactions(rows) {
  if (!rows.length) {
    elements.walletTransactionsBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No wallet transactions</td></tr>';
    return;
  }

  elements.walletTransactionsBody.innerHTML = rows.map((row) => `
    <tr>
      <td><span class="direction-badge ${row.direction === "SENT" ? "sent" : "received"}">${row.direction}</span></td>
      <td class="hash-cell" title="${row.transactionHash}">${shortHash(row.transactionHash)}</td>
      <td class="hash-cell" title="${row.counterpartyAddress || ""}">${shortHash(row.counterpartyAddress)}</td>
      <td>${formatNumber(row.blockNumber)}</td>
      <td>${row.valueWei}</td>
      <td>${statusLabel(row.status)}</td>
    </tr>
  `).join("");
}

function resetWalletView(message) {
  elements.walletSentCount.textContent = "-";
  elements.walletSentValue.textContent = "-";
  elements.walletReceivedCount.textContent = "-";
  elements.walletReceivedValue.textContent = "-";
  elements.walletNetFlow.textContent = "-";
  elements.walletLastActivity.textContent = "-";
  elements.walletTransactionsBody.innerHTML = `<tr><td colspan="6" class="empty-cell">${message}</td></tr>`;
}

async function loadTrackedWallets() {
  if (!state.token) {
    renderTrackedWallets([]);
    return;
  }

  const wallets = await fetchJson("/api/v1/tracked-wallets");
  renderTrackedWallets(wallets || []);
}

async function trackCurrentWallet() {
  if (!state.token) {
    logEvent("Log in before tracking wallets", "error");
    return;
  }

  const walletAddress = elements.walletAddressInput.value.trim();
  if (!walletAddress) {
    logEvent("Wallet address is required", "error");
    return;
  }

  const chainId = Number(elements.chainIdInput.value || 1);
  const label = elements.walletLabelInput.value.trim() || null;
  await fetchJson("/api/v1/tracked-wallets", {
    method: "POST",
    body: JSON.stringify({ chainId, walletAddress, label })
  });
  await loadTrackedWallets();
  logEvent(`Tracked wallet ${shortHash(walletAddress)}`);
}

async function deleteTrackedWallet(walletId) {
  await fetchJson(`/api/v1/tracked-wallets/${walletId}`, {
    method: "DELETE"
  });
  await loadTrackedWallets();
  logEvent("Tracked wallet removed");
}

function renderTrackedWallets(wallets) {
  if (!state.token) {
    elements.trackedWalletsList.innerHTML = '<p class="empty-state">Log in to track wallets</p>';
    return;
  }

  if (!wallets.length) {
    elements.trackedWalletsList.innerHTML = '<p class="empty-state">No tracked wallets yet</p>';
    return;
  }

  elements.trackedWalletsList.innerHTML = wallets.map((wallet) => `
    <div class="tracked-wallet-item">
      <button
        type="button"
        class="load-wallet"
        data-load-wallet="${wallet.walletAddress}"
        data-wallet-label="${wallet.label || ""}"
        title="${wallet.walletAddress}"
      >
        ${wallet.label || shortHash(wallet.walletAddress)}
      </button>
      <button type="button" class="delete-wallet" data-delete-wallet="${wallet.id}">Remove</button>
    </div>
  `).join("");
}

function renderDailyChart(rows) {
  const canvas = elements.dailyChart;
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.max(320, Math.floor(rect.width * scale));
  canvas.height = Math.floor(240 * scale);

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.scale(scale, scale);

  const viewWidth = width / scale;
  const viewHeight = height / scale;
  const pad = 34;

  ctx.strokeStyle = "#d9e0e4";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = pad + ((viewHeight - pad * 2) / 3) * i;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(viewWidth - pad, y);
    ctx.stroke();
  }

  if (!rows.length) {
    ctx.fillStyle = "#66727c";
    ctx.font = "13px Segoe UI, Arial";
    ctx.fillText("No data", pad, viewHeight / 2);
    return;
  }

  const values = rows.map((row) => Number(row.transactionCount || 0));
  const max = Math.max(...values, 1);
  const step = rows.length === 1 ? 0 : (viewWidth - pad * 2) / (rows.length - 1);

  ctx.strokeStyle = "#2457a6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  rows.forEach((row, index) => {
    const x = pad + step * index;
    const y = viewHeight - pad - (Number(row.transactionCount || 0) / max) * (viewHeight - pad * 2);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  rows.forEach((row, index) => {
    const x = pad + step * index;
    const y = viewHeight - pad - (Number(row.transactionCount || 0) / max) * (viewHeight - pad * 2);
    ctx.fillStyle = row.transactionCountDelta >= 0 ? "#0e7a5f" : "#b42318";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

async function loadFailedBlocks() {
  const chainId = Number(elements.chainIdInput.value || 1);
  const rows = await fetchJson(`/api/v1/ingestion/failed-blocks?chainId=${chainId}&status=PENDING`);
  renderFailedBlocks(rows || []);
}

function renderFailedBlocks(rows) {
  if (!rows.length) {
    elements.failedBlocksList.innerHTML = '<p class="empty-state">No pending failed blocks</p>';
    return;
  }

  elements.failedBlocksList.innerHTML = rows.map((row) => `
    <div class="failed-item">
      <div>
        <strong>Block ${formatNumber(row.blockNumber)}</strong>
        <span>${row.failureReason || "Unknown failure"} - retries ${row.retryCount}</span>
      </div>
      <button type="button" data-retry-block="${row.blockNumber}">Retry</button>
    </div>
  `).join("");
}

async function retryFailedBlock(blockNumber) {
  const chainId = Number(elements.chainIdInput.value || 1);
  await fetchJson(`/api/v1/ingestion/failed-blocks/${blockNumber}/retry?chainId=${chainId}`, {
    method: "POST"
  });
  await Promise.allSettled([loadStatus(), loadFailedBlocks()]);
  logEvent(`Retried block ${blockNumber}`);
}

function bindEvents() {
  elements.refreshButton.addEventListener("click", async () => {
    setBusy(elements.refreshButton, true);
    try {
      await settleDashboardLoads([
        loadCurrentUser(),
        loadStatus(),
        loadAnalytics(),
        loadWallet(),
        loadTrackedWallets(),
        loadFailedBlocks()
      ]);
      logEvent("Dashboard refreshed");
    } finally {
      setBusy(elements.refreshButton, false);
    }
  });

  elements.authForm.addEventListener("submit", async (event) => {
    setBusy(event.submitter, true);
    try {
      await submitAuth(event);
    } catch (error) {
      logEvent(error.message, "error");
    } finally {
      setBusy(event.submitter, false);
    }
  });
  elements.logoutButton.addEventListener("click", logout);
  if (elements.web3LoginButton) {
    elements.web3LoginButton.addEventListener("click", async () => {
      setBusy(elements.web3LoginButton, true);
      try {
        await web3Login();
      } catch (error) {
        // error already logged
      } finally {
        setBusy(elements.web3LoginButton, false);
      }
    });
  }

  elements.ingestionForm.addEventListener("submit", startIngestionJob);
  elements.analyticsForm.addEventListener("submit", async (event) => {
    try {
      await loadAnalytics(event);
    } catch (error) {
      logEvent(error.message, "error");
    }
  });
  elements.walletForm.addEventListener("submit", async (event) => {
    setBusy(event.submitter, true);
    try {
      await loadWallet(event);
    } catch (error) {
      logEvent(error.message, "error");
    } finally {
      setBusy(event.submitter, false);
    }
  });
  elements.trackWalletButton.addEventListener("click", async () => {
    setBusy(elements.trackWalletButton, true);
    try {
      await trackCurrentWallet();
    } catch (error) {
      logEvent(error.message, "error");
    } finally {
      setBusy(elements.trackWalletButton, false);
    }
  });
  elements.trackedWalletsList.addEventListener("click", async (event) => {
    const walletAddress = event.target.dataset.loadWallet;
    const walletLabel = event.target.dataset.walletLabel;
    const walletId = event.target.dataset.deleteWallet;

    if (walletAddress) {
      elements.walletAddressInput.value = walletAddress;
      elements.walletLabelInput.value = walletLabel || "";
      try {
        await loadWallet();
      } catch (error) {
        logEvent(error.message, "error");
      }
    }

    if (walletId) {
      try {
        await deleteTrackedWallet(walletId);
      } catch (error) {
        logEvent(error.message, "error");
      }
    }
  });
  elements.failedBlocksButton.addEventListener("click", async () => {
    try {
      await loadFailedBlocks();
    } catch (error) {
      logEvent(error.message, "error");
    }
  });

  elements.failedBlocksList.addEventListener("click", async (event) => {
    const blockNumber = event.target.dataset.retryBlock;
    if (blockNumber) {
      try {
        await retryFailedBlock(blockNumber);
      } catch (error) {
        logEvent(error.message, "error");
      }
    }
  });

  window.addEventListener("resize", () => renderDailyChart(state.dailyMetrics));
}

async function init() {
  elements.apiBaseInput.value = defaultApiBase();
  elements.fromDateInput.value = isoDateDaysAgo(7);
  elements.toDateInput.value = todayIsoDate();
  resetWalletView("No wallet loaded");
  bindEvents();

  try {
    await settleDashboardLoads([loadCurrentUser(), loadStatus(), loadAnalytics(), loadTrackedWallets(), loadFailedBlocks()]);
    logEvent("Dashboard ready");
  } catch (error) {
    logEvent(error.message, "error");
  }
}

async function settleDashboardLoads(promises) {
  const results = await Promise.allSettled(promises);
  results
    .filter((result) => result.status === "rejected")
    .forEach((result) => logEvent(result.reason.message, "error"));
}

init();
