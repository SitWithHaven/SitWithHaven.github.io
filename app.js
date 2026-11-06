"use strict";

const STORAGE_KEY = "sit-with-haven-v1";
const LEGACY_STORAGE_KEY = "harborstone-property-desk-v1";
const UNITS_PER_BUILDING = 36;
const INITIAL_BUILDINGS = 22;
const MAX_BUILDINGS = 150;
const UNIT_COUNT = INITIAL_BUILDINGS * UNITS_PER_BUILDING;
const SAMPLE_DATA_ENABLED = window.SIT_WITH_HAVEN_CONFIG?.sampleData !== false;
const RBAC_SCHEMA_VERSION = 3;
const app = document.getElementById("app");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");
const toast = document.getElementById("toast");
const pageTitles = {
  overview: "Overview",
  properties: "Properties",
  "property-detail": "Property",
  tenants: "Tenants",
  leases: "Leases",
  calendar: "Calendar",
  units: "Units & residents",
  rent: "Rent & receipts",
  maintenance: "Maintenance",
  violations: "Violations",
  reports: "Reports & analytics",
  "my-settings": "My Settings",
  settings: "General Settings",
  access: "Users & access",
  notifications: "Notifications",
  spaces: "Space requests",
  portal: "Tenant portal",
  "association-dashboard": "Association Dashboard",
  associations: "Associations",
  homeowners: "Homeowners",
  board: "Board Members",
  "arc-requests": "ARC Requests",
  assessments: "Assessments",
  "association-violations": "Violations",
  "association-maintenance": "Maintenance",
  "association-communications": "Communications",
  "association-reports": "Reports",
  "association-calendar": "Calendar",
  "association-settings": "Settings",
  "no-access": "Access unavailable"
};
let currentEnvironment = location.hash === "#/association" ? "association" : "property-management";
let currentPage = currentEnvironment === "association" ? "association-dashboard" : "overview";
let rentTab = "balances";
let violationTab = "incidents";
let unitPage = 0;
let selectedReport = "executive";
let toastTimer;
let usersTab = "users";
let dashboardView = "association";
let selectedPropertyId = "disiplina-village";
let selectedReports = new Set();
let mySettingsCategory = "profile";
let propertyPortfolioView = "grid";
let propertyPortfolioFilters = { search: "", type: "all", status: "all", owner: "all", region: "all", group: "all", manager: "all" };
let calendarView = "agenda";
let calendarTypeFilter = "all";
const pageSearchTerms = { units: "", rent: "" };

const PERMISSION_TYPES = ["view", "create", "edit", "delete", "approve", "reject", "assign", "export", "print", "manage", "archive", "restore"];
const ACCESS_MODULES = [
  ["dashboard", "Executive dashboard"],
  ["properties", "Property portfolio"],
  ["units", "Buildings & units"],
  ["tenants", "Tenant records"],
  ["leases", "Leases"],
  ["resident-data", "Resident personal data"],
  ["finance", "Financial records"],
  ["maintenance", "Maintenance & work orders"],
  ["incidents", "Violations & incidents"],
  ["community", "Community & spaces"],
  ["communications", "Notifications"],
  ["reports", "Reports & analytics"],
  ["procurement", "Procurement"],
  ["inventory", "Inventory"],
  ["security", "Security & visitors"],
  ["inspections", "Inspections & compliance"],
  ["documents", "Documents & records"],
  ["complaints", "Complaints & grievances"],
  ["audit", "Audit trail"],
  ["users", "Users & roles"],
  ["settings", "System settings"],
  ["payment-methods", "Property payment instructions"],
  ["vendors", "Vendor management"],
  ["calendar", "Calendar"],
  ["associations", "Association management"],
  ["homeowners", "Homeowner records"],
  ["boards", "Board management"],
  ["arc", "Architectural requests"],
  ["assessments", "Assessments"]
];
const PROPERTY_PROFILE_GROUPS = [
  ["information", "Property information", [
    ["ownershipType", "Ownership type"], ["propertyManager", "Property manager"], ["yearBuilt", "Year built"], ["numberOfUnits", "Number of units"],
    ["squareFootage", "Square footage"], ["lotSize", "Lot size"], ["description", "Property description"],
    ["photos", "Property photo references"], ["documents", "Property document references"]
  ]],
  ["location", "Location details", [
    ["city", "City"], ["state", "State / province"], ["zipCode", "ZIP / postal code"], ["county", "County"],
    ["gpsCoordinates", "GPS coordinates"], ["schoolDistrict", "School district"], ["nearbyAmenities", "Nearby amenities"]
  ]],
  ["ownership", "Ownership information", [
    ["ownerName", "Owner name"], ["ownerContact", "Owner contact information"], ["ownershipPercentage", "Ownership percentage"],
    ["managementAgreementDate", "Management agreement date"], ["statementDeliveryPreferences", "Statement delivery preferences"],
    ["ownerPortalAccessSettings", "Owner portal access settings"]
  ]],
  ["financial", "Financial information", [
    ["operatingAccount", "Operating account"], ["securityDepositAccount", "Security deposit account"],
    ["reserveBalance", "Reserve balance"], ["monthlyIncome", "Monthly income"], ["monthlyExpenses", "Monthly expenses"],
    ["propertyValue", "Property value"], ["budgetInformation", "Budget information"], ["lateFeeSettings", "Late fee settings"],
    ["managementFeeStructure", "Management fee structure"]
  ]],
  ["leasing", "Leasing and preferences", [
    ["vacancyStatus", "Vacancy status"], ["availableDate", "Available date"], ["marketingStatus", "Marketing status"],
    ["listingDescription", "Listing description"], ["showingSchedule", "Showing schedule"], ["screeningResults", "Screening results"],
    ["leaseTemplates", "Lease templates"], ["leaseRenewalStatus", "Lease renewal status"],
    ["rentCollectionSettings", "Rent collection settings"], ["lateFeeRules", "Late fee rules"],
    ["utilityBillingSettings", "Utility billing settings"], ["portalAccessControls", "Portal access controls"],
    ["automatedCharges", "Automated charges"], ["recurringTransactions", "Recurring transactions"],
    ["notificationPreferences", "Notification preferences"], ["accountingDefaults", "Accounting defaults"]
  ]],
  ["operations", "Maintenance and vendors", [
    ["preferredVendors", "Preferred vendors"], ["vendorContactDetails", "Vendor contact details"],
    ["vendorInsuranceInformation", "Vendor insurance information"], ["vendorW9Status", "Vendor W-9 status"],
    ["vendorPerformanceNotes", "Vendor performance notes"], ["vendorPaymentPreferences", "Vendor payment preferences"],
    ["inspectionNotes", "Property inspection notes"], ["maintenanceNotes", "Maintenance notes"]
  ]],
  ["records", "Documents and communications", [
    ["leaseAgreements", "Lease agreements"], ["managementAgreements", "Management agreements"],
    ["inspectionReports", "Inspection reports"], ["insurancePolicies", "Insurance policies"],
    ["hoaDocuments", "HOA documents"], ["licensesPermitsCertificates", "Licenses, permits, and certificates"],
    ["uploadedAttachments", "Uploaded attachments"], ["communicationHistory", "Communication history"],
    ["internalNotes", "Internal notes"], ["ownerReportPreferences", "Custom owner report preferences"]
  ]]
];
const GENERAL_SETTING_CATEGORIES = [
  ["company", "Company Settings", "Company/legal profile, logo and branding, addresses, contact details, website, regional defaults, currency, date/time, and email-domain settings."],
  ["users", "User & Access Management", "User groups, role and department assignment, permission sets, login restrictions, SSO/MFA policy, passwords, sessions, lockout rules, and audit trails."],
  ["roles", "Role Management", "Configure the existing VHMS roles, module and field access, report/dashboard visibility, export rights, and API access policy."],
  ["security", "Security Settings", "Password policies, MFA requirements, login restrictions, session controls, account lockout rules, and security alerts."],
  ["property", "Property Settings", "Property/unit types, occupancy statuses, amenities, parking, utilities, classifications, inspection templates, numbering, and asset categories."],
  ["leasing", "Leasing Settings", "Application fees, screening rules, income requirements, lease templates and approvals, renewal, move-in/out, vacancy, waitlists, and pet policies."],
  ["resident", "Resident Settings", "Resident portal and registration, payment options, rent reminders, notices, document access, emergency contacts, and guest management."],
  ["resident-portal", "Resident Portal Settings", "Resident portal access, online payments, maintenance requests, communications, registration, and self-service features."],
  ["owner", "Owner Settings", "Owner portal, statement delivery, distribution schedules, ownership structures, notifications, tax documents, and report sharing."],
  ["owner-portal", "Owner Portal Settings", "Owner portal access, reporting, statement delivery, notifications, and shared owner services."],
  ["maintenance", "Maintenance Settings", "Work-order categories, priorities, emergency levels, vendor dispatch, SLAs, preventive maintenance, inspection checklists, assets, and technician schedules."],
  ["vendors", "Vendor Settings", "Vendor categories/trades, insurance and license requirements, W-9 tracking, approval, performance scoring, and payment terms."],
  ["accounting", "Accounting Settings", "Chart of accounts, GL mapping, fiscal year/periods, bank and trust accounts, deposits, owner contributions, late fees, recurring charges, and write-offs."],
  ["ap-bill-pay", "AP & Bill Pay Settings", "Vendor invoices, approval workflows, payment schedules, bill processing, and accounts-payable controls."],
  ["online-payments", "Payment Settings", "ACH/card gateways, Stripe configuration status, transaction fees, AutoPay rules, refunds, chargebacks, and failed payments."],
  ["communications", "Communication Settings", "Email/SMS/push templates, bulk messaging, resident/owner/vendor notices, scheduled messages, and communication logs."],
  ["documents", "Document Management Settings", "Folder structure, document categories, file limits/types, retention, e-signatures, OCR, and document access."],
  ["website-marketing", "Website & Marketing Settings", "Property listings, syndication, lead capture, website content, and marketing preferences."],
  ["automation", "Automation Settings", "Workflow rules, lease reminders, rent collection, late fees, recurring charges, owner distributions, maintenance routing, tasks, and escalations."],
  ["ai", "AI Settings (Haven AI)", "AI assistant and chat, leasing/maintenance/accounting insights, owner summaries, vacancy/delinquency predictions, report summaries, and AI permissions."],
  ["integrations", "Integration Settings", "GitHub/development tools, Stripe, Plaid, Azure OpenAI, Google/Microsoft, QuickBooks, Twilio, SendGrid, APIs, and webhooks."],
  ["compliance", "Security & Compliance Settings", "Audit/login records, encryption policy, backup and recovery, retention, fair-housing/privacy controls, and security alerts."],
  ["reporting", "Reports & Analytics Settings", "Dashboard layouts/KPIs, scheduled reports and distribution, export formats, data warehouse, and executive dashboard controls."],
  ["custom-fields", "Custom Fields & Preferences", "Configure custom data fields, workflow preferences, and organization-specific options."],
  ["transactions", "Transaction Settings", "Configure charges, receipts, deposits, refunds, and transaction processing defaults."],
  ["portals", "Portal Settings", "Resident/owner/vendor branding, navigation, self-service features, notifications, and portal security."],
  ["system", "System Preferences", "Language, theme, dashboard defaults, feature flags, environment, maintenance mode, activity logging, and notifications."]
];
const MY_SETTINGS_CATEGORIES = [
  ["profile", "My Profile", [
    ["profilePhoto", "Profile photo URL", "text"], ["firstName", "First name", "text"], ["lastName", "Last name", "text"],
    ["jobTitle", "Job title", "text"], ["companyName", "Company name", "text"], ["emailAddress", "Email address", "email"],
    ["mobileNumber", "Mobile number", "tel"], ["emergencyContact", "Emergency contact", "text"],
    ["biography", "Biography / about me", "textarea"], ["address", "Address", "textarea"],
    ["language", "Language preference", "select", ["English", "Filipino", "Spanish"]]
  ]],
  ["account", "Account", [
    ["username", "Username", "text"], ["securityQuestions", "Security question setup status", "select", ["Not configured", "Configured (demo only)"]],
    ["accountStatus", "Account status", "readonly"], ["lastLoginActivity", "Last login activity", "readonly"],
    ["connectedDevices", "Connected devices", "readonly"], ["changePassword", "Change password", "action"]
  ]],
  ["security", "Security", [
    ["mfaEnabled", "MFA preference", "select", ["Off", "On (not enforced)"]],
    ["authenticatorApp", "Authenticator app setup", "action"], ["backupRecoveryCodes", "Backup recovery codes", "action"],
    ["activeSessions", "Active sessions", "readonly"], ["deviceTrust", "Device trust management", "action"],
    ["logoutDevices", "Logout all devices", "action"]
  ]],
  ["notifications", "Notifications", [
    ["emailNotifications", "Email notifications", "select", ["On", "Off"]],
    ["smsNotifications", "SMS notifications", "select", ["On", "Off"]],
    ["pushNotifications", "Push notifications", "select", ["On", "Off"]],
    ["inAppNotifications", "In-app notifications", "select", ["On", "Off"]],
    ["notificationCategories", "Categories (applications, renewals, work orders, messages, payments, late rent, inspections, announcements)", "textarea"]
  ]],
  ["dashboard", "Dashboard", [
    ["defaultLandingPage", "Default landing page", "select", ["Overview", "Property / units", "Tenant dashboard", "Homeowner dashboard", "Reports"]],
    ["favoriteWidgets", "Favorite widgets (occupancy, revenue, work orders, collections)", "textarea"],
    ["dashboardLayout", "Dashboard layout", "select", ["Comfortable", "Compact"]],
    ["kpiVisibility", "Visible KPIs", "textarea"], ["cardArrangement", "Card arrangement", "textarea"], ["savedViews", "Saved views", "textarea"]
  ]],
  ["appearance", "Appearance", [
    ["theme", "Theme", "select", ["Light", "Dark", "System"]],
    ["accentColor", "Accent color", "select", ["Blue", "Teal", "Purple", "Orange"]],
    ["fontSize", "Font size", "select", ["Small", "Default", "Large"]],
    ["compactView", "Compact view", "select", ["Off", "On"]],
    ["accessibilityMode", "Accessibility mode", "select", ["Off", "On"]]
  ]],
  ["communications", "Communications", [
    ["emailSignature", "Email signature", "textarea"], ["replyTemplates", "Default reply templates", "textarea"],
    ["autoResponses", "Auto responses", "textarea"], ["messageNotifications", "Message notifications", "select", ["On", "Off"]],
    ["preferredContactMethod", "Preferred contact method", "select", ["Email", "SMS", "Phone", "In-app"]]
  ]],
  ["calendar", "Calendar", [
    ["timeZone", "Time zone", "text"], ["businessHours", "Business hours", "text"], ["workSchedule", "Work schedule", "text"],
    ["holidayCalendar", "Holiday calendar", "text"], ["calendarSync", "Calendar sync", "select", ["Not connected", "Google Calendar (not connected)", "Microsoft Outlook (not connected)"]]
  ]],
  ["searches", "Saved Searches", [
    ["propertyFilters", "Saved property filters", "textarea"], ["reportFilters", "Saved report filters", "textarea"],
    ["residentSearches", "Saved resident searches", "textarea"], ["favoriteProperties", "Favorite properties", "textarea"]
  ]],
  ["documents", "Documents", [
    ["downloadFormat", "Default download format", "select", ["PDF", "Word-compatible DOC", "CSV"]],
    ["signatureProfile", "Electronic signature profile", "text"], ["signatureImage", "Signature image reference", "text"],
    ["documentNotifications", "Document notifications", "select", ["On", "Off"]]
  ]],
  ["integrations", "Integrations", [
    ["githubConnection", "GitHub account", "readonly"], ["microsoftConnection", "Microsoft account", "readonly"],
    ["googleConnection", "Google account", "readonly"], ["stripeConnection", "Stripe profile", "readonly"],
    ["apiTokens", "API tokens", "readonly"], ["webhookTokens", "Webhook tokens", "readonly"]
  ]],
  ["privacy", "Privacy", [
    ["profileVisibility", "Profile visibility", "select", ["Organization", "My team", "Private"]],
    ["contactVisibility", "Contact information visibility", "select", ["Organization", "My team", "Private"]],
    ["loginPrivacy", "Login privacy", "select", ["Standard", "Private"]],
    ["activityTracking", "Activity tracking preferences", "select", ["Standard audit logging"]],
    ["dataExportRequest", "Data export request", "action"]
  ]],
  ["accessibility", "Accessibility", [
    ["highContrast", "High contrast mode", "select", ["Off", "On"]],
    ["screenReader", "Screen reader support", "select", ["Standard", "Enhanced labels"]],
    ["keyboardNavigation", "Keyboard navigation", "select", ["On", "Off"]],
    ["fontScaling", "Font scaling", "select", ["100%", "110%", "125%", "150%"]],
    ["motionReduction", "Motion reduction", "select", ["Off", "On"]]
  ]],
  ["haven-ai", "Haven AI", [
    ["aiAssistant", "AI assistant", "select", ["Off", "On (not connected)"]],
    ["aiSuggestions", "AI suggestions", "select", ["Off", "On"]],
    ["smartNotifications", "Smart notifications", "select", ["Off", "On"]],
    ["personalizedInsights", "Personalized insights", "select", ["Off", "On"]],
    ["aiChatHistory", "AI chat history", "select", ["Off", "On"]],
    ["aiReportSummaries", "AI report summaries", "select", ["Off", "On"]]
  ]],
  ["reports", "My Reports", [
    ["favoriteReports", "Favorite reports", "textarea"], ["scheduledReports", "Scheduled report preferences", "textarea"], ["recentReports", "Recent reports", "readonly"],
    ["reportExports", "Report exports", "readonly"]
  ]],
  ["activity", "Activity Log", [
    ["recentLogins", "Recent logins", "readonly"], ["recentActions", "Recent actions", "readonly"],
    ["auditHistory", "Audit history", "readonly"], ["downloads", "Downloads", "readonly"],
    ["reportExportHistory", "Report exports", "readonly"], ["changesMade", "Changes made", "readonly"]
  ]],
  ["role-preferences", "Role-specific preferences", [
    ["portfolioPreferences", "Portfolio / property defaults", "textarea"], ["taskPreferences", "Task and lead assignment preferences", "textarea"],
    ["showingAvailability", "Showing availability / leasing templates", "textarea"],
    ["financialPreferences", "Default financial reports / export preferences", "textarea"],
    ["workOrderPreferences", "Work-order / vendor / technician scheduling preferences", "textarea"],
    ["residentPreferences", "Rent payment / AutoPay / maintenance preferences", "textarea"],
    ["ownerPreferences", "Statement delivery / distributions / investment dashboard", "textarea"],
    ["vendorPreferences", "Payment / insurance / service category preferences", "textarea"]
  ]]
];
const ROLE_DEFINITIONS = [
  ["president-executive-director", "President / Executive Director"],
  ["property-manager", "Property Manager"],
  ["assistant-property-manager", "Assistant Property Manager"],
  ["housing-administrator", "Housing Administrator"],
  ["leasing-occupancy-officer", "Leasing / Occupancy Officer"],
  ["maintenance-technician", "Maintenance Technician"],
  ["accountant-finance-officer", "Accountant / Finance Officer"],
  ["records-officer", "Records Officer"]
];
const ROLE_ACCESS = {
  "president-executive-director": { all: true },
  "property-manager": { dashboard: "view", properties: "view,create,edit,export", units: "view,create,edit,manage,export", tenants: "view,export", leases: "view,create,edit", "resident-data": "view", finance: "view,approve", maintenance: "view,approve", incidents: "view", community: "view", communications: "view", reports: "view,export,print", procurement: "view,approve", vendors: "view", inventory: "view", security: "view", inspections: "view", documents: "view", complaints: "view", audit: "view", users: "view,create,edit,manage", settings: "view", "payment-methods": "view,edit,manage", calendar: "view,create,edit,export", associations: "view", homeowners: "view", boards: "view", arc: "view,approve", assessments: "view" },
  "assistant-property-manager": { dashboard: "view", properties: "view", units: "view,edit", tenants: "view,edit", leases: "view,edit", "resident-data": "view", maintenance: "view,edit", incidents: "view,create,edit", community: "view,edit", communications: "view", reports: "view,export", complaints: "view,edit", calendar: "view", associations: "view", homeowners: "view", arc: "view" },
  "housing-administrator": { dashboard: "view", properties: "view", units: "view,edit", tenants: "view,create,edit,manage,export", leases: "view,create,edit", "resident-data": "view,export", community: "view", reports: "view,export", documents: "view,create,edit", calendar: "view", associations: "view", homeowners: "view" },
  "leasing-occupancy-officer": { dashboard: "view", properties: "view", units: "view,create,edit,manage", tenants: "view,create,edit", leases: "view,create,edit", reports: "view,export", calendar: "view,create,edit" },
  "maintenance-technician": { dashboard: "view", maintenance: "view,edit", reports: "view", vendors: "view", calendar: "view,edit", associations: "view" },
  "accountant-finance-officer": { dashboard: "view", finance: "view,create,edit,manage,export,print", reports: "view,export,print", procurement: "view", vendors: "view", audit: "view", calendar: "view", assessments: "view" },
  "records-officer": { dashboard: "view", properties: "view", documents: "view,create,edit,manage,archive,restore,export,print", reports: "view,export", calendar: "view", associations: "view", homeowners: "view", boards: "view", arc: "view", assessments: "view" },
};
const DASHBOARD_WIDGETS = [
  ["property-metrics", "Property occupancy and unit metrics"],
  ["financial-summary", "Financial summary"],
  ["rent-collection", "Rent collection"],
  ["operations", "Operations follow-up"],
  ["overdue-rent", "Overdue rent"],
  ["maintenance-queue", "Maintenance queue"],
  ["property-portfolio", "Property portfolio"]
];
const DEFAULT_DASHBOARD_WIDGETS = {
  "president-executive-director": DASHBOARD_WIDGETS.map(([id]) => id),
  "property-manager": DASHBOARD_WIDGETS.map(([id]) => id),
  "assistant-property-manager": ["property-metrics", "operations", "maintenance-queue"],
  "housing-administrator": ["property-metrics"],
  "leasing-occupancy-officer": ["property-metrics"],
  "maintenance-technician": ["maintenance-queue"],
  "accountant-finance-officer": ["financial-summary", "rent-collection", "overdue-rent"],
  "records-officer": ["property-portfolio"]
};
const PROPERTY_TYPES = [
  ["building", "Building"],
  ["commercial", "Commercial"],
  ["sfr", "SFR — Single-family rental"],
  ["mfr", "MFR — Multifamily rental"],
  ["hoa", "HOA — Homeowners association"]
];
const PAYMENT_METHOD_TYPES = [
  ["bank", "Bank transfer"],
  ["cash", "Cash"],
  ["escrow", "Escrow"],
  ["other", "Other"]
];
const DASHBOARD_VIEWS = [
  ["association", "Association management"],
  ["property", "Property / units"],
  ["tenant", "Tenant dashboard"],
  ["homeowner", "Homeowner dashboard"]
];
const DEFAULT_DASHBOARD_VIEWS = {
  "president-executive-director": ["association", "property", "tenant", "homeowner"],
  "property-manager": ["association", "property", "tenant", "homeowner"],
  "assistant-property-manager": ["association", "property"],
  "housing-administrator": ["property", "tenant"],
  "leasing-occupancy-officer": ["property"],
  "maintenance-technician": ["association"],
  "accountant-finance-officer": ["association"],
  "records-officer": ["association"]
};
const ENVIRONMENT_NAVIGATION = {
  "property-management": [
    ["overview", "Dashboard", "O"], ["properties", "Properties", "P"], ["tenants", "Tenants", "T"],
    ["leases", "Leases", "L"], ["units", "Units & residents", "U"], ["rent", "Accounting", "$"],
    ["maintenance", "Maintenance", "M"], ["vendors", "Vendors", "V"], ["violations", "Violations", "!"],
    ["reports", "Reports", "R"], ["calendar", "Calendar", "C"], ["access", "Users & access", "A"],
    ["notifications", "Communications", "N"], ["spaces", "Space requests", "S"], ["portal", "Tenant portal", "T"]
  ],
  association: [
    ["association-dashboard", "Dashboard", "O"], ["associations", "Associations", "A"],
    ["homeowners", "Homeowners", "H"], ["board", "Board Members", "B"],
    ["association-violations", "Violations", "!"], ["arc-requests", "ARC Requests", "R"],
    ["assessments", "Assessments", "$"], ["association-maintenance", "Maintenance", "M"],
    ["association-communications", "Communications", "C"], ["association-reports", "Reports", "R"],
    ["association-calendar", "Calendar", "C"], ["association-settings", "Settings", "S"]
  ]
};

function defaultAccessControl() {
  const roles = ROLE_DEFINITIONS.map(([id, name]) => {
    const policy = ROLE_ACCESS[id] || {};
    const permissions = Object.fromEntries(ACCESS_MODULES.map(([module]) => [
      module,
      policy.all ? [...PERMISSION_TYPES] : String(policy[module] || "").split(",").filter(Boolean)
    ]));
    return {
      id,
      name,
      active: true,
      permissions,
      dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS[id] || [],
      dashboardViews: DEFAULT_DASHBOARD_VIEWS[id] || ["association"]
    };
  });
  return {
    roleSchemaVersion: RBAC_SCHEMA_VERSION,
    roles,
    users: [{
      id: "USER-0001",
      name: "Alex Morgan",
      email: "alex@example.com",
      roles: ["property-manager"],
      department: "Property Management",
      propertyIds: ["disiplina-village"],
      status: "Active",
      createdAt: localDateString()
    }],
    demoUserId: "USER-0001",
    demoRoleId: "assigned-user",
    auditLog: []
  };
}
function roleName(roleId) {
  return state?.accessControl?.roles.find((role) => role.id === roleId)?.name || "Unassigned role";
}

function currentDemoRole() {
  return currentDemoRoles()[0] || null;
}

function currentDemoUser() {
  const access = state?.accessControl;
  return access?.users.find((user) => user.id === access.demoUserId) || access?.users[0] || null;
}

function currentUserSettings(user = currentDemoUser()) {
  if (!user) return {};
  const names = String(user.name || "").trim().split(/\s+/);
  const defaults = {
    firstName: names.shift() || "",
    lastName: names.join(" "),
    jobTitle: currentDemoRoles().map((role) => role.name).join(", "),
    companyName: "Sit with Haven",
    emailAddress: user.email || "",
    username: user.email?.split("@")[0] || user.id,
    language: "English",
    timeZone: "Asia/Manila",
    accountStatus: user.status,
    lastLoginActivity: "Not available in demo",
    connectedDevices: "Not available in demo",
    activeSessions: "Not available in demo",
    githubConnection: "Not connected",
    microsoftConnection: "Not connected",
    googleConnection: "Not connected",
    stripeConnection: "Not connected",
    apiTokens: "Not available (secure backend required)",
    webhookTokens: "Not available (secure backend required)"
  };
  return { ...defaults, ...(state.userSettings?.[user.id] || {}) };
}

function isValidProfilePhotoUrl(value) {
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function currentDemoRoles() {
  const access = state?.accessControl;
  if (!access) return [];
  if (access.demoRoleId !== "assigned-user") {
    const previewRole = access.roles.find((role) => role.id === access.demoRoleId && role.active);
    return previewRole ? [previewRole] : [];
  }
  const demoUser = access.users.find((user) => user.id === access.demoUserId && user.status === "Active");
  return access.roles.filter((role) => role.active && demoUser?.roles.includes(role.id));
}

function hasPermission(module, permission = "view") {
  return currentDemoRoles().some((role) => role.active
    && Array.isArray(role.permissions?.[module]) && role.permissions[module].includes(permission));
}

function canManageRoleDashboards() {
  return currentDemoRoles().some((role) => role.id === "president-executive-director");
}

function applyPersonalAppearance() {
  const preferences = currentUserSettings();
  const theme = preferences.theme || "Light";
  const dark = theme === "Dark" || (theme === "System" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.body.classList.toggle("theme-dark", dark);
  document.body.classList.toggle("theme-high-contrast", preferences.highContrast === "On" || preferences.accessibilityMode === "On");
  document.body.classList.toggle("theme-compact", preferences.compactView === "On" || preferences.dashboardLayout === "Compact");
  document.body.classList.toggle("theme-reduced-motion", preferences.motionReduction === "On");
  const scale = { Small: "0.94", Default: "1", Large: "1.1" }[preferences.fontSize] || "1";
  document.documentElement.style.setProperty("--user-font-scale", scale);
  const colors = { Blue: "#4778df", Teal: "#178b84", Purple: "#7957c8", Orange: "#cb762c" };
  document.documentElement.style.setProperty("--blue", colors[preferences.accentColor] || colors.Blue);
}

function canManageBulkRent() {
  return currentDemoRoles().some((role) => ["president-executive-director", "property-manager"].includes(role.id))
    || hasPermission("finance", "edit");
}

function selectedDashboardWidgets() {
  return new Set(currentDemoRoles().flatMap((role) => Array.isArray(role.dashboardWidgets)
    ? role.dashboardWidgets : DEFAULT_DASHBOARD_WIDGETS[role.id] || []));
}

function propertyTypeName(type) {
  return PROPERTY_TYPES.find(([id]) => id === type)?.[1] || "MFR — Multifamily rental";
}

function availableDashboardViews() {
  const assignedViews = new Set(currentDemoRoles().flatMap((role) => Array.isArray(role.dashboardViews)
    ? role.dashboardViews : DEFAULT_DASHBOARD_VIEWS[role.id] || ["association"]));
  return DASHBOARD_VIEWS.filter(([id]) => assignedViews.has(id)
    && (id === "association"
      || (id === "property" && hasPermission("units", "view"))
      || (id === "tenant" && hasPermission("community", "view"))
      || (id === "homeowner" && hasPermission("community", "view"))));
}

function dashboardSwitcherMarkup() {
  return `<section class="dashboard-switcher" aria-label="Dashboard view">${availableDashboardViews().map(([id, label]) => `<button class="tab-button ${dashboardView === id ? "tab-active" : ""}" data-action="dashboard-view" data-view="${id}">${escapeHtml(label)}</button>`).join("")}</section>`;
}

function environmentNavigation() {
  return ENVIRONMENT_NAVIGATION[currentEnvironment] || ENVIRONMENT_NAVIGATION["property-management"];
}

function renderNavigationShell() {
  const isAssociation = currentEnvironment === "association";
  document.getElementById("brand-environment").textContent = isAssociation ? "ASSOCIATION MANAGEMENT" : "PROPERTY MANAGEMENT";
  document.querySelector(".workspace-label").textContent = isAssociation ? "ASSOCIATION WORKSPACE" : "PROPERTY WORKSPACE";
  document.querySelectorAll(".environment-button").forEach((button) => {
    const active = button.dataset.environment === currentEnvironment;
    button.classList.toggle("environment-button-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.getElementById("primary-nav").innerHTML = environmentNavigation()
    .map(([page, label, icon]) => `<button class="nav-link ${page === currentPage ? "active" : ""}" data-page="${page}"><span class="nav-icon">${escapeHtml(icon)}</span>${escapeHtml(label)}</button>`)
    .join("");
}

function switchEnvironment(environment, updateUrl = true) {
  if (!ENVIRONMENT_NAVIGATION[environment]) return;
  if (environment === currentEnvironment) return;
  const module = environment === "association" ? "associations" : "properties";
  if (!hasPermission(module, "view")) {
    showToast(`Your role does not have permission to access ${environment === "association" ? "Association Management" : "Property Management"}.`, true);
    return;
  }
  currentEnvironment = environment;
  currentPage = environment === "association" ? "association-dashboard" : "overview";
  if (updateUrl) {
    const route = environment === "association" ? "#/association" : "#/property-management";
    if (location.hash !== route) location.hash = route;
  }
  render();
}

function pageModule(page) {
  return {
    overview: "dashboard",
    properties: "properties",
    "property-detail": "properties",
    tenants: "tenants",
    leases: "leases",
    calendar: "calendar",
    units: "units",
    rent: "finance",
    maintenance: "maintenance",
    violations: "incidents",
    reports: "reports",
    settings: "settings",
    access: "users",
    notifications: "communications",
    spaces: "community",
    portal: "community",
    "association-dashboard": "associations",
    associations: "associations",
    homeowners: "homeowners",
    board: "boards",
    "arc-requests": "arc",
    assessments: "assessments",
    "association-violations": "incidents",
    "association-maintenance": "maintenance",
    "association-communications": "communications",
    "association-reports": "reports",
    "association-calendar": "calendar",
    "association-settings": "settings"
  }[page];
}

function recordModule(formId) {
  return {
    "property-form": "properties",
    "property-details-form": "properties",
    "unit-form": "units",
    "unit-import-form": "units",
    "property-group-form": "settings",
    "general-settings-form": "settings",
    "bulk-rent-form": "finance",
    "payment-method-form": "payment-methods",
    "tenant-form": "tenants",
    "payment-form": "finance",
    "maintenance-form": "maintenance",
    "violation-form": "incidents",
    "community-rule-form": "incidents",
    "notification-settings-form": "communications",
    "announcement-form": "communications",
    "team-contact-form": "users",
    "space-booking-form": "community",
    "maintenance-message-form": "maintenance",
    "space-request-form": "community",
    "association-record-form": "homeowners",
    "calendar-event-form": "calendar",
    "tenant-charge-form": "finance"
  }[formId];
}

function buildingCount(units = state?.units || []) {
  return units.reduce((highest, unit) => Math.max(highest, Number(unit.building) || 0), 0);
}

function unitsForProperty(propertyId) {
  return state.units.filter((unit) => (unit.propertyId || "disiplina-village") === propertyId);
}

function propertyUnitMetrics(propertyId) {
  const units = unitsForProperty(propertyId);
  const unitIds = new Set(units.map((unit) => unit.id));
  return {
    units,
    occupied: units.filter((unit) => unit.status === "Occupied").length,
    charges: state.charges.filter((item) => unitIds.has(item.unitId)),
    payments: state.payments.filter((item) => unitIds.has(item.unitId)),
    maintenance: state.maintenance.filter((item) => unitIds.has(item.unitId))
  };
}

function nextUnitRecordId(units = state.units) {
  return units.reduce((highest, unit) => Math.max(highest, Number(unit.id) || 0), 0) + 1;
}

function unitRent(unit) {
  const recurringTotal = (unit.recurringCharges || []).reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
  return Math.max(0, Number(unit.monthlyRent || activeTenantCharge(unit)?.amount - recurringTotal || 0));
}

function rentUnitLabel(unit) {
  const resident = unit.resident ? ` · ${unit.resident}` : " · Vacant";
  return `${unitLabel(unit.id)} · Building ${String(unit.building).padStart(2, "0")}${resident}`;
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function unitNumberForIndex(indexWithinBuilding) {
  const floor = Math.floor(indexWithinBuilding / 12) + 1;
  const position = (indexWithinBuilding % 12) + 1;
  return String(floor * 100 + position);
}

function makeSeedState() {
  const units = [];
  const charges = [];
  const payments = [];
  const today = localDateString();

  for (let id = 1; SAMPLE_DATA_ENABLED && id <= UNIT_COUNT; id += 1) {
    const building = Math.ceil(id / 36);
    const unitNumber = unitNumberForIndex((id - 1) % UNITS_PER_BUILDING);
    const occupied = id <= 744;
    const resident = occupied ? `Resident ${String(id).padStart(3, "0")}` : "";
    units.push({
      id,
      propertyId: "disiplina-village",
      building,
      unitNumber,
      resident,
      status: occupied ? "Occupied" : "Vacant",
      contact: { address: "", phone: "", email: "" },
      occupation: "",
      householdMembers: [],
      monthlyRent: 12000,
      recurringCharges: [],
      pets: { hasPets: false, count: 0, types: [], otherDetails: "" }
    });

    if (occupied) {
      const chargeStatus = id <= 680 ? "Paid" : id <= 692 ? "Overdue" : "Due";
      charges.push({
        id: `RENT-${id}`,
        unitId: id,
        resident,
        amount: 12000,
        balance: chargeStatus === "Paid" ? 0 : 12000,
        status: chargeStatus,
        dueDate: `${today.slice(0, 7)}-01`
      });
      if (chargeStatus === "Paid") {
        payments.push({
          id: `RCPT-${String(id).padStart(4, "0")}`,
          unitId: id,
          resident,
          amount: 12000,
          method: ["Bank transfer", "E-wallet", "Cash"][id % 3],
          reference: `DEMO-${String(id).padStart(4, "0")}`,
          date: today
        });
      }
    }
  }

  return {
    properties: [{
      id: "disiplina-village",
      name: "Disiplina Village Valenzuela City",
      type: "mfr",
      address: "Valenzuela City",
      paymentMethods: [],
      groupId: "",
      profile: {},
      createdAt: today
    }],
    propertyGroups: [],
    generalSettings: {},
    userSettings: {},
    units,
    charges,
    payments,
    maintenance: SAMPLE_DATA_ENABLED ? [
      { id: "WO-1042", unitId: 17, category: "Plumbing", description: "Kitchen sink is leaking under the cabinet.", priority: "High", status: "Open", createdAt: localDateString(), messages: [{ id: "MSG-1042-1", author: "Resident 017", role: "Tenant", text: "The leak is getting worse when the tap is running.", createdAt: localDateString() }, { id: "MSG-1042-2", author: "Alex Morgan", role: "Property manager", text: "Thanks for reporting this. I have shared it with the maintenance team.", createdAt: localDateString() }] },
      { id: "WO-1041", unitId: 86, category: "Electrical", description: "Hallway light flickers intermittently.", priority: "Normal", status: "In progress", createdAt: localDateString() },
      { id: "WO-1040", unitId: 231, category: "Appliance", description: "Please inspect the refrigerator; it is not cooling.", priority: "Normal", status: "Scheduled", createdAt: localDateString() },
      { id: "WO-1039", unitId: 412, category: "Water", description: "Low water pressure in the bathroom.", priority: "High", status: "Open", createdAt: localDateString() },
      { id: "WO-1038", unitId: 566, category: "Common area", description: "Request to repair the lobby door closer.", priority: "Low", status: "Complete", createdAt: localDateString() },
      { id: "WO-1037", unitId: 701, category: "Other", description: "Bedroom window latch is difficult to close.", priority: "Normal", status: "Open", createdAt: localDateString() }
    ] : [],
    violations: SAMPLE_DATA_ENABLED ? [
      { id: "V-0208", unitId: 45, category: "Noise", description: "Noise reported after quiet hours.", status: "Notice sent", reportedAt: localDateString() },
      { id: "V-0207", unitId: 288, category: "Parking", description: "Vehicle parked in a reserved space.", status: "Under review", reportedAt: localDateString() },
      { id: "V-0206", unitId: 523, category: "Common area", description: "Personal items left in the corridor.", status: "Resolved", reportedAt: localDateString() },
      { id: "V-0205", unitId: 701, category: "Pet policy", description: "Follow-up requested regarding pet registration.", status: "Notice sent", reportedAt: localDateString() }
    ] : [],
    violationCatalog: [
      { id: "RULE-001", title: "Noise after quiet hours", category: "Noise", description: "Avoid loud music, gatherings, and other disruptive noise during posted quiet hours.", active: true },
      { id: "RULE-002", title: "Improper parking", category: "Parking", description: "Park only in assigned or marked spaces; keep fire lanes and access routes clear.", active: true },
      { id: "RULE-003", title: "Pets and pet registration", category: "Pet policy", description: "Follow community pet rules, register pets with management, and clean up after them.", active: true },
      { id: "RULE-004", title: "Blocked hallways and common areas", category: "Common area", description: "Keep corridors, stairways, and shared areas clear of personal belongings and obstructions.", active: true },
      { id: "RULE-005", title: "Waste disposal", category: "Sanitation", description: "Dispose of household waste in designated bins and follow the posted collection schedule.", active: true },
      { id: "RULE-006", title: "Smoking in restricted areas", category: "Smoking", description: "Observe posted smoking restrictions in units, corridors, and shared spaces.", active: true },
      { id: "RULE-007", title: "Unauthorized alterations", category: "Property", description: "Obtain management approval before making alterations to a unit or shared property.", active: true },
      { id: "RULE-008", title: "Security and visitor access", category: "Security", description: "Follow visitor registration and community security procedures.", active: true }
    ],
    communityAnnouncements: [],
    teamContacts: [],
    spaceReservations: [],
    tenantHistory: [],
    associationRecords: { homeowners: [], boards: [], arcRequests: [], assessments: [], violations: [], maintenance: [] },
    calendarEvents: [],
    accessControl: defaultAccessControl(),
    notificationSettings: {
      emailEnabled: false,
      smsEnabled: false,
      emailProvider: "Not configured",
      smsProvider: "Not configured",
      rentReminderDays: 3,
      overdueRepeatDays: 7,
      rentReminders: true,
      outstandingBalanceReminders: true,
      violationNotifications: true,
      communityDriveNotifications: true
    }
  };
}

function loadState() {
  let saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) localStorage.setItem(STORAGE_KEY, saved);
  }
  if (!saved) return makeSeedState();

  const parsed = JSON.parse(saved);
  const requiredLists = ["units", "charges", "payments", "maintenance", "violations"];
  if (!parsed || requiredLists.some((key) => !Array.isArray(parsed[key]))) {
    throw new Error("Saved property data is incomplete. Clear this site's browser data to reload the demo.");
  }
  parsed.violationCatalog = Array.isArray(parsed.violationCatalog) ? parsed.violationCatalog : makeSeedState().violationCatalog;
  parsed.communityAnnouncements = Array.isArray(parsed.communityAnnouncements) ? parsed.communityAnnouncements : [];
  parsed.teamContacts = Array.isArray(parsed.teamContacts) ? parsed.teamContacts : [];
  parsed.spaceReservations = Array.isArray(parsed.spaceReservations) ? parsed.spaceReservations : [];
  parsed.tenantHistory = Array.isArray(parsed.tenantHistory) ? parsed.tenantHistory : [];
  parsed.associationRecords = parsed.associationRecords && typeof parsed.associationRecords === "object"
    ? parsed.associationRecords : { homeowners: [], boards: [], arcRequests: [], assessments: [], violations: [], maintenance: [] };
  ["homeowners", "boards", "arcRequests", "assessments", "violations", "maintenance"].forEach((key) => {
    parsed.associationRecords[key] = Array.isArray(parsed.associationRecords[key]) ? parsed.associationRecords[key] : [];
  });
  parsed.calendarEvents = Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : [];
  parsed.properties = Array.isArray(parsed.properties) && parsed.properties.length
    ? parsed.properties.map((property, index) => ({
      id: String(property.id || `PROPERTY-${index + 1}`),
      name: String(property.name || "Untitled property"),
      type: PROPERTY_TYPES.some(([id]) => id === property.type) ? property.type : "mfr",
      address: String(property.address || ""),
      groupId: String(property.groupId || ""),
      profile: property.profile && typeof property.profile === "object" ? property.profile : {},
      paymentMethods: Array.isArray(property.paymentMethods) ? property.paymentMethods.map((method, index) => ({
        id: String(method.id || `PAY-${property.id || index + 1}-${index + 1}`),
        type: PAYMENT_METHOD_TYPES.some(([id]) => id === method.type) ? method.type : "other",
        label: String(method.label || ""),
        institution: String(method.institution || ""),
        accountName: String(method.accountName || ""),
        accountNumber: String(method.accountNumber || ""),
        branch: String(method.branch || ""),
        instructions: String(method.instructions || ""),
        active: Boolean(method.active)
      })) : [],
      createdAt: property.createdAt || localDateString()
    }))
    : makeSeedState().properties;
  parsed.propertyGroups = Array.isArray(parsed.propertyGroups) ? parsed.propertyGroups.map((group, index) => ({
    id: String(group.id || `GROUP-${index + 1}`),
    name: String(group.name || "Untitled group"),
    description: String(group.description || ""),
    propertyIds: Array.isArray(group.propertyIds) ? group.propertyIds.map(String) : [],
    customFields: Array.isArray(group.customFields) ? group.customFields.map(String) : []
  })) : [];
  parsed.generalSettings = parsed.generalSettings && typeof parsed.generalSettings === "object" ? parsed.generalSettings : {};
  GENERAL_SETTING_CATEGORIES.forEach(([id]) => {
    const savedSettings = parsed.generalSettings[id];
    parsed.generalSettings[id] = {
      enabled: savedSettings?.enabled !== false,
      notes: String(savedSettings?.notes || "")
    };
  });
  parsed.userSettings = parsed.userSettings && typeof parsed.userSettings === "object" ? parsed.userSettings : {};
  Object.keys(parsed.userSettings).forEach((userId) => {
    const savedSettings = parsed.userSettings[userId];
    parsed.userSettings[userId] = savedSettings && typeof savedSettings === "object" && !Array.isArray(savedSettings)
      ? Object.fromEntries(Object.entries(savedSettings).filter(([, value]) =>
        ["string", "boolean", "number"].includes(typeof value)).map(([key, value]) => [key, String(value)]))
      : {};
  });
  const defaultAccess = defaultAccessControl();
  const savedAccess = parsed.accessControl || {};
  const refreshBuiltInRoles = savedAccess.roleSchemaVersion !== RBAC_SCHEMA_VERSION;
  const savedRoles = Array.isArray(savedAccess.roles) ? savedAccess.roles : [];
  const savedRoleMap = new Map(savedRoles.map((role) => [role.id, role]));
  const roleIds = new Set(ROLE_DEFINITIONS.map(([id]) => id));
  const customRoles = savedRoles.filter((role) => typeof role.id === "string"
    && role.id.startsWith("custom-") && !roleIds.has(role.id)).map((role) => ({
    ...role,
    active: role.active !== false,
    dashboardWidgets: Array.isArray(role.dashboardWidgets)
      ? role.dashboardWidgets.filter((id) => DASHBOARD_WIDGETS.some(([widgetId]) => widgetId === id))
      : [],
    dashboardViews: Array.isArray(role.dashboardViews)
      ? role.dashboardViews.filter((id) => DASHBOARD_VIEWS.some(([viewId]) => viewId === id))
      : DEFAULT_DASHBOARD_VIEWS[role.id] || ["association"],
    permissions: Object.fromEntries(ACCESS_MODULES.map(([module]) => [
      module,
      Array.isArray(role.permissions?.[module])
        ? role.permissions[module].filter((permission) => PERMISSION_TYPES.includes(permission))
        : []
    ]))
  }));
  customRoles.forEach((role) => roleIds.add(role.id));
  const roles = defaultAccess.roles.map((role) => {
    const savedRole = savedRoleMap.get(role.id);
    if (role.id === "president-executive-director") return role;
    return savedRole ? {
      ...role,
      ...savedRole,
      name: refreshBuiltInRoles ? role.name : savedRole.name || role.name,
      dashboardWidgets: Array.isArray(savedRole.dashboardWidgets)
        ? savedRole.dashboardWidgets.filter((id) => DASHBOARD_WIDGETS.some(([widgetId]) => widgetId === id))
        : role.dashboardWidgets,
      dashboardViews: Array.isArray(savedRole.dashboardViews)
        ? savedRole.dashboardViews.filter((id) => DASHBOARD_VIEWS.some(([viewId]) => viewId === id))
        : role.dashboardViews,
      permissions: refreshBuiltInRoles ? role.permissions : Object.fromEntries(ACCESS_MODULES.map(([module]) => [
        module,
        Array.isArray(savedRole.permissions?.[module])
          ? savedRole.permissions[module].filter((permission) => PERMISSION_TYPES.includes(permission))
          : role.permissions[module]
      ]))
    } : role;
  }).concat(customRoles);
  const users = (Array.isArray(savedAccess.users) ? savedAccess.users : defaultAccess.users).map((user) => ({
    ...user,
    roles: [...new Set((Array.isArray(user.roles) ? user.roles : []).map((roleId) => roleId === "super-administrator"
      ? "president-executive-director" : roleId).filter((roleId) => roleIds.has(roleId)))]
  }));
  const savedDemoRoleId = savedAccess.demoRoleId || defaultAccess.demoRoleId;
  parsed.accessControl = {
    roleSchemaVersion: RBAC_SCHEMA_VERSION,
    roles,
    users,
    demoUserId: users.some((user) => user.id === savedAccess.demoUserId) ? savedAccess.demoUserId : defaultAccess.demoUserId,
    demoRoleId: savedDemoRoleId === "assigned-user" || roles.some((role) => role.id === savedDemoRoleId && role.active)
      ? savedDemoRoleId : "assigned-user",
    auditLog: Array.isArray(savedAccess.auditLog) ? savedAccess.auditLog.slice(-1000) : []
  };
  parsed.maintenance = parsed.maintenance.map((item) => ({ ...item, messages: Array.isArray(item.messages) ? item.messages : [] }));
  parsed.notificationSettings = {
    ...makeSeedState().notificationSettings,
    ...(parsed.notificationSettings || {})
  };
  parsed.units = parsed.units.map((unit) => {
    const recurringCharges = Array.isArray(unit.recurringCharges)
      ? unit.recurringCharges.map((charge, index) => ({
        id: charge.id || `REC-${unit.id}-${index + 1}`,
        name: String(charge.name || ""),
        amount: Number(charge.amount) || 0
      }))
      : [];
    const rentCharge = parsed.charges.find((charge) => charge.unitId === unit.id && charge.resident === unit.resident)
      || parsed.charges.find((charge) => charge.unitId === unit.id);
    const savedRent = Number(unit.monthlyRent);
    return {
      ...unit,
      propertyId: String(unit.propertyId || "disiplina-village"),
      building: Math.max(1, Number(unit.building) || Math.ceil(Number(unit.id) / UNITS_PER_BUILDING)),
      unitNumber: String(unit.unitNumber || unitNumberForIndex((unit.id - 1) % UNITS_PER_BUILDING)),
      contact: {
        address: unit.contact?.address || "",
        phone: unit.contact?.phone || "",
        email: unit.contact?.email || ""
      },
      occupation: unit.occupation || "",
      monthlyRent: Number.isFinite(savedRent) && savedRent > 0
        ? savedRent
        : Math.max(0, Number(rentCharge?.amount || 0) - recurringCharges.reduce((sum, charge) => sum + charge.amount, 0)),
      recurringCharges,
      householdMembers: Array.isArray(unit.householdMembers) ? unit.householdMembers.map((member, index) => ({
        id: member.id || `MEM-${unit.id}-${index + 1}`,
        name: String(member.name || ""),
        occupation: String(member.occupation || ""),
        pets: {
          hasPets: Boolean(member.pets?.hasPets),
          count: Math.max(0, Number(member.pets?.count) || (member.pets?.hasPets ? 1 : 0)),
          types: Array.isArray(member.pets?.types) ? member.pets.types : [],
          otherDetails: String(member.pets?.otherDetails || "")
        }
      })) : [],
      pets: {
        hasPets: Boolean(unit.pets?.hasPets),
        count: Math.max(0, Number(unit.pets?.count) || (unit.pets?.hasPets ? (unit.pets?.types?.length || 1) : 0)),
        types: Array.isArray(unit.pets?.types) ? unit.pets.types : [],
        otherDetails: unit.pets?.otherDetails || ""
      }
    };
  });
  if (JSON.stringify(parsed) !== saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  }
  return parsed;
}

let state = loadState();

function persist(nextState, action = `Updated ${pageTitles[currentPage] || "application"} data`) {
  const activeRoles = currentDemoRoles();
  const auditEntry = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actor: `${activeRoles.map((role) => role.name).join(" + ") || "No active role"} (demo)`,
    action,
    module: currentPage,
    timestamp: new Date().toISOString()
  };
  nextState.accessControl = {
    ...(nextState.accessControl || state.accessControl),
    auditLog: [...(nextState.accessControl?.auditLog || state.accessControl.auditLog), auditEntry].slice(-1000)
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch (error) {
    showToast(`Could not save changes in this browser: ${error.message}`, true);
    throw error;
  }
  state = nextState;
  render();
}

function recordAudit(action, module = currentPage) {
  const activeRoles = currentDemoRoles();
  const entry = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actor: `${activeRoles.map((role) => role.name).join(" + ") || "No active role"} (demo)`,
    action,
    module,
    timestamp: new Date().toISOString()
  };
  const accessControl = { ...state.accessControl, auditLog: [...state.accessControl.auditLog, entry].slice(-1000) };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, accessControl }));
  } catch (error) {
    showToast(`Could not save this audit event in the browser: ${error.message}`, true);
    throw error;
  }
  state = { ...state, accessControl };
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function money(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}

function shortDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function unitLabel(unitId) {
  const unit = state.units.find((item) => item.id === Number(unitId));
  if (!unit) return "Unknown unit";
  const property = state.properties.find((item) => item.id === (unit.propertyId || "disiplina-village"));
  const label = `B${String(unit.building).padStart(2, "0")} · ${unit.unitNumber}`;
  return property && property.id !== "disiplina-village" ? `${property.name} · ${label}` : label;
}

function activeTenantCharge(unit) {
  if (!unit) return null;
  return state.charges.find((charge) => charge.unitId === unit.id
    && charge.resident === unit.resident
    && (!charge.tenantId || !unit.tenantId || charge.tenantId === unit.tenantId)) || null;
}

function showToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("toast-error", isError);
  toast.classList.add("toast-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("toast-visible"), 3600);
}

function setPage(page) {
  if (!pageTitles[page]) return;
  const module = pageModule(page);
  if (page !== "my-settings" && (!module || !hasPermission(module, "view"))) {
    showToast(`Your ${currentDemoRole()?.name || "current role"} does not have permission to view ${pageTitles[page]}.`, true);
    return;
  }
  currentPage = page;
  unitPage = 0;
  recordAudit(`Viewed ${pageTitles[page]}`, page);
  render();
  document.getElementById("sidebar").classList.remove("sidebar-open");
  const profileMenu = document.getElementById("profile-menu");
  if (profileMenu) profileMenu.hidden = true;
  document.getElementById("profile-menu-toggle")?.setAttribute("aria-expanded", "false");
}

function findUniversalResults(query) {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  const results = [];
  const add = (title, meta, page, options = {}) => {
    if (`${title} ${meta}`.toLowerCase().includes(needle)) results.push({ title, meta, page, ...options });
  };
  state.properties.forEach((property) => {
    const association = property.type === "hoa";
    add(property.name, `${propertyTypeName(property.type)} ${property.address}`, association ? "associations" : "property-detail", {
      propertyId: property.id,
      dashboard: association ? "" : "property",
      environment: association ? "association" : "property-management"
    });
  });
  if (hasPermission("payment-methods", "view")) state.properties.forEach((property) => {
    const methods = (property.paymentMethods || []).map((method) => `${method.label} ${method.institution} ${method.accountName} ${method.accountNumber} ${method.instructions}`).join(" ");
    add(`${property.name} · payment instructions`, methods, "overview", { propertyId: property.id, dashboard: "property" });
  });
  if (hasPermission("units", "view")) state.units.forEach((unit) => {
    const residentData = hasPermission("resident-data", "view")
      ? `${unit.contact?.address || ""} ${unit.contact?.phone || ""} ${unit.contact?.email || ""}` : "";
    const household = (unit.householdMembers || []).map((member) => `${member.name || ""} ${member.occupation || ""} ${(member.pets?.types || []).join(" ")}`).join(" ");
    const pets = `${(unit.pets?.types || []).join(" ")} ${unit.pets?.otherDetails || ""}`;
    add(`${unit.resident || "Vacant"} · ${unitLabel(unit.id)}`, `${unit.status} ${unit.occupation || ""} ${household} ${pets} ${residentData}`, "units", { query });
  });
  if (hasPermission("finance", "view")) state.charges.forEach((charge) => add(`${charge.resident} · ${unitLabel(charge.unitId)}`, `${charge.status} ${money(charge.balance)} rent balance`, "rent", { query }));
  if (hasPermission("maintenance", "view")) state.maintenance.forEach((item) => add(`${item.id} · ${item.category}`, `${unitLabel(item.unitId)} ${item.status} ${item.description} ${(item.messages || []).map((message) => message.text).join(" ")}`, "maintenance"));
  if (hasPermission("incidents", "view")) state.violations.forEach((item) => add(`${item.id} · ${item.category}`, `${unitLabel(item.unitId)} ${item.status} ${item.description}`, "violations"));
  if (hasPermission("reports", "view")) reportCatalog.forEach((report) => add(report.name, `${report.group} report ${report.available ? "" : "(source data not tracked)"}`, "reports", { reportId: report.id }));
  if (hasPermission("settings", "view")) state.propertyGroups.forEach((group) => add(group.name, `Property group ${group.description}`, "overview", { dashboard: "property" }));
  if (hasPermission("settings", "view")) GENERAL_SETTING_CATEGORIES.forEach(([id, name]) => add(name, state.generalSettings?.[id]?.notes || "", "settings"));
  if (hasPermission("documents", "view")) state.properties.forEach((property) => {
    const text = PROPERTY_PROFILE_GROUPS.flatMap(([, , fields]) => fields.map(([key]) => property.profile?.[key] || "")).join(" ");
    add(`${property.name} · property profile`, text, "overview", { propertyId: property.id, dashboard: "property" });
  });
  if (hasPermission("users", "view")) state.accessControl.users.forEach((user) => add(user.name, `${user.email} ${user.department} ${user.roles.map(roleName).join(" ")}`, "access"));
  if (hasPermission("users", "view")) state.accessControl.roles.forEach((role) => add(role.name, "User role and access policy", "access"));
  if (hasPermission("users", "view")) state.teamContacts.forEach((contact) => add(contact.name, `${contact.role} ${contact.phone} ${contact.email}`, "access"));
  if (hasPermission("finance", "view")) state.payments.forEach((payment) => add(`${payment.id} · ${payment.resident}`, `${unitLabel(payment.unitId)} ${payment.reference} ${payment.method} ${money(payment.amount)}`, "rent", { receiptId: payment.id }));
  if (hasPermission("community", "view")) state.spaceReservations.forEach((request) => add(`${request.id} · ${request.resident}`, `${request.space} ${request.date} ${request.purpose} ${request.status}`, "spaces"));
  if (hasPermission("community", "view")) state.communityAnnouncements.forEach((item) => add(item.title || "Community notice", JSON.stringify(item), "notifications"));
  if (hasPermission("incidents", "view")) state.violationCatalog.forEach((item) => add(item.title, `${item.category} ${item.description}`, "violations"));
  return results.slice(0, 15);
}

function renderUniversalSearchResults(query) {
  const box = document.getElementById("universal-search-results");
  if (!box) return;
  const results = findUniversalResults(query);
  box.hidden = !query.trim();
  box.innerHTML = query.trim().length < 2
    ? `<div class="universal-search-empty">Type at least 2 characters to search records you can access.</div>`
    : results.length ? results.map((item, index) => `<button class="universal-search-result" data-search-result="${index}" data-search-page="${escapeHtml(item.page)}" data-search-query="${escapeHtml(item.query || "")}" data-search-property="${escapeHtml(item.propertyId || "")}" data-search-dashboard="${escapeHtml(item.dashboard || "")}" data-search-report="${escapeHtml(item.reportId || "")}"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.meta)}</small></button>`).join("")
      : `<div class="universal-search-empty">No matching records found.</div>`;
}

function render() {
  applyPersonalAppearance();
  renderNavigationShell();
  const currentModule = pageModule(currentPage);
  if (currentModule && !hasPermission(currentModule, "view")) {
    currentPage = environmentNavigation().find(([page]) => hasPermission(pageModule(page), "view"))?.[0] || "no-access";
    renderNavigationShell();
  }
  document.getElementById("page-title").textContent = pageTitles[currentPage];
  const buildingTotal = buildingCount();
  const activeProperty = state.properties.find((property) => property.id === selectedPropertyId) || state.properties[0];
  document.querySelectorAll(".property-name").forEach((element) => { element.textContent = activeProperty?.name || "Sit with Haven"; });
  document.querySelectorAll(".property-count").forEach((element) => {
    element.textContent = activeProperty?.id === "disiplina-village"
      ? `${buildingTotal} buildings · ${state.units.length} units · capacity ${MAX_BUILDINGS}`
      : `${activeProperty?.profile?.numberOfUnits ? `${activeProperty.profile.numberOfUnits} profiled units` : "No operating units"} · data not linked`;
  });
  document.querySelectorAll(".nav-link").forEach((button) => {
    const module = pageModule(button.dataset.page);
    button.hidden = !module || !hasPermission(module, "view");
  });
  const roleSelect = document.getElementById("demo-role-switch");
  if (roleSelect) {
    roleSelect.innerHTML = `<option value="assigned-user" ${state.accessControl.demoRoleId === "assigned-user" ? "selected" : ""}>Use assigned user roles</option>${state.accessControl.roles.filter((role) => role.active)
      .map((role) => `<option value="${escapeHtml(role.id)}" ${state.accessControl.demoRoleId === role.id ? "selected" : ""}>Preview: ${escapeHtml(role.name)}</option>`).join("")}`;
  }
  const userSelect = document.getElementById("demo-user-switch");
  if (userSelect) {
    userSelect.innerHTML = state.accessControl.users.filter((user) => user.status === "Active")
      .map((user) => `<option value="${escapeHtml(user.id)}" ${state.accessControl.demoUserId === user.id ? "selected" : ""}>${escapeHtml(user.name)} · ${escapeHtml(user.roles.map(roleName).join(", "))}</option>`).join("");
  }
  const user = currentDemoUser();
  const profileSettings = currentUserSettings(user);
  const displayName = [profileSettings.firstName, profileSettings.lastName].filter(Boolean).join(" ") || user?.name || "User";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const photoUrl = isValidProfilePhotoUrl(profileSettings.profilePhoto)
    ? profileSettings.profilePhoto || "" : "";
  const activeRoleLabel = currentDemoRoles().map((role) => role.name).join(" + ") || "No active role";
  document.getElementById("active-role-label").textContent = activeRoleLabel;
  document.getElementById("profile-display-name").textContent = displayName;
  document.getElementById("profile-menu-name").textContent = displayName;
  document.getElementById("profile-menu-role").textContent = activeRoleLabel;
  document.getElementById("profile-avatar").innerHTML = photoUrl
    ? `<img src="${escapeHtml(photoUrl)}" alt="">`
    : escapeHtml(initials);
  document.getElementById("general-settings-menu-item").hidden = !hasPermission("settings", "manage");

  const pages = {
    overview: renderOverview,
    properties: renderPropertyPortfolio,
    "property-detail": renderPropertyDashboard,
    tenants: renderTenants,
    leases: renderLeases,
    calendar: () => renderCalendar("property-management"),
    units: renderUnits,
    rent: renderRent,
    maintenance: renderMaintenance,
    violations: renderViolations,
    reports: renderReports,
    "my-settings": renderMySettings,
    settings: renderGeneralSettings,
    access: renderAccessControl,
    notifications: renderNotifications,
    spaces: renderSpaceRequests,
    portal: renderPortal,
    "association-dashboard": renderAssociationDashboard,
    associations: renderAssociations,
    homeowners: renderAssociationHomeowners,
    board: renderAssociationBoards,
    "arc-requests": renderArcRequests,
    assessments: renderAssessments,
    "association-violations": renderAssociationViolations,
    "association-maintenance": renderAssociationMaintenance,
    "association-communications": renderNotifications,
    "association-reports": renderAssociationReports,
    "association-calendar": () => renderCalendar("association"),
    "association-settings": renderGeneralSettings,
    "no-access": () => `<div class="empty-state">Your current role has no accessible pages in this business environment. Switch to an environment you are permitted to use or contact an administrator.</div>`
  };
  app.innerHTML = (pages[currentPage] || renderOverview)();
}

function card(label, value, note, icon, tone = "") {
  return `<article class="metric-card ${tone}">
    <div class="metric-top"><span>${escapeHtml(label)}</span><span class="metric-icon">${escapeHtml(icon)}</span></div>
    <strong class="metric-value">${escapeHtml(value)}</strong>
    <span class="metric-note">${escapeHtml(note)}</span>
  </article>`;
}

function renderOverview() {
  const allowedDashboardViews = availableDashboardViews();
  if (!allowedDashboardViews.some(([id]) => id === dashboardView)) {
    dashboardView = allowedDashboardViews[0]?.[0] || "association";
  }
  const switcher = dashboardSwitcherMarkup();
  if (dashboardView === "tenant") return `${switcher}${renderPortal(true)}`;
  if (dashboardView === "homeowner") return `${switcher}${renderHomeownerDashboard()}`;
  if (dashboardView === "property") return `${switcher}${renderPropertyDashboard()}`;

  const occupied = state.units.filter((unit) => unit.status === "Occupied").length;
  const paidCount = state.charges.filter((charge) => charge.status === "Paid").length;
  const billed = state.charges.reduce((total, charge) => total + charge.amount, 0);
  const outstanding = state.charges.reduce((total, charge) => total + charge.balance, 0);
  const paidAmount = billed - outstanding;
  const collectionRate = billed ? Math.round((paidAmount / billed) * 100) : 0;
  const activeWork = state.maintenance.filter((item) => item.status !== "Complete").length;
  const openViolations = state.violations.filter((item) => item.status !== "Resolved").length;
  const overdue = state.charges.filter((charge) => charge.status === "Overdue").slice(0, 5);
  const latestWork = [...state.maintenance].filter((item) => item.status !== "Complete").slice(0, 4);
  const widgets = selectedDashboardWidgets();
  const properties = (state.properties || []).filter((property) => property.type !== "hoa");
  const activeProperty = properties.find((property) => property.id === "disiplina-village") || properties[0];
  const hasUnitsAccess = hasPermission("units", "view");
  const hasFinanceAccess = hasPermission("finance", "view");
  const hasMaintenanceAccess = hasPermission("maintenance", "view");
  const metrics = [
    widgets.has("property-metrics") && hasUnitsAccess
      ? `<section class="metrics-grid">${card("Total units", String(state.units.length), `${buildingCount()} buildings · 36 units each`, "U")}${card("Occupied units", `${occupied} / ${state.units.length}`, `${Math.round((occupied / state.units.length) * 100)}% occupancy`, "↗", "metric-green")}</section>`
      : "",
    widgets.has("financial-summary") && hasFinanceAccess
      ? `<section class="metrics-grid compact-metrics">${card("Rent collected", `${collectionRate}%`, `${money(paidAmount)} collected this month`, "₱", "metric-blue")}${card("Outstanding balance", money(outstanding), `${state.charges.filter((charge) => charge.balance > 0).length} residents with a balance`, "!", "metric-amber")}</section>`
      : ""
  ].join("");
  const dashboardPanels = [
    widgets.has("rent-collection") && hasFinanceAccess ? `<article class="panel collection-panel">
      <div class="panel-heading"><div><h2>Rent collection</h2><p>Current month · ${paidCount} of ${state.charges.length} occupied units paid</p></div><button class="text-button" data-page="rent">View ledger <span>→</span></button></div>
      <div class="collection-total"><strong>${money(paidAmount)}</strong><span>of ${money(billed)} billed</span></div>
      <div class="progress-track"><span style="width:${collectionRate}%"></span></div>
      <div class="progress-labels"><span>${collectionRate}% collected</span><span>${money(outstanding)} remaining</span></div>
      <div class="mini-stats"><div><span class="status-dot dot-green"></span><strong>${paidCount}</strong><small>Paid</small></div><div><span class="status-dot dot-amber"></span><strong>${state.charges.filter((charge) => charge.status === "Due").length}</strong><small>Due</small></div><div><span class="status-dot dot-red"></span><strong>${state.charges.filter((charge) => charge.status === "Overdue").length}</strong><small>Overdue</small></div></div>
    </article>` : "",
    widgets.has("operations") && hasUnitsAccess ? `<article class="panel">
      <div class="panel-heading"><div><h2>Operations</h2><p>Items that may need attention</p></div></div>
      ${hasMaintenanceAccess ? `<button class="attention-row" data-page="maintenance"><span class="attention-icon attention-blue">M</span><span><strong>Maintenance requests</strong><small>Open or in progress</small></span><b>${activeWork}</b></button>` : ""}
      ${hasPermission("incidents", "view") ? `<button class="attention-row" data-page="violations"><span class="attention-icon attention-amber">V</span><span><strong>Open violations</strong><small>Need follow-up</small></span><b>${openViolations}</b></button>` : ""}
      <button class="attention-row" data-page="units"><span class="attention-icon attention-green">U</span><span><strong>Vacant units</strong><small>Available for leasing</small></span><b>${state.units.length - occupied}</b></button>
    </article>` : "",
    widgets.has("overdue-rent") && hasFinanceAccess ? `<article class="panel table-panel">
      <div class="panel-heading"><div><h2>Overdue rent</h2><p>Residents with outstanding rent</p></div><button class="text-button" data-page="rent">See all <span>→</span></button></div>
      ${overdue.length ? `<div class="table-wrap"><table><thead><tr><th>Resident / unit</th><th>Due date</th><th>Balance</th><th>Status</th></tr></thead><tbody>${overdue.map((charge) => `<tr><td><strong>${escapeHtml(charge.resident)}</strong><small>${escapeHtml(unitLabel(charge.unitId))}</small></td><td>${shortDate(charge.dueDate)}</td><td class="amount">${money(charge.balance)}</td><td><span class="badge badge-red">Overdue</span></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No overdue balances. Nice work!</div>`}
    </article>` : "",
    widgets.has("maintenance-queue") && hasMaintenanceAccess ? `<article class="panel">
      <div class="panel-heading"><div><h2>Maintenance queue</h2><p>Latest active work orders</p></div><button class="text-button" data-page="maintenance">View queue <span>→</span></button></div>
      <div class="compact-list">${latestWork.length ? latestWork.map((item) => `<div class="compact-item"><span class="list-icon">M</span><span class="compact-copy"><strong>${escapeHtml(item.category)} · ${escapeHtml(unitLabel(item.unitId))}</strong><small>${escapeHtml(item.description)}</small></span><span class="badge ${statusClass(item.status)}">${escapeHtml(item.status)}</span></div>`).join("") : `<div class="empty-state">No active maintenance requests.</div>`}</div>
    </article>` : "",
    widgets.has("property-portfolio") && hasPermission("properties", "view") ? `<article class="panel property-portfolio-panel">
      <div class="panel-heading"><div><h2>Property portfolio</h2><p>Commercial, single-family, and multifamily properties</p></div>${hasPermission("properties", "create") ? `<button class="button button-outline button-small" data-action="new-property">＋ Add property</button>` : ""}<button class="button button-outline button-small" data-page="properties">View portfolio</button></div>
      <div class="property-portfolio-list">${properties.filter((property) => property.type !== "hoa").map((property) => {
        const metrics = propertyUnitMetrics(property.id);
        const scope = metrics.units.length
          ? `${buildingCount(metrics.units)} buildings · ${metrics.units.length} units` : "No units added yet";
        return `<div class="property-portfolio-item"><span class="property-type-badge">${escapeHtml(propertyTypeName(property.type))}</span><div><strong>${escapeHtml(property.name)}</strong><small>${escapeHtml(property.address || "Address not provided")} · ${escapeHtml(scope)}</small></div><button class="table-action" data-action="view-property" data-property-id="${escapeHtml(property.id)}">Open</button></div>`;
      }).join("")}</div>
      <p class="table-footnote">Each property has its own unit records and operations are linked by the unit's property.</p>
    </article>` : ""
  ].filter(Boolean);

  return `${switcher}<section class="page-heading">
    <div><p class="eyebrow">PROPERTY SNAPSHOT</p><h1>Good day, Alex</h1><p class="subheading">${escapeHtml(activeProperty?.name || "Your property portfolio")} · ${escapeHtml(propertyTypeName(activeProperty?.type))}</p></div>
    <button class="button button-outline" data-action="export">Export data</button>
  </section>
  ${metrics}
  ${dashboardPanels.length ? `<section class="overview-grid">${dashboardPanels.join("")}</section>` : `<div class="empty-state">No dashboard widgets are assigned to your role. Ask the President / Executive Director to configure your dashboard.</div>`}`;
}

function renderPropertyPortfolio() {
  const search = (document.getElementById("property-search")?.value ?? propertyPortfolioFilters.search).trim().toLowerCase();
  const typeFilter = document.getElementById("portfolio-type")?.value || propertyPortfolioFilters.type;
  const statusFilter = document.getElementById("portfolio-status")?.value || propertyPortfolioFilters.status;
  const ownerFilter = document.getElementById("portfolio-owner")?.value || propertyPortfolioFilters.owner;
  const regionFilter = document.getElementById("portfolio-region")?.value || propertyPortfolioFilters.region;
  const groupFilter = document.getElementById("portfolio-group")?.value || propertyPortfolioFilters.group;
  const managerFilter = document.getElementById("portfolio-manager")?.value || propertyPortfolioFilters.manager;
  const properties = state.properties.filter((property) => property.type !== "hoa");
  const ownerNames = [...new Set(properties.map((property) => property.profile?.ownerName).filter(Boolean))];
  const regions = [...new Set(properties.map((property) => property.profile?.city || property.address.split(",").slice(-1)[0].trim()).filter(Boolean))];
  const managers = [...new Set(properties.map((property) => property.profile?.propertyManager).filter(Boolean))];
  const filtered = properties.filter((property) => {
    const status = property.profile?.status || "Active";
    const region = property.profile?.city || property.address.split(",").slice(-1)[0].trim();
    const groups = state.propertyGroups.filter((group) => group.propertyIds.includes(property.id));
    return (!search || `${property.name} ${property.id} ${property.profile?.propertyCode || ""} ${property.address} ${property.profile?.ownerName || ""} ${property.type}`.toLowerCase().includes(search))
      && (typeFilter === "all" || property.type === typeFilter)
      && (statusFilter === "all" || status === statusFilter)
      && (ownerFilter === "all" || property.profile?.ownerName === ownerFilter)
      && (regionFilter === "all" || region === regionFilter)
      && (groupFilter === "all" || groups.some((group) => group.id === groupFilter))
      && (managerFilter === "all" || (managerFilter === "__unassigned" ? !property.profile?.propertyManager : property.profile?.propertyManager === managerFilter));
  });
  const portfolioUnits = properties.flatMap((property) => unitsForProperty(property.id));
  const portfolioUnitIds = new Set(portfolioUnits.map((unit) => unit.id));
  const occupied = portfolioUnits.filter((unit) => unit.status === "Occupied").length;
  const unitCount = portfolioUnits.length;
  const revenue = state.charges.filter((charge) => portfolioUnitIds.has(charge.unitId)).reduce((sum, charge) => sum + charge.amount, 0);
  const openWorkOrders = state.maintenance.filter((item) => portfolioUnitIds.has(item.unitId) && item.status !== "Complete").length;
  const canCreate = hasPermission("properties", "create");
  const propertyContent = propertyPortfolioView === "table"
    ? `<div class="table-wrap"><table><thead><tr><th>Property</th><th>Type</th><th>Address</th><th>Owner</th><th>Units</th><th>Occupancy</th><th>Revenue</th><th>Status</th><th></th></tr></thead><tbody>${filtered.map((property) => {
      const propertyMetrics = propertyUnitMetrics(property.id);
      const tracked = propertyMetrics.units.length > 0;
      const occupiedUnits = propertyMetrics.occupied;
      const totalUnits = propertyMetrics.units.length;
      const propertyRevenue = propertyMetrics.charges.reduce((sum, charge) => sum + charge.amount, 0);
      return `<tr><td><strong>${escapeHtml(property.name)}</strong><small>${escapeHtml(property.profile?.propertyCode || property.id)}</small></td><td>${escapeHtml(propertyTypeName(property.type))}</td><td>${escapeHtml(property.address || "Not recorded")}</td><td>${escapeHtml(hasPermission("finance", "view") ? property.profile?.ownerName || "Not recorded" : "Restricted")}</td><td>${tracked ? totalUnits : "Not linked"}</td><td>${tracked ? `${totalUnits ? Math.round(occupiedUnits / totalUnits * 100) : 0}%` : "Not linked"}</td><td>${tracked ? money(propertyRevenue) : "Not linked"}</td><td><span class="badge ${property.profile?.status === "Inactive" ? "badge-gray" : "badge-green"}">${escapeHtml(property.profile?.status || "Active")}</span></td><td><button class="table-action" data-action="view-property" data-property-id="${escapeHtml(property.id)}">Open</button>${hasPermission("properties", "edit") ? `<button class="table-action" data-action="edit-property-details" data-property-id="${escapeHtml(property.id)}">Edit</button><button class="table-action" data-action="archive-property" data-property-id="${escapeHtml(property.id)}">${property.profile?.status === "Inactive" ? "Restore" : "Archive"}</button>` : ""}</td></tr>`;
    }).join("")}</tbody></table></div>`
    : `<div class="property-card-grid">${filtered.map((property) => {
      const propertyMetrics = propertyUnitMetrics(property.id);
      const tracked = propertyMetrics.units.length > 0;
      const propertyRevenue = propertyMetrics.charges.reduce((sum, charge) => sum + charge.amount, 0);
      const propertyOpenWork = propertyMetrics.maintenance.filter((item) => item.status !== "Complete").length;
      return `<article class="panel property-portfolio-card"><div class="property-card-top"><span class="property-type-badge">${escapeHtml(propertyTypeName(property.type))}</span><span class="badge ${property.profile?.status === "Inactive" ? "badge-gray" : "badge-green"}">${escapeHtml(property.profile?.status || "Active")}</span></div><h2>${escapeHtml(property.name)}</h2><p>${escapeHtml(property.address || "Address not recorded")}</p><dl class="profile-details"><div><dt>Owner</dt><dd>${escapeHtml(hasPermission("finance", "view") ? property.profile?.ownerName || "Not recorded" : "Restricted")}</dd></div><div><dt>Units / occupancy</dt><dd>${tracked ? `${propertyMetrics.units.length} / ${Math.round(propertyMetrics.occupied / propertyMetrics.units.length * 100)}%` : "No units yet"}</dd></div><div><dt>Revenue</dt><dd>${tracked ? money(propertyRevenue) : "Not tracked"}</dd></div><div><dt>Open work orders</dt><dd>${tracked ? propertyOpenWork : "Not tracked"}</dd></div></dl><div class="heading-actions"><button class="button button-primary button-small" data-action="view-property" data-property-id="${escapeHtml(property.id)}">Open property</button>${hasPermission("properties", "edit") ? `<button class="button button-outline button-small" data-action="edit-property-details" data-property-id="${escapeHtml(property.id)}">Edit</button><button class="button button-outline button-small" data-action="archive-property" data-property-id="${escapeHtml(property.id)}">${property.profile?.status === "Inactive" ? "Restore" : "Archive"}</button>` : ""}</div></article>`;
    }).join("") || `<div class="empty-state">No properties match the selected filters.</div>`}</div>`;
  return `<section class="page-heading"><div><p class="eyebrow">PROPERTY MANAGEMENT · PORTFOLIO</p><h1>Properties</h1><p class="subheading">Portfolio-wide performance for rental and commercial properties. HOA records are managed in the separate Association Management environment.</p></div><div class="heading-actions">${canManageBulkRent() ? `<button class="button button-outline" data-action="bulk-rent-edit">Bulk rent update</button>` : ""}${hasPermission("properties", "export") ? `<button class="button button-outline" data-action="export-property-portfolio">Export data</button>` : ""}${canCreate ? `<button class="button button-outline" data-action="import-property" disabled title="Import is not connected">Import property</button><button class="button button-primary" data-action="new-property">＋ Manually add property</button>` : ""}</div></section>
  <section class="metrics-grid">${card("Properties", String(properties.length), "Rental and commercial profiles", "P")}${card("Units", unitCount ? String(unitCount) : "Not tracked", "Only linked operating records", "U")}${card("Occupancy", unitCount ? `${Math.round(occupied / unitCount * 100)}%` : "Not tracked", "From linked unit records", "↗", "metric-green")}${card("Revenue", unitCount ? money(revenue) : "Not tracked", "Current ledger records only", "₱", "metric-blue")}${card("Open work orders", unitCount ? String(openWorkOrders) : "Not tracked", "From linked maintenance records", "M", "metric-amber")}${card("Vacancies", unitCount ? String(unitCount - occupied) : "Not tracked", "From linked unit records", "○")}</section>
  <section class="panel directory-panel"><div class="filter-row"><label class="search-field"><span>⌕</span><input id="property-search" type="search" placeholder="Search property, owner, or address" value="${escapeHtml(search)}"></label><select id="portfolio-type" aria-label="Filter by property type"><option value="all">All property types</option>${PROPERTY_TYPES.filter(([id]) => id !== "hoa").map(([id, label]) => `<option value="${id}" ${typeFilter === id ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select><select id="portfolio-owner" aria-label="Filter by owner"><option value="all">All owners</option>${ownerNames.map((name) => `<option ${ownerFilter === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select><select id="portfolio-region" aria-label="Filter by region"><option value="all">All regions</option>${regions.map((name) => `<option ${regionFilter === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select><select id="portfolio-status" aria-label="Filter by property status"><option value="all">All statuses</option><option ${statusFilter === "Active" ? "selected" : ""}>Active</option><option ${statusFilter === "Inactive" ? "selected" : ""}>Inactive</option></select><select id="portfolio-group" aria-label="Filter by portfolio"><option value="all">All portfolios</option>${state.propertyGroups.map((group) => `<option value="${escapeHtml(group.id)}" ${groupFilter === group.id ? "selected" : ""}>${escapeHtml(group.name)}</option>`).join("")}</select><select id="portfolio-manager" aria-label="Filter by property manager"><option value="all">All managers</option>${managers.map((name) => `<option ${managerFilter === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}<option value="__unassigned">Unassigned</option></select><div class="view-toggle" role="group" aria-label="Property display"><button class="tab-button ${propertyPortfolioView === "grid" ? "tab-active" : ""}" data-action="property-view" data-view="grid">Grid</button><button class="tab-button ${propertyPortfolioView === "table" ? "tab-active" : ""}" data-action="property-view" data-view="table">Table</button><button class="tab-button" disabled title="Map integration is not configured">Map</button></div></div>${propertyContent}<p class="table-footnote">Unit counts, occupancy, rent, and work orders are calculated from each property's own linked unit records. Map view requires a geocoding/maps provider.</p></section>`;
}

function renderTenants() {
  const query = (document.getElementById("tenant-search")?.value || "").trim().toLowerCase();
  const residents = state.units.filter((unit) => unit.status === "Occupied" && unit.resident)
    .filter((unit) => !query || `${unit.resident} ${unit.tenantId || ""} ${unit.contact?.email || ""} ${unit.contact?.phone || ""} ${unitLabel(unit.id)}`.toLowerCase().includes(query));
  const balances = state.charges.filter((charge) => charge.balance > 0);
  const overdue = balances.filter((charge) => charge.status === "Overdue");
  const canEdit = hasPermission("tenants", "edit") || hasPermission("tenants", "create");
  const table = residents.map((unit) => {
    const charge = activeTenantCharge(unit);
    const balance = hasPermission("finance", "view") ? charge ? money(charge.balance) : "—" : "Restricted";
    const contact = hasPermission("resident-data", "view")
      ? [unit.contact?.phone, unit.contact?.email].filter(Boolean).join(" · ") || "Not recorded"
      : "Restricted";
    return `<tr><td><strong>${escapeHtml(unit.resident)}</strong><small>${escapeHtml(unit.tenantId || `TEN-${String(unit.id).padStart(4, "0")}`)}</small></td><td>${escapeHtml(unitLabel(unit.id))}<small>${escapeHtml(state.properties.find((property) => property.id === "disiplina-village")?.name || "Disiplina Village")}</small></td><td>${escapeHtml(contact)}</td><td>${escapeHtml(unit.leaseStatus || "Not tracked")}<small>${unit.leaseEnd ? `Ends ${shortDate(unit.leaseEnd)}` : "Lease dates not recorded"}</small></td><td>${unit.moveInDate ? shortDate(unit.moveInDate) : "Not recorded"}</td><td>${hasPermission("finance", "view") && charge ? money(charge.amount) : hasPermission("finance", "view") ? "—" : "Restricted"}<small>Balance: ${balance}</small></td><td>${escapeHtml(unit.portalStatus || "Not configured")}</td><td>${canEdit ? `<button class="table-action" data-action="tenant-form" data-unit-id="${unit.id}">Edit</button><button class="table-action" data-action="move-out" data-unit-id="${unit.id}">Move out</button>` : ""}<button class="table-action" data-action="payment" data-unit-id="${unit.id}" ${!charge || charge.balance <= 0 || !hasPermission("finance", "create") ? "disabled" : ""}>Collect</button><button class="table-action" data-action="portal-maintenance" data-unit-id="${unit.id}" ${!hasPermission("maintenance", "create") ? "disabled" : ""}>Work order</button></td></tr>`;
  }).join("");
  return `<section class="page-heading"><div><p class="eyebrow">PROPERTY MANAGEMENT · RESIDENT CRM</p><h1>Tenants</h1><p class="subheading">Resident and commercial-occupant account workspace, with linked unit, lease, payment, maintenance, and portal information.</p></div><div class="heading-actions">${canEdit ? `<button class="button button-outline" data-action="tenant-form">＋ Add / move in</button>` : ""}<button class="button button-primary" data-action="export" ${!hasPermission("tenants", "export") ? "disabled" : ""}>Export tenant data</button></div></section>
  <section class="metrics-grid">${card("Current tenants", String(residents.length), "Occupied units with a named resident", "T")}${card("Open balances", String(balances.length), "Current charges with outstanding amount", "₱", "metric-amber")}${card("Overdue accounts", String(overdue.length), "Past-due charges", "!", "metric-red")}${card("Portal enabled", "Not tracked", "Portal authentication is not connected", "P")}${card("Active leases", "Not tracked", "Lease records are not yet a source of truth", "L")}</section>
  <section class="workflow-strip"><button class="button button-outline" data-action="tenant-form" ${!canEdit ? "disabled" : ""}>Add tenant</button><button class="button button-outline" data-action="tenant-form" ${!canEdit ? "disabled" : ""}>Move in</button><button class="button button-outline" data-action="payment" ${!hasPermission("finance", "create") ? "disabled" : ""}>Collect payment</button><button class="button button-outline" data-action="new-charge" ${!hasPermission("finance", "create") ? "disabled" : ""}>Create charge</button><button class="button button-outline" data-action="new-announcement" ${!hasPermission("communications", "create") ? "disabled" : ""}>Send notice</button><button class="button button-outline" data-action="new-maintenance" ${!hasPermission("maintenance", "create") ? "disabled" : ""}>Create work order</button></section>
  <section class="panel directory-panel"><div class="panel-heading"><div><h2>Tenant accounts</h2><p>Contact details, balances, lease dates, and actions are gated by the current role.</p></div><label class="search-field"><span>⌕</span><input id="tenant-search" type="search" placeholder="Search tenant, ID, or unit" value="${escapeHtml(query)}"></label></div><div class="table-wrap"><table><thead><tr><th>Tenant / ID</th><th>Property / unit</th><th>Contact</th><th>Lease</th><th>Move-in</th><th>Rent / balance</th><th>Portal</th><th>Actions</th></tr></thead><tbody>${table || `<tr><td colspan="8"><div class="empty-state">${query ? "No tenants match this search." : "No tenants have been entered yet."}</div></td></tr>`}</tbody></table></div><p class="table-footnote">Lease history/documents, SMS/email history, portal login history, and move-out workflows need a dedicated lease/authentication backend. Unrecorded values are not estimated.</p></section>`;
}

function renderLeases() {
  const occupied = state.units.filter((unit) => unit.status === "Occupied" && unit.resident);
  const leases = occupied.filter((unit) => unit.leaseStatus && unit.leaseStatus !== "Not recorded");
  const history = state.tenantHistory || [];
  const rows = [...leases.map((unit) => ({ ...unit, history: false })), ...history.map((item) => ({ ...item, history: true }))];
  return `<section class="page-heading"><div><p class="eyebrow">PROPERTY MANAGEMENT · LEASING</p><h1>Leases</h1><p class="subheading">Lease lifecycle workspace for move-ins, renewals, expirations, and documents.</p></div><div class="heading-actions"><button class="button button-primary" data-page="tenants">Open tenant CRM</button></div></section>
  <section class="metrics-grid">${card("Recorded active leases", String(leases.length), "Entered current lease records", "L")}${card("Occupied without lease", String(occupied.length - leases.length), "Lease status not recorded", "!", "metric-amber")}${card("Lease history", String(history.length), "Move-outs preserved locally", "↗")}</section>
  <section class="panel directory-panel"><div class="panel-heading"><div><h2>Lease records and history</h2><p>Lease dates, renewal status, and move-out snapshots.</p></div></div>${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Tenant</th><th>Unit</th><th>Status</th><th>Start</th><th>End / move-out</th><th>Renewal</th><th></th></tr></thead><tbody>${rows.map((unit) => `<tr><td>${escapeHtml(unit.resident)}</td><td>${escapeHtml(unitLabel(unit.unitId || unit.id))}</td><td>${escapeHtml(unit.leaseStatus || (unit.history ? "Terminated" : "Not recorded"))}</td><td>${shortDate(unit.leaseStart)}</td><td>${shortDate(unit.moveOutDate || unit.leaseEnd)}</td><td>${escapeHtml(unit.renewalStatus || "Not recorded")}</td><td>${unit.history ? "History" : `<button class="table-action" data-action="tenant-form" data-unit-id="${unit.id}" ${!hasPermission("tenants", "edit") ? "disabled" : ""}>Edit lease</button>`}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No lease source records are available. Add or edit a tenant to enter lease dates and status.</div>`}<p class="table-footnote">Lease generation, signatures, and document storage are not connected. Move-out snapshots preserve the tenant and lease details locally.</p></section>`;
}

function renderAssociationDashboard() {
  const associations = state.properties.filter((property) => property.type === "hoa");
  const records = state.associationRecords;
  const openViolations = records.violations.filter((item) => item.status !== "Resolved").length;
  const openTasks = records.maintenance.filter((item) => item.status !== "Complete").length;
  return `<section class="page-heading"><div><p class="eyebrow">ASSOCIATION MANAGEMENT · HOA / COA</p><h1>Association Dashboard</h1><p class="subheading">A separate community-association workspace for boards, homeowners, assessments, compliance, and shared-property operations.</p></div><button class="button button-outline" data-page="associations">Manage associations</button></section>
  <section class="metrics-grid">${card("Associations", String(associations.length), "HOA profiles in this browser", "A")}${card("Homeowners", String(records.homeowners.length), "Association-owned records", "H")}${card("Assessments due", String(records.assessments.filter((item) => item.status !== "Paid").length), "Entered association assessments", "$", "metric-amber")}${card("Open violations", String(openViolations), "Association violations entered locally", "!", "metric-red")}${card("ARC requests", String(records.arcRequests.filter((item) => item.status === "Pending").length), "Pending architectural reviews", "R")}${card("Open tasks", String(openTasks), "Association maintenance tasks", "✓")}</section>
  <section class="overview-grid"><article class="panel"><div class="panel-heading"><div><h2>Association workflows</h2><p>Manage members, board terms, assessments, compliance, and common-area maintenance in this environment.</p></div></div><div class="workflow-strip"><button class="button button-outline" data-page="homeowners">Homeowners</button><button class="button button-outline" data-page="board">Board members</button><button class="button button-outline" data-page="assessments">Assessments</button><button class="button button-outline" data-page="arc-requests">ARC requests</button><button class="button button-outline" data-page="association-violations">Violations</button><button class="button button-outline" data-page="association-maintenance">Maintenance</button></div></article><article class="panel"><div class="panel-heading"><div><h2>Upcoming calendar</h2><p>Board, community, and compliance scheduling</p></div><button class="button button-outline button-small" data-page="association-calendar">Open calendar</button></div>${associationCalendarPreview()}</article></section>
  ${associations.length ? "" : `<div class="report-caveat"><strong>No association profiles yet.</strong> Create an HOA property profile in Association Management to begin organizing the association workspace.</div>`}`;
}

function renderAssociations() {
  const associations = state.properties.filter((property) => property.type === "hoa");
  return `<section class="page-heading"><div><p class="eyebrow">ASSOCIATION MANAGEMENT · DIRECTORY</p><h1>Associations</h1><p class="subheading">HOA and COA entities are kept separate from rental and commercial property portfolios.</p></div>${hasPermission("properties", "create") ? `<button class="button button-primary" data-action="new-property" data-property-type="hoa">＋ Add association</button>` : ""}</section>
  <section class="metrics-grid">${card("Associations", String(associations.length), "Registered HOA profiles", "A")}${card("Homeowners", String(state.associationRecords.homeowners.length), "Entered member records", "H")}${card("Board members", String(state.associationRecords.boards.length), "Current directory entries", "B")}</section>
  <section class="property-card-grid">${associations.map((property) => `<article class="panel property-portfolio-card"><div class="property-card-top"><span class="property-type-badge">HOA / COA</span><span class="badge badge-green">${escapeHtml(property.profile?.status || "Active")}</span></div><h2>${escapeHtml(property.name)}</h2><p>${escapeHtml(property.address || "Address not recorded")}</p><dl class="profile-details"><div><dt>Owner / association contact</dt><dd>${escapeHtml(property.profile?.ownerName || "Not recorded")}</dd></div><div><dt>Homeowners</dt><dd>${state.associationRecords.homeowners.filter((item) => item.associationId === property.id).length}</dd></div><div><dt>Assessments</dt><dd>${state.associationRecords.assessments.filter((item) => item.associationId === property.id).length}</dd></div></dl><div class="heading-actions"><button class="button button-outline button-small" data-action="edit-property-details" data-property-id="${escapeHtml(property.id)}">Edit profile</button><button class="button button-primary button-small" data-page="homeowners">Members</button></div></article>`).join("") || `<div class="empty-state">No HOA / COA profiles are registered. Use Add association to create an association record.</div>`}</section>`;
}

function renderAssociationHomeowners() {
  const homeowners = state.associationRecords.homeowners;
  return renderAssociationRecordPage("Homeowners", "HOMEOWNER ACCOUNT WORKSPACE", "Homeowner ownership records, balances, and communications are isolated to the selected association.", homeowners, "homeowner", [
    ["name", "Homeowner"], ["associationName", "Association"], ["unit", "Unit / address"], ["email", "Email"], ["phone", "Phone"], ["balance", "Account balance"]
  ], "homeowners");
}

function renderAssociationBoards() {
  const members = state.associationRecords.boards;
  return renderAssociationRecordPage("Board Members", "BOARD MANAGEMENT", "Track board positions, terms, and contact records. Meeting, voting, and document workflows require later integration.", members, "board", [
    ["name", "Member"], ["position", "Position"], ["associationName", "Association"], ["termStart", "Term start"], ["termEnd", "Term end"], ["email", "Email"]
  ], "boards");
}

function renderArcRequests() {
  const requests = state.associationRecords.arcRequests;
  return renderAssociationRecordPage("ARC Requests", "ARCHITECTURAL REVIEW", "Review paint, construction, landscaping, and other architectural requests with a recorded decision.", requests, "arc", [
    ["id", "Request"], ["associationName", "Association"], ["homeownerName", "Homeowner"], ["requestType", "Type"], ["submittedAt", "Submitted"], ["status", "Status"]
  ], "arc");
}

function renderAssessments() {
  const assessments = state.associationRecords.assessments;
  const due = assessments.filter((item) => item.status !== "Paid");
  const totalDue = due.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return `<section class="page-heading"><div><p class="eyebrow">ASSOCIATION MANAGEMENT · FINANCE</p><h1>Assessments</h1><p class="subheading">Association assessment schedules and collection status; kept separate from tenant rent.</p></div>${hasPermission("assessments", "create") ? `<button class="button button-primary" data-action="new-assessment">＋ Create assessment</button>` : ""}</section>
  <section class="metrics-grid">${card("Assessments", String(assessments.length), "Locally entered records", "$")}${card("Open", String(due.length), "Not marked paid", "!", "metric-amber")}${card("Amount due", money(totalDue), "Based on entered assessments", "₱", "metric-blue")}</section>${renderAssociationRecordTable(assessments, "assessment", [["name", "Assessment"], ["associationName", "Association"], ["amount", "Amount"], ["dueDate", "Due date"], ["status", "Status"]])}`;
}

function renderAssociationViolations() {
  const records = state.associationRecords.violations;
  return renderAssociationRecordPage("Violations", "COMMUNITY COMPLIANCE", "Track association rule violations, hearings, and resolution history separately from rental resident incidents.", records, "violation", [
    ["id", "Case"], ["associationName", "Association"], ["homeownerName", "Homeowner"], ["category", "Category"], ["description", "Details"], ["reportedAt", "Reported"], ["status", "Status"]
  ], "incidents");
}

function renderAssociationMaintenance() {
  const records = state.associationRecords.maintenance;
  return renderAssociationRecordPage("Maintenance", "COMMUNITY OPERATIONS", "Track common-area and association maintenance tasks separately from rental-property work orders.", records, "association-maintenance", [
    ["id", "Task"], ["associationName", "Association"], ["title", "Work item"], ["location", "Location"], ["description", "Details"], ["dueDate", "Due date"], ["status", "Status"]
  ], "maintenance");
}

function renderAssociationReports() {
  const records = state.associationRecords;
  const openViolations = records.violations.filter((item) => item.status !== "Resolved");
  const openTasks = records.maintenance.filter((item) => item.status !== "Complete");
  const dueAssessments = records.assessments.filter((item) => item.status !== "Paid");
  const rows = [
    ["Associations", state.properties.filter((item) => item.type === "hoa").length],
    ["Homeowners", records.homeowners.length],
    ["Board members", records.boards.length],
    ["Assessments due", dueAssessments.length],
    ["Assessment balance due", money(dueAssessments.reduce((sum, item) => sum + Number(item.amount || 0), 0))],
    ["Open ARC requests", records.arcRequests.filter((item) => item.status === "Pending").length],
    ["Open violations", openViolations.length],
    ["Open maintenance tasks", openTasks.length]
  ];
  return `<section class="page-heading"><div><p class="eyebrow">ASSOCIATION MANAGEMENT · REPORTING</p><h1>Association Reports</h1><p class="subheading">Summary of association-owned records only; rental-property financial and resident data are excluded.</p></div><button class="button button-outline" data-action="export" ${!hasPermission("reports", "export") ? "disabled" : ""}>Export summary</button></section>
  <section class="panel directory-panel"><div class="panel-heading"><div><h2>Association summary</h2><p>Calculated from this browser's association workspace records.</p></div></div><div class="table-wrap"><table><thead><tr><th>Measure</th><th>Value</th></tr></thead><tbody>${rows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderAssociationRecordPage(title, eyebrow, description, records, kind, columns, permissionModule) {
  const canCreate = hasPermission(permissionModule, "create");
  const addLabel = { homeowner: "homeowner", board: "board member", arc: "ARC request", violation: "violation", "association-maintenance": "maintenance task" }[kind] || "record";
  return `<section class="page-heading"><div><p class="eyebrow">ASSOCIATION MANAGEMENT · ${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p class="subheading">${escapeHtml(description)}</p></div>${canCreate ? `<button class="button button-primary" data-action="new-association-record" data-kind="${kind}">＋ Add ${addLabel}</button>` : ""}</section>
  <section class="metrics-grid">${card("Records", String(records.length), `${title} entered locally`, kind.slice(0, 1).toUpperCase())}${kind === "arc" ? card("Pending", String(records.filter((item) => item.status === "Pending").length), "Awaiting review", "!", "metric-amber") : card("Associations", String(state.properties.filter((property) => property.type === "hoa").length), "Available in this environment", "A")}</section>
  ${renderAssociationRecordTable(records, kind, columns)}`;
}

function renderAssociationRecordTable(records, kind, columns) {
  const module = associationRecordModule(kind);
  const canEdit = hasPermission(module, "edit");
  const sectionName = { homeowner: "Homeowner directory", board: "Board directory", arc: "Architectural requests", assessment: "Assessment ledger", violation: "Violation log", "association-maintenance": "Association work log" }[kind] || "Association records";
  const emptyName = { homeowner: "homeowners", board: "board members", arc: "ARC requests", assessment: "assessments", violation: "violations", "association-maintenance": "maintenance tasks" }[kind] || "records";
  return `<section class="panel directory-panel"><div class="panel-heading"><div><h2>${sectionName}</h2><p>Records are scoped to this browser's Association Management environment.</p></div></div>${records.length ? `<div class="table-wrap"><table><thead><tr>${columns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("")}${canEdit ? "<th>Actions</th>" : ""}</tr></thead><tbody>${records.map((record) => `<tr>${columns.map(([key]) => `<td>${escapeHtml(associationRecordCell(record, key))}</td>`).join("")}${canEdit ? `<td><button class="table-action" data-action="edit-association-record" data-kind="${kind}" data-record-id="${escapeHtml(record.id)}">Edit</button>${kind === "arc" && record.status === "Pending" ? `<button class="table-action" data-action="decide-arc" data-record-id="${escapeHtml(record.id)}" data-status="Approved">Approve</button><button class="table-action" data-action="decide-arc" data-record-id="${escapeHtml(record.id)}" data-status="Rejected">Reject</button>` : ""}</td>` : ""}</tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No ${emptyName} have been entered for this association workspace.</div>`}</section>`;
}

function associationRecordModule(kind) {
  return kind === "homeowner" ? "homeowners"
    : kind === "board" ? "boards"
      : kind === "arc" ? "arc"
        : kind === "violation" ? "incidents"
          : kind === "association-maintenance" ? "maintenance" : "assessments";
}

function associationRecordCell(record, key) {
  if (["email", "phone"].includes(key) && !hasPermission("resident-data", "view")) return "Restricted";
  if (key === "amount") return money(Number(record[key]) || 0);
  if (["termStart", "termEnd", "dueDate", "submittedAt", "reportedAt"].includes(key)) return shortDate(record[key]);
  return record[key] || "Not recorded";
}

function getCalendarEvents(environment) {
  const manual = state.calendarEvents.filter((item) => item.environment === environment);
  if (environment === "property-management") {
    const workOrders = state.maintenance.map((item) => ({
      id: item.id,
      title: `${item.category} work order`,
      date: item.dueDate || item.createdAt,
      type: "Maintenance",
      status: item.status,
      detail: `${unitLabel(item.unitId)} · ${item.description}`,
      source: "Work order"
    }));
    const leases = state.units.flatMap((unit) => [
      unit.leaseStart ? { id: `LEASE-START-${unit.id}`, title: `Move-in · ${unit.resident}`, date: unit.leaseStart, type: "Leasing", status: "Scheduled", detail: unitLabel(unit.id), source: "Tenant record" } : null,
      unit.leaseEnd ? { id: `LEASE-END-${unit.id}`, title: `Lease expiry · ${unit.resident}`, date: unit.leaseEnd, type: "Leasing", status: "Scheduled", detail: unitLabel(unit.id), source: "Tenant record" } : null
    ].filter(Boolean));
    return [...manual, ...workOrders, ...leases].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  }
  const violations = state.associationRecords.violations.map((item) => ({
    id: item.id,
    title: `${item.category} compliance follow-up`,
    date: item.hearingDate || item.reportedAt,
    type: "Compliance",
    status: item.status,
    detail: `${item.associationName} · ${item.homeownerName}`,
    source: "Violation record"
  }));
  const maintenance = state.associationRecords.maintenance.map((item) => ({
    id: item.id,
    title: item.title,
    date: item.dueDate,
    type: "Maintenance",
    status: item.status,
    detail: `${item.associationName} · ${item.location}`,
    source: "Association maintenance"
  }));
  return [...manual, ...violations, ...maintenance].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

function calendarDateRange(view) {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const to = new Date(from);
  if (view === "day") {
    return [localDateString(from), localDateString(to)];
  }
  if (view === "week") {
    const day = from.getDay();
    from.setDate(from.getDate() - day);
    to.setTime(from.getTime());
    to.setDate(to.getDate() + 6);
  } else if (view === "month") {
    from.setDate(1);
    to.setMonth(to.getMonth() + 1, 0);
  } else {
    return null;
  }
  return [localDateString(from), localDateString(to)];
}

function calendarEventRows(events) {
  return events.map((item) => `<article class="calendar-event"><div class="calendar-event-date"><strong>${escapeHtml(shortDate(item.date))}</strong><small>${escapeHtml(item.type)}</small></div><div class="calendar-event-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail || item.source || "")}</small></div><span class="badge ${statusClass(item.status)}">${escapeHtml(item.status || "Scheduled")}</span></article>`).join("");
}

function associationCalendarPreview() {
  const events = getCalendarEvents("association").slice(0, 3);
  return events.length ? `<div class="calendar-event-list">${calendarEventRows(events)}</div>` : `<div class="empty-state">No association meetings or events are scheduled in the local calendar.</div>`;
}

function renderCalendar(environment) {
  const events = getCalendarEvents(environment);
  const types = environment === "association"
    ? ["Board", "Community", "Compliance", "Maintenance"]
    : ["Leasing", "Maintenance", "Accounting", "Internal"];
  const range = calendarDateRange(calendarView);
  const filtered = events.filter((item) => (calendarTypeFilter === "all" || item.type === calendarTypeFilter)
    && (!range || (item.date >= range[0] && item.date <= range[1])));
  const title = environment === "association" ? "Association Calendar" : "Property Management Calendar";
  return `<section class="page-heading"><div><p class="eyebrow">${environment === "association" ? "ASSOCIATION MANAGEMENT" : "PROPERTY MANAGEMENT"} · SCHEDULING</p><h1>${title}</h1><p class="subheading">Coordinate ${environment === "association" ? "board, community, compliance, and common-area maintenance" : "leasing, maintenance, accounting, and internal"} events. Calendar records are scoped to the selected business environment.</p></div><div class="heading-actions"><button class="button button-outline" data-action="export-calendar" ${!hasPermission("calendar", "export") ? "disabled" : ""}>Export agenda</button><button class="button button-primary" data-action="new-calendar-event" ${!hasPermission("calendar", "create") ? "disabled" : ""}>＋ Add event</button></div></section>
  <section class="metrics-grid">${card("Scheduled events", String(events.length), "Events in this environment", "C")}${card("Visible", String(filtered.length), calendarView === "agenda" || calendarView === "timeline" ? "Agenda / timeline" : `${calendarView} view`, "✓")}${card("Event types", String(types.length), "Available in this module", "T")}</section>
  <section class="panel directory-panel"><div class="calendar-toolbar"><div class="view-toggle" role="group" aria-label="Calendar view">${["day", "week", "month", "agenda", "timeline"].map((view) => `<button class="tab-button ${calendarView === view ? "tab-active" : ""}" data-action="calendar-view" data-view="${view}">${view[0].toUpperCase()}${view.slice(1)}</button>`).join("")}</div><select id="calendar-type-filter" aria-label="Filter calendar event type"><option value="all">All event types</option>${types.map((type) => `<option value="${type}" ${calendarTypeFilter === type ? "selected" : ""}>${type}</option>`).join("")}</select></div>${filtered.length ? `<div class="calendar-event-list">${calendarEventRows(filtered)}</div>` : `<div class="empty-state">No events match this ${calendarView} view. Add an event or change the event-type filter.</div>`}<p class="table-footnote">Leasing, accounting, board, and inspection events appear when records are entered. External calendar sync is not connected.</p></section>`;
}

function associationRecordForm(kind, recordId) {
  const module = associationRecordModule(kind);
  const listKey = { homeowner: "homeowners", board: "boards", arc: "arcRequests", assessment: "assessments", violation: "violations", "association-maintenance": "maintenance" }[kind];
  if (!listKey) {
    showToast("Select a supported association record type.", true);
    return;
  }
  const existing = state.associationRecords[listKey].find((item) => item.id === recordId);
  const associations = state.properties.filter((property) => property.type === "hoa");
  if (!associations.length) {
    showToast("Add an HOA / COA association profile before creating association records.", true);
    return;
  }
  const selectedAssociation = existing?.associationId || associations[0].id;
  const associationField = `<label class="form-field">Association<select name="associationId" required>${associations.map((property) => `<option value="${escapeHtml(property.id)}" ${selectedAssociation === property.id ? "selected" : ""}>${escapeHtml(property.name)}</option>`).join("")}</select></label>`;
  const fields = kind === "homeowner"
    ? `${associationField}<label class="form-field">Homeowner name<input name="name" maxlength="120" value="${escapeHtml(existing?.name || "")}" required></label><label class="form-field">Unit / mailing address<input name="unit" maxlength="180" value="${escapeHtml(existing?.unit || "")}"></label><label class="form-field">Email<input name="email" type="email" maxlength="254" value="${escapeHtml(existing?.email || "")}"></label><label class="form-field">Phone<input name="phone" type="tel" maxlength="40" value="${escapeHtml(existing?.phone || "")}"></label>`
    : kind === "board"
      ? `${associationField}<label class="form-field">Board member name<input name="name" maxlength="120" value="${escapeHtml(existing?.name || "")}" required></label><label class="form-field">Position<input name="position" maxlength="80" value="${escapeHtml(existing?.position || "")}" required placeholder="President, Treasurer, Director"></label><label class="form-field">Term start<input name="termStart" type="date" value="${escapeHtml(existing?.termStart || "")}"></label><label class="form-field">Term end<input name="termEnd" type="date" value="${escapeHtml(existing?.termEnd || "")}"></label><label class="form-field">Email<input name="email" type="email" maxlength="254" value="${escapeHtml(existing?.email || "")}"></label>`
      : kind === "arc"
        ? `${associationField}<label class="form-field">Homeowner name<input name="homeownerName" maxlength="120" value="${escapeHtml(existing?.homeownerName || "")}" required></label><label class="form-field">Request type<select name="requestType">${["Paint", "Construction", "Landscaping", "Other"].map((type) => `<option ${existing?.requestType === type ? "selected" : ""}>${type}</option>`).join("")}</select></label><label class="form-field">Submitted date<input name="submittedAt" type="date" value="${escapeHtml(existing?.submittedAt || localDateString())}" required></label><label class="form-field full-width">Description<textarea name="description" rows="3" maxlength="1200" required>${escapeHtml(existing?.description || "")}</textarea></label>`
      : kind === "assessment"
        ? `${associationField}<label class="form-field">Assessment name<input name="name" maxlength="120" value="${escapeHtml(existing?.name || "")}" required placeholder="Quarterly assessment"></label><label class="form-field">Amount (PHP)<input name="amount" type="number" min="0.01" step="0.01" value="${escapeHtml(existing?.amount || "")}" required></label><label class="form-field">Due date<input name="dueDate" type="date" value="${escapeHtml(existing?.dueDate || "")}" required></label><label class="form-field">Status<select name="status"><option ${existing?.status === "Paid" ? "" : "selected"}>Due</option><option ${existing?.status === "Paid" ? "selected" : ""}>Paid</option></select></label>`
        : kind === "violation"
          ? `${associationField}<label class="form-field">Homeowner name<input name="homeownerName" maxlength="120" value="${escapeHtml(existing?.homeownerName || "")}" required></label><label class="form-field">Violation category<select name="category">${["Noise", "Parking", "Property", "Pet policy", "Common area", "Other"].map((category) => `<option ${existing?.category === category ? "selected" : ""}>${category}</option>`).join("")}</select></label><label class="form-field">Reported date<input name="reportedAt" type="date" value="${escapeHtml(existing?.reportedAt || localDateString())}" required></label><label class="form-field">Status<select name="status">${["Open", "Under review", "Resolved"].map((status) => `<option ${existing?.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></label><label class="form-field full-width">Details<textarea name="description" rows="3" maxlength="1200" required>${escapeHtml(existing?.description || "")}</textarea></label>`
          : `${associationField}<label class="form-field">Work item<input name="title" maxlength="120" value="${escapeHtml(existing?.title || "")}" required placeholder="Landscape lighting repair"></label><label class="form-field">Common-area location<input name="location" maxlength="180" value="${escapeHtml(existing?.location || "")}" required></label><label class="form-field">Due date<input name="dueDate" type="date" value="${escapeHtml(existing?.dueDate || "")}" required></label><label class="form-field">Priority<select name="priority">${["Low", "Normal", "High", "Emergency"].map((priority) => `<option ${existing?.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}</select></label><label class="form-field">Status<select name="status">${["Open", "Scheduled", "In progress", "Complete"].map((status) => `<option ${existing?.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></label><label class="form-field full-width">Details<textarea name="description" rows="3" maxlength="1200">${escapeHtml(existing?.description || "")}</textarea></label>`;
  const recordLabel = { homeowner: "homeowner", board: "board member", arc: "ARC request", assessment: "assessment", violation: "violation", "association-maintenance": "maintenance task" }[kind];
  openModal(`<form id="association-record-form" class="modal-card" data-permission-module="${module}" data-permission="${existing ? "edit" : "create"}" data-kind="${kind}">
    <div class="modal-header"><div><p class="eyebrow">ASSOCIATION MANAGEMENT</p><h2>${existing ? "Edit" : "Add"} ${recordLabel}</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    ${existing ? `<input type="hidden" name="recordId" value="${escapeHtml(existing.id)}">` : ""}
    <div class="form-grid">${fields}</div><p class="form-hint">This local association record is separate from rental tenant and rent ledgers. No assessment payment is processed by this prototype.</p>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Save</button></div>
  </form>`);
}

function calendarEventForm() {
  const types = currentEnvironment === "association"
    ? ["Board", "Community", "Compliance", "Maintenance"]
    : ["Leasing", "Maintenance", "Accounting", "Internal"];
  openModal(`<form id="calendar-event-form" class="modal-card" data-permission-module="calendar" data-permission="create">
    <div class="modal-header"><div><p class="eyebrow">${currentEnvironment === "association" ? "ASSOCIATION" : "PROPERTY MANAGEMENT"} CALENDAR</p><h2>Add calendar event</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="form-grid"><label class="form-field full-width">Event title<input name="title" maxlength="140" required></label><label class="form-field">Event type<select name="type">${types.map((type) => `<option>${type}</option>`).join("")}</select></label><label class="form-field">Date<input name="date" type="date" required value="${localDateString()}"></label><label class="form-field">Status<select name="status"><option>Scheduled</option><option>Pending</option></select></label><label class="form-field full-width">Details<textarea name="detail" rows="3" maxlength="800"></textarea></label></div>
    <p class="form-hint">Events are saved locally and scoped to the current business environment. External calendar sync is not connected.</p><div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Save event</button></div>
  </form>`);
}

function tenantChargeForm(unitId) {
  const unitOptions = state.units.filter((unit) => unit.status === "Occupied").map((unit) => `<option value="${unit.id}" ${Number(unitId) === unit.id ? "selected" : ""}>${escapeHtml(unit.resident)} · ${escapeHtml(unitLabel(unit.id))}</option>`).join("");
  openModal(`<form id="tenant-charge-form" class="modal-card" data-permission-module="finance" data-permission="create">
    <div class="modal-header"><div><p class="eyebrow">TENANT LEDGER</p><h2>Create charge</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="form-grid"><label class="form-field full-width">Tenant / unit<select name="unitId" required>${unitOptions}</select></label><label class="form-field">Charge description<input name="description" maxlength="120" required></label><label class="form-field">Amount (PHP)<input name="amount" type="number" min="0.01" step="0.01" required></label><label class="form-field">Due date<input name="dueDate" type="date" value="${localDateString()}" required></label></div>
    <p class="form-hint">This creates a browser-local ledger charge. It does not collect a payment or post to an accounting system.</p><div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Create charge</button></div>
  </form>`);
}

function renderPropertyDashboard() {
  const properties = (state.properties || []).filter((property) => property.type !== "hoa");
  const selected = properties.find((property) => property.id === selectedPropertyId) || properties[0];
  if (selected) selectedPropertyId = selected.id;
  const paymentMethods = selected?.paymentMethods || [];
  const canManagePayments = hasPermission("payment-methods", "manage");
  const canEditProfiles = hasPermission("properties", "edit");
  const propertyUnits = selected ? unitsForProperty(selected.id) : [];
  const occupied = propertyUnits.filter((unit) => unit.status === "Occupied").length;
  const vacant = propertyUnits.length - occupied;
  const metrics = propertyUnits.length
    ? `<section class="metrics-grid">${card("Buildings / structures", String(buildingCount(propertyUnits)), "Current property", "B")}${card("Total units", String(propertyUnits.length), "Only units assigned to this property", "U")}${card("Occupied units", String(occupied), `${Math.round((occupied / propertyUnits.length) * 100)}% occupancy`, "↗", "metric-green")}${card("Vacant units", String(vacant), "Available for leasing", "○", "metric-amber")}</section>`
    : `<div class="empty-state">This property profile is registered, but its unit and operating records have not been added yet.</div>`;
  const canAddBuilding = selected?.type === "mfr" || (selected?.type === "building" && propertyUnits.length === 0);
  const buildingActionLabel = selected?.type === "building" ? "Add 36 units" : "Add building";
  const unitsLink = hasPermission("units", "view")
    ? `<div class="heading-actions">${canManageUnits() ? `<button class="button button-outline button-small" data-action="new-unit" data-property-id="${escapeHtml(selected?.id || "")}">＋ Add unit</button><button class="button button-outline button-small" data-action="import-units" data-property-id="${escapeHtml(selected?.id || "")}">Upload units</button>${canAddBuilding ? `<button class="button button-outline button-small" data-action="add-building">＋ ${buildingActionLabel}</button>` : ""}` : ""}<button class="button button-primary button-small" data-page="units">Open unit directory</button></div>` : "";
  const paymentSettings = `<section class="panel directory-panel property-profile-card"><div class="panel-heading"><div><h2>Payment instructions</h2><p>Enabled options are shown in the tenant and homeowner dashboards.</p></div>${canManagePayments && PAYMENT_METHOD_TYPES.some(([type]) => !paymentMethods.some((method) => method.type === type)) ? `<button class="button button-outline button-small" data-action="new-payment-method" data-property-id="${escapeHtml(selected?.id || "")}">＋ Add payment method</button>` : ""}</div>
    ${paymentMethods.length ? `<div class="property-portfolio-list">${paymentMethods.map((method) => `<div class="property-portfolio-item"><span class="property-type-badge">${escapeHtml(PAYMENT_METHOD_TYPES.find(([id]) => id === method.type)?.[1] || "Other")}</span><div><strong>${escapeHtml(method.label || method.institution || "Payment method")}</strong><small>${method.active ? "Visible to residents" : "Disabled"}${method.accountName ? ` · Account name: ${escapeHtml(method.accountName)}` : ""}${method.accountNumber ? ` · Account: ${escapeHtml(method.accountNumber)}` : ""}</small></div>${canManagePayments ? `<div class="access-actions"><button class="table-action" data-action="edit-payment-method" data-property-id="${escapeHtml(selected.id)}" data-method-id="${escapeHtml(method.id)}">Edit</button><button class="table-action" data-action="toggle-payment-method" data-property-id="${escapeHtml(selected.id)}" data-method-id="${escapeHtml(method.id)}">${method.active ? "Turn off" : "Turn on"}</button></div>` : ""}</div>`).join("")}</div>` : `<div class="empty-state">No payment methods configured. Add one bank, one cash, and optional escrow or other instructions.</div>`}
    <p class="table-footnote">These instructions do not process or verify payments. Confirm account details and authorized recipients before enabling them.</p>
  </section>`;
  const groupNames = (state.propertyGroups || []).filter((group) => group.propertyIds.includes(selected?.id)).map((group) => group.name);
  const profileSections = PROPERTY_PROFILE_GROUPS.map(([id, title, fields]) => {
    const restricted = (["financial", "ownership"].includes(id) && !hasPermission("finance", "view"))
      || (id === "leasing" && !hasPermission("tenants", "view"))
      || (id === "operations" && !hasPermission("procurement", "view"))
      || (id === "records" && !hasPermission("documents", "view"));
    return `<article class="panel property-profile-card" id="property-section-${id}"><div class="panel-heading"><div><h2>${escapeHtml(title)}</h2><p>${fields.length} profile fields</p></div></div><dl class="profile-details">${fields.map(([key, label]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(restricted ? "Restricted" : selected?.profile?.[key] || "Not recorded")}</dd></div>`).join("")}</dl></article>`;
  }).join("");
  const groupPanel = `<section class="panel directory-panel property-profile-card"><div class="panel-heading"><div><h2>Property groups</h2><p>${groupNames.length ? `Member of ${escapeHtml(groupNames.join(", "))}` : "Organize properties into customizable portfolios."}</p></div><div class="heading-actions">${canEditProfiles ? `<button class="button button-outline button-small" data-action="new-property-group">＋ Create group</button>` : ""}</div></div>${state.propertyGroups.length ? `<div class="property-portfolio-list">${state.propertyGroups.map((group) => `<div class="property-portfolio-item"><span class="property-type-badge">${group.propertyIds.length} ${group.propertyIds.length === 1 ? "property" : "properties"}</span><div><strong>${escapeHtml(group.name)}</strong><small>${escapeHtml(group.description || "No description")}${group.customFields.length ? ` · Custom fields: ${escapeHtml(group.customFields.join(", "))}` : ""}</small></div>${canEditProfiles ? `<button class="table-action" data-action="edit-property-group" data-group-id="${escapeHtml(group.id)}">Customize</button>` : ""}</div>`).join("")}</div>` : `<div class="empty-state">No property groups yet.</div>`}</section>`;
  const linkedGroup = groupNames[0] || "None";
  return `<section class="page-heading"><div><p class="eyebrow">PROPERTY OPERATIONS</p><h1>Property dashboard</h1><p class="subheading">Review operational, financial, leasing, and document information for this property.</p></div><div class="heading-actions"><label class="portal-switcher"><span>Property</span><select id="property-dashboard-select">${properties.map((property) => `<option value="${escapeHtml(property.id)}" ${property.id === selected?.id ? "selected" : ""}>${escapeHtml(property.name)} · ${escapeHtml(propertyTypeName(property.type))}</option>`).join("")}</select></label>${canEditProfiles ? `<button class="button button-outline" data-action="edit-property-details" data-property-id="${escapeHtml(selected?.id || "")}">Edit profile</button>` : ""}</div></section>
  ${metrics}
  <nav class="property-tabs" aria-label="Property sections">${[["property-info", "Overview"], ["property-record-units", "Units"], ["property-section-financial", "Financial"], ["property-record-maintenance", "Maintenance"], ["property-section-records", "Documents"], ["property-record-reports", "Reports"]].map(([target, label]) => `<button class="tab-button" data-action="property-tab" data-target="${target}">${label}</button>`).join("")}</nav>
  <section class="panel directory-panel property-profile-card" id="property-info"><div class="panel-heading"><div><h2>${escapeHtml(selected?.name || "Property")}</h2><p>${escapeHtml(propertyTypeName(selected?.type))} · ${escapeHtml(selected?.address || "Address not provided")} · Group: ${escapeHtml(linkedGroup)} · ${escapeHtml(selected?.profile?.status || "Active")}</p></div>${unitsLink}</div>${selected?.type === "mfr" ? `<p class="subheading">Buildings and units are tracked independently for this property. Add a building to create its 36 vacant units, or add/import units individually.</p>` : `<p class="table-footnote">Units entered or imported here are linked only to this ${escapeHtml(propertyTypeName(selected?.type))} property.</p>`}</section>
  ${groupPanel}
  <section class="property-profile-sections">${profileSections}</section>
  ${renderPropertyRecordSections(selected)}
  ${paymentSettings}`;
}

function canManageUnits() {
  return hasPermission("units", "manage");
}

function renderPropertyRecordSections(property) {
  const units = property ? unitsForProperty(property.id) : [];
  const unitIds = new Set(units.map((unit) => unit.id));
  const charges = state.charges.filter((item) => unitIds.has(item.unitId));
  const payments = state.payments.filter((item) => unitIds.has(item.unitId));
  const maintenance = state.maintenance.filter((item) => unitIds.has(item.unitId));
  const occupied = units.filter((unit) => unit.status === "Occupied");
  const visibleUnits = units.slice(0, 8);
  const visibleResidents = occupied.slice(0, 8);
  const unitRows = visibleUnits.map((unit) => {
    const currentRent = hasPermission("finance", "view") ? unit.monthlyRent ? money(unit.monthlyRent) : "Not recorded" : "Restricted";
    return `<tr><td><strong>${escapeHtml(unitLabel(unit.id))}</strong></td><td>Not recorded</td><td>Not recorded</td><td>${currentRent}</td><td>${escapeHtml(unit.status)}</td><td>Not recorded</td></tr>`;
  }).join("");
  const residentRows = visibleResidents.map((unit) => {
    const charge = activeTenantCharge(unit);
    const paymentCount = payments.filter((payment) => payment.unitId === unit.id).length;
    const contact = hasPermission("resident-data", "view") ? [unit.contact?.phone, unit.contact?.email].filter(Boolean).join(" · ") || "Not recorded" : "Restricted";
    const rent = hasPermission("finance", "view") ? charge ? money(charge.amount) : "—" : "Restricted";
    const balance = hasPermission("finance", "view") ? charge ? money(charge.balance) : "—" : "Restricted";
    const history = hasPermission("finance", "view") ? `${paymentCount} payments` : "Restricted";
    return `<tr><td><strong>${escapeHtml(unit.resident)}</strong><small>${escapeHtml(unitLabel(unit.id))}</small></td><td>${escapeHtml(contact)}</td><td>Not recorded</td><td>${rent}</td><td>${balance}</td><td>${history} · portal preview only</td></tr>`;
  }).join("");
  const maintenanceRows = maintenance.slice(0, 6).map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(unitLabel(item.unitId))}</td><td>${escapeHtml(item.category)} · ${escapeHtml(item.priority)}</td><td>${escapeHtml(item.status)}</td><td>${shortDate(item.createdAt)}</td></tr>`).join("");
  const metrics = {
    occupied: occupied.length,
    vacancy: units.length - occupied.length,
    billed: charges.reduce((sum, item) => sum + item.amount, 0),
    collected: payments.reduce((sum, item) => sum + item.amount, 0),
    balance: charges.reduce((sum, item) => sum + item.balance, 0)
  };
  const recentAudit = hasPermission("audit", "view") ? [...state.accessControl.auditLog].reverse().slice(0, 5) : [];
  return `<section class="property-profile-sections">
    <article class="panel property-profile-card" id="property-record-units"><div class="panel-heading"><div><h2>Unit information</h2><p>Units belonging to ${escapeHtml(property?.name || "this property")}.</p></div><div class="heading-actions">${canManageUnits() ? `<button class="button button-outline button-small" data-action="new-unit" data-property-id="${escapeHtml(property?.id || "")}">＋ Add unit</button><button class="button button-outline button-small" data-action="import-units" data-property-id="${escapeHtml(property?.id || "")}">Upload units</button>${property?.type === "mfr" || (property?.type === "building" && !units.length) ? `<button class="button button-outline button-small" data-action="add-building">＋ ${property?.type === "building" ? "Add 36 units" : "Add building"}</button>` : ""}` : ""}</div></div>${units.length ? `<div class="table-wrap"><table><thead><tr><th>Unit</th><th>Floor plan / beds / baths</th><th>Square footage</th><th>Current rent</th><th>Occupancy / lease</th><th>Amenities / utilities / photos</th></tr></thead><tbody>${unitRows}</tbody></table></div><p class="table-footnote">Showing ${visibleUnits.length} of ${units.length} units. Fields not recorded in the source unit model are labeled accordingly.</p>` : `<div class="empty-state">No units are assigned to this property yet. Add a unit, upload a CSV, or add a building.</div>`}</article>
    <article class="panel property-profile-card"><div class="panel-heading"><div><h2>Resident information</h2><p>Residents, contact, move/lease dates, rent, deposits, balances, portal status, and payment history.</p></div></div>${occupied.length ? `<div class="table-wrap"><table><thead><tr><th>Resident / unit</th><th>Contact</th><th>Lease dates</th><th>Rent / balance</th><th>Security deposit</th><th>Portal / payments</th></tr></thead><tbody>${residentRows}</tbody></table></div><p class="table-footnote">Showing ${visibleResidents.length} of ${occupied.length} occupied units. Contact details require the resident-data permission.</p>` : `<div class="empty-state">No occupied units are recorded for this property.</div>`}</article>
    <article class="panel property-profile-card"><div class="panel-heading"><div><h2>Leasing information</h2><p>Vacancy, availability, marketing, applications, showings, screening, and renewals.</p></div></div><dl class="profile-details"><div><dt>Vacancy status</dt><dd>${units.length ? `${metrics.vacancy} vacant units` : escapeHtml(property?.profile?.vacancyStatus || "No units entered")}</dd></div><div><dt>Marketing / applications</dt><dd>${escapeHtml(property?.profile?.marketingStatus || "Not recorded")}</dd></div><div><dt>Lease workflow</dt><dd>${escapeHtml(property?.profile?.leaseRenewalStatus || "Lease dates and applications are not tracked")}</dd></div></dl></article>
    <article class="panel property-profile-card" id="property-record-maintenance"><div class="panel-heading"><div><h2>Maintenance information</h2><p>Open/closed work orders, history, inspections, vendor assignments, due dates, priorities, and notes.</p></div></div>${!hasPermission("maintenance", "view") ? `<div class="empty-state">Maintenance information is restricted by role.</div>` : maintenanceRows ? `<div class="table-wrap"><table><thead><tr><th>Work order</th><th>Unit</th><th>Category / priority</th><th>Status</th><th>Reported</th></tr></thead><tbody>${maintenanceRows}</tbody></table></div>` : `<div class="empty-state">No work orders are linked to this property profile.</div>`}<p class="table-footnote">${hasPermission("maintenance", "view") ? `${maintenance.filter((item) => item.status !== "Complete").length} open · ${maintenance.filter((item) => item.status === "Complete").length} completed. Inspection and vendor cost records are not tracked.` : "Maintenance source records are not configured or accessible."}</p></article>
    <article class="panel property-profile-card"><div class="panel-heading"><div><h2>Vendor information</h2><p>Preferred vendors, contacts, insurance, W-9 status, notes, and payment preferences.</p></div></div><p class="empty-state">Vendor records have not been entered for this property.</p></article>
    <article class="panel property-profile-card"><div class="panel-heading"><div><h2>Communication history and compliance</h2><p>Emails, texts, letters, notices, internal activity, leases, inspections, insurance, permits, and attachments.</p></div></div>${recentAudit.length ? `<div class="compact-list">${recentAudit.map((entry) => `<div class="compact-item"><span class="list-icon">A</span><span class="compact-copy"><strong>${escapeHtml(entry.action)}</strong><small>${escapeHtml(entry.actor)} · ${escapeHtml(shortDate(entry.timestamp?.slice(0, 10)))}</small></span></div>`).join("")}</div>` : `<div class="empty-state">No activity history is recorded yet.</div>`}<p class="table-footnote">Email/SMS delivery and document storage are not connected. Add official files through a secure document service before production use.</p></article>
    <article class="panel property-profile-card" id="property-record-reports"><div class="panel-heading"><div><h2>Reporting &amp; analytics</h2><p>Occupancy, delinquency, collections, rent, maintenance costs, profitability, and budget performance.</p></div></div><dl class="profile-details"><div><dt>Occupancy rate</dt><dd>${units.length ? `${Math.round(metrics.occupied / units.length * 100)}%` : "Not available"}</dd></div><div><dt>Delinquent balances</dt><dd>${hasPermission("finance", "view") && units.length ? money(metrics.balance) : hasPermission("finance", "view") ? "Not available" : "Restricted"}</dd></div><div><dt>Recorded collections</dt><dd>${hasPermission("finance", "view") && units.length ? money(metrics.collected) : hasPermission("finance", "view") ? "Not available" : "Restricted"}</dd></div><div><dt>Expenses / NOI</dt><dd>Not tracked; no profit estimate is shown.</dd></div></dl></article>
  </section>`;
}

function renderPaymentInstructions(property, audience = "residents") {
  const enabled = (property?.paymentMethods || []).filter((method) => method.active);
  return `<section class="panel directory-panel payment-instructions"><div class="panel-heading"><div><h2>Payment instructions</h2><p>Available ways to pay ${audience === "homeowners" ? "association dues" : "your balance"}</p></div><span class="badge ${enabled.length ? "badge-green" : "badge-gray"}">${enabled.length ? `${enabled.length} enabled` : "Not configured"}</span></div>
  ${enabled.length ? `<div class="property-portfolio-list">${enabled.map((method) => `<article class="payment-instruction-card"><span class="property-type-badge">${escapeHtml(PAYMENT_METHOD_TYPES.find(([id]) => id === method.type)?.[1] || "Other")}</span><div><strong>${escapeHtml(method.label || method.institution || "Payment method")}</strong>${method.institution ? `<p>Bank / provider: ${escapeHtml(method.institution)}</p>` : ""}${method.accountName ? `<p>Account name: ${escapeHtml(method.accountName)}</p>` : ""}${method.accountNumber ? `<p>Account number: ${escapeHtml(method.accountNumber)}</p>` : ""}${method.branch ? `<p>Branch: ${escapeHtml(method.branch)}</p>` : ""}<p>${escapeHtml(method.instructions || "Contact property management for payment instructions.")}</p></div></article>`).join("")}</div><p class="table-footnote">After paying, retain your transfer confirmation and submit the payment reference to management for manual verification. Do not send cash or transfer until you have independently confirmed the recipient.</p>` : `<div class="empty-state">Payment instructions are not available yet. Contact property management for payment options.</div>`}</section>`;
}

function renderHomeownerDashboard() {
  const property = (state.properties || []).find((item) => item.id === selectedPropertyId)
    || (state.properties || [])[0];
  if (property) selectedPropertyId = property.id;
  return `<section class="page-heading"><div><p class="eyebrow">OWNER / HOMEOWNER EXPERIENCE</p><h1>Homeowner dashboard preview</h1><p class="subheading">This preview is not a secured homeowner account.</p></div><label class="portal-switcher"><span>Property</span><select id="property-dashboard-select">${(state.properties || []).map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === property?.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label></section>
  ${property ? `<div class="portal-welcome"><div class="portal-avatar">H</div><div><span>HOMEOWNER PORTAL</span><h2>${escapeHtml(property.name)}</h2><p>${escapeHtml(propertyTypeName(property.type))} · ${escapeHtml(property.address || "")}</p></div></div>${renderPaymentInstructions(property, "homeowners")}` : `<div class="empty-state">No property is selected.</div>`}
  <div class="report-caveat"><strong>Owner portal preview only.</strong> Owner statements, ownership details, and account-specific balances require a secured owner account and property-scoped backend.</div>`;
}

function propertyForm(defaultType = "") {
  const propertyTypes = defaultType === "hoa"
    ? PROPERTY_TYPES.filter(([id]) => id === "hoa")
    : PROPERTY_TYPES.filter(([id]) => id !== "hoa");
  const groups = currentEnvironment === "association" ? [] : state.propertyGroups || [];
  openModal(`<form id="property-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">${currentEnvironment === "association" ? "ASSOCIATION MANAGEMENT" : "PROPERTY PORTFOLIO"}</p><h2>${defaultType === "hoa" ? "Manually add association" : "Manually add property"}</h2><p class="form-hint">Create a record by entering its details; importing a file is not required.</p></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="form-grid">
      <label class="form-field full-width">Property name<input name="name" maxlength="120" required placeholder="Property or community name"></label>
      <label class="form-field">Property code<input name="propertyCode" maxlength="40" placeholder="Optional internal code"></label>
      <label class="form-field">Property type<select name="type" required>${propertyTypes.map(([id, label]) => `<option value="${id}" ${defaultType === id ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select></label>
      <label class="form-field full-width">Street / full property address<input name="address" maxlength="240" required placeholder="Street address"></label>
      <label class="form-field">City<input name="city" maxlength="100" placeholder="City"></label>
      <label class="form-field">Province / region<input name="region" maxlength="100" placeholder="Province or region"></label>
      <label class="form-field">Postal code<input name="postalCode" maxlength="20" placeholder="Postal code"></label>
      <label class="form-field">Owner name<input name="ownerName" maxlength="120" placeholder="Property owner"></label>
      <label class="form-field">Property manager<input name="propertyManager" maxlength="120" placeholder="Assigned manager"></label>
      <label class="form-field">Year built<input name="yearBuilt" type="number" min="1700" max="${new Date().getFullYear()}" step="1" placeholder="Year"></label>
      ${defaultType === "hoa" ? "" : `<label class="form-field">Portfolio group<select name="groupId"><option value="">No group</option>${groups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`).join("")}</select></label>`}
      <label class="form-field full-width">Property description<textarea name="description" rows="3" maxlength="600" placeholder="Optional property details"></textarea></label>
    </div>
    <p class="form-hint">This creates a persistent property record in the portfolio. Building, unit, lease, and financial records are not automatically created for a new property.</p>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Create property</button></div>
  </form>`);
}

function propertyDetailsForm(propertyId) {
  const property = state.properties.find((item) => item.id === propertyId);
  if (!property) {
    showToast("The selected property could not be found.", true);
    return;
  }
  const propertyTypes = property.type === "hoa"
    ? PROPERTY_TYPES.filter(([id]) => id === "hoa")
    : PROPERTY_TYPES.filter(([id]) => id !== "hoa");
  const fields = PROPERTY_PROFILE_GROUPS.map(([id, title, entries]) => `<fieldset class="profile-fieldset"><legend>${escapeHtml(title)}</legend><div class="form-grid">${entries.map(([key, label]) => {
    const value = property.profile?.[key] || "";
    const multiline = /description|notes|amenities|preferences|settings|templates|documents|photos|attachments|agreements|reports|history|insurance|certificates|schedule|results|defaults|transactions|charges|controls|status|budget/i.test(key);
    const fieldValue = key === "numberOfUnits" ? unitsForProperty(property.id).length || value : value;
    const readOnly = key === "numberOfUnits" && unitsForProperty(property.id).length ? "disabled" : "";
    return `<label class="form-field">${escapeHtml(label)}${multiline ? `<textarea name="profile.${key}" rows="2" maxlength="600" ${readOnly}>${escapeHtml(fieldValue)}</textarea>` : `<input name="profile.${key}" value="${escapeHtml(fieldValue)}" maxlength="180" ${readOnly}>`}</label>`;
  }).join("")}</div></fieldset>`).join("");
  openModal(`<form id="property-details-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">${escapeHtml(property.name)}</p><h2>Property profile details</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <input type="hidden" name="propertyId" value="${escapeHtml(property.id)}">
    <div class="form-grid">
      <label class="form-field">Property ID<input value="${escapeHtml(property.id)}" disabled></label>
      <label class="form-field">Property status<select name="propertyStatus"><option ${property.profile?.status === "Inactive" ? "" : "selected"}>Active</option><option ${property.profile?.status === "Inactive" ? "selected" : ""}>Inactive</option></select></label>
      <label class="form-field">Property type<select name="propertyType">${propertyTypes.map(([id, label]) => `<option value="${id}" ${property.type === id ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select></label>
      <label class="form-field">Property name<input name="propertyName" value="${escapeHtml(property.name)}" maxlength="120" required></label>
      <label class="form-field full-width">Full address<input name="propertyAddress" value="${escapeHtml(property.address)}" maxlength="240"></label>
    </div>
    ${fields}
    <p class="form-hint">Unit, resident, payment, lease, maintenance, and financial details below are sourced only when this prototype has those records. Entering text here does not create documents, integrations, owner accounts, or accounting transactions.</p>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Save property profile</button></div>
  </form>`);
}

function propertyGroupForm(groupId) {
  const group = state.propertyGroups.find((item) => item.id === groupId);
  if (groupId && !group) {
    showToast("The selected property group could not be found.", true);
    return;
  }
  const selectedIds = new Set(group?.propertyIds || []);
  openModal(`<form id="property-group-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">PROPERTY PORTFOLIO</p><h2>${group ? "Customize property group" : "Create property group"}</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <input type="hidden" name="groupId" value="${escapeHtml(group?.id || "")}">
    <div class="form-grid"><label class="form-field full-width">Group name<input name="name" maxlength="100" required value="${escapeHtml(group?.name || "")}"></label>
    <label class="form-field full-width">Description<input name="description" maxlength="240" value="${escapeHtml(group?.description || "")}" placeholder="Portfolio purpose or grouping criteria"></label>
    <label class="form-field full-width">Custom group fields<input name="customFields" maxlength="500" value="${escapeHtml((group?.customFields || []).join(", "))}" placeholder="Region, operating team, portfolio code"></label></div>
    <div class="profile-fieldset"><strong>Properties in this group</strong><div class="group-property-options">${state.properties.map((property) => `<label class="pet-option"><input type="checkbox" name="propertyIds" value="${escapeHtml(property.id)}" ${selectedIds.has(property.id) ? "checked" : ""}>${escapeHtml(property.name)}</label>`).join("")}</div></div>
    <p class="form-hint">Groups are organizational labels only; they do not merge or isolate property records.</p>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Save group</button></div>
  </form>`);
}

function mySettingsReadOnlyValue(key, profile, logs) {
  if (key === "recentReports") {
    const reports = logs.filter((entry) => entry.module === "reports" && /Viewed|Exported|Printed/i.test(entry.action)).slice(0, 5);
    return reports.length ? reports.map((entry) => entry.action).join("\n") : "No report activity recorded.";
  }
  if (key === "reportExports" || key === "reportExportHistory" || key === "downloads") {
    const exports = logs.filter((entry) => /Exported|Printed/i.test(entry.action)).slice(0, 8);
    return exports.length ? exports.map((entry) => `${shortDate(entry.timestamp?.slice(0, 10))} · ${entry.action}`).join("\n") : "No exports recorded.";
  }
  if (["recentActions", "auditHistory", "changesMade"].includes(key)) {
    return logs.slice(0, 10).map((entry) => `${shortDate(entry.timestamp?.slice(0, 10))} · ${entry.action}`).join("\n") || "No activity recorded.";
  }
  return String(profile[key] || "Not available in this browser prototype.");
}

function renderMySettings() {
  const user = currentDemoUser();
  if (!user) return `<div class="empty-state">No active user profile is available.</div>`;
  const settings = currentUserSettings(user);
  const logs = [...(state.accessControl.auditLog || [])].reverse();
  const category = MY_SETTINGS_CATEGORIES.find(([id]) => id === mySettingsCategory) || MY_SETTINGS_CATEGORIES[0];
  const categories = MY_SETTINGS_CATEGORIES.map(([id, label]) => `<button type="button" class="my-settings-tab ${id === category[0] ? "my-settings-tab-active" : ""}" data-action="my-settings-category" data-category="${id}">${escapeHtml(label)}</button>`).join("");
  const fields = category[2].map(([key, label, type, choices]) => {
    if (type === "readonly") {
      const value = mySettingsReadOnlyValue(key, settings, logs);
      return `<div class="form-field my-settings-readonly"><span>${escapeHtml(label)}</span><output>${escapeHtml(value)}</output></div>`;
    }
    if (type === "action") {
      return `<div class="form-field my-settings-action"><span>${escapeHtml(label)}</span><button type="button" class="button button-outline button-small" data-action="personal-setting-action" data-setting-key="${escapeHtml(key)}">${escapeHtml(key === "changePassword" ? "Change password" : key === "dataExportRequest" ? "Request export" : "Configure")}</button><small>Requires a secured account service; this demo cannot perform the action.</small></div>`;
    }
    const value = settings[key] || "";
    if (type === "select") {
      const options = choices.map((option) => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("");
      return `<label class="form-field">${escapeHtml(label)}<select name="${escapeHtml(key)}">${options}</select></label>`;
    }
    if (type === "textarea") return `<label class="form-field my-settings-wide">${escapeHtml(label)}<textarea name="${escapeHtml(key)}" rows="3" maxlength="1200">${escapeHtml(value)}</textarea></label>`;
    return `<label class="form-field">${escapeHtml(label)}<input name="${escapeHtml(key)}" type="${type}" maxlength="240" value="${escapeHtml(value)}" ${key === "emailAddress" ? "autocomplete=\"email\"" : ""}></label>`;
  }).join("");
  return `<section class="page-heading"><div><p class="eyebrow">PERSONAL ACCOUNT</p><h1>My Settings</h1><p class="subheading">Manage your profile and personal preferences. These settings are separate from administrator-managed General Settings.</p></div></section>
  <div class="report-caveat"><strong>Browser demo account.</strong> Preferences are saved locally for the selected demo user. Passwords, MFA, connected accounts, sessions, tokens, calendar sync, and secure data requests require a real authentication backend and are not activated here.</div>
  <section class="my-settings-layout"><nav class="panel my-settings-navigation" aria-label="My Settings sections">${categories}</nav>
    <form class="panel my-settings-form" id="my-settings-form"><div class="panel-heading"><div><h2>${escapeHtml(category[1])}</h2><p>${escapeHtml(user.email)} · ${escapeHtml(activeUserRoleNames())}</p></div></div>
      <div class="my-settings-fields">${fields}</div>
      ${category[0] === "appearance" ? `<div class="appearance-preview"><span>Appearance preview</span><button type="button" class="button button-outline button-small" data-action="apply-appearance">Apply saved theme</button></div>` : ""}
      ${category[0] === "activity" ? `<p class="table-footnote">These entries are a local prototype audit trail and may not identify an authenticated person or device.</p>` : ""}
      <div class="settings-save"><button class="button button-primary" type="submit">Save ${escapeHtml(category[1])}</button></div>
    </form>
  </section>`;
}

function activeUserRoleNames() {
  return currentDemoRoles().map((role) => role.name).join(", ") || "No active role";
}

function renderGeneralSettings() {
  const canEdit = hasPermission("settings", "manage");
  return `<section class="page-heading"><div><p class="eyebrow">PLATFORM CONFIGURATION</p><h1>General settings</h1><p class="subheading">Configure company, security, leasing, accounting, resident-service, and platform preferences.</p></div></section>
  <div class="report-caveat"><strong>Prototype configuration only.</strong> These settings are stored in this browser. MFA, payment processing, messages, integrations, e-signatures, and automated jobs are not connected.</div>
  <form id="general-settings-form">
    <section class="settings-grid">${GENERAL_SETTING_CATEGORIES.map(([id, title, description]) => {
      const settings = state.generalSettings?.[id] || { enabled: true, notes: "" };
      return `<article class="panel settings-card"><div class="panel-heading"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div><label class="settings-toggle"><input type="checkbox" name="${id}.enabled" ${settings.enabled ? "checked" : ""} ${canEdit ? "" : "disabled"}><span>${settings.enabled ? "On" : "Off"}</span></label></div><label class="form-field">Configuration notes / defaults<textarea name="${id}.notes" rows="3" maxlength="800" placeholder="Document intended settings or approved defaults." ${canEdit ? "" : "disabled"}>${escapeHtml(settings.notes)}</textarea></label></article>`;
    }).join("")}</section>
    ${canEdit ? `<div class="settings-save"><button class="button button-primary" type="submit">Save general settings</button></div>` : `<p class="form-hint">You can view these settings, but only the President / Executive Director can change them.</p>`}
  </form>`;
}

function bulkRentForm(unitId) {
  const selectedUnit = unitId === undefined ? null : state.units.find((unit) => unit.id === Number(unitId));
  if (unitId !== undefined && !selectedUnit) {
    showToast("That unit could not be found.", true);
    return;
  }
  const properties = state.properties.filter((property) => unitsForProperty(property.id).length > 0);
  const selectedPropertyId = selectedUnit?.propertyId || properties[0]?.id || "";
  const isSingleUnit = Boolean(selectedUnit);
  const selectedPropertyUnits = unitsForProperty(selectedPropertyId);
  if (!properties.length) {
    showToast("No properties have linked unit records to update.", true);
    return;
  }
  const optionMarkup = (units) => units.map((unit) => `<option value="${unit.id}" ${selectedUnit?.id === unit.id ? "selected" : ""}>${escapeHtml(rentUnitLabel(unit))}</option>`).join("");
  openModal(`<form id="bulk-rent-form" class="modal-card" data-single-unit="${isSingleUnit ? selectedUnit.id : ""}">
    <div class="modal-header"><div><p class="eyebrow">PROPERTY RENT UPDATE</p><h2>${isSingleUnit ? `Set rent · ${escapeHtml(unitLabel(selectedUnit.id))}` : "Set monthly rent"}</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="form-grid">
      <label class="form-field full-width">Property<select name="propertyId" required ${isSingleUnit ? "disabled" : ""}>${properties.map((property) => `<option value="${escapeHtml(property.id)}" ${property.id === selectedPropertyId ? "selected" : ""}>${escapeHtml(property.name)}</option>`).join("")}</select>${isSingleUnit ? `<input type="hidden" name="propertyId" value="${escapeHtml(selectedPropertyId)}">` : ""}</label>
      <label class="form-field">Apply to<select name="targetMode" ${isSingleUnit ? "disabled" : ""}><option value="property" ${isSingleUnit ? "" : "selected"}>All units in property</option><option value="selected">Selected units</option><option value="single" ${isSingleUnit ? "selected" : ""}>One unit</option></select>${isSingleUnit ? `<input type="hidden" name="targetMode" value="single">` : ""}</label>
      <label class="form-field">Occupancy<select name="occupancy"><option value="all">Occupied and vacant</option><option value="Occupied">Occupied only</option><option value="Vacant">Vacant only</option></select></label>
      <label class="form-field">Building<select name="building"><option value="all">All buildings</option>${[...new Set(selectedPropertyUnits.map((unit) => unit.building))].sort((a, b) => a - b).map((building) => `<option value="${building}">Building ${String(building).padStart(2, "0")}</option>`).join("")}</select></label>
      <label class="form-field">Change method<select name="mode" required><option value="set">Set monthly base rent</option><option value="increase">Increase by amount</option><option value="decrease">Decrease by amount</option><option value="percent">Adjust by percent</option></select></label>
      <label class="form-field">Amount (PHP) or percent<input name="value" type="number" min="0.01" step="0.01" required placeholder="Enter rent or adjustment"></label>
      <label class="form-field full-width" data-rent-unit-picker ${isSingleUnit ? "" : "hidden"}>Choose unit${isSingleUnit ? "" : "s"}<select name="unitIds" size="8" ${isSingleUnit ? "" : "multiple"} ${isSingleUnit ? "required" : ""}>${optionMarkup(selectedPropertyUnits)}</select><small>Use Ctrl (Windows) or Command (Mac) to select multiple units.</small></label>
    </div>
    <section class="rent-update-preview" id="rent-update-preview" aria-live="polite"><div class="empty-state">Enter an amount to preview the units and monthly rent change before applying.</div></section>
    <p class="form-hint">Updates apply immediately to each unit's base rent. For occupied units, this also updates the current tenant charge while preserving payments already received. New properties with no linked units cannot be updated here.</p>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Apply rent update</button></div>
  </form>`);
  updateBulkRentForm();
}

function updateBulkRentForm() {
  const form = document.getElementById("bulk-rent-form");
  if (!form) return;
  const propertyId = String(new FormData(form).get("propertyId") || "");
  const propertyUnits = unitsForProperty(propertyId);
  const mode = form.elements.mode.value;
  const targetMode = String(new FormData(form).get("targetMode") || "property");
  const building = form.elements.building.value;
  const occupancy = form.elements.occupancy.value;
  const picker = form.querySelector("[data-rent-unit-picker]");
  const unitSelect = form.elements.unitIds;
  const isSingleUnit = Boolean(form.dataset.singleUnit);
  const needsUnit = targetMode === "single" || targetMode === "selected";
  picker.hidden = !needsUnit;
  unitSelect.multiple = targetMode === "selected" && !isSingleUnit;
  unitSelect.required = targetMode === "single" || isSingleUnit;
  const previousSelection = new Set([...unitSelect.selectedOptions].map((option) => option.value));
  unitSelect.innerHTML = propertyUnits.map((unit) => {
    const occupancyMatch = occupancy === "all" || unit.status === occupancy;
    const buildingMatch = building === "all" || unit.building === Number(building);
    const disabled = !occupancyMatch || !buildingMatch;
    return `<option value="${unit.id}" ${previousSelection.has(String(unit.id)) ? "selected" : ""} ${disabled ? "disabled" : ""}>${escapeHtml(rentUnitLabel(unit))} · Current ${money(unitRent(unit))}</option>`;
  }).join("");
  const amount = Number(form.elements.value.value);
  const preview = document.getElementById("rent-update-preview");
  const selectedIds = new Set([...unitSelect.selectedOptions].map((option) => Number(option.value)));
  const affected = propertyUnits.filter((unit) => {
    const occupancyMatch = occupancy === "all" || unit.status === occupancy;
    const buildingMatch = building === "all" || unit.building === Number(building);
    const targetMatch = targetMode === "property" || selectedIds.has(unit.id);
    return occupancyMatch && buildingMatch && targetMatch;
  });
  if (!Number.isFinite(amount) || amount <= 0 || !affected.length || (needsUnit && selectedIds.size === 0)) {
    preview.innerHTML = `<div class="empty-state">${needsUnit && selectedIds.size === 0 ? "Select one or more units to preview the change." : "Choose a property with matching units and enter a positive rent or adjustment."}</div>`;
    return;
  }
  if (targetMode === "single" && selectedIds.size !== 1) {
    preview.innerHTML = `<div class="empty-state">Select exactly one unit for a single-unit rent update.</div>`;
    return;
  }
  const updates = affected.map((unit) => {
    const currentRent = unitRent(unit);
    const proposedRent = mode === "set" ? amount
      : mode === "increase" ? currentRent + amount
        : mode === "decrease" ? currentRent - amount
          : currentRent * (1 + amount / 100);
    const rent = Math.round(proposedRent * 100) / 100;
    return { unit, currentRent, rent, difference: rent - currentRent };
  });
  const previewRows = updates.slice(0, 25).map(({ unit, currentRent, rent, difference }) => `<tr><td>${escapeHtml(unitLabel(unit.id))}</td><td>${escapeHtml(unit.resident || "Vacant")}</td><td>${money(currentRent)}</td><td>${money(rent)}</td><td>${difference >= 0 ? "+" : ""}${money(difference)}</td></tr>`).join("");
  const monthlyChange = updates.reduce((sum, item) => sum + item.difference, 0);
  preview.innerHTML = `<div class="panel-heading"><div><h3>Rent update preview</h3><p>${updates.length} ${updates.length === 1 ? "unit" : "units"} selected · ${escapeHtml(state.properties.find((property) => property.id === propertyId)?.name || "Property")}</p></div><strong>${money(monthlyChange)} / month net change</strong></div><div class="table-wrap"><table><thead><tr><th>Unit</th><th>Tenant</th><th>Current rent</th><th>New rent</th><th>Difference</th></tr></thead><tbody>${previewRows}</tbody></table></div>${updates.length > 25 ? `<p class="table-footnote">Showing first 25 units; all ${updates.length} selected units will be updated.</p>` : ""}<p class="table-footnote">Projected annual change: ${money(monthlyChange * 12)}. Preview is not an approval or a rent notice.</p>`;
}

function paymentMethodForm(propertyId, methodId) {
  const property = state.properties.find((item) => item.id === propertyId);
  const method = property?.paymentMethods.find((item) => item.id === methodId);
  if (!property || (methodId && !method)) {
    showToast("The selected property or payment method could not be found.", true);
    return;
  }
  const typeOptions = PAYMENT_METHOD_TYPES.filter(([type]) => method
    ? type === method.type
    : !property.paymentMethods.some((item) => item.type === type));
  openModal(`<form id="payment-method-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">PROPERTY PAYMENT SETTINGS</p><h2>${method ? "Edit payment method" : "Add payment method"}</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <input type="hidden" name="propertyId" value="${escapeHtml(property.id)}"><input type="hidden" name="methodId" value="${escapeHtml(method?.id || "")}">
    <div class="form-grid">
      <label class="form-field">Method type<select name="type" required>${typeOptions.map(([id, label]) => `<option value="${id}" ${method?.type === id || (!method && typeOptions[0]?.[0] === id) ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select></label>
      <label class="form-field">Display name<input name="label" maxlength="100" value="${escapeHtml(method?.label || "")}" placeholder="e.g. Monthly association dues"></label>
      <label class="form-field">Bank / provider<input name="institution" maxlength="100" value="${escapeHtml(method?.institution || "")}" placeholder="Bank or payment recipient"></label>
      <label class="form-field">Account name<input name="accountName" maxlength="120" value="${escapeHtml(method?.accountName || "")}" placeholder="Registered account holder"></label>
      <label class="form-field">Account number<input name="accountNumber" maxlength="80" value="${escapeHtml(method?.accountNumber || "")}" placeholder="Recipient account number"></label>
      <label class="form-field">Branch / reference<input name="branch" maxlength="100" value="${escapeHtml(method?.branch || "")}" placeholder="Branch, counter, or reference"></label>
      <label class="form-field full-width">Payment instructions<textarea name="instructions" maxlength="600" rows="3" placeholder="Include payment reference format or cash payment location.">${escapeHtml(method?.instructions || "")}</textarea></label>
      <label class="form-field">Resident visibility<select name="active"><option value="false" ${method?.active ? "" : "selected"}>Off</option><option value="true" ${method?.active ? "selected" : ""}>On</option></select></label>
    </div>
    <p class="form-hint">Only enabled methods are shown in tenant and homeowner previews. This does not receive or verify payments. Do not enable until account ownership and instructions have been checked.</p>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Save payment method</button></div>
  </form>`);
}

const reportDefinitions = [
  ["profit-loss", "Profit & Loss (P&L)", "Financial", "accounting", false],
  ["balance-sheet", "Balance Sheet", "Financial", "accounting", false],
  ["cash-flow", "Cash Flow Statement", "Financial", "accounting", false],
  ["general-ledger", "General Ledger", "Financial", "accounting", false],
  ["trial-balance", "Trial Balance", "Financial", "accounting", false],
  ["income-statement", "Income Statement", "Financial", "accounting", false],
  ["bank-reconciliation", "Bank Reconciliation Report", "Financial", "accounting", false],
  ["budget-vs-actual", "Budget vs Actual Report", "Financial", "budget", false],
  ["owner-statement", "Owner Statement", "Financial", "accounting", false],
  ["management-fee", "Management Fee Report", "Financial", "accounting", false],
  ["security-deposit-liability", "Security Deposit Liability Report", "Financial", "accounting", false],
  ["check-register", "Check Register", "Financial", "payments", false],
  ["deposit-detail", "Deposit Detail Report", "Financial", "payments", true],
  ["ap-aging", "AP Aging Report", "Financial", "accounting", false],
  ["open-bills", "Open Bills Report", "Financial", "accounting", false],
  ["ar-aging-summary", "AR Aging Summary", "Accounts Receivable", "ar-summary", true],
  ["ar-aging-detail", "AR Aging Detail", "Accounts Receivable", "accounting", true],
  ["delinquency", "Delinquency Report", "Accounts Receivable", "accounting", true],
  ["resident-ledger", "Resident Ledger", "Accounts Receivable", "accounting", true],
  ["charges-credits", "Charges and Credits Report", "Accounts Receivable", "accounting", true],
  ["rent-roll", "Rent Roll", "Accounts Receivable", "accounting", true],
  ["collections", "Collections Report", "Accounts Receivable", "budget", true],
  ["unpaid-charges", "Unpaid Charges Report", "Accounts Receivable", "accounting", true],
  ["security-deposit", "Security Deposit Report", "Accounts Receivable", "accounting", false],
  ["vacancy", "Vacancy Report", "Leasing", "occupancy", true],
  ["occupancy", "Occupancy Report", "Leasing", "occupancy", true],
  ["expiring-leases", "Expiring Leases Report", "Leasing", "tenants", false],
  ["lease-renewal", "Lease Renewal Report", "Leasing", "tenants", false],
  ["move-in", "Move-In Report", "Leasing", "tenants", false],
  ["move-out", "Move-Out Report", "Leasing", "tenants", false],
  ["leasing-conversion", "Leasing Conversion Report", "Leasing", "tenants", false],
  ["application-activity", "Application Activity Report", "Leasing", "tenants", false],
  ["prospect-activity", "Prospect Activity Report", "Leasing", "tenants", false],
  ["showing-performance", "Showing Performance Report", "Leasing", "tenants", false],
  ["property-directory", "Property Directory", "Property", "properties", true],
  ["unit-directory", "Unit Directory", "Property", "units", true],
  ["unit-status", "Unit Status Report", "Property", "units", true],
  ["property-performance", "Property Performance Report", "Property", "property", true],
  ["property-comparison", "Property Comparison Report", "Property", "properties", true],
  ["unit-availability", "Unit Availability Report", "Property", "occupancy", true],
  ["market-rent", "Market Rent Analysis Report", "Property", "units", false],
  ["open-work-orders", "Open Work Orders Report", "Maintenance", "work-orders", true],
  ["completed-work-orders", "Completed Work Orders Report", "Maintenance", "work-orders", true],
  ["work-order-aging", "Work Order Aging Report", "Maintenance", "work-orders", true],
  ["maintenance-cost", "Maintenance Cost Report", "Maintenance", "work-orders", false],
  ["vendor-performance", "Vendor Performance Report", "Maintenance", "work-orders", false],
  ["inspection-report", "Inspection Report", "Maintenance", "work-orders", false],
  ["maintenance-summary", "Maintenance Request Summary", "Maintenance", "maintenance", true],
  ["owner-statement-owner", "Owner Statement", "Owner", "property", false],
  ["owner-distribution", "Owner Distribution Report", "Owner", "property", false],
  ["owner-contribution", "Owner Contribution Report", "Owner", "property", false],
  ["property-owner-summary", "Property Owner Summary", "Owner", "property", false],
  ["ownership-listing", "Ownership Listing", "Owner", "property", false],
  ["vendor-directory", "Vendor Directory", "Vendor", "maintenance", false],
  ["vendor-insurance", "Vendor Insurance Tracking Report", "Vendor", "maintenance", false],
  ["vendor-payment-history", "Vendor Payment History", "Vendor", "payments", false],
  ["vendor-expense", "Vendor Expense Report", "Vendor", "payments", false],
  ["1099-vendor", "1099 Vendor Report", "Vendor", "payments", false],
  ["resident-directory", "Resident Directory", "Resident", "tenants", true],
  ["resident-balance", "Resident Balance Report", "Resident", "accounting", true],
  ["delinquent-residents", "Delinquent Residents Report", "Resident", "accounting", true],
  ["resident-payment-history", "Resident Payment History", "Resident", "payments", true],
  ["resident-lease", "Resident Lease Report", "Resident", "tenants", false],
  ["resident-contact", "Resident Contact Information Report", "Resident", "tenants", true],
  ["lead-source", "Lead Source Report", "Marketing & Leasing Analytics", "tenants", false],
  ["prospect-funnel", "Prospect Funnel Report", "Marketing & Leasing Analytics", "tenants", false],
  ["conversion-rate", "Conversion Rate Report", "Marketing & Leasing Analytics", "tenants", false],
  ["showing-metrics", "Showing Metrics Report", "Marketing & Leasing Analytics", "tenants", false],
  ["vacancy-loss", "Vacancy Loss Report", "Marketing & Leasing Analytics", "accounting", false],
  ["advertising-performance", "Advertising Performance Report", "Marketing & Leasing Analytics", "tenants", false],
  ["portfolio-dashboard", "Portfolio Dashboard", "Portfolio & Executive", "executive", true],
  ["portfolio-occupancy", "Portfolio Occupancy Report", "Portfolio & Executive", "occupancy", true],
  ["revenue-summary", "Revenue Summary Report", "Portfolio & Executive", "budget", true],
  ["expense-summary", "Expense Summary Report", "Portfolio & Executive", "accounting", false],
  ["noi", "Net Operating Income (NOI) Report", "Portfolio & Executive", "accounting", false],
  ["delinquency-summary", "Delinquency Summary Report", "Portfolio & Executive", "ar-summary", true],
  ["executive-performance", "Executive Property Performance Report", "Portfolio & Executive", "property", true],
  ["executive", "Executive summary", "Additional", "executive", true],
  ["building", "Building reports", "Additional", "buildings", true],
  ["units", "Unit reports", "Additional", "units", true],
  ["maintenance", "Maintenance requests", "Additional", "maintenance", true],
  ["work-orders", "Work orders", "Additional", "work-orders", true],
  ["accounting", "Accounting & financial (rent ledger)", "Additional", "accounting", true],
  ["budget", "Rent collection", "Additional", "budget", true],
  ["incidents", "Community violation incidents", "Additional", "incidents", true],
  ["operations", "Operational performance", "Additional", "operations", true],
  ["monthly-annual", "Monthly & annual management", "Additional", "monthly-annual", true],
  ["community", "Community-wide analytics", "Additional", "community", true],
  ["space-requests", "Community space requests", "Additional", "space-requests", true]
].map(([id, name, group, view, available]) => ({ id, name, group, view, available }));
const COMMON_REPORTS = ["rent-roll", "ar-aging-summary", "delinquency", "occupancy", "vacancy", "profit-loss", "owner-statement", "open-work-orders", "expiring-leases", "security-deposit-liability"];
const reportCatalog = reportDefinitions;

const reportColumns = {
  executive: ["Metric", "Value"],
  "ar-summary": ["Status", "Charges", "Total balance"],
  properties: ["Property", "Property ID", "Type", "Status", "Address", "Units", "Group"],
  payments: ["Receipt", "Resident", "Unit", "Date", "Method", "Amount", "Reference"],
  property: ["Property", "Buildings", "Units", "Occupied", "Vacant", "Occupancy", "Monthly billed", "Outstanding"],
  buildings: ["Building", "Units", "Occupied", "Vacant", "Occupancy", "Monthly billed", "Outstanding"],
  tenants: ["Resident", "Occupation", "Unit", "Household members", "Occupants", "Pets", "Phone", "Email", "Status"],
  units: ["Unit", "Resident", "Occupation", "Occupants", "Pets", "Monthly charges", "Balance", "Status"],
  occupancy: ["Unit", "Resident", "Building", "Occupancy status", "Monthly charges", "Balance"],
  maintenance: ["Work order", "Building", "Unit", "Category", "Priority", "Description", "Status", "Reported"],
  "work-orders": ["Work order", "Building", "Unit", "Category", "Priority", "Description", "Status", "Reported"],
  accounting: ["Resident", "Building", "Unit", "Monthly billed", "Balance", "Status", "Due date"],
  budget: ["Resident", "Building", "Unit", "Billed", "Collected", "Outstanding", "Collection status"],
  incidents: ["Incident", "Building", "Unit", "Category", "Description", "Status", "Reported"],
  operations: ["Area", "Total", "Open / outstanding", "Completed / resolved"],
  "monthly-annual": ["Period", "Occupied units", "Monthly billed", "Collected", "Outstanding", "Maintenance requests", "Incidents"],
  community: ["Metric", "Value"],
  "space-requests": ["Request", "Resident", "Building", "Unit", "Space", "Date", "Attendees", "Purpose", "Status"]
};

function reportRows(type, filters) {
  const units = state.units.filter((unit) => (filters.building === "all" || unit.building === Number(filters.building))
    && (filters.unit === "all" || unit.id === Number(filters.unit)));
  const unitIds = new Set(units.map((unit) => unit.id));
  const inDateRange = (value) => !value || ((!filters.start || value >= filters.start) && (!filters.end || value <= filters.end));
  const row = (cells, meta = {}) => ({ cells: cells.map((value) => String(value ?? "")), ...meta });
  const unitPetCount = (unit) => (unit.pets?.count || 0) + (unit.householdMembers || []).reduce((sum, member) => sum + (member.pets?.count || 0), 0);
  const chargeFor = (id) => state.charges.find((charge) => charge.unitId === id);
  const pct = (value, total) => total ? `${Math.round(value / total * 100)}%` : "0%";

  if (type === "properties") {
    return state.properties.map((property) => {
      const propertyUnits = property.id === "disiplina-village" ? state.units.length : Number(property.profile?.numberOfUnits || 0);
      const group = state.propertyGroups.find((item) => item.propertyIds.includes(property.id));
      return row([property.name, property.id, propertyTypeName(property.type), property.profile?.status || "Active", property.address || property.profile?.city || "—", propertyUnits || "Not recorded", group?.name || "—"]);
    });
  }
  if (type === "payments") {
    return state.payments.filter((payment) => unitIds.has(payment.unitId) && inDateRange(payment.date)).map((payment) =>
      row([payment.id, payment.resident, unitLabel(payment.unitId), shortDate(payment.date), payment.method, money(payment.amount), payment.reference || "—"], {
        unitId: payment.unitId,
        building: units.find((unit) => unit.id === payment.unitId)?.building,
        date: payment.date
      }));
  }
  if (type === "ar-summary") {
    const charges = state.charges.filter((charge) => unitIds.has(charge.unitId) && inDateRange(charge.dueDate));
    return ["Paid", "Due", "Overdue"].map((status) => {
      const group = charges.filter((charge) => charge.status === status);
      return row([status, group.length, money(group.reduce((sum, charge) => sum + charge.balance, 0))], { status });
    });
  }
  if (type === "executive" || type === "property") {
    const occupied = units.filter((unit) => unit.status === "Occupied").length;
    const charges = state.charges.filter((charge) => unitIds.has(charge.unitId));
    const columns = type === "property"
      ? [row(["Disiplina Village Valenzuela City", new Set(units.map((unit) => unit.building)).size, units.length, occupied, units.length - occupied, pct(occupied, units.length), hasPermission("finance", "view") ? money(charges.reduce((sum, item) => sum + item.amount, 0)) : "Restricted", hasPermission("finance", "view") ? money(charges.reduce((sum, item) => sum + item.balance, 0)) : "Restricted"])]
      : [
        row(["Buildings", buildingCount(units)]),
        row(["Units", units.length]),
        row(["Occupied units", occupied]),
        row(["Vacant units", units.length - occupied]),
        row(["Occupancy rate", pct(occupied, units.length)]),
        row(["Monthly billed", hasPermission("finance", "view") ? money(charges.reduce((sum, item) => sum + item.amount, 0)) : "Restricted"]),
        row(["Outstanding balance", hasPermission("finance", "view") ? money(charges.reduce((sum, item) => sum + item.balance, 0)) : "Restricted"]),
        row(["Open maintenance requests", state.maintenance.filter((item) => item.status !== "Complete" && unitIds.has(item.unitId) && inDateRange(item.createdAt)).length]),
        row(["Unresolved incidents", state.violations.filter((item) => item.status !== "Resolved" && unitIds.has(item.unitId) && inDateRange(item.reportedAt)).length])
      ];
    return columns;
  }
  if (type === "buildings") {
    return Array.from({ length: buildingCount(units) }, (_, index) => {
      const building = index + 1;
      const group = units.filter((unit) => unit.building === building);
      if (!group.length) return null;
      const occupied = group.filter((unit) => unit.status === "Occupied").length;
      const charges = state.charges.filter((item) => group.some((unit) => unit.id === item.unitId));
      return row([`Building ${String(building).padStart(2, "0")}`, group.length, occupied, group.length - occupied, pct(occupied, group.length), hasPermission("finance", "view") ? money(charges.reduce((sum, item) => sum + item.amount, 0)) : "Restricted", hasPermission("finance", "view") ? money(charges.reduce((sum, item) => sum + item.balance, 0)) : "Restricted"], { building });
    }).filter(Boolean);
  }
  if (type === "tenants") {
    return units.filter((unit) => unit.status === "Occupied").map((unit) => {
      const occupants = [unit.resident, ...(unit.householdMembers || []).map((member) => member.name).filter(Boolean)];
      const pets = unitPetCount(unit);
      return row([unit.resident, unit.occupation || "Not listed", unitLabel(unit.id), (unit.householdMembers || []).map((member) => member.name).filter(Boolean).join("; ") || "—", occupants.length, pets, hasPermission("resident-data", "view") ? unit.contact?.phone || "—" : "Restricted", hasPermission("resident-data", "view") ? unit.contact?.email || "—" : "Restricted", unit.status], { building: unit.building, unitId: unit.id, status: unit.status });
    });
  }
  if (type === "units" || type === "occupancy") {
    return units.map((unit) => {
      const charge = chargeFor(unit.id);
      const chargeAmount = hasPermission("finance", "view") ? charge ? money(charge.amount) : "—" : "Restricted";
      const chargeBalance = hasPermission("finance", "view") ? charge ? money(charge.balance) : "—" : "Restricted";
      const cells = type === "units"
        ? [unitLabel(unit.id), unit.resident || "—", unit.occupation || "—", unit.resident ? 1 + (unit.householdMembers || []).filter((item) => item.name).length : 0, unitPetCount(unit), chargeAmount, chargeBalance, unit.status]
        : [unitLabel(unit.id), unit.resident || "—", `Building ${String(unit.building).padStart(2, "0")}`, unit.status, chargeAmount, chargeBalance];
      return row(cells, { building: unit.building, unitId: unit.id, status: unit.status });
    });
  }
  if (type === "maintenance" || type === "work-orders") {
    return state.maintenance.filter((item) => unitIds.has(item.unitId) && inDateRange(item.createdAt)).map((item) => {
      const unit = units.find((candidate) => candidate.id === item.unitId);
      return row([item.id, `Building ${String(unit?.building || "").padStart(2, "0")}`, unitLabel(item.unitId), item.category, item.priority, item.description, item.status, shortDate(item.createdAt)], { building: unit?.building, unitId: item.unitId, status: item.status, date: item.createdAt });
    });
  }
  if (type === "accounting" || type === "budget") {
    const charges = state.charges.filter((item) => unitIds.has(item.unitId) && inDateRange(item.dueDate));
    return charges.map((item) => {
      const unit = units.find((candidate) => candidate.id === item.unitId);
      const paid = item.amount - item.balance;
      const cells = type === "accounting"
        ? [item.resident, `Building ${String(unit?.building || "").padStart(2, "0")}`, unitLabel(item.unitId), money(item.amount), money(item.balance), item.status, shortDate(item.dueDate)]
        : [item.resident, `Building ${String(unit?.building || "").padStart(2, "0")}`, unitLabel(item.unitId), money(item.amount), money(paid), money(item.balance), item.status];
      return row(cells, { building: unit?.building, unitId: item.unitId, status: item.status, date: item.dueDate });
    });
  }
  if (type === "incidents") {
    return state.violations.filter((item) => unitIds.has(item.unitId) && inDateRange(item.reportedAt)).map((item) => {
      const unit = units.find((candidate) => candidate.id === item.unitId);
      return row([item.id, `Building ${String(unit?.building || "").padStart(2, "0")}`, unitLabel(item.unitId), item.category, item.description, item.status, shortDate(item.reportedAt)], { building: unit?.building, unitId: item.unitId, status: item.status, date: item.reportedAt });
    });
  }
  if (type === "operations") {
    const maintenance = state.maintenance.filter((item) => unitIds.has(item.unitId) && inDateRange(item.createdAt));
    const incidents = state.violations.filter((item) => unitIds.has(item.unitId) && inDateRange(item.reportedAt));
    const outstanding = state.charges.filter((item) => unitIds.has(item.unitId) && inDateRange(item.dueDate));
    const reservations = state.spaceReservations.filter((item) => unitIds.has(item.unitId) && inDateRange(item.date));
    return [
      row(["Maintenance", maintenance.length, maintenance.filter((item) => item.status !== "Complete").length, maintenance.filter((item) => item.status === "Complete").length]),
      row(["Incidents", incidents.length, incidents.filter((item) => item.status !== "Resolved").length, incidents.filter((item) => item.status === "Resolved").length]),
      row(["Rent balances", outstanding.length, money(outstanding.reduce((sum, item) => sum + item.balance, 0)), outstanding.filter((item) => item.balance === 0).length]),
      row(["Space requests", reservations.length, reservations.filter((item) => item.status === "Pending").length, reservations.filter((item) => item.status === "Approved").length])
    ];
  }
  if (type === "monthly-annual") {
    const periods = new Set([
      ...state.charges.filter((item) => unitIds.has(item.unitId)).map((item) => item.dueDate?.slice(0, 7)),
      ...state.payments.filter((item) => unitIds.has(item.unitId)).map((item) => item.date?.slice(0, 7))
    ].filter((period) => period && inDateRange(`${period}-01`)));
    const monthlyRows = [...periods].sort().map((period) => {
      const charges = state.charges.filter((item) => unitIds.has(item.unitId) && item.dueDate?.startsWith(period) && inDateRange(item.dueDate));
      const payments = state.payments.filter((item) => unitIds.has(item.unitId) && item.date?.startsWith(period) && inDateRange(item.date));
      const monthMaintenance = state.maintenance.filter((item) => unitIds.has(item.unitId) && item.createdAt?.startsWith(period) && inDateRange(item.createdAt));
      const incidents = state.violations.filter((item) => unitIds.has(item.unitId) && item.reportedAt?.startsWith(period) && inDateRange(item.reportedAt));
      return row([period, units.filter((unit) => unit.status === "Occupied").length, money(charges.reduce((sum, item) => sum + item.amount, 0)), money(payments.reduce((sum, item) => sum + item.amount, 0)), money(charges.reduce((sum, item) => sum + item.balance, 0)), monthMaintenance.length, incidents.length]);
    });
    const years = [...new Set([...periods].map((period) => period.slice(0, 4)))].sort();
    const annualRows = years.map((year) => {
      const charges = state.charges.filter((item) => unitIds.has(item.unitId) && item.dueDate?.startsWith(year) && inDateRange(item.dueDate));
      const payments = state.payments.filter((item) => unitIds.has(item.unitId) && item.date?.startsWith(year) && inDateRange(item.date));
      const yearMaintenance = state.maintenance.filter((item) => unitIds.has(item.unitId) && item.createdAt?.startsWith(year) && inDateRange(item.createdAt));
      const incidents = state.violations.filter((item) => unitIds.has(item.unitId) && item.reportedAt?.startsWith(year) && inDateRange(item.reportedAt));
      return row([`${year} annual`, units.filter((unit) => unit.status === "Occupied").length, money(charges.reduce((sum, item) => sum + item.amount, 0)), money(payments.reduce((sum, item) => sum + item.amount, 0)), money(charges.reduce((sum, item) => sum + item.balance, 0)), yearMaintenance.length, incidents.length]);
    });
    return [...monthlyRows, ...annualRows];
  }
  if (type === "community") {
    const occupied = units.filter((unit) => unit.status === "Occupied").length;
    return [
      row(["Households", occupied]),
      row(["Registered residents", units.filter((unit) => unit.status === "Occupied").reduce((sum, unit) => sum + 1 + (unit.householdMembers || []).filter((member) => member.name).length, 0)]),
      row(["Registered pets", units.reduce((sum, unit) => sum + unitPetCount(unit), 0)]),
      row(["Community rule types", state.violationCatalog.filter((item) => item.active).length]),
      row(["Violation reports", state.violations.filter((item) => unitIds.has(item.unitId) && inDateRange(item.reportedAt)).length]),
      row(["Shared-space requests", state.spaceReservations.filter((item) => unitIds.has(item.unitId) && inDateRange(item.date)).length])
    ];
  }
  if (type === "space-requests") {
    return state.spaceReservations.filter((item) => unitIds.has(item.unitId) && inDateRange(item.date)).map((item) => {
      const unit = units.find((candidate) => candidate.id === item.unitId);
      return row([item.id, item.resident, `Building ${String(unit?.building || "").padStart(2, "0")}`, unitLabel(item.unitId), item.space, shortDate(item.date), item.attendees, item.purpose, item.status], { building: unit?.building, unitId: item.unitId, status: item.status, date: item.date });
    });
  }
  return [];
}

function readReportFilters() {
  return {
    start: document.getElementById("report-start")?.value || "",
    end: document.getElementById("report-end")?.value || "",
    building: document.getElementById("report-building")?.value || "all",
    unit: document.getElementById("report-unit")?.value || "all",
    status: document.getElementById("report-status")?.value || "all"
  };
}

function reportResult(report, filters) {
  const requiredModules = {
    executive: ["dashboard", "finance", "units", "maintenance", "incidents"],
    property: ["units", "finance"],
    buildings: ["units", "finance"],
    tenants: ["tenants"],
    units: ["units"],
    occupancy: ["units"],
    maintenance: ["maintenance"],
    "work-orders": ["maintenance"],
    accounting: ["finance"],
    budget: ["finance"],
    payments: ["finance"],
    "ar-summary": ["finance"],
    incidents: ["incidents"],
    operations: ["finance", "maintenance", "incidents", "community"],
    "monthly-annual": ["finance", "units", "maintenance", "incidents"],
    community: ["community"],
    "space-requests": ["community"],
    properties: ["units"]
  }[report.view] || [];
  const allowed = requiredModules.every((module) => hasPermission(module, "view"));
  if (!report.available || !allowed) return { report, rows: [], columns: reportColumns[report.view] || [], allowed };
  let rows = reportRows(report.view, filters);
  if (report.id === "vacancy" || report.id === "unit-availability") rows = rows.filter((item) => item.status === "Vacant");
  if (report.id === "occupancy" || report.id === "portfolio-occupancy") rows = rows.filter((item) => item.status === "Occupied");
  if (report.id === "open-work-orders") rows = rows.filter((item) => item.status !== "Complete");
  if (report.id === "completed-work-orders") rows = rows.filter((item) => item.status === "Complete");
  if (report.id === "delinquency-summary") rows = rows.filter((item) => item.status === "Overdue");
  if (["ar-aging-detail", "delinquency", "unpaid-charges", "resident-balance", "delinquent-residents"].includes(report.id)) {
    rows = rows.filter((item) => item.status !== "Paid");
  }
  if (filters.status !== "all") rows = rows.filter((item) => item.status === filters.status);
  const columns = report.id === "work-order-aging"
    ? [...(reportColumns[report.view] || []), "Age (days)"]
    : reportColumns[report.view] || [];
  if (report.id === "work-order-aging") {
    rows = rows.map((item) => ({ ...item, cells: [...item.cells, String(Math.max(0, Math.floor((Date.now() - new Date(`${item.date || localDateString()}T00:00:00`).getTime()) / 86400000)))] }));
  }
  return { report, rows, columns, allowed };
}

function currentReportSections(filters = readReportFilters()) {
  if (selectedReport === "custom") {
    return reportCatalog.filter((item) => selectedReports.has(item.id)).map((item) => reportResult(item, filters));
  }
  const report = reportCatalog.find((item) => item.id === selectedReport) || reportCatalog[0];
  return [reportResult(report, filters)];
}

function reportTable(section) {
  if (!section.allowed) return `<div class="empty-state">Your demo role does not have permission to view this report's source data.</div>`;
  if (!section.report.available) return `<div class="empty-state"><strong>${escapeHtml(section.report.name)} is listed but cannot be generated from current records.</strong><br>Its required source data is not entered or tracked in this browser prototype.</div>`;
  return `<div class="table-wrap"><table><thead><tr>${section.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${section.rows.map((item) => `<tr>${item.cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${section.columns.length}"><div class="empty-state">No records match these filters.</div></td></tr>`}</tbody></table></div>`;
}

function renderReports() {
  const filters = readReportFilters();
  const sections = currentReportSections(filters);
  const rowsCount = sections.reduce((sum, section) => sum + section.rows.length, 0);
  const buildings = [...new Set(state.units.map((unit) => unit.building))].sort((a, b) => a - b);
  const selectedBuilding = filters.building === "all" ? null : Number(filters.building);
  const unitOptions = state.units.filter((unit) => !selectedBuilding || unit.building === selectedBuilding);
  const currentReport = reportCatalog.find((item) => item.id === selectedReport);
  const statuses = [...new Set(sections.flatMap((section) => section.rows.map((item) => item.status).filter(Boolean)))].sort();
  const selectedNames = sections.map((section) => section.report.name).join(", ");
  const catalogGroups = [...new Set(reportCatalog.map((item) => item.group))];
  return `<section class="page-heading"><div><p class="eyebrow">CENTRAL REPORTING</p><h1>Reports &amp; analytics</h1><p class="subheading">Select an individual report or combine reports into a custom package.</p></div><div class="heading-actions"><button class="button button-outline" data-action="export-report">Export CSV</button><button class="button button-outline" data-action="export-report-word">Export Word</button><button class="button button-primary" data-action="print-report">Print / Save PDF</button></div></section>
  <div class="report-caveat"><strong>Prototype reporting only.</strong> Report data comes from this browser. Financial statements, bank reconciliation, AP, leases, vendor/owner records, marketing, and several other datasets are not present and will be identified as unavailable.</div>
  <section class="metrics-grid compact-metrics report-metrics">${card("Report sections", String(sections.length), selectedReport === "custom" ? "Custom consolidated report" : currentReport?.group || "Selected report", "R", "metric-blue")}${card("Available records", String(rowsCount), "From currently tracked sources", "D", "metric-green")}${card("Reports available", String(reportCatalog.filter((item) => item.available).length), `of ${reportCatalog.length} listed`, "✓")}${card("Source data missing", String(reportCatalog.filter((item) => !item.available).length), "Shown with limitations—not estimated", "!", "metric-amber")}</section>
  <section class="panel report-filter-panel"><div class="panel-heading"><div><h2>Report selection and filters</h2><p>Choose an individual report, or select multiple reports and use the custom consolidated option.</p></div></div><div class="report-filters">
    <label class="form-field">Report<select id="report-type"><option value="custom" ${selectedReport === "custom" ? "selected" : ""}>Custom consolidated report</option>${catalogGroups.map((group) => `<optgroup label="${escapeHtml(group)}">${reportCatalog.filter((item) => item.group === group).map((item) => `<option value="${item.id}" ${selectedReport === item.id ? "selected" : ""}>${escapeHtml(item.name)}${item.available ? "" : " · source data not tracked"}</option>`).join("")}</optgroup>`).join("")}</select></label>
    <label class="form-field">From<input id="report-start" type="date" value="${escapeHtml(filters.start)}"></label><label class="form-field">To<input id="report-end" type="date" value="${escapeHtml(filters.end)}"></label>
    <label class="form-field">Building<select id="report-building"><option value="all">All buildings</option>${buildings.map((building) => `<option value="${building}" ${filters.building === String(building) ? "selected" : ""}>Building ${String(building).padStart(2, "0")}</option>`).join("")}</select></label>
    <label class="form-field">Unit<select id="report-unit"><option value="all">All units</option>${unitOptions.map((unit) => `<option value="${unit.id}" ${filters.unit === String(unit.id) ? "selected" : ""}>${escapeHtml(unitLabel(unit.id))}</option>`).join("")}</select></label>
    <label class="form-field">Status<select id="report-status"><option value="all">All statuses</option>${statuses.map((status) => `<option value="${escapeHtml(status)}" ${filters.status === status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}</select></label>
  </div>${selectedReport === "custom" ? `<div class="custom-report-picker"><strong>Include reports</strong><div class="custom-report-options">${reportCatalog.map((item) => `<label class="pet-option"><input type="checkbox" data-custom-report="${escapeHtml(item.id)}" ${selectedReports.has(item.id) ? "checked" : ""}>${escapeHtml(item.name)}${item.available ? "" : " (source missing)"}</label>`).join("")}</div></div>` : ""}</section>
  <section class="panel directory-panel report-result" id="reports-printable"><div class="panel-heading report-result-heading"><div><h2>${selectedReport === "custom" ? "Custom consolidated report" : escapeHtml(currentReport?.name || "Report")}</h2><p>${rowsCount} available records · Generated ${shortDate(localDateString())}${selectedReport === "custom" && selectedNames ? ` · ${escapeHtml(selectedNames)}` : ""}</p></div><span class="badge ${sections.every((item) => item.allowed && item.report.available) ? "badge-green" : "badge-amber"}">${sections.every((item) => item.allowed && item.report.available) ? "Source data available" : "Some data unavailable or restricted"}</span></div>
    ${sections.length ? sections.map((section) => `<section class="report-section"><div class="panel-heading"><div><h2>${escapeHtml(section.report.name)}</h2><p>${!section.allowed ? "Role permission required" : section.report.available ? `${section.rows.length} matching records` : "Source data required"}</p></div><span class="badge ${section.allowed && section.report.available ? "badge-green" : "badge-gray"}">${!section.allowed ? "Restricted" : section.report.available ? "Available" : "Not tracked"}</span></div>${reportTable(section)}</section>`).join("") : `<div class="empty-state">Select at least one report above to build a custom report.</div>`}
    <p class="table-footnote">CSV can be opened in Excel. Word export creates an editable .doc-compatible file; PDF uses your browser's print dialog. These are not audited financial statements.</p></section>
  <section class="panel report-catalog-panel"><div class="panel-heading"><div><h2>Report library</h2><p>All requested individual reports are listed. Missing source-data types remain available for selection but are not generated with invented values.</p></div></div>
    ${COMMON_REPORTS.map((id) => reportCatalog.find((item) => item.id === id)).filter(Boolean).map((item) => `<button class="report-tile report-shortcut" data-report="${item.id}"><span>Commonly used</span><strong>${escapeHtml(item.name)}</strong><small>${item.available ? "Open report" : "Source data required"}</small></button>`).join("")}
    <div class="report-catalog">${reportCatalog.map((item) => `<button class="report-tile ${item.id === selectedReport ? "report-tile-active" : ""} ${item.available ? "" : "report-tile-disabled"}" data-report="${item.id}"><span>${escapeHtml(item.group)}</span><strong>${escapeHtml(item.name)}</strong><small>${item.available ? "Data available" : "Source data not tracked"}</small></button>`).join("")}</div>
  </section>
  <div class="delivery-warning report-security-note"><span class="attention-icon attention-amber">!</span><div><strong>Access control and audit trail are not production security.</strong><p>Local role checks are not authenticated access control. Use a secured server-side reporting system before entering real resident or financial information.</p></div></div>`;
}

function renderAccessControl() {
  const access = state.accessControl;
  const activeUsers = access.users.filter((user) => user.status === "Active").length;
  const presidentRoleId = "president-executive-director";
  const tabButton = (id, label, module, permission = "view") => hasPermission(module, permission)
    ? `<button class="tab-button ${usersTab === id ? "tab-active" : ""}" data-action="access-tab" data-tab="${id}">${label}</button>`
    : "";
  let content = "";
  if (usersTab === "roles" && hasPermission("users", "manage")) {
    content = `<div class="access-list">${access.roles.map((role) => `<article class="access-item ${role.active ? "" : "access-item-inactive"}"><div><strong>${escapeHtml(role.name)}</strong><small>${Object.values(role.permissions).flat().length} assigned permission grants · ${role.active ? "Active" : "Inactive"}</small></div><div class="access-actions"><span class="badge ${role.active ? "badge-green" : "badge-gray"}">${role.active ? "Active" : "Inactive"}</span><button class="table-action" data-action="edit-role" data-role-id="${escapeHtml(role.id)}">Customize</button>${role.id !== presidentRoleId ? `<button class="table-action" data-action="toggle-role" data-role-id="${escapeHtml(role.id)}">${role.active ? "Deactivate" : "Activate"}</button>` : ""}</div></article>`).join("")}</div>`;
  } else if (usersTab === "audit" && hasPermission("audit", "view")) {
    const logs = [...access.auditLog].reverse();
    content = logs.length ? `<div class="table-wrap"><table><thead><tr><th>Date / time</th><th>Actor</th><th>Module</th><th>Activity</th></tr></thead><tbody>${logs.map((entry) => `<tr><td>${escapeHtml(new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.timestamp)))}</td><td>${escapeHtml(entry.actor)}</td><td>${escapeHtml(pageTitles[entry.module] || entry.module)}</td><td>${escapeHtml(entry.action)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No local audit events recorded yet.</div>`;
  } else {
    content = access.users.length ? `<div class="table-wrap"><table><thead><tr><th>User</th><th>Assigned roles</th><th>Department</th><th>Property scope</th><th>Status</th><th></th></tr></thead><tbody>${access.users.map((user) => `<tr><td><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.email)}</small></td><td>${user.roles.map((id) => escapeHtml(roleName(id))).join("<br>")}</td><td>${escapeHtml(user.department || "—")}</td><td>${user.propertyIds.includes("*") ? "All properties" : user.propertyIds.map((id) => id === "disiplina-village" ? "Disiplina Village" : escapeHtml(id)).join(", ") || "None"}</td><td><span class="badge ${user.status === "Active" ? "badge-green" : "badge-gray"}">${escapeHtml(user.status)}</span></td><td><button class="table-action" data-action="edit-user" data-user-id="${escapeHtml(user.id)}">Edit</button>${user.id !== "USER-0001" || user.status !== "Active" ? `<button class="table-action" data-action="toggle-user" data-user-id="${escapeHtml(user.id)}">${user.status === "Active" ? "Deactivate" : "Activate"}</button>` : ""}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No user accounts have been created.</div>`;
  }
  return `<section class="page-heading"><div><p class="eyebrow">ADMINISTRATION</p><h1>Users &amp; access</h1><p class="subheading">Manage the eight VHMS positions, user-role assignments, and permission grants.</p></div>${hasPermission("users", "manage") ? `<button class="button button-primary" data-action="${usersTab === "roles" ? "new-role" : "new-user"}">＋ ${usersTab === "roles" ? "Create role" : "Add user"}</button>` : ""}</section>
  <div class="report-caveat"><strong>RBAC demonstration only—not security enforcement.</strong> The role preview, user records, and permissions are stored in browser local storage. There is no authentication or server-side authorization; do not treat these controls as protecting data.</div>
  <section class="metrics-grid compact-metrics">
    ${card("Role templates", String(access.roles.length), "Eight built-in VHMS positions", "R", "metric-blue")}
    ${card("Active roles", String(access.roles.filter((role) => role.active).length), "Available in role preview", "✓", "metric-green")}
    ${card("Active user records", String(activeUsers), `${access.users.length} local user records`, "U", "")}
    ${card("Audit entries", String(access.auditLog.length), "Local demo events · not tamper-proof", "A", "metric-amber")}
  </section>
  <section class="panel directory-panel access-panel">
    <div class="tabs">${tabButton("users", `Users <span class="tab-count">${access.users.length}</span>`, "users")}${tabButton("roles", `Roles <span class="tab-count">${access.roles.length}</span>`, "users", "manage")}${tabButton("audit", `Audit trail <span class="tab-count">${access.auditLog.length}</span>`, "audit")}</div>
    ${usersTab === "roles" && !hasPermission("users", "manage") ? `<div class="empty-state">Your role cannot manage role definitions.</div>` : usersTab === "audit" && !hasPermission("audit", "view") ? `<div class="empty-state">Your role cannot view audit records.</div>` : content}
    <p class="table-footnote">Demo user: <strong>${escapeHtml(state.accessControl.users.find((user) => user.id === state.accessControl.demoUserId)?.name || "No active user")}</strong> · Role preview: <strong>${escapeHtml(currentDemoRoles().map((role) => role.name).join(" + ") || "No active role")}</strong>. Changing these previews does not authenticate a user or secure data.</p>
  </section>
  ${usersTab === "roles" ? `<section class="panel directory-panel permission-guide"><div class="panel-heading"><div><h2>Permission categories</h2><p>Role templates support all VHMS permission types.</p></div></div><div class="permission-chips">${PERMISSION_TYPES.map((permission) => `<span class="badge badge-blue">${permission.toUpperCase()}</span>`).join("")}</div></section>` : ""}
  <section class="panel access-scope-note"><div class="panel-heading"><div><h2>Security controls for production</h2><p>These controls are requirements, not active guarantees in this browser app.</p></div></div><ul><li>Authenticate users and enforce permissions in server-side APIs and database queries.</li><li>Scope every request by assigned properties and departments; support multiple roles and deny-by-default.</li><li>Enforce independent approvals, secure sessions, account suspension/reset, and archived-record restoration.</li><li>Write tamper-evident audit events and backup/restore records on the server.</li></ul></section>`;
}

function userForm(userId) {
  const user = userId ? state.accessControl.users.find((item) => item.id === userId) : null;
  if (userId && !user) {
    showToast("That user record could not be found.", true);
    return;
  }
  const assignedRoles = new Set(user?.roles || []);
  openModal(`<form id="access-user-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">USER ADMINISTRATION</p><h2>${user ? "Edit user" : "Create user record"}</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <input type="hidden" name="userId" value="${escapeHtml(user?.id || "")}">
    <div class="form-grid">
      <label class="form-field full-width">Full name<input name="name" maxlength="120" value="${escapeHtml(user?.name || "")}" required></label>
      <label class="form-field full-width">Email address<input name="email" type="email" maxlength="254" value="${escapeHtml(user?.email || "")}" required></label>
      <label class="form-field">Department<input name="department" maxlength="100" value="${escapeHtml(user?.department || "")}" placeholder="Department"></label>
      <label class="form-field">Account status<select name="status"><option ${user?.status === "Active" || !user ? "selected" : ""}>Active</option><option ${user?.status === "Suspended" ? "selected" : ""}>Suspended</option><option ${user?.status === "Deactivated" ? "selected" : ""}>Deactivated</option></select></label>
      <label class="form-field full-width">Property scope<select name="propertyScope"><option value="disiplina-village" ${user?.propertyIds?.includes("*") ? "" : "selected"}>Disiplina Village Valenzuela City</option><option value="*" ${user?.propertyIds?.includes("*") ? "selected" : ""}>All properties (future expansion)</option></select></label>
      <fieldset class="permission-role-list full-width"><legend>Assigned roles (multiple roles supported)</legend>${state.accessControl.roles.filter((role) => role.active).map((role) => `<label class="pet-option"><input type="checkbox" name="userRoles" value="${escapeHtml(role.id)}" ${assignedRoles.has(role.id) ? "checked" : ""}>${escapeHtml(role.name)}</label>`).join("")}</fieldset>
    </div>
    <p class="form-hint">Creates or edits a browser-local user record only. No account, password, login, reset, or invitation is created.</p>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Save user</button></div>
  </form>`);
}

function roleForm(roleId) {
  const role = roleId ? state.accessControl.roles.find((item) => item.id === roleId) : null;
  const isPresidentRole = role?.id === "president-executive-director";
  const canEditDashboards = canManageRoleDashboards() && !isPresidentRole;
  const dashboardWidgets = new Set(role?.dashboardWidgets || DEFAULT_DASHBOARD_WIDGETS[role?.id] || []);
  const dashboardViews = new Set(role?.dashboardViews || DEFAULT_DASHBOARD_VIEWS[role?.id] || ["association"]);
  const permissionRows = ACCESS_MODULES.map(([module, label]) => {
    const granted = new Set(role?.permissions?.[module] || []);
    return `<tr><th>${escapeHtml(label)}</th>${PERMISSION_TYPES.map((permission) => `<td><label class="permission-checkbox"><input type="checkbox" name="rolePermission" value="${module}:${permission}" ${granted.has(permission) ? "checked" : ""} ${isPresidentRole ? "disabled" : ""} aria-label="${escapeHtml(label)} ${permission}">${permission.slice(0, 3).toUpperCase()}</label></td>`).join("")}</tr>`;
  }).join("");
  const dashboardEditor = canEditDashboards
    ? `<section class="repeatable-section dashboard-role-settings"><div class="repeatable-heading"><div><span class="form-field-label">Dashboard views for this role</span><small>Only the President / Executive Director can assign role dashboards.</small></div></div><div class="dashboard-widget-options">${DASHBOARD_VIEWS.map(([id, label]) => `<label class="pet-option"><input type="checkbox" name="dashboardView" value="${id}" ${dashboardViews.has(id) ? "checked" : ""}>${escapeHtml(label)}</label>`).join("")}</div><div class="repeatable-heading"><div><span class="form-field-label">Association dashboard widgets</span><small>Choose the sections shown on the association-management dashboard.</small></div></div><div class="dashboard-widget-options">${DASHBOARD_WIDGETS.map(([id, label]) => `<label class="pet-option"><input type="checkbox" name="dashboardWidget" value="${id}" ${dashboardWidgets.has(id) ? "checked" : ""}>${escapeHtml(label)}</label>`).join("")}</div></section>`
    : `<div class="report-caveat dashboard-role-settings"><strong>Dashboard settings are read-only.</strong> Only the President / Executive Director can add or change role dashboards.</div>`;
  openModal(`<form id="access-role-form" class="modal-card role-form-modal">
    <div class="modal-header"><div><p class="eyebrow">ROLE CONFIGURATION</p><h2>${role ? "Customize role" : "Create role"}</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <input type="hidden" name="roleId" value="${escapeHtml(role?.id || "")}">
    <div class="form-grid role-metadata">
      <label class="form-field">Role name<input name="name" maxlength="100" value="${escapeHtml(role?.name || "")}" ${isPresidentRole ? "readonly" : ""} required></label>
      <label class="form-field">Role status<select name="active" ${isPresidentRole ? "disabled" : ""}><option value="true" ${role?.active !== false ? "selected" : ""}>Active</option><option value="false" ${role?.active === false ? "selected" : ""}>Inactive</option></select></label>
    </div>
    <p class="form-hint">${isPresidentRole ? "President / Executive Director retains full permissions and cannot be deactivated. Customize other roles here." : "Configure grants by module. An empty module grants no access."}</p>
    ${dashboardEditor}
    <div class="table-wrap permission-matrix"><table><thead><tr><th>Module / permission</th>${PERMISSION_TYPES.map((permission) => `<th>${permission.slice(0, 3).toUpperCase()}</th>`).join("")}</tr></thead><tbody>${permissionRows}</tbody></table></div>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Save role</button></div>
  </form>`);
}

function currentReportFilters() {
  return readReportFilters();
}

function exportReportCsv() {
  const sections = currentReportSections(currentReportFilters());
  if (!sections.length) {
    showToast("Select at least one report before exporting.", true);
    return;
  }
  const csvRows = [];
  sections.forEach((section) => {
    csvRows.push([section.report.name]);
    if (!section.allowed) {
      csvRows.push(["Availability", "Access restricted by current demo role"]);
      csvRows.push([]);
      return;
    }
    if (!section.report.available) {
      csvRows.push(["Availability", "Source data not tracked in this prototype"]);
      csvRows.push([]);
      return;
    }
    csvRows.push(section.columns, ...section.rows.map((item) => item.cells));
    csvRows.push([]);
  });
  const csv = csvRows.map((row) => row.map((value) => {
    const text = String(value ?? "");
    const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `sit-with-haven-${selectedReport === "custom" ? "custom-report" : selectedReport}-${localDateString()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  recordAudit(`Exported ${sections.map((section) => section.report.name).join(", ")} as CSV`, "reports");
  showToast("Report exported as CSV. CSV can be opened in Excel; this prototype does not generate native .xlsx files.");
}

function exportReportWord() {
  const sections = currentReportSections(currentReportFilters());
  if (!sections.length) {
    showToast("Select at least one report before exporting.", true);
    return;
  }
  const htmlSections = sections.map((section) => `<h2>${escapeHtml(section.report.name)}</h2>${!section.allowed
    ? `<p>Not generated: access is restricted for the current demo role.</p>`
    : section.report.available
      ? `<table border="1" cellspacing="0" cellpadding="5"><thead><tr>${section.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${section.rows.map((row) => `<tr>${row.cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${section.columns.length}">No records match these filters.</td></tr>`}</tbody></table>`
      : `<p>Not generated: required source data is not tracked in this browser prototype.</p>`}`).join("");
  const contents = `<!doctype html><html><head><meta charset="utf-8"><title>Sit with Haven report</title></head><body><h1>Sit with Haven — ${selectedReport === "custom" ? "Custom report" : escapeHtml(sections[0].report.name)}</h1><p>Generated ${escapeHtml(shortDate(localDateString()))}. Browser-local prototype data.</p>${htmlSections}<p>Report format: Word-compatible HTML document (.doc). This is not a native .docx file.</p></body></html>`;
  const blob = new Blob([contents], { type: "application/msword;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `sit-with-haven-${selectedReport === "custom" ? "custom-report" : selectedReport}-${localDateString()}.doc`;
  link.click();
  URL.revokeObjectURL(link.href);
  recordAudit(`Exported ${sections.map((section) => section.report.name).join(", ")} as Word-compatible document`, "reports");
  showToast("Word-compatible .doc report exported. This is not a native .docx file.");
}

function renderUnits() {
  const search = (document.getElementById("unit-search")?.value || pageSearchTerms.units).trim().toLowerCase();
  const buildingFilter = document.getElementById("building-filter")?.value || "all";
  const occupancyFilter = document.getElementById("occupancy-filter")?.value || "all";
  const properties = state.properties.filter((property) => property.type !== "hoa");
  const property = properties.find((item) => item.id === selectedPropertyId) || properties[0];
  if (property) selectedPropertyId = property.id;
  const propertyUnits = property ? unitsForProperty(property.id) : [];
  const filtered = propertyUnits.filter((unit) => {
    const householdSearch = (unit.householdMembers || []).map((member) => `${member.name} ${member.occupation}`).join(" ");
    const contactSearch = hasPermission("resident-data", "view") ? `${unit.contact?.address} ${unit.contact?.phone} ${unit.contact?.email}` : "";
    const queryMatch = !search || `${unit.resident} ${unit.occupation} ${householdSearch} ${contactSearch} B${unit.building} ${unit.unitNumber}`.toLowerCase().includes(search);
    const buildingMatch = buildingFilter === "all" || unit.building === Number(buildingFilter);
    const occupancyMatch = occupancyFilter === "all" || unit.status === occupancyFilter;
    return queryMatch && buildingMatch && occupancyMatch;
  });
  const pageSize = 30;
  const maxPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1);
  unitPage = Math.min(unitPage, maxPage);
  const visible = filtered.slice(unitPage * pageSize, (unitPage + 1) * pageSize);

  const totalBuildings = buildingCount(propertyUnits);
  const remainingBuildings = MAX_BUILDINGS - totalBuildings;
  const canManageUnits = hasPermission("units", "manage");
  return `<section class="page-heading"><div><p class="eyebrow">PROPERTY DIRECTORY · ${escapeHtml(propertyTypeName(property?.type || "mfr"))}</p><h1>Units &amp; residents</h1><p class="subheading">${escapeHtml(property?.name || "Select a property")} · ${propertyUnits.length} units across ${totalBuildings} buildings.</p></div><div class="heading-actions">${properties.length > 1 ? `<label class="portal-switcher"><span>Property</span><select id="units-property-select">${properties.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === property?.id ? "selected" : ""}>${escapeHtml(item.name)} · ${escapeHtml(propertyTypeName(item.type))}</option>`).join("")}</select></label>` : ""}<button class="button button-outline" data-action="export">Export CSV</button>${canManageBulkRent() ? `<button class="button button-outline" data-action="bulk-rent-edit">Bulk rent update</button>` : ""}${canManageUnits ? `<button class="button button-outline" data-action="new-unit" data-property-id="${escapeHtml(property?.id || "")}" ${!property ? "disabled" : ""}>＋ Add unit</button><button class="button button-outline" data-action="import-units" data-property-id="${escapeHtml(property?.id || "")}" ${!property ? "disabled" : ""}>Upload units</button>${property?.type === "mfr" || (property?.type === "building" && propertyUnits.length === 0) ? `<button class="button button-outline" data-action="add-building" ${remainingBuildings === 0 ? "disabled" : ""}>＋ ${property?.type === "building" ? "Add 36 units" : `Add building (${remainingBuildings} left)`}</button>` : ""}` : ""}<button class="button button-primary" data-action="tenant-form">＋ Add tenant</button></div></section>
  <section class="panel directory-panel">
    <div class="filter-row">
      <label class="search-field"><span>⌕</span><input id="unit-search" type="search" placeholder="Search resident, contact, or unit" value="${escapeHtml(search)}"></label>
      <select id="building-filter" aria-label="Filter by building"><option value="all">All buildings</option>${Array.from({ length: totalBuildings }, (_, index) => `<option value="${index + 1}" ${buildingFilter === String(index + 1) ? "selected" : ""}>Building ${String(index + 1).padStart(2, "0")}</option>`).join("")}</select>
      <select id="occupancy-filter" aria-label="Filter by occupancy"><option value="all">All occupancy</option><option value="Occupied" ${occupancyFilter === "Occupied" ? "selected" : ""}>Occupied</option><option value="Vacant" ${occupancyFilter === "Vacant" ? "selected" : ""}>Vacant</option></select>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Unit</th><th>Resident / household</th><th>Pets</th><th>Monthly base rent</th><th>Status</th><th></th></tr></thead><tbody>${visible.map((unit) => {
      const members = unit.householdMembers || [];
      const occupantCount = unit.resident ? 1 + members.filter((member) => member.name).length : 0;
      const petCount = unit.resident ? (unit.pets?.count || 0) + members.reduce((total, member) => total + (member.pets?.count || 0), 0) : 0;
      const charge = activeTenantCharge(unit);
      const contactText = hasPermission("resident-data", "view")
        ? unit.contact?.phone || unit.contact?.email || "Contact details not added"
        : "Contact details restricted";
      return `<tr><td><strong>${escapeHtml(unitLabel(unit.id))}</strong><small>Building ${String(unit.building).padStart(2, "0")}</small></td><td>${unit.resident ? `<strong>${escapeHtml(unit.resident)}</strong><small>${escapeHtml(contactText)}</small><small>${occupantCount} ${occupantCount === 1 ? "resident" : "residents"} · ${escapeHtml(unit.occupation || "Occupation not listed")}</small>${members.filter((member) => member.name).map((member) => `<small>${escapeHtml(member.name)}${member.occupation ? ` · ${escapeHtml(member.occupation)}` : ""}</small>`).join("")}` : `<span class="muted">No resident assigned</span>`}</td><td>${petCount ? `<strong>${petCount} ${petCount === 1 ? "pet" : "pets"}</strong><small>${escapeHtml([...(unit.pets?.types || []), ...members.flatMap((member) => member.pets?.types || [])].join(", ") || "Type not listed")}</small>` : `<span class="muted">${unit.resident ? "None listed" : "—"}</span>`}</td><td>${money(unitRent(unit))}${unit.recurringCharges?.length ? `<small>${unit.recurringCharges.length} recurring item${unit.recurringCharges.length === 1 ? "" : "s"}</small>` : ""}</td><td><span class="badge ${unit.status === "Occupied" ? "badge-green" : "badge-gray"}">${unit.status}</span></td><td>${canManageBulkRent() ? `<button class="table-action" data-action="set-unit-rent" data-unit-id="${unit.id}">Set rent</button>` : ""}<button class="table-action" data-action="tenant-form" data-unit-id="${unit.id}">${unit.resident ? "Edit household" : "Add tenant"}</button></td></tr>`;
    }).join("") || `<tr><td colspan="6"><div class="empty-state">${propertyUnits.length ? "No units match these filters." : "No units have been added to this property yet. Add a unit or upload a CSV to get started."}</div></td></tr>`}</tbody></table></div>
    <div class="pagination"><span>Showing ${filtered.length ? unitPage * pageSize + 1 : 0}–${Math.min((unitPage + 1) * pageSize, filtered.length)} of ${filtered.length} units</span><div><button class="button button-outline button-small" data-action="units-prev" ${unitPage === 0 ? "disabled" : ""}>Previous</button><button class="button button-outline button-small" data-action="units-next" ${unitPage >= maxPage ? "disabled" : ""}>Next</button></div></div>
  </section>`;
}

function unitForm(propertyId) {
  const property = state.properties.find((item) => item.id === propertyId && item.type !== "hoa");
  if (!property) {
    showToast("Select a rental property before adding units.", true);
    return;
  }
  const propertyUnits = unitsForProperty(property.id);
  const usedBuildings = [...new Set(propertyUnits.map((unit) => Number(unit.building)))].sort((a, b) => a - b);
  const defaultBuilding = property.type === "sfr" ? 1 : Math.max(1, buildingCount(propertyUnits) || 1);
  openModal(`<form id="unit-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">${escapeHtml(property.name)} · ${escapeHtml(propertyTypeName(property.type))}</p><h2>Add a unit</h2><p class="form-hint">This unit will be saved only under this property.</p></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <input type="hidden" name="propertyId" value="${escapeHtml(property.id)}">
    <div class="form-grid">
      <label class="form-field">Building / structure number<input name="building" type="number" min="1" max="${MAX_BUILDINGS}" step="1" value="${defaultBuilding}" required></label>
      <label class="form-field">Unit number / name<input name="unitNumber" maxlength="80" required placeholder="${property.type === "sfr" ? "e.g. Main House" : "e.g. 101"}"></label>
      <label class="form-field">Monthly base rent (PHP)<input name="monthlyRent" type="number" min="0" step="0.01" value="0" required></label>
    </div>
    ${usedBuildings.length ? `<p class="form-hint">Existing building / structure numbers: ${usedBuildings.map((building) => escapeHtml(String(building))).join(", ")}.</p>` : ""}
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Add unit to property</button></div>
  </form>`);
}

function unitImportForm(propertyId) {
  const property = state.properties.find((item) => item.id === propertyId && item.type !== "hoa");
  if (!property) {
    showToast("Select a rental property before uploading units.", true);
    return;
  }
  const template = encodeURIComponent("building,unitNumber,monthlyRent,status\n1,101,12000,Vacant");
  openModal(`<form id="unit-import-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">${escapeHtml(property.name)} · ${escapeHtml(propertyTypeName(property.type))}</p><h2>Upload units</h2><p class="form-hint">Every imported row will be linked to this property only.</p></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <input type="hidden" name="propertyId" value="${escapeHtml(property.id)}">
    <div class="form-grid">
      <label class="form-field full-width">Choose a CSV file<input id="unit-import-file" type="file" accept=".csv,text/csv"></label>
      <label class="form-field full-width">CSV data<textarea id="unit-import-csv" name="csv" rows="8" required placeholder="building,unitNumber,monthlyRent,status&#10;1,101,12000,Vacant"></textarea></label>
    </div>
    <p class="form-hint">Required columns: <strong>building</strong> and <strong>unitNumber</strong>. Optional: monthlyRent and status (Vacant only). Duplicate unit numbers within a building are rejected. <a href="data:text/csv;charset=utf-8,${template}" download="sit-with-haven-unit-template.csv">Download CSV template</a></p>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Validate and import units</button></div>
  </form>`);
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error("The CSV contains an unclosed quoted field.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function importedUnitRecords(propertyId, csvText) {
  const property = state.properties.find((item) => item.id === propertyId && item.type !== "hoa");
  if (!property) throw new Error("The selected rental property could not be found.");
  const rows = parseCsvRows(csvText.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("Add a header row and at least one unit row to the CSV.");
  const headers = rows[0].map((header) => header.toLowerCase().replace(/[\s_-]+/g, ""));
  const buildingIndex = headers.indexOf("building");
  const unitNumberIndex = headers.indexOf("unitnumber");
  const rentIndex = headers.findIndex((header) => ["monthlyrent", "rent"].includes(header));
  const statusIndex = headers.indexOf("status");
  if (buildingIndex < 0 || unitNumberIndex < 0) {
    throw new Error("CSV needs building and unitNumber columns.");
  }
  const existing = new Set(unitsForProperty(property.id).map((unit) => `${unit.building}|${unit.unitNumber.toLowerCase()}`));
  const buildingCounts = new Map();
  unitsForProperty(property.id).forEach((unit) => buildingCounts.set(Number(unit.building), (buildingCounts.get(Number(unit.building)) || 0) + 1));
  const additions = [];
  rows.slice(1).forEach((row, index) => {
    const line = index + 2;
    const building = Number(row[buildingIndex]);
    const unitNumber = String(row[unitNumberIndex] || "").trim();
    const rentText = rentIndex < 0 ? "" : String(row[rentIndex] || "").trim();
    const rent = rentText ? Number(rentText) : 0;
    const status = statusIndex < 0 ? "Vacant" : String(row[statusIndex] || "Vacant").trim();
    const key = `${building}|${unitNumber.toLowerCase()}`;
    if (!Number.isInteger(building) || building < 1 || building > MAX_BUILDINGS || !unitNumber
      || unitNumber.length > 80 || !Number.isFinite(rent) || rent < 0
      || (status && status.toLowerCase() !== "vacant")) {
      throw new Error(`Check building, unitNumber, rent, and vacant status on CSV row ${line}.`);
    }
    if (existing.has(key)) throw new Error(`Building ${building}, unit ${unitNumber} already exists in ${property.name} (CSV row ${line}).`);
    const buildingUnitCount = (buildingCounts.get(building) || 0) + 1;
    if (buildingUnitCount > UNITS_PER_BUILDING) {
      throw new Error(`Building ${building} in ${property.name} would exceed ${UNITS_PER_BUILDING} units (CSV row ${line}).`);
    }
    buildingCounts.set(building, buildingUnitCount);
    existing.add(key);
    additions.push({
      id: nextUnitRecordId([...state.units, ...additions]),
      propertyId: property.id,
      building,
      unitNumber,
      resident: "",
      status: "Vacant",
      contact: { address: "", phone: "", email: "" },
      occupation: "",
      householdMembers: [],
      monthlyRent: rent,
      recurringCharges: [],
      pets: { hasPets: false, count: 0, types: [], otherDetails: "" }
    });
  });
  if (!additions.length) throw new Error("No valid unit rows were found.");
  return additions;
}

function addBuilding() {
  const property = state.properties.find((item) => item.id === selectedPropertyId && ["building", "mfr"].includes(item.type));
  if (!property) {
    showToast("Select a Building or MFR property before adding building units.", true);
    return;
  }
  const propertyUnits = unitsForProperty(property.id);
  if (property.type === "building" && propertyUnits.length) {
    showToast("This Building property already has units. Add or upload individual units instead.", true);
    return;
  }
  const nextBuilding = buildingCount(propertyUnits) + 1;
  if (nextBuilding > MAX_BUILDINGS) {
    showToast(`${property.name} has reached its ${MAX_BUILDINGS}-building capacity.`, true);
    return;
  }
  const firstUnitId = nextUnitRecordId();
  const newUnits = Array.from({ length: UNITS_PER_BUILDING }, (_, index) => {
    return {
      id: firstUnitId + index,
      propertyId: property.id,
      building: nextBuilding,
      unitNumber: unitNumberForIndex(index),
      resident: "",
      status: "Vacant",
      contact: { address: "", phone: "", email: "" },
      occupation: "",
      householdMembers: [],
      monthlyRent: 0,
      recurringCharges: [],
      pets: { hasPets: false, count: 0, types: [], otherDetails: "" }
    };
  });
  persist({ ...state, units: [...state.units, ...newUnits] }, `Added building ${nextBuilding} to ${property.name}`);
  unitPage = Math.floor(propertyUnits.length / 30);
  render();
  showToast(`${property.type === "building" ? "Added 36 units to" : `Building ${String(nextBuilding).padStart(2, "0")} added to`} ${property.name}.`);
}

function moveOutTenant(unitId) {
  const unit = state.units.find((item) => item.id === Number(unitId));
  if (!unit || unit.status !== "Occupied" || !unit.resident) {
    showToast("Select an occupied tenant record to move out.", true);
    return;
  }
  if (!window.confirm(`Record move-out for ${unit.resident} from ${unitLabel(unit.id)}? The rent ledger will be preserved.`)) return;
  const snapshot = {
    ...unit,
    id: nextId("LEASEH-", state.tenantHistory),
    unitId: unit.id,
    moveOutDate: localDateString(),
    leaseStatus: "Terminated"
  };
  const updatedUnit = {
    ...unit,
    resident: "",
    tenantId: "",
    status: "Vacant",
    occupation: "",
    contact: { address: "", phone: "", email: "" },
    householdMembers: [],
    recurringCharges: [],
    pets: { hasPets: false, count: 0, types: [], otherDetails: "" },
    moveInDate: "",
    leaseStart: "",
    leaseEnd: "",
    leaseStatus: "Not recorded",
    renewalStatus: "Not recorded",
    securityDeposit: 0,
    portalStatus: "Not configured"
  };
  persist({
    ...state,
    units: state.units.map((item) => item.id === unit.id ? updatedUnit : item),
    tenantHistory: [snapshot, ...state.tenantHistory]
  }, `Recorded move-out for ${unit.resident} from ${unitLabel(unit.id)}`);
  showToast("Move-out recorded. The prior tenant and ledger details remain in lease history.");
}

function householdMemberForm(member = {}, key = Date.now()) {
  const pets = member.pets || { hasPets: false, count: 0, types: [], otherDetails: "" };
  return `<fieldset class="repeatable-card household-member" data-household-member>
    <input type="hidden" data-member-id value="${escapeHtml(member.id || "")}">
    <legend>Additional household member</legend>
    <button type="button" class="table-action repeatable-remove" data-action="remove-household-member">Remove</button>
    <div class="form-grid">
      <label class="form-field">Full name<input data-member-name maxlength="120" value="${escapeHtml(member.name || "")}" required placeholder="Household member name"></label>
      <label class="form-field">Occupation<input data-member-occupation maxlength="120" value="${escapeHtml(member.occupation || "")}" placeholder="Current occupation"></label>
      <label class="form-field full-width">Has pets?<select data-member-has-pets><option value="no" ${pets.hasPets ? "" : "selected"}>No</option><option value="yes" ${pets.hasPets ? "selected" : ""}>Yes</option></select></label>
      <div class="member-pet-fields pet-fields full-width" ${pets.hasPets ? "" : "hidden"}>
        <label class="form-field">Number of pets<input data-member-pet-count type="number" min="1" max="30" step="1" value="${pets.count || 1}" ${pets.hasPets ? "required" : ""}></label>
        <span class="form-field-label">Pet type(s)</span>
        <div class="pet-options">${["Cat", "Dog", "Other"].map((type) => `<label class="pet-option"><input type="checkbox" name="memberPetType${key}" value="${type}" ${pets.types?.includes(type) ? "checked" : ""}>${type}</label>`).join("")}</div>
        <label class="form-field member-other-pet" ${pets.types?.includes("Other") ? "" : "hidden"}>Other pet details<input data-member-other-pet maxlength="120" value="${escapeHtml(pets.otherDetails || "")}" placeholder="Please describe the pet"></label>
      </div>
    </div>
  </fieldset>`;
}

function recurringChargeForm(charge = {}) {
  return `<div class="repeatable-card recurring-charge" data-recurring-charge>
    <input type="hidden" data-charge-id value="${escapeHtml(charge.id || "")}">
    <button type="button" class="table-action repeatable-remove" data-action="remove-recurring-charge">Remove</button>
    <div class="form-grid">
      <label class="form-field">Charge name<input data-charge-name maxlength="80" value="${escapeHtml(charge.name || "")}" required placeholder="e.g. Parking"></label>
      <label class="form-field">Amount per month (PHP)<input data-charge-amount type="number" min="0.01" step="0.01" value="${charge.amount || ""}" required placeholder="0.00"></label>
    </div>
  </div>`;
}

function tenantForm(unitId) {
  const isEditing = unitId !== undefined;
  const unit = isEditing ? state.units.find((item) => item.id === Number(unitId)) : undefined;
  if (isEditing && !unit) {
    showToast("That unit could not be found.", true);
    return;
  }
  const availableUnits = unitsForProperty(selectedPropertyId).filter((item) => item.status === "Vacant");
  if (!isEditing && availableUnits.length === 0) {
    showToast("There are no vacant units available to assign.", true);
    return;
  }
  const existingPets = unit?.pets || { hasPets: false, count: 0, types: [], otherDetails: "" };
  const rent = isEditing ? unit.monthlyRent || 12000 : 12000;
  const canViewResidentData = hasPermission("resident-data", "view");
  const tenantId = isEditing
    ? unit.tenantId || `TEN-${String(unit.id).padStart(4, "0")}`
    : nextId("TEN-", state.units.map((item) => ({ id: item.tenantId || `TEN-${String(item.id).padStart(4, "0")}` })));
  const unitField = isEditing
    ? `<input type="hidden" name="unitId" value="${unit.id}"><input value="${escapeHtml(unitLabel(unit.id))} · Building ${String(unit.building).padStart(2, "0")}" disabled>`
    : `<select name="unitId" required>${availableUnits.map((item) => `<option value="${item.id}" ${item.id === availableUnits[0].id ? "selected" : ""}>${escapeHtml(unitLabel(item.id))} · Building ${String(item.building).padStart(2, "0")}</option>`).join("")}</select>`;

  openModal(`<form id="tenant-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">RESIDENT DIRECTORY</p><h2>${isEditing ? "Edit tenant information" : "Add a tenant"}</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="form-grid">
      <label class="form-field full-width">Unit${unitField}</label>
      <label class="form-field">Tenant ID<input name="tenantId" value="${escapeHtml(tenantId)}" readonly></label>
      <label class="form-field full-width">Tenant's full name<input name="resident" maxlength="120" value="${escapeHtml(unit?.resident || "")}" autocomplete="name" required placeholder="Enter the tenant's full name"></label>
      <label class="form-field full-width">Primary tenant's occupation<input name="occupation" maxlength="120" value="${escapeHtml(unit?.occupation || "")}" placeholder="Current occupation"></label>
      ${canViewResidentData ? `<label class="form-field full-width">Mailing address<input name="address" maxlength="240" value="${escapeHtml(unit?.contact?.address || "")}" autocomplete="street-address" placeholder="Street, city, province, postal code"></label>
      <label class="form-field">Phone number<input name="phone" type="tel" maxlength="40" value="${escapeHtml(unit?.contact?.phone || "")}" autocomplete="tel" placeholder="+63 9XX XXX XXXX"></label>
      <label class="form-field">Email address<input name="email" type="email" maxlength="254" value="${escapeHtml(unit?.contact?.email || "")}" autocomplete="email" placeholder="name@example.com"></label>` : `<p class="form-hint full-width">Contact details are restricted for this role.</p>`}
      <label class="form-field full-width">Does this tenant have pets?<select id="tenant-has-pets" name="hasPets"><option value="no" ${existingPets.hasPets ? "" : "selected"}>No</option><option value="yes" ${existingPets.hasPets ? "selected" : ""}>Yes</option></select></label>
      <div id="pet-fields" class="pet-fields full-width" ${existingPets.hasPets ? "" : "hidden"}>
        <label class="form-field">Number of pets<input name="petCount" type="number" min="1" max="30" step="1" value="${existingPets.count || 1}" ${existingPets.hasPets ? "required" : ""}></label>
        <span class="form-field-label">Select pet type(s)</span>
        <div class="pet-options">${["Cat", "Dog", "Other"].map((type) => `<label class="pet-option"><input type="checkbox" name="petTypes" value="${type}" ${existingPets.types.includes(type) ? "checked" : ""}>${type}</label>`).join("")}</div>
        <label id="pet-other-field" class="form-field pet-other-field" ${existingPets.types.includes("Other") ? "" : "hidden"}>Other pet details<input name="otherDetails" maxlength="120" value="${escapeHtml(existingPets.otherDetails)}" placeholder="Please describe the pet"></label>
      </div>
      <label class="form-field full-width">Monthly base rent (PHP)<input name="rent" type="number" min="0.01" step="0.01" value="${rent}" required></label>
      <fieldset class="profile-fieldset full-width"><legend>Lease and portal</legend><div class="form-grid">
        <label class="form-field">Lease status<select name="leaseStatus">${["Not recorded", "Pending", "Active", "Month-to-month", "Expired", "Terminated"].map((status) => `<option ${unit?.leaseStatus === status || (!unit?.leaseStatus && status === "Not recorded") ? "selected" : ""}>${status}</option>`).join("")}</select></label>
        <label class="form-field">Renewal status<select name="renewalStatus">${["Not recorded", "Not due", "Offered", "Renewed", "Declined", "Month-to-month"].map((status) => `<option ${unit?.renewalStatus === status || (!unit?.renewalStatus && status === "Not recorded") ? "selected" : ""}>${status}</option>`).join("")}</select></label>
        <label class="form-field">Move-in date<input name="moveInDate" type="date" value="${escapeHtml(unit?.moveInDate || "")}"></label>
        <label class="form-field">Lease start<input name="leaseStart" type="date" value="${escapeHtml(unit?.leaseStart || "")}"></label>
        <label class="form-field">Lease end<input name="leaseEnd" type="date" value="${escapeHtml(unit?.leaseEnd || "")}"></label>
        <label class="form-field">Security deposit (PHP)<input name="securityDeposit" type="number" min="0" step="0.01" value="${Number(unit?.securityDeposit) || 0}"></label>
        <label class="form-field">Resident portal status<select name="portalStatus">${["Not configured", "Enabled (demo only)", "Disabled"].map((status) => `<option ${unit?.portalStatus === status || (!unit?.portalStatus && status === "Not configured") ? "selected" : ""}>${status}</option>`).join("")}</select></label>
      </div></fieldset>
      <section class="repeatable-section full-width">
        <div class="repeatable-heading"><div><span class="form-field-label">Additional household members</span><small>Add each person living in this unit and their pet details.</small></div><button type="button" class="button button-outline button-small" data-action="add-household-member">＋ Add person</button></div>
        <div id="household-member-list">${(unit?.householdMembers || []).map((member, index) => householdMemberForm(member, index)).join("")}</div>
      </section>
      <section class="repeatable-section full-width">
        <div class="repeatable-heading"><div><span class="form-field-label">Monthly recurring charges</span><small>These amounts are added to the unit's monthly ledger total.</small></div><button type="button" class="button button-outline button-small" data-action="add-recurring-charge">＋ Add charge</button></div>
        <div id="recurring-charge-list">${(unit?.recurringCharges || []).map((charge) => recurringChargeForm(charge)).join("")}</div>
      </section>
    </div>
    <p class="form-hint">Monthly recurring amounts are included in this unit's current ledger total. Future monthly billing cycles are not generated automatically in this browser-only demo. Resident data is saved in this browser only.</p>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">${isEditing ? "Save changes" : "Add tenant"}</button></div>
  </form>`);
}

function renderRent() {
  const search = (document.getElementById("rent-search")?.value || pageSearchTerms.rent).trim().toLowerCase();
  const statusFilter = document.getElementById("rent-filter")?.value || "all";
  const rows = state.charges.filter((charge) => {
    const queryMatch = !search || `${charge.resident} ${unitLabel(charge.unitId)}`.toLowerCase().includes(search);
    return queryMatch && (statusFilter === "all" || charge.status === statusFilter);
  }).sort((a, b) => {
    const order = { Overdue: 0, Due: 1, Paid: 2 };
    return order[a.status] - order[b.status] || a.unitId - b.unitId;
  }).slice(0, 50);

  return `<section class="page-heading"><div><p class="eyebrow">FINANCIALS</p><h1>Rent &amp; receipts</h1><p class="subheading">Track rent balances and record payments for the current month.</p></div><div class="heading-actions">${canManageBulkRent() ? `<button class="button button-outline" data-action="bulk-rent-edit">Bulk edit rent</button>` : ""}<button class="button button-primary" data-action="payment">＋ Record payment</button></div></section>
  <section class="metrics-grid rent-metrics">
    ${card("Paid this month", String(state.charges.filter((item) => item.status === "Paid").length), "Occupied units", "✓", "metric-green")}
    ${card("Due", String(state.charges.filter((item) => item.status === "Due").length), "Awaiting payment", "•", "metric-amber")}
    ${card("Overdue", String(state.charges.filter((item) => item.status === "Overdue").length), "Past due date", "!", "metric-red")}
    ${card("Received", money(state.charges.reduce((sum, item) => sum + item.amount - item.balance, 0)), "Current month", "₱", "metric-blue")}
  </section>
  <section class="panel directory-panel">
    <div class="tabs"><button class="tab-button ${rentTab === "balances" ? "tab-active" : ""}" data-action="rent-balances">Rent balances</button><button class="tab-button ${rentTab === "receipts" ? "tab-active" : ""}" data-action="rent-receipts">Payment receipts <span class="tab-count">${state.payments.length}</span></button></div>
    ${rentTab === "balances" ? `<div class="filter-row"><label class="search-field"><span>⌕</span><input id="rent-search" type="search" placeholder="Search resident or unit" value="${escapeHtml(search)}"></label><select id="rent-filter" aria-label="Filter by payment status"><option value="all">All statuses</option><option value="Due" ${statusFilter === "Due" ? "selected" : ""}>Due</option><option value="Overdue" ${statusFilter === "Overdue" ? "selected" : ""}>Overdue</option><option value="Paid" ${statusFilter === "Paid" ? "selected" : ""}>Paid</option></select></div>
      <div class="table-wrap"><table><thead><tr><th>Resident / unit</th><th>Due date</th><th>Rent</th><th>Balance</th><th>Status</th><th></th></tr></thead><tbody>${rows.map((charge) => `<tr><td><strong>${escapeHtml(charge.resident)}</strong><small>${escapeHtml(unitLabel(charge.unitId))}</small></td><td>${shortDate(charge.dueDate)}</td><td>${money(charge.amount)}</td><td class="amount">${money(charge.balance)}</td><td><span class="badge ${statusClass(charge.status)}">${charge.status}</span></td><td>${charge.balance > 0 ? `<button class="table-action" data-action="payment" data-unit-id="${charge.unitId}">Record</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="6"><div class="empty-state">No rent records match these filters.</div></td></tr>`}</tbody></table></div><p class="table-footnote">Showing up to 50 matching records. Use search to find a specific resident or unit.</p>` : renderReceipts()}
  </section>`;
}

function renderReceipts() {
  const receipts = [...state.payments].sort((a, b) => b.date.localeCompare(a.date) || Number(b.id.match(/\d+$/)?.[0] || 0) - Number(a.id.match(/\d+$/)?.[0] || 0));
  return receipts.length ? `<div class="table-wrap"><table><thead><tr><th>Receipt</th><th>Resident / unit</th><th>Date</th><th>Method</th><th>Amount</th><th>Reference</th><th></th></tr></thead><tbody>${receipts.slice(0, 50).map((payment) => `<tr><td><strong>${escapeHtml(payment.id)}</strong></td><td>${escapeHtml(payment.resident)}<small>${escapeHtml(unitLabel(payment.unitId))}</small></td><td>${shortDate(payment.date)}</td><td>${escapeHtml(payment.method)}</td><td class="amount">${money(payment.amount)}</td><td>${escapeHtml(payment.reference || "—")}</td><td><button class="table-action" data-action="receipt" data-receipt-id="${escapeHtml(payment.id)}">View</button></td></tr>`).join("")}</tbody></table></div>${receipts.length > 50 ? `<p class="table-footnote">Showing the 50 most recent of ${receipts.length} receipts.</p>` : ""}` : `<div class="empty-state">No receipts have been recorded yet.</div>`;
}

function statusClass(status) {
  const normalized = String(status).toLowerCase();
  if (normalized.includes("paid") || normalized.includes("complete") || normalized.includes("resolved")) return "badge-green";
  if (normalized.includes("overdue") || normalized.includes("open") || normalized.includes("sent")) return "badge-red";
  if (normalized.includes("progress") || normalized.includes("review") || normalized.includes("due") || normalized.includes("scheduled")) return "badge-amber";
  return "badge-gray";
}

function renderMaintenance() {
  const items = [...state.maintenance].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return `<section class="page-heading"><div><p class="eyebrow">OPERATIONS</p><h1>Maintenance</h1><p class="subheading">Receive and track work orders across the property.</p></div><button class="button button-primary" data-action="new-maintenance">＋ New request</button></section>
  <section class="metrics-grid compact-metrics">
    ${card("Open", String(items.filter((item) => item.status === "Open").length), "Needs assignment", "!", "metric-amber")}
    ${card("In progress", String(items.filter((item) => item.status === "In progress").length), "Being worked on", "↻", "metric-blue")}
    ${card("Scheduled", String(items.filter((item) => item.status === "Scheduled").length), "Upcoming work", "◷", "")}
    ${card("Completed", String(items.filter((item) => item.status === "Complete").length), "Closed requests", "✓", "metric-green")}
  </section>
  <section class="panel request-list">${items.length ? items.map((item) => `<article class="request-card"><div class="request-symbol">M</div><div class="request-main"><div class="request-title-row"><h3>${escapeHtml(item.category)} <span class="muted">· ${escapeHtml(unitLabel(item.unitId))}</span></h3><span class="badge ${statusClass(item.status)}">${escapeHtml(item.status)}</span></div><p>${escapeHtml(item.description)}</p><div class="request-meta"><span>${escapeHtml(item.id)}</span><span>Reported ${shortDate(item.createdAt)}</span><span class="priority priority-${escapeHtml(item.priority.toLowerCase())}">${escapeHtml(item.priority)} priority</span></div><button class="table-action thread-link" data-action="maintenance-thread" data-request-id="${escapeHtml(item.id)}" data-role="Property manager">Open team conversation · ${(item.messages || []).length}</button></div><label class="status-control"><span>Update status</span><select data-maintenance-status="${escapeHtml(item.id)}"><option ${item.status === "Open" ? "selected" : ""}>Open</option><option ${item.status === "In progress" ? "selected" : ""}>In progress</option><option ${item.status === "Scheduled" ? "selected" : ""}>Scheduled</option><option ${item.status === "Complete" ? "selected" : ""}>Complete</option></select></label></article>`).join("") : `<div class="empty-state">No maintenance requests yet.</div>`}</section>`;
}

function maintenanceThread(requestId, preferredRole = "Property manager") {
  const request = state.maintenance.find((item) => item.id === requestId);
  if (!request) {
    showToast("That maintenance request could not be found.", true);
    return;
  }
  const messages = request.messages || [];
  openModal(`<section class="modal-card thread-modal">
    <div class="modal-header"><div><p class="eyebrow">${escapeHtml(request.id)} · ${escapeHtml(unitLabel(request.unitId))}</p><h2>${escapeHtml(request.category)} conversation</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <p class="thread-description">${escapeHtml(request.description)}</p>
    <div class="thread-notice">This thread is for the tenant, property management, and maintenance team. Demo messages are saved only in this browser; no push, email, or SMS is sent.</div>
    <div class="thread-messages">${messages.length ? messages.map((message) => `<article class="thread-message"><div class="thread-message-meta"><strong>${escapeHtml(message.author)}</strong><span class="badge badge-gray">${escapeHtml(message.role)}</span><time>${message.createdAt.includes("T") ? escapeHtml(new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))) : shortDate(message.createdAt)}</time></div><p>${escapeHtml(message.text)}</p></article>`).join("") : `<div class="empty-state">No messages yet. Send the first update to the team.</div>`}</div>
    <form id="maintenance-message-form">
      <input type="hidden" name="requestId" value="${escapeHtml(request.id)}">
      <div class="form-grid">
        <label class="form-field">Your role<select name="role" required><option ${preferredRole === "Tenant" ? "selected" : ""}>Tenant</option><option ${preferredRole === "Property manager" ? "selected" : ""}>Property manager</option><option ${preferredRole === "Maintenance staff" ? "selected" : ""}>Maintenance staff</option></select></label>
        <label class="form-field">Your name<input name="author" maxlength="120" required placeholder="Enter your name"></label>
        <label class="form-field full-width">Message to the team<textarea name="text" rows="3" maxlength="1000" required placeholder="Share an update, question, or work note."></textarea></label>
      </div>
      <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Close</button><button type="submit" class="button button-primary">Add to conversation</button></div>
    </form>
  </section>`);
}

function renderViolations() {
  const items = [...state.violations].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
  const activeRules = state.violationCatalog.filter((item) => item.active);
  return `<section class="page-heading"><div><p class="eyebrow">COMMUNITY STANDARDS</p><h1>Violations</h1><p class="subheading">Maintain community rules and log observed incidents.</p></div><div class="heading-actions"><button class="button button-outline" data-page="notifications">Notification settings</button><button class="button button-primary" data-action="${violationTab === "rules" ? "new-rule" : "new-violation"}">＋ ${violationTab === "rules" ? "Add community rule" : "Log violation"}</button></div></section>
  <section class="panel directory-panel">
    <div class="tabs"><button class="tab-button ${violationTab === "incidents" ? "tab-active" : ""}" data-action="violation-incidents">Incident log <span class="tab-count">${items.length}</span></button><button class="tab-button ${violationTab === "rules" ? "tab-active" : ""}" data-action="violation-rules">Known community violations <span class="tab-count">${activeRules.length}</span></button></div>
    ${violationTab === "incidents" ? `<div class="panel-heading panel-heading-spaced"><div><h2>Reported incidents</h2><p>${items.filter((item) => item.status !== "Resolved").length} items need follow-up</p></div><span class="badge badge-amber">For management use</span></div>
    <div class="table-wrap"><table><thead><tr><th>Incident</th><th>Unit</th><th>Reported</th><th>Description</th><th>Status</th><th></th></tr></thead><tbody>${items.map((item) => `<tr><td><strong>${escapeHtml(item.category)}</strong><small>${escapeHtml(item.id)}</small></td><td>${escapeHtml(unitLabel(item.unitId))}</td><td>${shortDate(item.reportedAt)}</td><td class="description-cell">${escapeHtml(item.description)}</td><td><span class="badge ${statusClass(item.status)}">${escapeHtml(item.status)}</span></td><td><select class="inline-select" aria-label="Update ${escapeHtml(item.id)} status" data-violation-status="${escapeHtml(item.id)}"><option ${item.status === "Under review" ? "selected" : ""}>Under review</option><option ${item.status === "Notice sent" ? "selected" : ""}>Notice sent</option><option ${item.status === "Termination review" ? "selected" : ""}>Termination review</option><option ${item.status === "Resolved" ? "selected" : ""}>Resolved</option></select></td></tr>`).join("") || `<tr><td colspan="6"><div class="empty-state">No violations logged.</div></td></tr>`}</tbody></table></div>
    <p class="table-footnote">Keep incident notes factual and share them only with authorized staff. “Termination review” flags an incident for management follow-up only; it does not terminate a tenancy or change unit occupancy.</p>` : `<div class="catalog-intro"><div><h2>Known community violations</h2><p>Maintain a shared reference list of community rules. Add new rules or deactivate outdated ones.</p></div><span class="badge badge-blue">${activeRules.length} active rules</span></div>
    <div class="rule-list">${state.violationCatalog.length ? state.violationCatalog.map((rule) => `<article class="rule-card ${rule.active ? "" : "rule-inactive"}"><span class="attention-icon attention-amber">!</span><div class="rule-copy"><div class="rule-title-row"><h3>${escapeHtml(rule.title)}</h3><span class="badge ${rule.active ? "badge-green" : "badge-gray"}">${rule.active ? "Active" : "Inactive"}</span></div><span class="rule-category">${escapeHtml(rule.category)}</span><p>${escapeHtml(rule.description)}</p></div><button class="button button-outline button-small" data-action="toggle-rule" data-rule-id="${escapeHtml(rule.id)}">${rule.active ? "Deactivate" : "Reactivate"}</button></article>`).join("") : `<div class="empty-state">No community rules listed yet. Add one to get started.</div>`}</div>
    <p class="table-footnote">This reference list is for property management and should reflect your community’s approved policies.</p>`}
  </section>`;
}

function renderNotifications() {
  const settings = state.notificationSettings;
  const ready = settings.emailEnabled || settings.smsEnabled;
  const announcements = [...state.communityAnnouncements].sort((a, b) => a.date.localeCompare(b.date));
  return `<section class="page-heading"><div><p class="eyebrow">RESIDENT COMMUNICATIONS</p><h1>Notifications</h1><p class="subheading">Configure rent reminders, violation notices, and community drives or events.</p></div><span class="badge badge-amber">Delivery ${ready ? "not connected" : "inactive"}</span></section>
  <div class="delivery-warning"><span class="attention-icon attention-amber">!</span><div><strong>Automated delivery needs a secure server and messaging provider.</strong><p>These preferences are saved in this browser only. No emails or text messages are sent or scheduled by this demo. Connect an email service and Philippine SMS gateway on a backend before enabling real resident notifications.</p></div></div>
  <section class="panel portal-access-panel"><div class="panel-heading"><div><h2>Tenant portal invitations &amp; OTP sign-in</h2><p>Account setup is not enabled in this browser-only demo.</p></div><span class="badge badge-amber">Backend required</span></div>
    <p>Secure invitations need a single-use, expiring link generated by the server. Phone/email login needs a server-verified one-time code with expiry and attempt limits. Neither a real invite link nor an OTP can be created or sent until an authentication backend, delivery provider, and verified HTTPS domain are configured.</p>
    <div class="portal-access-prerequisites"><span>Email/SMS delivery provider: <strong>Not selected</strong></span><span>Verified app domain: <strong>Not confirmed</strong></span><span>Tenant accounts: <strong>Not configured</strong></span></div>
  </section>
  <form id="notification-settings-form">
    <section class="notification-grid">
      <article class="panel notification-panel"><div class="panel-heading"><div><h2>Delivery channels</h2><p>Choose channels for future automated notifications.</p></div></div>
        <label class="setting-row"><span><strong>Email</strong><small>Send to the tenant email on file</small></span><input type="checkbox" name="emailEnabled" ${settings.emailEnabled ? "checked" : ""}></label>
        <label class="form-field provider-field">Email provider<select name="emailProvider"><option ${settings.emailProvider === "Not configured" ? "selected" : ""}>Not configured</option><option ${settings.emailProvider === "SendGrid" ? "selected" : ""}>SendGrid</option><option ${settings.emailProvider === "Amazon SES" ? "selected" : ""}>Amazon SES</option><option ${settings.emailProvider === "Other" ? "selected" : ""}>Other</option></select></label>
        <label class="setting-row"><span><strong>Text message (SMS)</strong><small>Send to the tenant phone number on file</small></span><input type="checkbox" name="smsEnabled" ${settings.smsEnabled ? "checked" : ""}></label>
        <label class="form-field provider-field">SMS provider<select name="smsProvider"><option ${settings.smsProvider === "Not configured" ? "selected" : ""}>Not configured</option><option ${settings.smsProvider === "Semaphore" ? "selected" : ""}>Semaphore</option><option ${settings.smsProvider === "Twilio" ? "selected" : ""}>Twilio</option><option ${settings.smsProvider === "Other" ? "selected" : ""}>Other</option></select></label>
        <p class="form-hint">Provider API keys must only be stored on a secure server, never in this browser app.</p>
      </article>
      <article class="panel notification-panel"><div class="panel-heading"><div><h2>What to notify residents about</h2><p>Choose which events should trigger messages.</p></div></div>
        ${notificationToggle("rentReminders", "Monthly rent reminder", "Remind residents before rent is due.", settings.rentReminders)}
        <label class="form-field schedule-field">Send reminder <select name="rentReminderDays"><option value="1" ${Number(settings.rentReminderDays) === 1 ? "selected" : ""}>1 day before rent is due</option><option value="3" ${Number(settings.rentReminderDays) === 3 ? "selected" : ""}>3 days before rent is due</option><option value="5" ${Number(settings.rentReminderDays) === 5 ? "selected" : ""}>5 days before rent is due</option><option value="7" ${Number(settings.rentReminderDays) === 7 ? "selected" : ""}>7 days before rent is due</option></select></label>
        ${notificationToggle("outstandingBalanceReminders", "Outstanding balances", "Follow up with residents who still owe rent.", settings.outstandingBalanceReminders)}
        <label class="form-field schedule-field">Repeat overdue reminder <select name="overdueRepeatDays"><option value="3" ${Number(settings.overdueRepeatDays) === 3 ? "selected" : ""}>Every 3 days</option><option value="7" ${Number(settings.overdueRepeatDays) === 7 ? "selected" : ""}>Every 7 days</option><option value="14" ${Number(settings.overdueRepeatDays) === 14 ? "selected" : ""}>Every 14 days</option></select></label>
        ${notificationToggle("violationNotifications", "Violation notices", "Notify the affected resident when a notice is recorded.", settings.violationNotifications)}
        ${notificationToggle("communityDriveNotifications", "Community drives & events", "Share community drives, activities, and event updates.", settings.communityDriveNotifications)}
      </article>
    </section>
    <div class="notification-save"><span>Settings take effect only after a backend and delivery provider are connected.</span><button class="button button-primary" type="submit">Save notification settings</button></div>
  </form>
  <section class="panel team-panel"><div class="panel-heading"><div><h2>Manager &amp; maintenance contacts</h2><p>Register staff phone numbers, preferred channel, and intended app access.</p></div><button class="button button-outline button-small" data-action="new-team-contact">＋ Register contact</button></div>
    <div class="team-sync-note">Contacts below are local records, not user accounts. Web/mobile login and shared synchronization require a backend and identity system.</div>
    ${state.teamContacts.length ? `<div class="table-wrap"><table><thead><tr><th>Staff member</th><th>Role</th><th>Phone / email</th><th>Preferred channel</th><th>Intended access</th><th>Account</th></tr></thead><tbody>${state.teamContacts.map((contact) => `<tr><td><strong>${escapeHtml(contact.name)}</strong></td><td>${escapeHtml(contact.role)}</td><td>${escapeHtml(contact.phone || "No phone")}<small>${escapeHtml(contact.email || "No email")}</small></td><td>${escapeHtml(contact.channel)}</td><td>${escapeHtml(contact.access)}</td><td><span class="badge badge-gray">Setup pending</span></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No staff contacts have been registered in this demo.</div>`}
  </section>
  <section class="panel announcement-panel"><div class="panel-heading"><div><h2>Community drives &amp; events</h2><p>Draft notices for upcoming community activities. Saving does not send them.</p></div><button class="button button-outline button-small" data-action="new-announcement">＋ Add announcement</button></div>
    ${announcements.length ? `<div class="table-wrap"><table><thead><tr><th>Activity</th><th>Date</th><th>Message</th><th>Delivery</th></tr></thead><tbody>${announcements.map((item) => `<tr><td><strong>${escapeHtml(item.title)}</strong></td><td>${shortDate(item.date)}</td><td class="description-cell">${escapeHtml(item.message)}</td><td><span class="badge badge-gray">Draft · not sent</span></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No community activities have been drafted.</div>`}
  </section>`;
}

function notificationToggle(name, title, description, checked) {
  return `<label class="setting-row"><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></span><input type="checkbox" name="${escapeHtml(name)}" ${checked ? "checked" : ""}></label>`;
}

function teamContactForm() {
  openModal(`<form id="team-contact-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">TEAM DIRECTORY</p><h2>Register a team contact</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="form-grid">
      <label class="form-field full-width">Full name<input name="name" maxlength="120" required placeholder="Team member name"></label>
      <label class="form-field full-width">Role<select name="role" required><option>Property manager</option><option>Maintenance staff</option><option>Owner / accounting</option></select></label>
      <label class="form-field">Phone number<input name="phone" type="tel" maxlength="40" placeholder="+63 9XX XXX XXXX"></label>
      <label class="form-field">Email address<input name="email" type="email" maxlength="254" placeholder="name@example.com"></label>
      <label class="form-field">Preferred notification<select name="channel" required><option>SMS</option><option>Email</option><option>Both</option></select></label>
      <label class="form-field">Intended app access<select name="access" required><option>Web app</option><option>Mobile app</option><option>Web and mobile app</option></select></label>
    </div>
    <p class="form-hint">This creates a local contact record only. No account is created, and no contact is sent an SMS or email.</p>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Save contact</button></div>
  </form>`);
}

function renderSpaceRequests() {
  const requests = [...state.spaceReservations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pending = requests.filter((request) => request.status === "Pending").length;
  return `<section class="page-heading"><div><p class="eyebrow">SHARED COMMUNITY AREAS</p><h1>Space requests</h1><p class="subheading">Review tenant requests for shared spaces. A request is not a confirmed booking until approved.</p></div></section>
  <section class="metrics-grid compact-metrics">
    ${card("Pending review", String(pending), "Awaiting management", "◷", "metric-amber")}
    ${card("Approved", String(requests.filter((request) => request.status === "Approved").length), "Confirmed use", "✓", "metric-green")}
    ${card("All requests", String(requests.length), "Across the community", "S", "metric-blue")}
    ${card("Available spaces", "3 types", "Hall, park, or other", "•", "")}
  </section>
  <section class="panel directory-panel"><div class="panel-heading panel-heading-spaced"><div><h2>Reservation requests</h2><p>Review dates, times, and requested spaces before approval.</p></div></div>
    ${requests.length ? `<div class="table-wrap"><table><thead><tr><th>Resident / unit</th><th>Space</th><th>Date &amp; time</th><th>Attendees</th><th>Purpose</th><th>Status</th></tr></thead><tbody>${requests.map((request) => `<tr><td><strong>${escapeHtml(request.resident)}</strong><small>${escapeHtml(unitLabel(request.unitId))}</small></td><td><strong>${escapeHtml(request.space)}</strong>${request.otherSpace ? `<small>${escapeHtml(request.otherSpace)}</small>` : ""}</td><td>${shortDate(request.date)}<small>${escapeHtml(request.startTime)}–${escapeHtml(request.endTime)}</small></td><td>${escapeHtml(request.attendees)}</td><td class="description-cell">${escapeHtml(request.purpose)}</td><td><select class="inline-select" aria-label="Update space request status" data-space-status="${escapeHtml(request.id)}"><option ${request.status === "Pending" ? "selected" : ""}>Pending</option><option ${request.status === "Approved" ? "selected" : ""}>Approved</option><option ${request.status === "Declined" ? "selected" : ""}>Declined</option><option ${request.status === "Cancelled" ? "selected" : ""}>Cancelled</option></select></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No shared-space requests yet. Tenants can request a space from their portal.</div>`}
    <p class="table-footnote">Confirm availability, community rules, and any required arrangements before approving a request.</p>
  </section>`;
}

function renderPortal(asDashboard = false) {
  const occupied = state.units.filter((unit) => unit.status === "Occupied");
  const selectedId = Number(document.getElementById("portal-unit")?.value || 701);
  const unit = occupied.find((item) => item.id === selectedId) || occupied[0];
  const property = state.properties.find((item) => item.id === selectedPropertyId) || state.properties.find((item) => item.id === "disiplina-village") || state.properties[0];
  const charge = activeTenantCharge(unit);
  const requests = state.maintenance.filter((item) => item.unitId === unit.id);
  const violations = state.violations.filter((item) => item.unitId === unit.id);
  const spaceRequests = state.spaceReservations.filter((item) => item.unitId === unit.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return `<section class="page-heading"><div><p class="eyebrow">${asDashboard ? "TENANT DASHBOARD" : "RESIDENT EXPERIENCE"}</p><h1>${asDashboard ? "Tenant dashboard preview" : "Tenant portal preview"}</h1><p class="subheading">Preview only. Invitations and phone/email OTP sign-in are not configured.</p></div><label class="portal-switcher"><span>Preview resident</span><select id="portal-unit">${occupied.slice(0, 200).map((item) => `<option value="${item.id}" ${item.id === unit.id ? "selected" : ""}>${escapeHtml(item.resident)} · ${escapeHtml(unitLabel(item.id))}</option>`).join("")}</select></label></section>
  <section class="portal-layout">
    <div class="portal-welcome"><div class="portal-avatar">${escapeHtml(unit.resident.split(" ").map((word) => word[0]).join(""))}</div><div><span>RESIDENT PORTAL</span><h2>Welcome, ${escapeHtml(unit.resident)}</h2><p>${escapeHtml(unitLabel(unit.id))} · Disiplina Village Valenzuela City</p></div></div>
    ${renderPaymentInstructions(property)}
    <div class="portal-grid">
      <article class="panel portal-balance"><div class="panel-heading"><div><h2>Rent balance</h2><p>Current month</p></div><span class="badge ${statusClass(charge.status)}">${escapeHtml(charge.status)}</span></div><strong class="portal-amount">${money(charge.balance)}</strong><p class="muted">Monthly rent: ${money(charge.amount)} · Due ${shortDate(charge.dueDate)}</p><small class="portal-note">Payment confirmation is recorded manually by property management. Online checkout is not connected.</small></article>
      <article class="panel portal-actions"><div class="panel-heading"><div><h2>Need help?</h2><p>Send a request to the property team.</p></div></div><button class="portal-action" data-action="portal-maintenance" data-unit-id="${unit.id}"><span class="attention-icon attention-blue">M</span><span><strong>Request maintenance</strong><small>Report a repair or issue</small></span><b>→</b></button><button class="portal-action" data-action="space-booking" data-unit-id="${unit.id}"><span class="attention-icon attention-green">S</span><span><strong>Request a shared space</strong><small>Hall, park, or another space</small></span><b>→</b></button><button class="portal-action" data-action="portal-violation"><span class="attention-icon attention-green">?</span><span><strong>Contact management</strong><small>Ask about a notice or policy</small></span><b>→</b></button></article>
      <article class="panel portal-history"><div class="panel-heading"><div><h2>My maintenance</h2><p>Your submitted requests</p></div></div>${requests.length ? requests.map((item) => `<div class="portal-history-row"><span><strong>${escapeHtml(item.category)}</strong><small>${escapeHtml(item.description)}<br><button class="table-action" data-action="maintenance-thread" data-request-id="${escapeHtml(item.id)}" data-role="Tenant">Open tenant / maintenance thread (${(item.messages || []).length})</button></small></span><span class="badge ${statusClass(item.status)}">${escapeHtml(item.status)}</span></div>`).join("") : `<div class="empty-state">No maintenance requests yet.</div>`}</article>
      <article class="panel portal-history"><div class="panel-heading"><div><h2>Notices</h2><p>Property updates for your unit</p></div></div>${violations.length ? violations.map((item) => `<div class="portal-history-row"><span><strong>${escapeHtml(item.category)}</strong><small>${escapeHtml(item.description)}</small></span><span class="badge ${statusClass(item.status)}">${escapeHtml(item.status)}</span></div>`).join("") : `<div class="empty-state">No notices for this unit.</div>`}</article>
      <article class="panel portal-history"><div class="panel-heading"><div><h2>My space requests</h2><p>Requests must be approved by management.</p></div></div>${spaceRequests.length ? spaceRequests.map((item) => `<div class="portal-history-row"><span><strong>${escapeHtml(item.space)} · ${shortDate(item.date)}</strong><small>${escapeHtml(item.startTime)}–${escapeHtml(item.endTime)} · ${escapeHtml(item.purpose)}</small></span><span class="badge ${item.status === "Approved" ? "badge-green" : item.status === "Declined" ? "badge-red" : "badge-amber"}">${escapeHtml(item.status)}</span></div>`).join("") : `<div class="empty-state">You have no shared-space requests.</div>`}</article>
    </div>
  </section>`;
}

function spaceBookingForm(unitId) {
  const unit = state.units.find((item) => item.id === Number(unitId) && item.status === "Occupied");
  if (!unit) {
    showToast("Select an occupied tenant unit before requesting a space.", true);
    return;
  }
  openModal(`<form id="space-booking-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">COMMUNITY SPACES</p><h2>Request a shared space</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <p class="subheading booking-requester">Requesting as ${escapeHtml(unit.resident)} · ${escapeHtml(unitLabel(unit.id))}</p>
    <input type="hidden" name="unitId" value="${unit.id}">
    <div class="form-grid">
      <label class="form-field full-width">Space<select name="space" required><option>Multi-purpose hall</option><option>Park</option><option>Other</option></select></label>
      <label id="other-space-field" class="form-field full-width" hidden>Other community space<input name="otherSpace" maxlength="100" placeholder="Name or describe the space"></label>
      <label class="form-field">Requested date<input name="date" type="date" min="${localDateString()}" required></label>
      <label class="form-field">Expected attendees<input name="attendees" type="number" min="1" max="500" step="1" required placeholder="Number of guests"></label>
      <label class="form-field">Start time<input name="startTime" type="time" required></label>
      <label class="form-field">End time<input name="endTime" type="time" required></label>
      <label class="form-field full-width">Gathering details<textarea name="purpose" rows="3" maxlength="400" required placeholder="What is the gathering for?"></textarea></label>
    </div>
    <p class="form-hint">This is a request, not a confirmed booking. Management will review availability and contact you with a decision.</p>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">Submit request</button></div>
  </form>`);
}

function openModal(content) {
  modal.classList.toggle("modal-wide", content.includes('class="modal-card role-form-modal"'));
  modalContent.innerHTML = content;
  if (!modal.open) modal.showModal();
  modalContent.querySelector("input,select,textarea,button")?.focus();
}

function closeModal() {
  modal.close();
  modal.classList.remove("modal-wide");
}

function paymentForm(unitId) {
  const selectedCharge = activeTenantCharge(state.units.find((unit) => unit.id === Number(unitId)));
  const options = state.charges.filter((charge) => charge.balance > 0).map((charge) => `<option value="${escapeHtml(charge.id)}" ${selectedCharge?.id === charge.id ? "selected" : ""}>${escapeHtml(charge.resident)} · ${escapeHtml(unitLabel(charge.unitId))} · ${money(charge.balance)} due</option>`).join("");
  openModal(`<form id="payment-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">RENT LEDGER</p><h2>Record rent payment</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="form-grid"><label class="form-field full-width">Resident / unit<select name="chargeId" required>${options || `<option value="">No outstanding balances</option>`}</select></label>
    <label class="form-field">Amount received<input name="amount" type="number" min="1" step="0.01" placeholder="12000" required></label>
    <label class="form-field">Payment method<select name="method" required><option>Bank transfer</option><option>E-wallet</option><option>Cash</option><option>Check</option><option>Other</option></select></label>
    <label class="form-field full-width">Reference number <span class="optional">(optional)</span><input name="reference" maxlength="60" placeholder="Transfer or transaction reference"></label>
    </div>
    <p class="form-hint">This records a payment already received and creates a receipt. It does not collect money online.</p>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit" ${options ? "" : "disabled"}>Save &amp; create receipt</button></div>
  </form>`);
}

function maintenanceForm(unitId) {
  const unitOptions = state.units.filter((unit) => unit.status === "Occupied").map((unit) => `<option value="${unit.id}" ${Number(unitId) === unit.id ? "selected" : ""}>${escapeHtml(unit.resident)} · ${escapeHtml(unitLabel(unit.id))}</option>`).join("");
  openModal(`<form id="maintenance-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">WORK ORDER</p><h2>New maintenance request</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="form-grid"><label class="form-field full-width">Resident / unit<select name="unitId" required>${unitOptions}</select></label>
    <label class="form-field">Category<select name="category" required><option>Plumbing</option><option>Electrical</option><option>Appliance</option><option>Water</option><option>Common area</option><option>Other</option></select></label>
    <label class="form-field">Priority<select name="priority" required><option>Normal</option><option>High</option><option>Low</option></select></label>
    <label class="form-field full-width">Describe the issue<textarea name="description" rows="4" maxlength="500" required placeholder="Include the location and details of the issue."></textarea></label></div>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Create request</button></div>
  </form>`);
}

function violationForm() {
  const unitOptions = state.units.filter((unit) => unit.status === "Occupied").map((unit) => `<option value="${unit.id}">${escapeHtml(unit.resident)} · ${escapeHtml(unitLabel(unit.id))}</option>`).join("");
  const categories = [...new Set(state.violationCatalog.filter((rule) => rule.active).map((rule) => rule.category))];
  openModal(`<form id="violation-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">COMMUNITY STANDARDS</p><h2>Log a violation</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="form-grid"><label class="form-field full-width">Resident / unit<select name="unitId" required>${unitOptions}</select></label>
    <label class="form-field full-width">Category<select name="category" required>${categories.map((category) => `<option>${escapeHtml(category)}</option>`).join("")}<option>Other</option></select></label>
    <label class="form-field full-width">Factual incident notes<textarea name="description" rows="4" maxlength="500" required placeholder="Record the observed issue and relevant dates."></textarea></label></div>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Save violation</button></div>
  </form>`);
}

function communityRuleForm() {
  openModal(`<form id="community-rule-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">COMMUNITY STANDARDS</p><h2>Add a known violation</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="form-grid">
      <label class="form-field full-width">Rule title<input name="title" maxlength="100" required placeholder="For example, improper waste disposal"></label>
      <label class="form-field full-width">Category<input name="category" maxlength="60" required placeholder="For example, Sanitation"></label>
      <label class="form-field full-width">Community rule / description<textarea name="description" rows="4" maxlength="500" required placeholder="Describe the policy in clear, neutral terms."></textarea></label>
    </div>
    <div class="form-hint">Only add policies approved for this community. Active rules are available as categories when management logs an incident.</div>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Add rule</button></div>
  </form>`);
}

function announcementForm() {
  openModal(`<form id="announcement-form" class="modal-card">
    <div class="modal-header"><div><p class="eyebrow">COMMUNITY UPDATES</p><h2>Draft a community announcement</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="form-grid">
      <label class="form-field full-width">Activity or drive title<input name="title" maxlength="100" required placeholder="Community clean-up drive"></label>
      <label class="form-field full-width">Event date<input name="date" type="date" min="${localDateString()}" required></label>
      <label class="form-field full-width">Details for residents<textarea name="message" rows="4" maxlength="600" required placeholder="Share the time, location, and what residents should know."></textarea></label>
    </div>
    <p class="form-hint">This saves a draft only. It will not email or text residents until a delivery service is connected.</p>
    <div class="modal-actions"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Save draft</button></div>
  </form>`);
}

function createReceipt(payment) {
  openModal(`<article class="modal-card receipt-card">
    <div class="receipt-brand"><span class="brand-mark">H</span><span><strong>Sit with Haven</strong><small>DISIPLINA VILLAGE VALENZUELA CITY</small></span></div>
    <div class="receipt-success"><span>✓</span><strong>Payment recorded</strong><small>Receipt ${escapeHtml(payment.id)}</small></div>
    <div class="receipt-details"><div><span>Received from</span><strong>${escapeHtml(payment.resident)}</strong></div><div><span>Unit</span><strong>${escapeHtml(unitLabel(payment.unitId))}</strong></div><div><span>Date</span><strong>${shortDate(payment.date)}</strong></div><div><span>Payment method</span><strong>${escapeHtml(payment.method)}</strong></div>${payment.reference ? `<div><span>Reference</span><strong>${escapeHtml(payment.reference)}</strong></div>` : ""}<div class="receipt-total"><span>Amount received</span><strong>${money(payment.amount)}</strong></div></div>
    <p class="receipt-disclaimer">This receipt confirms a payment entry in the demo ledger. It is not proof of a processed online transaction.</p>
    <div class="modal-actions no-print"><button class="button button-outline" data-action="close-modal">Close</button><button class="button button-primary" data-action="print-receipt">Print receipt</button></div>
  </article>`);
}

function nextId(prefix, list, field = "id") {
  const highest = list.reduce((max, item) => {
    const number = Number(String(item[field]).match(/\d+$/)?.[0] || 0);
    return Math.max(max, number);
  }, 0);
  return `${prefix}${String(highest + 1).padStart(4, "0")}`;
}

function downloadCsv(rows, filename, auditAction, auditModule) {
  const csv = rows.map((row) => row.map((value) => {
    const text = String(value ?? "");
    const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  recordAudit(auditAction, auditModule);
}

function exportPropertyPortfolio() {
  const properties = state.properties.filter((property) => property.type !== "hoa");
  const rows = [["Property ID", "Property Name", "Type", "Address", "Owner", "Manager", "Portfolio", "Status", "Units", "Occupancy", "Revenue"]];
  properties.forEach((property) => {
    const metrics = propertyUnitMetrics(property.id);
    const unitCount = metrics.units.length;
    const revenue = metrics.charges.reduce((sum, charge) => sum + charge.amount, 0);
    rows.push([
      property.id, property.name, propertyTypeName(property.type), property.address,
      hasPermission("finance", "view") ? property.profile?.ownerName || "" : "",
      property.profile?.propertyManager || "",
      state.propertyGroups.filter((group) => group.propertyIds.includes(property.id)).map((group) => group.name).join("; "),
      property.profile?.status || "Active", unitCount,
      unitCount ? `${Math.round(metrics.occupied / unitCount * 100)}%` : "",
      unitCount ? revenue : ""
    ]);
  });
  downloadCsv(rows, `sit-with-haven-properties-${localDateString()}.csv`, "Exported property portfolio", "properties");
  showToast("Property portfolio exported as CSV.");
}

function exportCalendar() {
  const rows = [["Date", "Type", "Title", "Status", "Details", "Source"]];
  getCalendarEvents(currentEnvironment).forEach((item) => rows.push([
    item.date || "", item.type || "", item.title || "", item.status || "", item.detail || "", item.source || "Calendar event"
  ]));
  downloadCsv(rows, `sit-with-haven-${currentEnvironment}-calendar-${localDateString()}.csv`, "Exported calendar agenda", "calendar");
  showToast("Calendar agenda exported as CSV.");
}

function exportCsv() {
  const units = currentPage === "units" ? unitsForProperty(selectedPropertyId) : state.units;
  const selectedProperty = state.properties.find((property) => property.id === selectedPropertyId);
  const rows = [["Property", "Building", "Unit Number", "Resident", "Occupation", "Additional household members", "Occupants", "Address", "Phone", "Email", "Pet count", "Pet types", "Other pet details", "Status", "Monthly Rent", "Recurring monthly charges", "Monthly total", "Balance", "Payment status"]];
  units.forEach((unit) => {
    const charge = activeTenantCharge(unit);
    const members = unit.householdMembers || [];
    const pets = [unit.pets, ...members.map((member) => member.pets || {})];
    rows.push([
      state.properties.find((property) => property.id === (unit.propertyId || "disiplina-village"))?.name || "",
      `Building ${String(unit.building).padStart(2, "0")}`,
      unit.unitNumber,
      unit.resident,
      unit.occupation || "",
      members.map((member) => `${member.name}${member.occupation ? ` (${member.occupation})` : ""}`).join("; "),
      unit.resident ? 1 + members.filter((member) => member.name).length : 0,
      hasPermission("resident-data", "export") ? unit.contact?.address || "" : "",
      hasPermission("resident-data", "export") ? unit.contact?.phone || "" : "",
      hasPermission("resident-data", "export") ? unit.contact?.email || "" : "",
      pets.reduce((total, item) => total + (item.count || 0), 0),
      pets.flatMap((item) => item.types || []).join(", "),
      pets.map((item) => item.otherDetails || "").filter(Boolean).join("; "),
      unit.status,
      unit.monthlyRent || "",
      (unit.recurringCharges || []).map((item) => `${item.name}: ${item.amount}`).join("; "),
      charge ? charge.amount : "",
      charge ? charge.balance : "",
      charge ? charge.status : ""
    ]);
  });
  const csv = rows.map((row) => row.map((value) => {
    const text = String(value);
    const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `sit-with-haven-${selectedProperty?.id || "units"}-units-${localDateString()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  recordAudit("Exported unit and rent ledger as CSV", "units");
  showToast("Unit and rent ledger exported as CSV.");
}

document.addEventListener("click", (event) => {
  const environmentButton = event.target.closest("[data-environment]");
  if (environmentButton) {
    switchEnvironment(environmentButton.dataset.environment);
    return;
  }
  const profileToggle = event.target.closest("#profile-menu-toggle");
  if (profileToggle) {
    const menu = document.getElementById("profile-menu");
    menu.hidden = !menu.hidden;
    profileToggle.setAttribute("aria-expanded", String(!menu.hidden));
    if (!menu.hidden) menu.querySelector('[data-page="my-settings"]')?.focus();
    return;
  }
  if (!event.target.closest(".profile-menu-container")) {
    const menu = document.getElementById("profile-menu");
    if (menu) menu.hidden = true;
    document.getElementById("profile-menu-toggle")?.setAttribute("aria-expanded", "false");
  }
  const searchResult = event.target.closest("[data-search-result]");
  if (searchResult) {
    const query = document.getElementById("universal-search")?.value || "";
    const result = findUniversalResults(query)[Number(searchResult.dataset.searchResult)];
    if (!result) {
      showToast("That search result is no longer available.", true);
      return;
    }
    if (result.environment && result.environment !== currentEnvironment) switchEnvironment(result.environment);
    if (result.propertyId) selectedPropertyId = result.propertyId;
    if (result.dashboard) dashboardView = result.dashboard;
    if (result.reportId) selectedReport = result.reportId;
    if (result.receiptId) rentTab = "receipts";
    if (result.query && result.page === "units") pageSearchTerms.units = result.query;
    if (result.query && result.page === "rent") pageSearchTerms.rent = result.query;
    const input = document.getElementById("universal-search");
    if (input) input.value = "";
    renderUniversalSearchResults("");
    setPage(result.page);
    return;
  }
  if (!event.target.closest(".universal-search")) {
    const results = document.getElementById("universal-search-results");
    if (results) results.hidden = true;
  }
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    setPage(pageButton.dataset.page);
    return;
  }

  const reportButton = event.target.closest("[data-report]");
  if (reportButton && !reportButton.disabled) {
    selectedReport = reportButton.dataset.report;
    render();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const { action, unitId, receiptId } = actionButton.dataset;
  if (action === "my-settings-category") {
    mySettingsCategory = MY_SETTINGS_CATEGORIES.some(([id]) => id === actionButton.dataset.category)
      ? actionButton.dataset.category : "profile";
    render();
    return;
  }
  if (action === "personal-setting-action") {
    const actionName = actionButton.dataset.settingKey;
    const message = actionName === "changePassword"
      ? "Password changes require secure authentication, which is not configured in this browser prototype."
      : actionName === "dataExportRequest"
        ? "Personal data export requests require an authenticated backend. Use the current report exports only for demo data."
        : "MFA, recovery codes, trusted devices, sessions, and external account connections are not available without a secure backend.";
    showToast(message, true);
    return;
  }
  if (action === "apply-appearance") {
    applyPersonalAppearance();
    showToast("Saved appearance preferences applied to this browser.");
    return;
  }
  const actionModule = {
    "new-property": "properties:create",
    "edit-property-details": "properties:edit",
    "new-unit": "units:manage",
    "import-units": "units:manage",
    "view-property": "properties:view",
    "archive-property": "properties:edit",
    "export-property-portfolio": "properties:export",
    "new-property-group": "settings:manage",
    "edit-property-group": "settings:manage",
    "new-payment-method": "payment-methods:manage",
    "edit-payment-method": "payment-methods:manage",
    "toggle-payment-method": "payment-methods:manage",
    "tenant-form": unitId ? "tenants:edit" : "tenants:create",
    "move-out": "tenants:edit",
    "add-building": "units:manage",
    payment: "finance:create",
    "new-charge": "finance:create",
    "new-maintenance": "maintenance:create",
    "portal-maintenance": "maintenance:create",
    "new-violation": "incidents:create",
    "new-rule": "incidents:manage",
    "toggle-rule": "incidents:manage",
    "new-announcement": "communications:create",
    "new-team-contact": "users:manage",
    "space-booking": "community:create",
    "new-calendar-event": "calendar:create",
    "export-calendar": "calendar:export",
    "decide-arc": "arc:approve",
    "export-report": "reports:export",
    "export-report-word": "reports:export",
    "print-report": "reports:print",
    "print-receipt": "finance:print",
    "maintenance-thread": "maintenance:view",
    "receipt": "finance:view",
    export: currentPage === "reports" || currentPage === "association-reports" ? "reports:export"
      : currentPage === "properties" ? "properties:export" : currentPage === "tenants" ? "tenants:export" : "units:export"
  }[action];
  if (["bulk-rent-edit", "set-unit-rent"].includes(action) && !canManageBulkRent()) {
    showToast("Your role does not have permission to change unit rent.", true);
    return;
  }
  if (actionModule) {
    const [module, permission] = actionModule.split(":");
    if (!hasPermission(module, permission)) {
      showToast(`Your role does not have permission to ${permission} in this module.`, true);
      return;
    }
  }
  if (["new-user", "edit-user", "new-role", "edit-role", "toggle-user", "toggle-role"].includes(action) && !hasPermission("users", "manage")) {
    showToast("Only authorized administrators can manage users and roles.", true);
    return;
  }
  if (["new-payment-method", "edit-payment-method", "toggle-payment-method"].includes(action)
    && !hasPermission("payment-methods", "manage")) {
    showToast("Only the President / Executive Director or Property Manager can manage payment instructions.", true);
    return;
  }
  if (action === "dashboard-view") {
    const view = actionButton.dataset.view;
    if (!availableDashboardViews().some(([id]) => id === view)) {
      showToast("This dashboard is not assigned to your role.", true);
      return;
    }
    dashboardView = view;
    render();
    return;
  }
  if (action === "property-view") {
    propertyPortfolioView = actionButton.dataset.view === "table" ? "table" : "grid";
    render();
    return;
  }
  if (action === "property-tab") {
    document.getElementById(actionButton.dataset.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (action === "view-property") {
    selectedPropertyId = actionButton.dataset.propertyId;
    setPage("property-detail");
    return;
  }
  if (action === "archive-property") {
    const property = state.properties.find((item) => item.id === actionButton.dataset.propertyId);
    if (!property) {
      showToast("That property could not be found.", true);
      return;
    }
    const status = property.profile?.status === "Inactive" ? "Active" : "Inactive";
    persist({
      ...state,
      properties: state.properties.map((item) => item.id === property.id
        ? { ...item, profile: { ...item.profile, status } } : item)
    }, `${status === "Inactive" ? "Archived" : "Restored"} property ${property.name}`);
    return;
  }
  if (action === "access-tab") {
    const requiredModule = actionButton.dataset.tab === "audit" ? "audit" : "users";
    const requiredPermission = actionButton.dataset.tab === "roles" ? "manage" : "view";
    if (!hasPermission(requiredModule, requiredPermission)) {
      showToast("Your role cannot view or manage this section.", true);
      return;
    }
    usersTab = actionButton.dataset.tab;
    render();
    return;
  }
  if (action === "new-user") userForm();
  if (action === "edit-user") userForm(actionButton.dataset.userId);
  if (action === "new-property") {
    if (!hasPermission("properties", "create")) {
      showToast("You do not have permission to add a property profile.", true);
      return;
    }
    propertyForm(actionButton.dataset.propertyType || "");
  }
  if (action === "edit-property-details") propertyDetailsForm(actionButton.dataset.propertyId);
  if (action === "new-unit") unitForm(actionButton.dataset.propertyId || selectedPropertyId);
  if (action === "import-units") unitImportForm(actionButton.dataset.propertyId || selectedPropertyId);
  if (action === "new-property-group") propertyGroupForm();
  if (action === "edit-property-group") propertyGroupForm(actionButton.dataset.groupId);
  if (action === "bulk-rent-edit") bulkRentForm();
  if (action === "set-unit-rent") bulkRentForm(actionButton.dataset.unitId);
  if (action === "new-payment-method") paymentMethodForm(actionButton.dataset.propertyId);
  if (action === "edit-payment-method") paymentMethodForm(actionButton.dataset.propertyId, actionButton.dataset.methodId);
  if (action === "toggle-payment-method") {
    const property = state.properties.find((item) => item.id === actionButton.dataset.propertyId);
    const method = property?.paymentMethods.find((item) => item.id === actionButton.dataset.methodId);
    if (!property || !method) {
      showToast("The selected payment method could not be found.", true);
      return;
    }
    if (!method.active && method.type === "bank" && (!method.institution || !method.accountName || !method.accountNumber)) {
      showToast("Add and verify the bank, account name, and account number before enabling this method.", true);
      paymentMethodForm(property.id, method.id);
      return;
    }
    if (!method.active && !method.instructions.trim()) {
      showToast("Add payment instructions before enabling this method.", true);
      paymentMethodForm(property.id, method.id);
      return;
    }
    persist({
      ...state,
      properties: state.properties.map((item) => item.id !== property.id ? item : {
        ...item,
        paymentMethods: item.paymentMethods.map((paymentMethod) => paymentMethod.id === method.id
          ? { ...paymentMethod, active: !paymentMethod.active } : paymentMethod)
      })
    }, `${method.active ? "Disabled" : "Enabled"} ${method.label || PAYMENT_METHOD_TYPES.find(([id]) => id === method.type)?.[1] || "payment method"} for ${property.name}`);
    showToast(`${method.active ? "Payment instructions are off." : "Payment instructions are on."}`);
  }
  if (action === "new-role") roleForm();
  if (action === "edit-role") roleForm(actionButton.dataset.roleId);
  if (action === "toggle-user") {
    if (!hasPermission("users", "manage")) {
      showToast("You do not have permission to manage user accounts.", true);
      return;
    }
    const user = state.accessControl.users.find((item) => item.id === actionButton.dataset.userId);
    if (!user || (user.id === "USER-0001" && user.status === "Active")) {
      showToast("The initial administrator demo record cannot be deactivated.", true);
      return;
    }
    const status = user.status === "Active" ? "Deactivated" : "Active";
    persist({
      ...state,
      accessControl: {
        ...state.accessControl,
        users: state.accessControl.users.map((item) => item.id === user.id ? { ...item, status } : item)
      }
    }, `${status} local user record ${user.email}`);
  }
  if (action === "toggle-role") {
    if (!hasPermission("users", "manage")) {
      showToast("You do not have permission to manage roles.", true);
      return;
    }
    const role = state.accessControl.roles.find((item) => item.id === actionButton.dataset.roleId);
    if (!role || role.id === "president-executive-director" || (role.id === currentDemoRole()?.id && role.active)) {
      showToast("The President / Executive Director or active demo role cannot be deactivated.", true);
      return;
    }
    const active = !role.active;
    persist({
      ...state,
      accessControl: {
        ...state.accessControl,
        roles: state.accessControl.roles.map((item) => item.id === role.id ? { ...item, active } : item)
      }
    }, `${active ? "Activated" : "Deactivated"} role ${role.name}`);
  }
  if (action === "maintenance-thread") maintenanceThread(actionButton.dataset.requestId, actionButton.dataset.role || "Property manager");
  if (action === "space-booking") spaceBookingForm(unitId);
  if (action === "new-team-contact") teamContactForm();
  if (action === "add-building") addBuilding();
  if (action === "tenant-form") tenantForm(unitId ? Number(unitId) : undefined, actionButton.dataset.propertyId || selectedPropertyId);
  if (action === "move-out") moveOutTenant(unitId);
  if (action === "new-association-record") associationRecordForm(actionButton.dataset.kind);
  if (action === "edit-association-record") associationRecordForm(actionButton.dataset.kind, actionButton.dataset.recordId);
  if (action === "new-assessment") associationRecordForm("assessment");
  if (action === "new-calendar-event") calendarEventForm();
  if (action === "new-charge") tenantChargeForm(unitId ? Number(unitId) : undefined);
  if (action === "calendar-view") {
    calendarView = ["day", "week", "month", "agenda", "timeline"].includes(actionButton.dataset.view)
      ? actionButton.dataset.view : "agenda";
    render();
  }
  if (action === "export-calendar") exportCalendar();
  if (action === "export-property-portfolio") exportPropertyPortfolio();
  if (action === "decide-arc") {
    const requests = state.associationRecords.arcRequests.map((item) => item.id === actionButton.dataset.recordId
      ? { ...item, status: actionButton.dataset.status, decidedAt: localDateString() } : item);
    persist({ ...state, associationRecords: { ...state.associationRecords, arcRequests: requests } }, `${actionButton.dataset.status} an ARC request`);
  }
  if (action === "export-report") exportReportCsv();
  if (action === "export-report-word") exportReportWord();
  if (action === "print-report") {
    const printedName = selectedReport === "custom" ? [...selectedReports].map((id) => reportCatalog.find((item) => item.id === id)?.name).filter(Boolean).join(", ") || "custom report"
      : reportCatalog.find((item) => item.id === selectedReport)?.name || "report";
    recordAudit(`Printed ${printedName} / saved as PDF`, "reports");
    window.print();
  }
  if (action === "add-household-member") {
    const list = document.getElementById("household-member-list");
    list.insertAdjacentHTML("beforeend", householdMemberForm({}, Date.now()));
    list.lastElementChild.querySelector("[data-member-name]").focus();
  }
  if (action === "remove-household-member") actionButton.closest("[data-household-member]").remove();
  if (action === "add-recurring-charge") {
    const list = document.getElementById("recurring-charge-list");
    list.insertAdjacentHTML("beforeend", recurringChargeForm());
    list.lastElementChild.querySelector("[data-charge-name]").focus();
  }
  if (action === "remove-recurring-charge") actionButton.closest("[data-recurring-charge]").remove();
  if (action === "payment") paymentForm(unitId ? Number(unitId) : undefined);
  if (action === "new-maintenance") maintenanceForm();
  if (action === "portal-maintenance") maintenanceForm(Number(unitId));
  if (action === "new-violation") violationForm();
  if (action === "new-rule") communityRuleForm();
  if (action === "new-announcement") announcementForm();
  if (action === "toggle-rule") {
    const nextRules = state.violationCatalog.map((rule) => rule.id === actionButton.dataset.ruleId ? { ...rule, active: !rule.active } : rule);
    persist({ ...state, violationCatalog: nextRules });
    showToast("Community rule updated.");
  }
  if (action === "portal-violation") showToast("Please contact property management directly; messaging is not connected in this demo.");
  if (action === "portal-pay") showToast("Online checkout is not configured. No payment has been made.", true);
  if (action === "close-modal") closeModal();
  if (action === "rent-balances") { rentTab = "balances"; render(); }
  if (action === "rent-receipts") { rentTab = "receipts"; render(); }
  if (action === "violation-incidents") { violationTab = "incidents"; render(); }
  if (action === "violation-rules") { violationTab = "rules"; render(); }
  if (action === "units-prev") { unitPage = Math.max(0, unitPage - 1); render(); }
  if (action === "units-next") { unitPage += 1; render(); }
  if (action === "export") exportCsv();
  if (action === "print-receipt") {
    recordAudit("Printed payment receipt", "finance");
    window.print();
  }
  if (action === "receipt") {
    const payment = state.payments.find((item) => item.id === receiptId);
    if (payment && hasPermission("finance", "view")) createReceipt(payment);
  }
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const module = recordModule(form.id);
  const requiredPermission = form.dataset.permission || (form.id === "access-user-form" || form.id === "access-role-form" || form.id === "payment-method-form" || form.id === "property-group-form" || form.id === "general-settings-form" || form.id === "unit-form" || form.id === "unit-import-form" ? "manage"
    : form.id === "property-form" ? "create"
    : form.id === "property-details-form" ? "edit"
    : form.id === "tenant-form" ? (state.units.find((unit) => unit.id === Number(form.querySelector('[name="unitId"]')?.value))?.resident ? "edit" : "create")
      : form.id === "property-form" || form.id === "payment-form" || form.id === "maintenance-form" || form.id === "violation-form" || form.id === "community-rule-form" || form.id === "announcement-form" || form.id === "space-booking-form" ? "create"
      : "edit");
  const effectiveModule = form.dataset.permissionModule || module || (form.id === "access-user-form" || form.id === "access-role-form" ? "users" : "");
  if (form.id === "bulk-rent-form" && !canManageBulkRent()) {
    showToast("Only the President / Executive Director or Property Manager can bulk edit rent.", true);
    return;
  }
  if (form.id !== "bulk-rent-form" && effectiveModule && !hasPermission(effectiveModule, requiredPermission)) {
    showToast(`Your role does not have permission to ${requiredPermission} ${effectiveModule} records.`, true);
    return;
  }
  const data = new FormData(form);

  if (form.id === "my-settings-form") {
    const user = currentDemoUser();
    if (!user) {
      showToast("No active user profile is available.", true);
      return;
    }
    const category = MY_SETTINGS_CATEGORIES.find(([id]) => id === mySettingsCategory);
    if (!category) {
      showToast("Select a valid My Settings section.", true);
      return;
    }
    const existing = state.userSettings?.[user.id] || {};
    const personalSettings = { ...existing };
    category[2].forEach(([key, , type]) => {
      if (type !== "readonly" && type !== "action" && data.has(key)) {
        personalSettings[key] = String(data.get(key) || "").trim();
      }
    });
    let accessControl = state.accessControl;
    if (mySettingsCategory === "profile") {
      const firstName = String(data.get("firstName") || "").trim();
      const lastName = String(data.get("lastName") || "").trim();
      const emailAddress = String(data.get("emailAddress") || "").trim().toLowerCase();
      const profilePhoto = String(data.get("profilePhoto") || "").trim();
      const name = [firstName, lastName].filter(Boolean).join(" ");
      if (!name || !emailAddress.includes("@")) {
        showToast("Enter a first or last name and a valid email address.", true);
        return;
      }
      if (!isValidProfilePhotoUrl(profilePhoto)) {
        showToast("Enter a valid HTTPS profile photo URL or leave it blank.", true);
        return;
      }
      personalSettings.firstName = firstName;
      personalSettings.lastName = lastName;
      personalSettings.emailAddress = emailAddress;
      accessControl = {
        ...state.accessControl,
        users: state.accessControl.users.map((item) => item.id === user.id
          ? { ...item, name, email: emailAddress } : item)
      };
    }
    persist({
      ...state,
      accessControl,
      userSettings: { ...state.userSettings, [user.id]: personalSettings }
    }, `Updated ${category[1]} preferences for demo user ${user.email}`);
    showToast(`${category[1]} saved for this browser's demo user.`);
    return;
  }

  if (form.id === "payment-method-form") {
    const propertyId = String(data.get("propertyId") || "");
    const methodId = String(data.get("methodId") || "");
    const property = state.properties.find((item) => item.id === propertyId);
    const existing = property?.paymentMethods.find((item) => item.id === methodId);
    const type = String(data.get("type") || "");
    const institution = String(data.get("institution") || "").trim();
    const accountName = String(data.get("accountName") || "").trim();
    const accountNumber = String(data.get("accountNumber") || "").trim();
    const instructions = String(data.get("instructions") || "").trim();
    const active = data.get("active") === "true";
    if (!property || !PAYMENT_METHOD_TYPES.some(([id]) => id === type)
      || property.paymentMethods.some((method) => method.type === type && method.id !== methodId)) {
      showToast("Each property can have one payment method of each type.", true);
      return;
    }
    if (active && type === "bank" && (!institution || !accountName || !accountNumber)) {
      showToast("To enable a bank method, enter the bank, registered account name, and account number.", true);
      return;
    }
    if (active && !instructions) {
      showToast("Add payment instructions before turning a method on.", true);
      return;
    }
    const method = {
      id: existing?.id || nextId(`PAY-${property.id}-`, property.paymentMethods),
      type,
      label: String(data.get("label") || "").trim(),
      institution,
      accountName,
      accountNumber,
      branch: String(data.get("branch") || "").trim(),
      instructions,
      active
    };
    const paymentMethods = existing
      ? property.paymentMethods.map((item) => item.id === existing.id ? method : item)
      : [...property.paymentMethods, method];
    persist({
      ...state,
      properties: state.properties.map((item) => item.id === property.id ? { ...item, paymentMethods } : item)
    }, `${existing ? "Updated" : "Added"} ${method.label || PAYMENT_METHOD_TYPES.find(([id]) => id === type)?.[1]} instructions for ${property.name}`);
    closeModal();
    showToast(`Payment method saved${active ? " and shown to residents" : " but hidden from residents"}. Payments are not processed here.`);
    return;
  }

  if (form.id === "general-settings-form") {
    const generalSettings = Object.fromEntries(GENERAL_SETTING_CATEGORIES.map(([id]) => [id, {
      enabled: data.has(`${id}.enabled`),
      notes: String(data.get(`${id}.notes`) || "").trim()
    }]));
    persist({ ...state, generalSettings }, "Updated general system settings");
    showToast("General settings saved in this browser. External services remain unconnected.");
    return;
  }

  if (form.id === "property-details-form") {
    const propertyId = String(data.get("propertyId") || "");
    const property = state.properties.find((item) => item.id === propertyId);
    const name = String(data.get("propertyName") || "").trim();
    const type = String(data.get("propertyType") || "");
    const environmentMatches = property && (currentEnvironment === "association") === (property.type === "hoa");
    const typeMatchesEnvironment = property && (property.type === "hoa" ? type === "hoa" : type !== "hoa");
    if (!property || !environmentMatches || !typeMatchesEnvironment || !name || !PROPERTY_TYPES.some(([id]) => id === type)
      || state.properties.some((item) => item.id !== propertyId && item.name.toLowerCase() === name.toLowerCase())) {
      showToast("Enter a unique property name and supported property type.", true);
      return;
    }
    const profile = { ...property.profile };
    PROPERTY_PROFILE_GROUPS.flatMap(([, , fields]) => fields).forEach(([key]) => {
      if (data.has(`profile.${key}`)) profile[key] = String(data.get(`profile.${key}`) || "").trim();
    });
    profile.status = String(data.get("propertyStatus") || "Active");
    const updated = { ...property, name, type, address: String(data.get("propertyAddress") || "").trim(), profile };
    persist({ ...state, properties: state.properties.map((item) => item.id === propertyId ? updated : item) }, `Updated profile for ${name}`);
    closeModal();
    showToast("Property profile saved.");
    return;
  }

  if (form.id === "property-group-form") {
    const groupId = String(data.get("groupId") || "");
    const existing = state.propertyGroups.find((group) => group.id === groupId);
    const name = String(data.get("name") || "").trim();
    const propertyIds = [...new Set(data.getAll("propertyIds").map(String).filter((id) => state.properties.some((property) => property.id === id)))];
    const customFields = [...new Set(String(data.get("customFields") || "").split(",").map((field) => field.trim()).filter(Boolean))].slice(0, 20);
    if (!name || state.propertyGroups.some((group) => group.id !== groupId && group.name.toLowerCase() === name.toLowerCase())) {
      showToast("Enter a unique property group name.", true);
      return;
    }
    const group = {
      id: existing?.id || nextId("GROUP-", state.propertyGroups),
      name,
      description: String(data.get("description") || "").trim(),
      propertyIds,
      customFields
    };
    const propertyGroups = existing
      ? state.propertyGroups.map((item) => item.id === group.id ? group : item)
      : [...state.propertyGroups, group];
    persist({ ...state, propertyGroups }, `${existing ? "Customized" : "Created"} property group ${name}`);
    closeModal();
    showToast("Property group saved.");
    return;
  }

  if (form.id === "bulk-rent-form") {
    const propertyId = String(data.get("propertyId") || "");
    const property = state.properties.find((item) => item.id === propertyId);
    const building = String(data.get("building") || "all");
    const occupancy = String(data.get("occupancy") || "all");
    const targetMode = String(data.get("targetMode") || "property");
    const selectedUnitIds = new Set(data.getAll("unitIds").map(Number));
    const mode = String(data.get("mode") || "");
    const value = Number(data.get("value"));
    if (!canManageBulkRent()) {
      showToast("Your role does not have permission to change unit rent.", true);
      return;
    }
    if (!property || !["property", "selected", "single"].includes(targetMode)
      || !["all", "Occupied", "Vacant"].includes(occupancy)) {
      showToast("Select a valid property and rent update target.", true);
      return;
    }
    if (!["set", "increase", "decrease", "percent"].includes(mode) || !Number.isFinite(value) || value <= 0) {
      showToast("Select a valid update method and enter a positive value.", true);
      return;
    }
    if ((targetMode === "single" && selectedUnitIds.size !== 1)
      || (targetMode === "selected" && selectedUnitIds.size === 0)) {
      showToast(targetMode === "single" ? "Select exactly one unit." : "Select at least one unit to update.", true);
      return;
    }
    const affectedUnits = unitsForProperty(propertyId).filter((unit) => (occupancy === "all" || unit.status === occupancy)
      && (building === "all" || unit.building === Number(building))
      && (targetMode === "property" || selectedUnitIds.has(unit.id)));
    if (!affectedUnits.length) {
      showToast("No units match this property and update selection.", true);
      return;
    }
    const updates = affectedUnits.map((unit) => {
      const currentRent = unitRent(unit);
      const proposedRent = mode === "set" ? value
        : mode === "increase" ? currentRent + value
          : mode === "decrease" ? currentRent - value
            : currentRent * (1 + value / 100);
      const rent = Math.round(proposedRent * 100) / 100;
      const recurringTotal = (unit.recurringCharges || []).reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
      const total = Math.round((rent + recurringTotal) * 100) / 100;
      const currentCharge = activeTenantCharge(unit);
      const paid = currentCharge ? currentCharge.amount - currentCharge.balance : 0;
      return { unit, rent, total, currentCharge, paid };
    });
    if (updates.some((item) => item.rent <= 0 || !Number.isFinite(item.rent) || item.total < item.paid)) {
      showToast("The update would create a non-positive rent or lower a balance below payments already received. No units were changed.", true);
      return;
    }
    const updateByUnit = new Map(updates.map((item) => [item.unit.id, item]));
    const units = state.units.map((unit) => updateByUnit.has(unit.id)
      ? { ...unit, monthlyRent: updateByUnit.get(unit.id).rent } : unit);
    const activeChargeIds = new Set(updates.filter((item) => item.currentCharge).map((item) => item.currentCharge.id));
    const charges = state.charges.map((charge) => {
      if (!activeChargeIds.has(charge.id)) return charge;
      const update = updateByUnit.get(charge.unitId);
      if (!update) return charge;
      const balance = Math.round((update.total - update.paid) * 100) / 100;
      return { ...charge, amount: update.total, balance, status: balance === 0 ? "Paid" : charge.status === "Overdue" ? "Overdue" : "Due" };
    });
    const missingCharges = updates.filter((item) => !item.currentCharge).reduce((created, item) => [
      ...created,
      {
        id: nextId("RENT-", [...state.charges, ...created]),
        unitId: item.unit.id,
        tenantId: item.unit.tenantId || `TEN-${String(item.unit.id).padStart(4, "0")}`,
        resident: item.unit.resident,
        amount: item.total,
        balance: item.total,
        status: "Due",
        dueDate: `${localDateString().slice(0, 7)}-01`
      }
    ], []);
    const occupiedMissingCharges = missingCharges.filter((charge) => {
      const unit = updates.find((item) => item.unit.id === charge.unitId)?.unit;
      return unit?.status === "Occupied" && Boolean(unit.resident);
    });
    const targetDescription = targetMode === "property" ? "all matching units"
      : targetMode === "single" ? "one unit" : "selected units";
    persist({ ...state, units, charges: [...charges, ...occupiedMissingCharges] }, `Updated base rent for ${updates.length} ${targetDescription} in ${property.name}`);
    closeModal();
    showToast(`Updated monthly base rent for ${updates.length} ${updates.length === 1 ? "unit" : "units"}. Recorded payments were preserved.`);
    return;
  }

  if (form.id === "property-form") {
    const name = String(data.get("name") || "").trim();
    const type = String(data.get("type") || "");
    const address = String(data.get("address") || "").trim();
    const propertyCode = String(data.get("propertyCode") || "").trim();
    const groupId = String(data.get("groupId") || "");
    const yearBuiltValue = String(data.get("yearBuilt") || "").trim();
    const yearBuilt = yearBuiltValue ? Number(yearBuiltValue) : "";
    const typeMatchesEnvironment = currentEnvironment === "association" ? type === "hoa" : type !== "hoa";
    if (!name || !address || !typeMatchesEnvironment || !PROPERTY_TYPES.some(([id]) => id === type)
      || state.properties.some((property) => property.name.toLowerCase() === name.toLowerCase())) {
      showToast("Enter a unique property name, full address, and supported property type.", true);
      return;
    }
    if (propertyCode && state.properties.some((property) => property.profile?.propertyCode?.toLowerCase() === propertyCode.toLowerCase())) {
      showToast("That property code is already in use.", true);
      return;
    }
    if (yearBuiltValue && (!Number.isInteger(yearBuilt) || yearBuilt < 1700 || yearBuilt > new Date().getFullYear())) {
      showToast("Enter a valid year built.", true);
      return;
    }
    const selectedGroup = groupId ? state.propertyGroups.find((group) => group.id === groupId) : null;
    if (groupId && !selectedGroup) {
      showToast("The selected portfolio group could not be found.", true);
      return;
    }
    const profile = {
      status: "Active",
      ownerName: String(data.get("ownerName") || "").trim(),
      propertyManager: String(data.get("propertyManager") || "").trim(),
      yearBuilt: yearBuilt ? String(yearBuilt) : "",
      city: String(data.get("city") || "").trim(),
      state: String(data.get("region") || "").trim(),
      zipCode: String(data.get("postalCode") || "").trim(),
      description: String(data.get("description") || "").trim()
    };
    if (propertyCode) profile.propertyCode = propertyCode;
    const property = {
      id: nextId("PROPERTY-", state.properties),
      name,
      type,
      address,
      groupId,
      profile,
      paymentMethods: [],
      createdAt: localDateString()
    };
    selectedPropertyId = property.id;
    const propertyGroups = groupId
      ? state.propertyGroups.map((group) => group.id === groupId
        ? { ...group, propertyIds: [...new Set([...group.propertyIds, property.id])] } : group)
      : state.propertyGroups;
    persist({ ...state, properties: [...state.properties, property], propertyGroups }, `Created ${propertyTypeName(type)} property ${name}`);
    closeModal();
    setPage("property-detail");
    showToast(`Property created. Add units to ${name} manually, from CSV, or by adding a building.`);
    return;
  }

  if (form.id === "unit-form") {
    const propertyId = String(data.get("propertyId") || "");
    const property = state.properties.find((item) => item.id === propertyId && item.type !== "hoa");
    const building = Number(data.get("building"));
    const unitNumber = String(data.get("unitNumber") || "").trim();
    const rent = Number(data.get("monthlyRent"));
    const propertyUnits = property ? unitsForProperty(property.id) : [];
    const exists = propertyUnits.some((unit) =>
      Number(unit.building) === building && String(unit.unitNumber).toLowerCase() === unitNumber.toLowerCase());
    const buildingFull = propertyUnits.filter((unit) => Number(unit.building) === building).length >= UNITS_PER_BUILDING;
    if (!property || !Number.isInteger(building) || building < 1 || building > MAX_BUILDINGS
      || !unitNumber || unitNumber.length > 80 || !Number.isFinite(rent) || rent < 0 || exists || buildingFull) {
      showToast(exists ? "That building and unit number already exist in this property."
        : buildingFull ? `A building can have up to ${UNITS_PER_BUILDING} units.` : "Enter a valid building, unique unit number, and non-negative rent.", true);
      return;
    }
    const unit = {
      id: nextUnitRecordId(),
      propertyId: property.id,
      building,
      unitNumber,
      resident: "",
      status: "Vacant",
      contact: { address: "", phone: "", email: "" },
      occupation: "",
      householdMembers: [],
      monthlyRent: rent,
      recurringCharges: [],
      pets: { hasPets: false, count: 0, types: [], otherDetails: "" }
    };
    selectedPropertyId = property.id;
    persist({ ...state, units: [...state.units, unit] }, `Added unit ${unitNumber} to ${property.name}`);
    closeModal();
    showToast(`Unit ${unitNumber} added to ${property.name}.`);
    return;
  }

  if (form.id === "unit-import-form") {
    const propertyId = String(data.get("propertyId") || "");
    try {
      const additions = importedUnitRecords(propertyId, String(data.get("csv") || ""));
      const property = state.properties.find((item) => item.id === propertyId);
      selectedPropertyId = propertyId;
      persist({ ...state, units: [...state.units, ...additions] }, `Imported ${additions.length} units to ${property.name}`);
      closeModal();
      showToast(`Imported ${additions.length} units to ${property.name}.`);
    } catch (error) {
      showToast(error.message, true);
    }
    return;
  }

  if (form.id === "access-user-form") {
    const userId = String(data.get("userId") || "");
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim().toLowerCase();
    const department = String(data.get("department") || "").trim();
    const roles = data.getAll("userRoles").map(String).filter((id) => state.accessControl.roles.some((role) => role.id === id && role.active));
    const existing = state.accessControl.users.find((user) => user.id === userId);
    if (!name || !email || roles.length === 0 || state.accessControl.users.some((user) => user.id !== userId && user.email.toLowerCase() === email)) {
      showToast("Enter a name, unique email address, and at least one active role.", true);
      return;
    }
    const user = {
      id: existing?.id || nextId("USER-", state.accessControl.users),
      name,
      email,
      roles,
      department,
      propertyIds: [String(data.get("propertyScope") || "disiplina-village")],
      status: String(data.get("status") || "Active"),
      createdAt: existing?.createdAt || localDateString()
    };
    const users = existing
      ? state.accessControl.users.map((item) => item.id === existing.id ? user : item)
      : [...state.accessControl.users, user];
    persist({ ...state, accessControl: { ...state.accessControl, users } }, `${existing ? "Updated" : "Created"} local user record ${email}`);
    closeModal();
    showToast("Local user record saved. No login account was created.");
    return;
  }

  if (form.id === "access-role-form") {
    const roleId = String(data.get("roleId") || "");
    const existing = state.accessControl.roles.find((role) => role.id === roleId);
    const isPresidentRole = roleId === "president-executive-director";
    const name = String(data.get("name") || "").trim();
    if (!name || state.accessControl.roles.some((role) => role.id !== roleId && role.name.toLowerCase() === name.toLowerCase())) {
      showToast("Enter a unique role name.", true);
      return;
    }
    const permissions = Object.fromEntries(ACCESS_MODULES.map(([module]) => [module, []]));
    data.getAll("rolePermission").map(String).forEach((value) => {
      const [module, permission] = value.split(":");
      if (permissions[module] && PERMISSION_TYPES.includes(permission) && !permissions[module].includes(permission)) permissions[module].push(permission);
    });
    const role = {
      id: existing?.id || `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      name: isPresidentRole ? existing.name : name,
      active: isPresidentRole || data.get("active") === "true",
      permissions: isPresidentRole ? Object.fromEntries(ACCESS_MODULES.map(([module]) => [module, [...PERMISSION_TYPES]])) : permissions,
      dashboardWidgets: isPresidentRole ? existing.dashboardWidgets
        : canManageRoleDashboards()
          ? data.getAll("dashboardWidget").map(String).filter((id) => DASHBOARD_WIDGETS.some(([widgetId]) => widgetId === id))
          : existing?.dashboardWidgets || [],
      dashboardViews: isPresidentRole ? existing.dashboardViews
        : canManageRoleDashboards()
          ? data.getAll("dashboardView").map(String).filter((id) => DASHBOARD_VIEWS.some(([viewId]) => viewId === id))
          : existing?.dashboardViews || []
    };
    if (!existing && state.accessControl.roles.some((item) => item.id === role.id)) {
      showToast("A role with that name already exists.", true);
      return;
    }
    const roles = existing
      ? state.accessControl.roles.map((item) => item.id === existing.id ? role : item)
      : [...state.accessControl.roles, role];
    persist({ ...state, accessControl: { ...state.accessControl, roles } }, `${existing ? "Customized" : "Created"} role ${name}`);
    closeModal();
    showToast("Role permissions saved in this browser.");
    return;
  }

  if (form.id === "payment-form") {
    const charge = state.charges.find((item) => item.id === String(data.get("chargeId") || ""));
    const unitId = Number(charge?.unitId);
    const amount = Number(data.get("amount"));
    if (!charge || !Number.isFinite(amount) || amount <= 0 || amount > charge.balance) {
      showToast("Enter a valid payment amount no greater than the outstanding balance.", true);
      return;
    }
    const payment = {
      id: nextId("RCPT-", state.payments),
      unitId,
      tenantId: charge.tenantId || "",
      resident: charge.resident,
      amount,
      method: String(data.get("method")),
      reference: String(data.get("reference") || "").trim(),
      date: localDateString()
    };
    const remaining = Math.max(0, Math.round((charge.balance - amount) * 100) / 100);
    const nextCharges = state.charges.map((item) => item.id === charge.id
      ? { ...item, balance: remaining, status: remaining === 0 ? "Paid" : item.status === "Overdue" ? "Overdue" : "Due" }
      : item);
    persist({ ...state, charges: nextCharges, payments: [...state.payments, payment] });
    createReceipt(payment);
    return;
  }

  if (form.id === "tenant-charge-form") {
    const unitId = Number(data.get("unitId"));
    const unit = state.units.find((item) => item.id === unitId && item.status === "Occupied");
    const amount = Number(data.get("amount"));
    const description = String(data.get("description") || "").trim();
    const dueDate = String(data.get("dueDate") || "");
    if (!unit || !description || !Number.isFinite(amount) || amount <= 0 || !dueDate) {
      showToast("Select a current tenant and enter a valid charge description, amount, and due date.", true);
      return;
    }
    const charge = {
      id: nextId("CHG-", state.charges),
      unitId,
      tenantId: unit.tenantId || `TEN-${String(unitId).padStart(4, "0")}`,
      resident: unit.resident,
      description,
      amount,
      balance: amount,
      status: dueDate < localDateString() ? "Overdue" : "Due",
      dueDate
    };
    persist({ ...state, charges: [...state.charges, charge] }, `Created ${description} charge for ${unit.resident}`);
    closeModal();
    showToast("Tenant charge created in the local ledger.");
    return;
  }

  if (form.id === "association-record-form") {
    const kind = form.dataset.kind;
    const recordId = String(data.get("recordId") || "");
    const recordLists = { homeowner: "homeowners", board: "boards", arc: "arcRequests", assessment: "assessments", violation: "violations", "association-maintenance": "maintenance" };
    const listKey = recordLists[kind];
    if (!listKey) {
      showToast("Select a supported association record type.", true);
      return;
    }
    const list = state.associationRecords[listKey];
    const existing = list.find((item) => item.id === recordId);
    const associationId = String(data.get("associationId") || "");
    const association = state.properties.find((item) => item.id === associationId && item.type === "hoa");
    const common = {
      id: existing?.id || nextId({ homeowner: "HOM-", board: "BOARD-", arc: "ARC-", assessment: "ASSESS-", violation: "ASSOC-V-", "association-maintenance": "ASSOC-WO-" }[kind], list),
      associationId,
      associationName: association?.name || "Unknown association"
    };
    let record;
    if (kind === "homeowner") {
      const name = String(data.get("name") || "").trim();
      if (!association || !name) {
        showToast("Select an association and enter a homeowner name.", true);
        return;
      }
      record = { ...common, name, unit: String(data.get("unit") || "").trim(), email: String(data.get("email") || "").trim(), phone: String(data.get("phone") || "").trim(), balance: existing?.balance || "Not tracked" };
    } else if (kind === "board") {
      const name = String(data.get("name") || "").trim();
      const position = String(data.get("position") || "").trim();
      if (!association || !name || !position) {
        showToast("Select an association, enter a member name, and choose a board position.", true);
        return;
      }
      record = { ...common, name, position, termStart: String(data.get("termStart") || ""), termEnd: String(data.get("termEnd") || ""), email: String(data.get("email") || "").trim() };
    } else if (kind === "arc") {
      const homeownerName = String(data.get("homeownerName") || "").trim();
      const description = String(data.get("description") || "").trim();
      if (!association || !homeownerName || !description) {
        showToast("Select an association and enter the homeowner and request details.", true);
        return;
      }
      record = { ...common, homeownerName, requestType: String(data.get("requestType") || "Other"), submittedAt: String(data.get("submittedAt") || localDateString()), description, status: existing?.status || "Pending" };
    } else if (kind === "assessment") {
      const name = String(data.get("name") || "").trim();
      const amount = Number(data.get("amount"));
      const dueDate = String(data.get("dueDate") || "");
      if (!association || !name || !Number.isFinite(amount) || amount <= 0 || !dueDate) {
        showToast("Select an association and enter an assessment name, amount, and due date.", true);
        return;
      }
      record = { ...common, name, amount, dueDate, status: String(data.get("status") || "Due") };
    } else if (kind === "violation") {
      const homeownerName = String(data.get("homeownerName") || "").trim();
      const description = String(data.get("description") || "").trim();
      const reportedAt = String(data.get("reportedAt") || "");
      if (!association || !homeownerName || !description || !reportedAt) {
        showToast("Select an association and enter the homeowner, violation details, and reported date.", true);
        return;
      }
      record = { ...common, homeownerName, category: String(data.get("category") || "Other"), description, reportedAt, status: String(data.get("status") || "Open") };
    } else {
      const title = String(data.get("title") || "").trim();
      const location = String(data.get("location") || "").trim();
      const dueDate = String(data.get("dueDate") || "");
      if (!association || !title || !location || !dueDate) {
        showToast("Select an association and enter a work item, location, and due date.", true);
        return;
      }
      record = { ...common, title, location, dueDate, priority: String(data.get("priority") || "Normal"), description: String(data.get("description") || "").trim(), status: String(data.get("status") || "Open") };
    }
    const records = existing ? list.map((item) => item.id === existing.id ? record : item) : [...list, record];
    const recordName = record.name || record.homeownerName || record.title || record.id;
    persist({ ...state, associationRecords: { ...state.associationRecords, [listKey]: records } }, `${existing ? "Updated" : "Added"} ${kind} record ${recordName}`);
    closeModal();
    showToast("Association record saved locally.");
    return;
  }

  if (form.id === "calendar-event-form") {
    const title = String(data.get("title") || "").trim();
    const type = String(data.get("type") || "");
    const date = String(data.get("date") || "");
    const allowedTypes = currentEnvironment === "association"
      ? ["Board", "Community", "Compliance", "Maintenance"]
      : ["Leasing", "Maintenance", "Accounting", "Internal"];
    if (!title || !date || !allowedTypes.includes(type)) {
      showToast("Enter an event title, valid date, and event type for this business environment.", true);
      return;
    }
    const calendarEvent = {
      id: nextId("CAL-", state.calendarEvents),
      environment: currentEnvironment,
      title,
      type,
      date,
      status: String(data.get("status") || "Scheduled"),
      detail: String(data.get("detail") || "").trim()
    };
    persist({ ...state, calendarEvents: [...state.calendarEvents, calendarEvent] }, `Scheduled ${title} in ${currentEnvironment} calendar`);
    closeModal();
    showToast("Calendar event saved to this business environment.");
    return;
  }

  if (form.id === "tenant-form") {
    const unitId = Number(data.get("unitId"));
    const unit = state.units.find((item) => item.id === unitId);
    const resident = String(data.get("resident") || "").trim();
    const leaseStart = String(data.get("leaseStart") || "");
    const leaseEnd = String(data.get("leaseEnd") || "");
    const securityDeposit = Number(data.get("securityDeposit") || 0);
    const hasPets = data.get("hasPets") === "yes";
    const petTypes = hasPets ? data.getAll("petTypes").map(String).filter((type) => ["Cat", "Dog", "Other"].includes(type)) : [];
    const rent = Number(data.get("rent"));
    const petCount = hasPets ? Number(data.get("petCount")) : 0;
    const householdMembers = [...form.querySelectorAll("[data-household-member]")].map((row, index) => {
      const memberHasPets = row.querySelector("[data-member-has-pets]").value === "yes";
      const types = memberHasPets
        ? [...row.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value).filter((type) => ["Cat", "Dog", "Other"].includes(type))
        : [];
      return {
        id: row.querySelector("[data-member-id]").value || `MEM-${unitId}-${index + 1}`,
        name: row.querySelector("[data-member-name]").value.trim(),
        occupation: row.querySelector("[data-member-occupation]").value.trim(),
        pets: {
          hasPets: memberHasPets,
          count: memberHasPets ? Number(row.querySelector("[data-member-pet-count]").value) : 0,
          types,
          otherDetails: memberHasPets && types.includes("Other") ? row.querySelector("[data-member-other-pet]").value.trim() : ""
        }
      };
    });
    const recurringCharges = [...form.querySelectorAll("[data-recurring-charge]")].map((row, index) => ({
      id: row.querySelector("[data-charge-id]").value || `REC-${unitId}-${index + 1}`,
      name: row.querySelector("[data-charge-name]").value.trim(),
      amount: Number(row.querySelector("[data-charge-amount]").value)
    }));
    const invalidMemberPets = householdMembers.some((member) => member.pets.hasPets
      && (!Number.isInteger(member.pets.count) || member.pets.count < 1 || member.pets.count > 30 || member.pets.types.length === 0));
    const invalidRecurringCharge = recurringCharges.some((charge) => !charge.name || !Number.isFinite(charge.amount) || charge.amount <= 0);
    if (!unit || !resident || !Number.isFinite(rent) || rent <= 0
      || (leaseStart && leaseEnd && leaseEnd < leaseStart)
      || !Number.isFinite(securityDeposit) || securityDeposit < 0
      || (hasPets && (!Number.isInteger(petCount) || petCount < 1 || petCount > 30 || petTypes.length === 0))
      || householdMembers.some((member) => !member.name)
      || invalidMemberPets || invalidRecurringCharge) {
      showToast("Check required resident, pet, occupation, and monthly charge details.", true);
      return;
    }

    const totalRecurring = recurringCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const monthlyTotal = Math.round((rent + totalRecurring) * 100) / 100;
    const tenantId = String(data.get("tenantId") || unit.tenantId || `TEN-${String(unitId).padStart(4, "0")}`);
    const existingCharge = unit.resident ? activeTenantCharge(unit) : null;
    const paidAmount = existingCharge ? existingCharge.amount - existingCharge.balance : 0;
    if (monthlyTotal < paidAmount) {
      showToast("The new monthly total cannot be less than payments already recorded for this month.", true);
      return;
    }
    const updatedUnit = {
      ...unit,
      resident,
      tenantId,
      status: "Occupied",
      occupation: String(data.get("occupation") || "").trim(),
      leaseStatus: String(data.get("leaseStatus") || "Not recorded"),
      leaseStart,
      leaseEnd,
      moveInDate: String(data.get("moveInDate") || ""),
      renewalStatus: String(data.get("renewalStatus") || "Not recorded"),
      securityDeposit,
      portalStatus: String(data.get("portalStatus") || "Not configured"),
      monthlyRent: rent,
      recurringCharges,
      householdMembers,
      contact: {
        address: hasPermission("resident-data", "view") ? String(data.get("address") || "").trim() : unit.contact?.address || "",
        phone: hasPermission("resident-data", "view") ? String(data.get("phone") || "").trim() : unit.contact?.phone || "",
        email: hasPermission("resident-data", "view") ? String(data.get("email") || "").trim() : unit.contact?.email || ""
      },
      pets: {
        hasPets,
        count: petCount,
        types: petTypes,
        otherDetails: hasPets && petTypes.includes("Other") ? String(data.get("otherDetails") || "").trim() : ""
      }
    };
    const nextUnits = state.units.map((item) => item.id === unitId ? updatedUnit : item);
    const nextCharges = existingCharge
      ? state.charges.map((item) => item.id === existingCharge.id ? {
        ...item,
        resident,
        tenantId,
        amount: monthlyTotal,
        balance: Math.round((monthlyTotal - paidAmount) * 100) / 100,
        status: monthlyTotal === paidAmount ? "Paid" : item.status === "Overdue" ? "Overdue" : "Due"
      } : item)
      : [...state.charges, {
        id: nextId("RENT-", state.charges),
        unitId,
        tenantId,
        resident,
        amount: monthlyTotal,
        balance: monthlyTotal,
        status: "Due",
        dueDate: `${localDateString().slice(0, 7)}-01`
      }];
    unitPage = Math.floor((unitId - 1) / 30);
    persist({ ...state, units: nextUnits, charges: nextCharges });
    closeModal();
    showToast(unit.resident ? "Household and monthly charges updated." : "Tenant added and monthly balance created.");
    return;
  }

  if (form.id === "notification-settings-form") {
    const settings = {
      ...state.notificationSettings,
      emailEnabled: data.has("emailEnabled"),
      smsEnabled: data.has("smsEnabled"),
      emailProvider: String(data.get("emailProvider")),
      smsProvider: String(data.get("smsProvider")),
      rentReminderDays: Number(data.get("rentReminderDays")),
      overdueRepeatDays: Number(data.get("overdueRepeatDays")),
      rentReminders: data.has("rentReminders"),
      outstandingBalanceReminders: data.has("outstandingBalanceReminders"),
      violationNotifications: data.has("violationNotifications"),
      communityDriveNotifications: data.has("communityDriveNotifications")
    };
    if (![1, 3, 5, 7].includes(settings.rentReminderDays) || ![3, 7, 14].includes(settings.overdueRepeatDays)) {
      showToast("Choose a valid reminder schedule.", true);
      return;
    }
    persist({ ...state, notificationSettings: settings });
    showToast("Notification preferences saved. No messages were sent.");
    return;
  }

  if (form.id === "maintenance-message-form") {
    const requestId = String(data.get("requestId") || "");
    const author = String(data.get("author") || "").trim();
    const role = String(data.get("role") || "");
    const text = String(data.get("text") || "").trim();
    const request = state.maintenance.find((item) => item.id === requestId);
    if (!request || !author || !text || !["Tenant", "Property manager", "Maintenance staff"].includes(role)) {
      showToast("Enter your name and a valid message for this request.", true);
      return;
    }
    const message = { id: nextId("MSG-", request.messages || []), author, role, text, createdAt: new Date().toISOString() };
    const nextMaintenance = state.maintenance.map((item) => item.id === requestId ? { ...item, messages: [...(item.messages || []), message] } : item);
    persist({ ...state, maintenance: nextMaintenance });
    maintenanceThread(requestId, role);
    showToast("Message added to the maintenance conversation. No external notification was sent.");
    return;
  }

  if (form.id === "team-contact-form") {
    const name = String(data.get("name") || "").trim();
    const role = String(data.get("role") || "");
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim();
    const channel = String(data.get("channel") || "");
    const access = String(data.get("access") || "");
    if (!name || !["Property manager", "Maintenance staff", "Owner / accounting"].includes(role)
      || !["SMS", "Email", "Both"].includes(channel)
      || !["Web app", "Mobile app", "Web and mobile app"].includes(access)
      || (!phone && !email)
      || (["SMS", "Both"].includes(channel) && !phone)
      || (["Email", "Both"].includes(channel) && !email)) {
      showToast("Enter a name and contact details for the selected notification channel.", true);
      return;
    }
    const contact = { id: nextId("STAFF-", state.teamContacts), name, role, phone, email, channel, access, accountStatus: "Setup pending" };
    persist({ ...state, teamContacts: [...state.teamContacts, contact] });
    closeModal();
    showToast("Team contact saved locally. No account or message was created.");
    return;
  }

  if (form.id === "space-booking-form") {
    const unitId = Number(data.get("unitId"));
    const unit = state.units.find((item) => item.id === unitId && item.status === "Occupied");
    const date = String(data.get("date") || "");
    const startTime = String(data.get("startTime") || "");
    const endTime = String(data.get("endTime") || "");
    const space = String(data.get("space") || "");
    const otherSpace = String(data.get("otherSpace") || "").trim();
    const attendees = Number(data.get("attendees"));
    const purpose = String(data.get("purpose") || "").trim();
    if (!unit || !["Multi-purpose hall", "Park", "Other"].includes(space) || !date || date < localDateString()
      || !startTime || !endTime || endTime <= startTime || !Number.isInteger(attendees)
      || attendees < 1 || attendees > 500 || !purpose || (space === "Other" && !otherSpace)) {
      showToast("Check the tenant, space, date, time range, attendee count, and gathering details.", true);
      return;
    }
    const request = {
      id: nextId("BOOK-", state.spaceReservations),
      unitId,
      resident: unit.resident,
      space,
      otherSpace: space === "Other" ? otherSpace : "",
      date,
      startTime,
      endTime,
      attendees,
      purpose,
      status: "Pending",
      createdAt: new Date().toISOString()
    };
    persist({ ...state, spaceReservations: [...state.spaceReservations, request] });
    closeModal();
    showToast("Shared-space request submitted. It is pending management approval.");
    return;
  }

  if (form.id === "community-rule-form") {
    const title = String(data.get("title") || "").trim();
    const category = String(data.get("category") || "").trim();
    const description = String(data.get("description") || "").trim();
    if (!title || !category || !description) {
      showToast("Enter a title, category, and description for the rule.", true);
      return;
    }
    const rule = { id: nextId("RULE-", state.violationCatalog), title, category, description, active: true };
    violationTab = "rules";
    persist({ ...state, violationCatalog: [...state.violationCatalog, rule] });
    closeModal();
    showToast("Known community violation added.");
    return;
  }

  if (form.id === "announcement-form") {
    const title = String(data.get("title") || "").trim();
    const date = String(data.get("date") || "");
    const message = String(data.get("message") || "").trim();
    if (!title || !message || !date || date < localDateString()) {
      showToast("Enter an announcement, event details, and a valid current or future date.", true);
      return;
    }
    const announcement = { id: nextId("EVENT-", state.communityAnnouncements), title, date, message };
    persist({ ...state, communityAnnouncements: [...state.communityAnnouncements, announcement] });
    closeModal();
    showToast("Community announcement saved as a draft. Nothing was sent.");
    return;
  }

  if (form.id === "maintenance-form") {
    const unitId = Number(data.get("unitId"));
    const unit = state.units.find((item) => item.id === unitId);
    const request = {
      id: nextId("WO-", state.maintenance),
      unitId,
      category: String(data.get("category")),
      description: String(data.get("description")).trim(),
      priority: String(data.get("priority")),
      status: "Open",
      createdAt: localDateString()
    };
    if (!unit || !request.description) {
      showToast("Select a resident and enter a description.", true);
      return;
    }
    request.messages = [];
    persist({ ...state, maintenance: [request, ...state.maintenance] });
    closeModal();
    showToast("Maintenance request created.");
    return;
  }

  if (form.id === "violation-form") {
    const unitId = Number(data.get("unitId"));
    const unit = state.units.find((item) => item.id === unitId);
    const violation = {
      id: nextId("V-", state.violations),
      unitId,
      category: String(data.get("category")),
      description: String(data.get("description")).trim(),
      status: "Under review",
      reportedAt: localDateString()
    };
    if (!unit || !violation.description) {
      showToast("Select a resident and enter incident notes.", true);
      return;
    }
    persist({ ...state, violations: [violation, ...state.violations] });
    closeModal();
    showToast("Violation added to the log.");
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.id === "unit-import-file") {
    const file = target.files?.[0];
    if (file) {
      file.text().then((text) => {
        const csvField = document.getElementById("unit-import-csv");
        if (csvField) csvField.value = text;
      }).catch((error) => showToast(`Could not read the selected CSV: ${error.message}`, true));
    }
    return;
  }
  if (target.id === "units-property-select") {
    selectedPropertyId = target.value;
    unitPage = 0;
    render();
    return;
  }
  if (target.form?.id === "bulk-rent-form") {
    if (["propertyId", "building", "occupancy"].includes(target.name)) {
      target.form.elements.unitIds.selectedIndex = -1;
    }
    if (target.name === "propertyId") {
      const propertyUnits = unitsForProperty(target.value);
      const buildingSelect = target.form.elements.building;
      buildingSelect.innerHTML = `<option value="all">All buildings</option>${[...new Set(propertyUnits.map((unit) => unit.building))].sort((a, b) => a - b).map((building) => `<option value="${building}">Building ${String(building).padStart(2, "0")}</option>`).join("")}`;
    }
    updateBulkRentForm();
    return;
  }
  if (["portfolio-type", "portfolio-owner", "portfolio-region", "portfolio-status", "portfolio-group", "portfolio-manager"].includes(target.id)) {
    const filterKeys = {
      "portfolio-type": "type", "portfolio-owner": "owner", "portfolio-region": "region",
      "portfolio-status": "status", "portfolio-group": "group", "portfolio-manager": "manager"
    };
    propertyPortfolioFilters[filterKeys[target.id]] = target.value;
    render();
    return;
  }
  if (target.id === "calendar-type-filter") {
    calendarTypeFilter = target.value;
    render();
    return;
  }
  if (target.id === "property-dashboard-select") {
    selectedPropertyId = target.value;
    render();
    return;
  }
  if (target.id === "demo-role-switch") {
    const role = state.accessControl.roles.find((item) => item.id === target.value && item.active);
    if (target.value !== "assigned-user" && !role) {
      showToast("Select an active role for the demo preview.", true);
      render();
      return;
    }
    usersTab = "users";
    const demoRoleId = target.value;
    persist({ ...state, accessControl: { ...state.accessControl, demoRoleId } }, demoRoleId === "assigned-user" ? "Switched to assigned demo user roles" : `Switched demo role preview to ${role.name}`);
    showToast("Demo role preview changed. This does not sign in or enforce security.");
    return;
  }
  if (target.id === "demo-user-switch") {
    const user = state.accessControl.users.find((item) => item.id === target.value && item.status === "Active");
    if (!user) {
      showToast("Select an active user record for the demo preview.", true);
      render();
      return;
    }
    usersTab = "users";
    persist({ ...state, accessControl: { ...state.accessControl, demoUserId: user.id, demoRoleId: "assigned-user" } }, `Switched demo user preview to ${user.email}`);
    showToast("Demo user preview changed. This does not authenticate a user.");
    return;
  }
  if (target.matches("[data-custom-report]")) {
    if (target.checked) selectedReports.add(target.dataset.customReport);
    else selectedReports.delete(target.dataset.customReport);
    render();
    return;
  }
  if (target.matches("#report-type,#report-start,#report-end,#report-building,#report-unit,#report-status")) {
    if (target.id === "report-type") {
      selectedReport = target.value;
      const reportStatus = document.getElementById("report-status");
      if (reportStatus) reportStatus.value = "all";
    }
    if (target.id === "report-building") {
      const reportUnit = document.getElementById("report-unit");
      if (reportUnit) reportUnit.value = "all";
    }
    const reportStart = document.getElementById("report-start")?.value;
    const reportEnd = document.getElementById("report-end")?.value;
    if (reportStart && reportEnd && reportStart > reportEnd) {
      showToast("The report start date must be on or before its end date.", true);
      target.value = "";
    }
    render();
    return;
  }
  if (target.name === "space" && target.form?.id === "space-booking-form") {
    const otherField = document.getElementById("other-space-field");
    if (otherField) otherField.hidden = target.value !== "Other";
  }
  if (target.id === "tenant-has-pets") {
    const fields = document.getElementById("pet-fields");
    const countField = fields.querySelector('[name="petCount"]');
    fields.hidden = target.value !== "yes";
    countField.required = target.value === "yes";
  }
  if (target.matches("[data-member-has-pets]")) {
    const fields = target.closest("[data-household-member]").querySelector(".member-pet-fields");
    const countField = fields.querySelector("[data-member-pet-count]");
    fields.hidden = target.value !== "yes";
    countField.required = target.value === "yes";
  }
  if (target.matches('input[name="petTypes"]')) {
    const otherField = document.getElementById("pet-other-field");
    if (otherField) {
      otherField.hidden = !document.querySelector('input[name="petTypes"][value="Other"]').checked;
    }
  }
  if (target.matches('input[type="checkbox"][name^="memberPetType"]')) {
    const otherField = target.closest("[data-household-member]").querySelector(".member-other-pet");
    otherField.hidden = ![...target.closest("[data-household-member]").querySelectorAll('input[type="checkbox"]')].some((input) => input.checked && input.value === "Other");
  }
  if (target.matches("[data-maintenance-status]")) {
    if (!hasPermission("maintenance", "edit")) {
      target.value = state.maintenance.find((item) => item.id === target.dataset.maintenanceStatus)?.status || "Open";
      showToast("Your role does not have permission to update work-order status.", true);
      return;
    }
    const nextMaintenance = state.maintenance.map((item) => item.id === target.dataset.maintenanceStatus ? { ...item, status: target.value } : item);
    persist({ ...state, maintenance: nextMaintenance });
    showToast("Maintenance status updated.");
  }
  if (target.matches("[data-violation-status]")) {
    if (!hasPermission("incidents", "edit")) {
      target.value = state.violations.find((item) => item.id === target.dataset.violationStatus)?.status || "Under review";
      showToast("Your role does not have permission to update incident status.", true);
      return;
    }
    const nextViolations = state.violations.map((item) => item.id === target.dataset.violationStatus ? { ...item, status: target.value } : item);
    persist({ ...state, violations: nextViolations });
    showToast("Violation status updated.");
  }
  if (target.matches("[data-space-status]")) {
    const request = state.spaceReservations.find((item) => item.id === target.dataset.spaceStatus);
    if (!request) {
      showToast("That shared-space request could not be found.", true);
      render();
      return;
    }
    const requiredPermission = target.value === "Approved" ? "approve" : target.value === "Declined" ? "reject" : "edit";
    if (!hasPermission("community", requiredPermission)) {
      target.value = request.status;
      showToast(`Your role does not have permission to ${requiredPermission} shared-space requests.`, true);
      return;
    }
    if (target.value === "Approved") {
      const requestedSpace = `${request.space}:${request.otherSpace || ""}`.toLowerCase();
      const conflict = state.spaceReservations.find((item) => item.id !== request.id
        && item.status === "Approved"
        && item.date === request.date
        && `${item.space}:${item.otherSpace || ""}`.toLowerCase() === requestedSpace
        && request.startTime < item.endTime
        && request.endTime > item.startTime);
      if (conflict) {
        target.value = request.status;
        showToast(`Cannot approve: this space is already booked for ${conflict.startTime}–${conflict.endTime}.`, true);
        return;
      }
    }
    const nextReservations = state.spaceReservations.map((item) => item.id === request.id ? { ...item, status: target.value } : item);
    persist({ ...state, spaceReservations: nextReservations });
    showToast(`Space request ${target.value.toLowerCase()}.`);
  }
  if (target.id === "building-filter" || target.id === "occupancy-filter" || target.id === "rent-filter" || target.id === "portal-unit") {
    if (target.id === "building-filter" || target.id === "occupancy-filter") unitPage = 0;
    const values = {};
    document.querySelectorAll("#unit-search,#building-filter,#occupancy-filter,#rent-search,#rent-filter,#portal-unit").forEach((element) => { values[element.id] = element.value; });
    render();
    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.value = value;
    });
  }
});

document.addEventListener("input", (event) => {
  if (event.target.form?.id === "bulk-rent-form") {
    updateBulkRentForm();
    return;
  }
  if (event.target.id === "universal-search") {
    renderUniversalSearchResults(event.target.value);
    return;
  }
  if (["unit-search", "rent-search", "property-search", "tenant-search"].includes(event.target.id)) {
    const id = event.target.id;
    const value = event.target.value;
    if (id === "unit-search") unitPage = 0;
    if (id === "unit-search" || id === "rent-search") pageSearchTerms[id === "unit-search" ? "units" : "rent"] = value;
    if (id === "property-search") propertyPortfolioFilters.search = value;
    const selectionStart = event.target.selectionStart;
    render();
    const replacement = document.getElementById(id);
    replacement.value = value;
    replacement.focus();
    replacement.setSelectionRange(selectionStart, selectionStart);
  }
});

document.querySelectorAll(".nav-link").forEach((button) => button.addEventListener("click", () => setPage(button.dataset.page)));
document.getElementById("mobile-menu").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("sidebar-open"));
document.getElementById("today-label").textContent = new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric" }).format(new Date());
window.addEventListener("hashchange", () => {
  const environment = location.hash === "#/association" ? "association" : "property-management";
  if (environment !== currentEnvironment) switchEnvironment(environment, false);
});
document.getElementById("quick-payment").addEventListener("click", () => {
  if (!hasPermission("finance", "create")) {
    showToast("Your role does not have permission to record payments.", true);
    return;
  }
  paymentForm();
});
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

render();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./service-worker.js").catch((error) => {
    console.error("Service worker registration failed:", error);
  });
}
