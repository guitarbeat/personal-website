export const GOOGLE_SHEETS_CONFIG = {
  // Security Fix: API Key removed from client bundle.
  // This integration is currently disabled. If re-enabled, use a backend proxy.
  apiKey: undefined,
  discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
  // Security Fix: Doc ID removed from client bundle.
  spreadsheetId: undefined,
  dataLoading: {
    component: () => null,
  },
};

export const NAV_ITEMS = {
  About: "/#about",
  Projects: "/#projects",
  Work: "/#work",
};
