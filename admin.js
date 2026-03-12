// Stella Martis — Admin Telemetry Panel JS
// Manages authentication, dynamic metrics computation, filters, details, and updates.

document.addEventListener("DOMContentLoaded", () => {
  // Inline robust initialization of Supabase client to prevent any script load failures or local storage overrides
  const SUPABASE_URL = "https://sfjjgsuchsfsohzqrojr.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmampnc3VjaHNmc29oenFyb2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjgwODYsImV4cCI6MjA5NTk0NDA4Nn0.BGhYAJX8VlKUaYbtSiROBQevoeumLtcqnzZUrIicVPg";
  
  let supabase = null;
  try {
    if (typeof window.supabase !== 'undefined' && window.supabase) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else if (typeof supabase !== 'undefined' && supabase) {
      supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (err) {
    console.error("Supabase client failed to initialize inline in admin.js:", err);
  }

  // DOM Elements
  const authPanel = document.getElementById("auth-panel");
  const dashboardPanel = document.getElementById("dashboard-panel");
  const authHeaderActions = document.getElementById("auth-header-actions");
  const adminUserEmail = document.getElementById("admin-user-email");
  
  const loginForm = document.getElementById("login-form");
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const btnLoginSubmit = document.getElementById("btn-login-submit");
  const btnLogout = document.getElementById("btn-logout");

  // Config Overrides DOM
  const btnSettingsToggle = document.getElementById("btn-settings-toggle");
  const settingsModal = document.getElementById("settings-modal");
  const btnCloseSettings = document.getElementById("btn-close-settings");
  const settingsForm = document.getElementById("settings-form");
  const configUrl = document.getElementById("config-url");
  const configKey = document.getElementById("config-key");
  const btnClearConfig = document.getElementById("btn-clear-config");

  // Dashboard Metrics & Tables DOM
  const requestsList = document.getElementById("requests-list");
  const statTotal = document.getElementById("stat-total");
  const statPending = document.getElementById("stat-pending");
  const statActive = document.getElementById("stat-active");
  const statCompleted = document.getElementById("stat-completed");
  const searchOrg = document.getElementById("search-org");
  const filterTabs = document.querySelectorAll(".filter-tab");

  // Details Modal DOM
  const detailsModal = document.getElementById("details-modal");
  const btnCloseDetails = document.getElementById("btn-close-details");
  const updateRequestForm = document.getElementById("update-request-form");
  const updateId = document.getElementById("update-id");
  const updateStatus = document.getElementById("update-status");
  const updateReport = document.getElementById("update-report");
  const btnDeleteRequest = document.getElementById("btn-delete-request");

  const detailOrgTitle = document.getElementById("detail-org-title");
  const detailEmail = document.getElementById("detail-email");
  const detailDate = document.getElementById("detail-date");
  const detailHardware = document.getElementById("detail-hardware");
  const detailConditions = document.getElementById("detail-conditions");
  const detailTimeline = document.getElementById("detail-timeline");
  const detailSpiti = document.getElementById("detail-spiti");
  const detailDeliverables = document.getElementById("detail-deliverables");

  // Global State
  let campaignRequests = [];
  let currentFilter = "all";
  let searchQuery = "";

  // 1. DYNAMIC CONFIG OVERRIDE ROUTINE
  function initConfigForm() {
    configUrl.value = localStorage.getItem("SM_SUPABASE_URL") || "";
    configKey.value = localStorage.getItem("SM_SUPABASE_ANON_KEY") || "";
  }

  btnSettingsToggle.addEventListener("click", () => {
    initConfigForm();
    settingsModal.style.display = "flex";
  });

  btnCloseSettings.addEventListener("click", () => {
    settingsModal.style.display = "none";
  });

  settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    localStorage.setItem("SM_SUPABASE_URL", configUrl.value.trim());
    localStorage.setItem("SM_SUPABASE_ANON_KEY", configKey.value.trim());
    alert("Configuration override saved! Reloading telemetry systems...");
    window.location.reload();
  });

  btnClearConfig.addEventListener("click", () => {
    localStorage.removeItem("SM_SUPABASE_URL");
    localStorage.removeItem("SM_SUPABASE_ANON_KEY");
    alert("Configuration override cleared! Reverting to project defaults...");
    window.location.reload();
  });

  // Check if Supabase client is active and properly initialized
  function isSupabaseConfigured() {
    return (
      typeof supabase !== "undefined" &&
      supabase &&
      supabase.auth &&
      typeof SUPABASE_URL !== "undefined" &&
      SUPABASE_URL &&
      !SUPABASE_URL.includes("your-project-id")
    );
  }

  // 2. AUTHENTICATION CONTROLLER
  if (isSupabaseConfigured()) {
    // Listen to Supabase Auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
