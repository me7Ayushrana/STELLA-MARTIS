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
        // Authenticated State
        authPanel.style.display = "none";
        dashboardPanel.style.display = "block";
        authHeaderActions.style.display = "flex";
        adminUserEmail.textContent = session.user.email;
        loadCampaignData();
      } else {
        // Unauthenticated State
        authPanel.style.display = "flex";
        dashboardPanel.style.display = "none";
        authHeaderActions.style.display = "none";
      }
    });

    // Login Form Submit
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const loginErrorMsg = document.getElementById("login-error-msg");
      if (loginErrorMsg) {
        loginErrorMsg.style.display = "none";
        loginErrorMsg.textContent = "";
      }
      btnLoginSubmit.textContent = "ESTABLISHING LINK...";
      btnLoginSubmit.disabled = true;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail.value.trim(),
          password: loginPassword.value,
        });

        if (error) throw error;
      } catch (err) {
        console.error("Login Failed:", err);
        if (loginErrorMsg) {
          loginErrorMsg.textContent = `ERROR: ${err.message.toUpperCase()}`;
          loginErrorMsg.style.display = "block";
        } else {
          alert("Authentication Error: " + err.message);
        }
      } finally {
        btnLoginSubmit.textContent = "ESTABLISH LINK";
        btnLoginSubmit.disabled = false;
      }
    });

    // Logout Action
    btnLogout.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.reload();
    });

  } else {
    // Fallback/Demo Mock UI when Supabase URL/Key placeholders are not configured yet
    console.warn("Supabase is offline or not configured. Starting in simulated mode.");
    
    // Simulate dynamic login for frontend testing without DB
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      btnLoginSubmit.textContent = "ESTABLISHING MOCK LINK...";
      btnLoginSubmit.disabled = true;

      setTimeout(() => {
        authPanel.style.display = "none";
        dashboardPanel.style.display = "block";
        authHeaderActions.style.display = "flex";
        adminUserEmail.textContent = "demo-admin@stellamartis.in";
        loadMockCampaignData();
      }, 1000);
    });

    btnLogout.addEventListener("click", () => {
      window.location.reload();
    });
  }

  // 3. DATA FETCHING & COMPUTATION
  async function loadCampaignData() {
    try {
      requestsList.innerHTML = `<tr><td colspan="6" class="table-empty">Reading campaigns datastream...</td></tr>`;
      
      const { data, error } = await supabase
        .from("campaign_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      campaignRequests = data || [];
      computeMetrics();
      renderRequestsTable();
    } catch (err) {
      console.error("Fetch Campaigns Error:", err);
      requestsList.innerHTML = `<tr><td colspan="6" class="table-empty" style="color:var(--error);">Failed to fetch datastream: ${err.message}</td></tr>`;
    }
  }

  // Fallback static mock data for demo
  function loadMockCampaignData() {
    campaignRequests = [
      {
        id: "mock-1",
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        organization: "ISRO Space Applications Centre",
        email: "rover-autonomy@sac.isro.gov.in",
        hardware: "Autonomy navigation payload & stereo camera rig. Weighs 12kg.",
        conditions: "10-20 min comms delay, loose regolith sand gradient up to 25 degrees.",
        timeline: "Q4 2026",
        deliverables: "report_and_data",
        spiti_team: "5 team members",
        status: "Pending",
        report_url: null
      },
      {
        id: "mock-2",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        organization: "IIT Ropar Geology Team",
        email: "geochemistry@iitrpr.ac.in",
        hardware: "X-ray fluorescence spectrometer & planetary core drill bits.",
        conditions: "Mohali indoor vacuum down to 0.05 atm, Mars regolith simulant bed, UV radiation.",
        timeline: "Immediate",
        deliverables: "report_and_data",
        spiti_team: "None (Mohali indoor)",
        status: "In Progress",
        report_url: null
      },
      {
        id: "mock-3",
        created_at: new Date(Date.now() - 3600000 * 48 * 2).toISOString(),
        organization: "Valles-X Aerospace",
        email: "missions@vallesx.com",
        hardware: "Carbon fiber solar cells, rotor blades, and flight computer of a Mars analog drone.",
        conditions: "Spiti high altitude low pressure (0.55 atm), cold desert climate.",
        timeline: "June 2026",
        deliverables: "raw_data_only",
        spiti_team: "3 members for deployment",
        status: "Completed",
        report_url: "https://drive.google.com/file/d/demo-report/view"
      }
    ];
    computeMetrics();
    renderRequestsTable();
  }

  // 4. METRICS / STATS COMPUTATION
  function computeMetrics() {
    statTotal.textContent = campaignRequests.length;
    statPending.textContent = campaignRequests.filter(r => r.status === "Pending").length;
    statActive.textContent = campaignRequests.filter(r => r.status === "In Progress").length;
    statCompleted.textContent = campaignRequests.filter(r => r.status === "Completed").length;
  }

  // 5. TABLE RENDER CONTROLLER
  function renderRequestsTable() {
    // Apply filters
    let filtered = campaignRequests;

    if (currentFilter !== "all") {
      filtered = filtered.filter(r => r.status === currentFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.organization.toLowerCase().includes(searchQuery) ||
        r.email.toLowerCase().includes(searchQuery)
      );
    }

    if (filtered.length === 0) {
      requestsList.innerHTML = `<tr><td colspan="6" class="table-empty">No matching telemetry logs found.</td></tr>`;
      return;
    }

    requestsList.innerHTML = filtered.map(r => {
      const dateStr = new Date(r.created_at).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      let statusBadge = "badge-pending";
      if (r.status === "In Progress") statusBadge = "badge-progress";
      else if (r.status === "Completed") statusBadge = "badge-completed";
      else if (r.status === "Cancelled") statusBadge = "badge-cancelled";

      const deliverableText = r.deliverables === "report_and_data" ? "Report + Data" : "Raw Data";

      return `
        <tr>
          <td class="time-mono">${dateStr}</td>
          <td><strong>${escapeHtml(r.organization)}</strong></td>
          <td class="time-mono">${escapeHtml(r.email)}</td>
          <td>${deliverableText}</td>
          <td><span class="badge ${statusBadge}">${r.status}</span></td>
          <td><button class="btn-view" data-id="${r.id}">VIEW</button></td>
        </tr>
      `;
    }).join('');

    // Rebind action buttons
    document.querySelectorAll(".btn-view").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        showRequestDetails(id);
      });
    });
  }

  // HTML escaping helper
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 6. FILTER & SEARCH BINDINGS
  searchOrg.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderRequestsTable();
  });

  filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.getAttribute("data-filter");
      renderRequestsTable();
    });
  });

  // 7. MODAL DRAWER HANDLING (VIEW & EDIT)
  function showRequestDetails(id) {
    const req = campaignRequests.find(r => r.id === id);
    if (!req) return;

    // Fill fields
    updateId.value = req.id;
    detailOrgTitle.textContent = req.organization;
    detailEmail.textContent = req.email;
    detailDate.textContent = new Date(req.created_at).toLocaleString();
    detailHardware.textContent = req.hardware;
    detailConditions.textContent = req.conditions || "None specified";
    detailTimeline.textContent = req.timeline || "Not specified";
    detailSpiti.textContent = req.spiti_team || "Not applicable";
    detailDeliverables.textContent = req.deliverables === "report_and_data" ? "Research Report & Raw Data" : "Raw Data Only";

    updateStatus.value = req.status;
    updateReport.value = req.report_url || "";

    detailsModal.style.display = "flex";
  }

  btnCloseDetails.addEventListener("click", () => {
    detailsModal.style.display = "none";
  });

  // Submit Detail updates
  updateRequestForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = updateId.value;
    const status = updateStatus.value;
    const report_url = updateReport.value.trim() || null;

    const btnSubmit = updateRequestForm.querySelector("button[type='submit']");
    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = "SAVING TELEMETRY STATE...";
    btnSubmit.disabled = true;

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("campaign_requests")
          .update({ status, report_url })
          .eq("id", id);

        if (error) throw error;

        // Success: reload
        detailsModal.style.display = "none";
        alert("Campaign details successfully updated!");
        loadCampaignData();
      } catch (err) {
        console.error("Update Error:", err);
        alert("Failed to save changes: " + err.message);
      } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
      }
    } else {
      // Offline Simulated update fallback
      setTimeout(() => {
        const idx = campaignRequests.findIndex(r => r.id === id);
        if (idx !== -1) {
          campaignRequests[idx].status = status;
          campaignRequests[idx].report_url = report_url;
        }
        computeMetrics();
        renderRequestsTable();
        detailsModal.style.display = "none";
        alert("Simulation telemetry state updated successfully (Offline Demo)!");
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
      }, 1000);
    }
  });

  // Handle Delete Request Action
  if (btnDeleteRequest) {
    btnDeleteRequest.addEventListener("click", async () => {
      const id = updateId.value;
      const orgName = detailOrgTitle.textContent;
      
      if (!confirm(`Are you absolutely sure you want to permanently delete the campaign request from "${orgName}"? This action cannot be undone.`)) {
        return;
      }

      const originalText = btnDeleteRequest.textContent;
      btnDeleteRequest.textContent = "DELETING...";
      btnDeleteRequest.disabled = true;

      if (isSupabaseConfigured()) {
        try {
          const { error } = await supabase
            .from("campaign_requests")
            .delete()
            .eq("id", id);

          if (error) throw error;

          detailsModal.style.display = "none";
          alert("Campaign request successfully deleted!");
          loadCampaignData();
        } catch (err) {
          console.error("Delete Error:", err);
          alert("Failed to delete request: " + err.message);
        } finally {
          btnDeleteRequest.textContent = originalText;
          btnDeleteRequest.disabled = false;
        }
      } else {
        // Offline Simulated delete fallback
        setTimeout(() => {
          campaignRequests = campaignRequests.filter(r => r.id !== id);
          computeMetrics();
          renderRequestsTable();
          detailsModal.style.display = "none";
          alert("Simulation telemetry state deleted successfully (Offline Demo)!");
          btnDeleteRequest.textContent = originalText;
          btnDeleteRequest.disabled = false;
        }, 1000);
      }
    });
  }

});

// Diagnostics check iteration 127
