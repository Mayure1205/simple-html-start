const state = {
  chainId: 1,
  lastJobId: null,
  dailyMetrics: [],
  token: localStorage.getItem("chainsightJwt"),
  currentUser: null,
  walletProviders: [],
  walletConnectProvider: null,
  walletProviderAnnouncements: new Map()
};

const elements = {
  sidebarToggle: document.getElementById("sidebarToggle"),
  apiBaseInput: document.getElementById("apiBaseInput"),
  refreshButton: document.getElementById("refreshButton"),
  authStatusBadge: document.getElementById("authStatusBadge"),
  authForm: document.getElementById("authForm"),
  authEmailInput: document.getElementById("authEmailInput"),
  authPasswordInput: document.getElementById("authPasswordInput"),
  logoutButton: document.getElementById("logoutButton"),
  walletConnectButton: document.getElementById("walletConnectButton"),
  walletSigninLabel: document.getElementById("walletSigninLabel"),
  walletModal: document.getElementById("walletModal"),
  walletModalClose: document.getElementById("walletModalClose"),
  walletProviderList: document.getElementById("walletProviderList"),
  walletStepList: document.getElementById("walletStepList"),
  walletModalMessage: document.getElementById("walletModalMessage"),
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
  activityLog: document.getElementById("activityLog"),
  accountGrid: document.getElementById("accountGrid")
};

const WALLETCONNECT_PROVIDER_URL = "https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.23.9/+esm";
const WALLETCONNECT_PROJECT_ID_KEY = "chainsightWalletConnectProjectId";
const SIDEBAR_COLLAPSED_KEY = "chainsightSidebarCollapsed";
const ETHEREUM_CHAIN_ID = 1;

