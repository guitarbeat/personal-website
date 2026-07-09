/**
 * Security Fix: API Key and Document ID removed from client bundle.
 * This integration is currently disabled. If re-enabled, use a backend proxy.
 */
export const GOOGLE_SHEETS_CONFIG = {
  discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
  dataLoading: {
    component: () => null,
  },
};

export const NAV_ITEMS = {
  About: "/#about",
  Projects: "/#projects",
  Work: "/#work",
};