window.addEventListener("eip6963:announceProvider", (event) => {
  const detail = event.detail;
  if (!detail?.provider) {
    return;
  }
  state.walletProviderAnnouncements.set(detail.info?.uuid || detail.info?.name || String(state.walletProviderAnnouncements.size), detail);
});

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initials(value) {
  return String(value || "Wallet")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "W";
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
  if (!button) {
    return;
  }
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
      <td>${escapeHtml(row.valueRank)}</td>
      <td class="hash-cell" title="${escapeHtml(row.transactionHash)}">${escapeHtml(shortHash(row.transactionHash))}</td>
      <td>${escapeHtml(formatNumber(row.blockNumber))}</td>
      <td>${escapeHtml(row.valueWei)}</td>
      <td>${escapeHtml(statusLabel(row.status))}</td>
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

function getWalletConnectProjectId() {
  return (
    localStorage.getItem(WALLETCONNECT_PROJECT_ID_KEY)
    || window.CHAINSIGHT_WALLETCONNECT_PROJECT_ID
    || ""
  ).trim();
}

function requestWalletProviderAnnouncements() {
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

function walletProviderRows() {
  const metamask = findInjectedWallet("metamask");
  const coinbase = findInjectedWallet("coinbase");
  const trust = findInjectedWallet("trust");
  const browser = findInjectedWallet("browser");
  const projectId = getWalletConnectProjectId();

  return [
    {
      providerType: "metamask",
      providerKey: "metamask",
      label: "MetaMask",
      source: "Browser extension",
      stateLabel: metamask ? "Installed" : "Not installed",
      disabled: !metamask
    },
    {
      providerType: "walletconnect",
      providerKey: "walletconnect",
      label: "WalletConnect",
      source: "QR and mobile wallets",
      stateLabel: projectId ? "QR" : "Setup needed",
      disabled: false
    },
    {
      providerType: coinbase ? "coinbase" : "walletconnect",
      providerKey: "coinbase",
      label: "Coinbase Wallet",
      source: coinbase ? "Browser extension" : "Mobile via WalletConnect",
      stateLabel: coinbase ? "Installed" : "Mobile",
      disabled: false
    },
    {
      providerType: trust ? "trust" : "walletconnect",
      providerKey: "trust",
      label: "Trust Wallet",
      source: trust ? "Browser extension" : "Mobile via WalletConnect",
      stateLabel: trust ? "Installed" : "Mobile",
      disabled: false
    },
    {
      providerType: "browser",
      providerKey: "browser",
      label: "Injected Browser Wallet",
      source: browser ? browser.label : "Any EIP-1193 wallet",
      stateLabel: browser ? "Detected" : "Not detected",
      disabled: !browser
    },
    {
      providerType: "walletconnect",
      providerKey: "all",
      label: "All Wallets",
      source: "Open WalletConnect provider list",
      stateLabel: projectId ? "Recommended" : "Setup needed",
      disabled: false
    }
  ];
}

function discoverInjectedWallets() {
  requestWalletProviderAnnouncements();
  const providers = [];

  state.walletProviderAnnouncements.forEach((announcement) => {
    providers.push({
      label: announcement.info?.name || "Browser wallet",
      provider: announcement.provider,
      source: "Browser",
      icon: announcement.info?.icon || null
    });
  });

  const injectedProviders = window.ethereum?.providers || (window.ethereum ? [window.ethereum] : []);
  injectedProviders.forEach((provider) => {
    if (providers.some((item) => item.provider === provider)) {
      return;
    }
    providers.push({
      label: walletProviderName(provider),
      provider,
      source: "Browser",
      icon: null
    });
  });

  state.walletProviders = providers;
  return providers;
}

function walletProviderName(provider) {
  if (provider?.isRabby) {
    return "Rabby";
  }
  if (provider?.isCoinbaseWallet) {
    return "Coinbase Wallet";
  }
  if (provider?.isTrust) {
    return "Trust Wallet";
  }
  if (provider?.isBraveWallet) {
    return "Brave Wallet";
  }
  if (provider?.isOkxWallet || provider?.isOKExWallet) {
    return "OKX Wallet";
  }
  if (provider?.isMetaMask) {
    return "MetaMask";
  }
  return "Browser wallet";
}

function findInjectedWallet(type) {
  if (!state.walletProviders.length) {
    discoverInjectedWallets();
  }

  if (type === "metamask") {
    return state.walletProviders.find((wallet) => wallet.provider?.isMetaMask);
  }
  if (type === "coinbase") {
    return state.walletProviders.find((wallet) => wallet.provider?.isCoinbaseWallet);
  }
  if (type === "trust") {
    return state.walletProviders.find((wallet) => wallet.provider?.isTrust);
  }
  if (type === "browser") {
    return state.walletProviders[0];
  }
  return null;
}

function resetWalletSteps() {
  if (!elements.walletStepList) {
    return;
  }
  elements.walletStepList.hidden = true;
  elements.walletStepList.querySelectorAll("[data-wallet-step]").forEach((item) => {
    item.dataset.state = "pending";
  });
}

function setWalletStep(stepName, stateName) {
  if (!elements.walletStepList) {
    return;
  }
  elements.walletStepList.hidden = false;
  const step = elements.walletStepList.querySelector(`[data-wallet-step="${stepName}"]`);
  if (step) {
    step.dataset.state = stateName;
  }
}

function openWalletModal() {
  discoverInjectedWallets();
  renderWalletProviderList();
  elements.walletModal.hidden = false;
  elements.walletModalMessage.textContent = "";
  resetWalletSteps();
}

function closeWalletModal() {
  elements.walletModal.hidden = true;
  elements.walletModalMessage.textContent = "";
  resetWalletSteps();
}

function renderWalletProviderList() {
  elements.walletProviderList.innerHTML = walletProviderRows()
    .map((wallet) => walletProviderButton(wallet))
    .join("");
}

function walletProviderButton({ providerType, providerKey, label, source, stateLabel, disabled }) {
  const dataAttribute = `data-provider-type="${providerType}" data-provider-label="${escapeHtml(label)}"`;
  const disabledAttribute = disabled ? "disabled" : "";
  const iconText = {
    metamask: "MM",
    walletconnect: "WC",
    coinbase: "CB",
    trust: "TW",
    browser: "BW",
    all: "AW"
  }[providerKey] || initials(label);
  return `
    <button type="button" class="wallet-provider" ${dataAttribute} ${disabledAttribute}>
      <span class="provider-mark provider-${escapeHtml(providerKey)}">${escapeHtml(iconText)}</span>
      <span class="provider-copy">
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(source)}</span>
      </span>
      <span class="provider-state">${escapeHtml(stateLabel)}</span>
    </button>
  `;
}

async function connectInjectedWallet(providerType) {
  const wallet = findInjectedWallet(providerType);
  if (!wallet?.provider?.request) {
    throw new Error("Selected wallet is not available in this browser");
  }

  resetWalletSteps();
  setWalletStep("detected", "done");
  elements.walletModalMessage.textContent = "Opening wallet...";
  const accounts = await wallet.provider.request({ method: "eth_requestAccounts" });
  await completeWalletSignIn(wallet.provider, accounts, wallet.label);
}

async function connectWalletConnectProvider(providerLabel = "WalletConnect") {
  const projectId = getWalletConnectProjectId();
  resetWalletSteps();
  if (!projectId) {
    elements.walletModalMessage.textContent = "WalletConnect is not configured yet. Add the Reown Project ID in app config before QR login.";
    return;
  }

  setWalletStep("detected", "done");
  elements.walletModalMessage.textContent = "Opening WalletConnect QR modal...";
  if (!state.walletConnectProvider) {
    const { EthereumProvider } = await import(WALLETCONNECT_PROVIDER_URL);
    const appUrl = window.location.protocol === "file:"
      ? "http://localhost:8080"
      : window.location.origin && window.location.origin !== "null"
      ? window.location.origin
      : "http://localhost:8080";
    state.walletConnectProvider = await EthereumProvider.init({
      projectId,
      optionalChains: [ETHEREUM_CHAIN_ID],
      optionalMethods: ["eth_requestAccounts", "personal_sign"],
      optionalEvents: ["accountsChanged", "chainChanged", "disconnect"],
      showQrModal: true,
      metadata: {
        name: "ChainSight",
        description: "Historical data warehouse dashboard",
        url: appUrl,
        icons: []
      }
    });
  }

  const accounts = await state.walletConnectProvider.enable();
  await completeWalletSignIn(state.walletConnectProvider, accounts, providerLabel);
}

async function completeWalletSignIn(provider, accounts, providerLabel) {
  if (!accounts?.length) {
    throw new Error("Wallet did not return an account");
  }

  const walletAddress = accounts[0];
  setWalletStep("address", "done");
  const nonceResponse = await fetchJson(
    `/api/v1/auth/nonce?walletAddress=${encodeURIComponent(walletAddress)}`,
    { auth: false }
  );
  const message = nonceResponse.message;
  if (!message) {
    throw new Error("Wallet login challenge was not returned by the API");
  }

  elements.walletModalMessage.textContent = "Please sign the message in your wallet to continue.";
  setWalletStep("signature", "active");
  const signature = await provider.request({
    method: "personal_sign",
    params: [message, walletAddress]
  });
  setWalletStep("signature", "done");

  const response = await fetchJson("/api/v1/auth/wallet-login", {
    auth: false,
    method: "POST",
    body: JSON.stringify({ walletAddress, signature })
  });
  setWalletStep("session", "done");

  state.token = response.accessToken;
  state.currentUser = response.user;
  localStorage.setItem("chainsightJwt", state.token);
  closeWalletModal();
  renderAuthState();
  await loadTrackedWallets();
  logEvent(`Logged in with ${providerLabel}`);
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
    const hasWallet = Boolean(state.currentUser.walletAddress);
    elements.authStatusBadge.textContent = "Signed in";
    elements.currentUserEmail.textContent = state.currentUser.email || shortHash(state.currentUser.walletAddress) || "Unknown User";
    elements.walletSigninLabel.textContent = hasWallet ? shortHash(state.currentUser.walletAddress) : "Not connected";
    elements.walletConnectButton.textContent = hasWallet ? "Wallet connected" : "Connect wallet";
    elements.walletConnectButton.classList.toggle("is-connected", hasWallet);
    elements.logoutButton.hidden = false;
    elements.accountGrid.style.display = "none";
  } else {
    elements.authStatusBadge.textContent = "Signed out";
    elements.currentUserEmail.textContent = "-";
    elements.walletSigninLabel.textContent = "Not connected";
    elements.walletConnectButton.textContent = "Connect wallet";
    elements.walletConnectButton.classList.remove("is-connected");
    elements.logoutButton.hidden = true;
    elements.accountGrid.style.display = "";
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
  renderWalletFlowChart(summary);
}

function renderWalletTransactions(rows) {
  if (!rows.length) {
    elements.walletTransactionsBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No wallet transactions</td></tr>';
    return;
  }

  elements.walletTransactionsBody.innerHTML = rows.map((row) => `
    <tr>
      <td><span class="direction-badge ${row.direction === "SENT" ? "sent" : "received"}">${escapeHtml(row.direction)}</span></td>
      <td class="hash-cell" title="${escapeHtml(row.transactionHash)}">${escapeHtml(shortHash(row.transactionHash))}</td>
      <td class="hash-cell" title="${escapeHtml(row.counterpartyAddress || "")}">${escapeHtml(shortHash(row.counterpartyAddress))}</td>
      <td>${escapeHtml(formatNumber(row.blockNumber))}</td>
      <td>${escapeHtml(row.valueWei)}</td>
      <td>${escapeHtml(statusLabel(row.status))}</td>
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
  elements.walletTransactionsBody.innerHTML = `<tr><td colspan="6" class="empty-cell">${escapeHtml(message)}</td></tr>`;

  const walletFlowCanvas = document.getElementById("walletFlowChart");
  if (walletFlowCanvas && typeof Chart !== "undefined") {
    const walletFlowChart = Chart.getChart(walletFlowCanvas);
    if (walletFlowChart) {
      walletFlowChart.destroy();
    }
  }
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
        data-load-wallet="${escapeHtml(wallet.walletAddress)}"
        data-wallet-label="${escapeHtml(wallet.label || "")}"
        title="${escapeHtml(wallet.walletAddress)}"
      >
        ${escapeHtml(wallet.label || shortHash(wallet.walletAddress))}
      </button>
      <button type="button" class="delete-wallet" data-delete-wallet="${escapeHtml(wallet.id)}">Remove</button>
    </div>
  `).join("");
}

function renderAreaChart(canvas, rows, opts) {
  if (!canvas || typeof Chart === "undefined") {
    return;
  }
  const compact = Boolean(opts && opts.compact);
  const labels = rows.map((row) => row.date || "");
  const txData = rows.map((row) => Number(row.transactionCount || 0));
  const blockData = rows.map((row) => Number(row.blockCount || 0));

  const existing = Chart.getChart(canvas);
  if (existing) {
    existing.data.labels = labels;
    existing.data.datasets[0].data = txData;
    if (existing.data.datasets[1]) {
      existing.data.datasets[1].data = blockData;
    }
    existing.resize();
    existing.update();
    return;
  }

  const datasets = [{
    label: "Transactions",
    data: txData,
    borderColor: "#16a34a",
    borderWidth: 2,
    fill: true,
    tension: 0.35,
    pointRadius: rows.length === 1 ? 4 : 0,
    pointHoverRadius: 4,
    pointHoverBackgroundColor: "#16a34a",
    backgroundColor: function (context) {
      const chart = context.chart;
      const chartArea = chart.chartArea;
      if (!chartArea) {
        return "rgba(22,163,74,0.12)";
      }
      const gradient = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      gradient.addColorStop(0, "rgba(22,163,74,0.28)");
      gradient.addColorStop(1, "rgba(22,163,74,0.02)");
      return gradient;
    }
  }];

  if (!compact) {
    datasets.push({
      label: "Blocks",
      data: blockData,
      borderColor: "#2563eb",
      borderWidth: 1.5,
      fill: false,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderDash: [4, 4]
    });
  }

  new Chart(canvas, {
    type: "line",
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: !compact,
          position: "top",
          align: "end",
          labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { size: 12 } }
        },
        tooltip: {
          backgroundColor: "#19222a",
          padding: 10,
          cornerRadius: 8,
          titleFont: { size: 12 },
          bodyFont: { size: 12 }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: compact ? 5 : 8, color: "#6b7682", font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: "#eef1f4" },
          ticks: { color: "#6b7682", font: { size: 11 } }
        }
      }
    }
  });
}

function renderDailyChart(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  renderAreaChart(elements.dailyChart, safeRows, { compact: false });
  renderAreaChart(document.getElementById("overviewChart"), safeRows, { compact: true });
}

function renderWalletFlowChart(summary) {
  const canvas = document.getElementById("walletFlowChart");
  if (!canvas || typeof Chart === "undefined") {
    return;
  }
  const sent = Number(summary.sentCount || 0);
  const received = Number(summary.receivedCount || 0);

  const existing = Chart.getChart(canvas);
  if (existing) {
    existing.data.datasets[0].data = [sent, received];
    existing.resize();
    existing.update();
    return;
  }

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Sent", "Received"],
      datasets: [{
        data: [sent, received],
        backgroundColor: ["#dc2626", "#16a34a"],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: { display: true, position: "bottom", labels: { boxWidth: 10, usePointStyle: true, font: { size: 12 } } },
        tooltip: { backgroundColor: "#19222a", padding: 10, cornerRadius: 8 }
      }
    }
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
        <strong>Block ${escapeHtml(formatNumber(row.blockNumber))}</strong>
        <span>${escapeHtml(row.failureReason || "Unknown failure")} - retries ${escapeHtml(row.retryCount)}</span>
      </div>
      <button type="button" data-retry-block="${escapeHtml(row.blockNumber)}">Retry</button>
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

function setSidebarCollapsed(collapsed) {
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  elements.sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
  elements.sidebarToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
  elements.sidebarToggle.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
}

function bindEvents() {
  elements.sidebarToggle.addEventListener("click", () => {
    setSidebarCollapsed(!document.body.classList.contains("sidebar-collapsed"));
  });

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

  elements.walletConnectButton.addEventListener("click", openWalletModal);
  elements.walletModalClose.addEventListener("click", closeWalletModal);
  elements.walletModal.addEventListener("click", (event) => {
    if (event.target === elements.walletModal) {
      closeWalletModal();
    }
  });
  elements.walletProviderList.addEventListener("click", async (event) => {
    const providerButton = event.target.closest(".wallet-provider");
    if (!providerButton) {
      return;
    }

    setBusy(providerButton, true);
    elements.walletModalMessage.textContent = "";
    try {
      if (providerButton.dataset.providerType === "walletconnect") {
        await connectWalletConnectProvider(providerButton.dataset.providerLabel || "WalletConnect");
      } else {
        await connectInjectedWallet(providerButton.dataset.providerType);
      }
    } catch (error) {
      elements.walletModalMessage.textContent = error.message;
      logEvent(error.message, "error");
    } finally {
      setBusy(providerButton, false);
    }
  });

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
  elements.fromDateInput.value = "2024-05-28";
  elements.toDateInput.value = "2024-06-05";
  setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  requestWalletProviderAnnouncements();
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
