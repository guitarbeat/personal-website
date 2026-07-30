# Notion Integration Documentation

This document consolidates all information regarding the migration from Google Sheets to Notion as the primary data source for the personal portfolio website.

## Table of Contents

1. [Migration Plan](#migration-plan)
2. [Requirements](#requirements)
3. [Design Specification](#design-specification)
4. [Integration Mapping](#integration-mapping)
5. [Task List](#task-list)

---

## Migration Plan

Notion provides a robust API that can serve as a headless CMS/database, offering better content management capabilities, richer data types, and a more intuitive interface for content updates.

### Strategy Overview

1. **Phase 1: Notion Workspace Setup**: Create integration and databases.
2. **Phase 2: Backend API Setup**: Implement serverless functions on Vercel to proxy Notion requests securely.
3. **Phase 3: Frontend Implementation**: Create hooks and services to fetch and transform Notion data.
4. **Phase 4: Testing & Validation**: Ensure data integrity and performance.

---

## Requirements

### Business Objectives

- Replace Google Sheets dependency with Notion.
- Maintain existing functionality and user experience.
- Enable non-technical content updates via Notion UI.
- Improve data structure and security.

### Key Functional Requirements

- **FR-001**: Setup About, Projects, and Work databases in Notion.
- **FR-003**: Implement server-side API proxy to keep API keys secure.
- **FR-007**: Transform Notion API responses to match current data structures.
- **FR-009**: Remove Google Sheets dependency after successful migration.

---

## Design Specification

### System Architecture

```mermaid
sequenceDiagram
  participant App as React App
  participant API as api/content.js
  participant Server as src/server/notion/*
  participant Notion as Notion API
  participant KV as Vercel KV

  App->>API: GET /api/content
  API->>Server: getContentResponse(env)
  Server->>Notion: live query (when configured)
  Server->>KV: read/write snapshot
  Server-->>API: data + meta
  API-->>App: ContentResponse JSON
  Note over App: NotionContext hydrates section components
```

### Data Flow

1. Serverless content API queries Notion and refreshes the snapshot.
2. KV stores the latest successful content snapshot for degraded-mode fallback.
3. React fetches `/api/content` and renders the transformed response.

### API routes

| Route | Purpose |
| ----- | ------- |
| `GET /api/content` | Primary content endpoint (live Notion + KV snapshot fallback) |
| `GET /api/health` | Snapshot / refresh health summary |
| `GET` or `POST /api/content-refresh` | Authorized cron refresh |
| `GET` or `POST /api/notion` | **Retired (410)** — returns `ENDPOINT_RETIRED`; use `/api/content` ([api/notion.js](../api/notion.js)) |

Local dev: Vite middleware on port `8080` mounts the same handlers as Vercel serverless routes under [api/](../api/).

### Database Schemas

#### About Database

- `Category` (Title)
- `Description` (Rich Text)

#### Projects Database

- `Title` (Title)
- `Slug` (Text)
- `Date` (Date)
- `Published` (Checkbox)
- `Sort Order` (Number)
- `Keyword` (Multi-select)
- `Link` (URL)
- `Hook` (Rich Text)
- `Detail` (Rich Text)
- `Image` (Files & Media)

#### Work Database

- `Title` (Title)
- `Company` (Text)
- `Place` (Text)
- `From` (Date)
- `To` (Date)
- `Description` (Rich Text)
- `Slug` (Text)

---

## Integration Mapping

### Database Schemas & IDs

| Database | ID | Notion URL |
|----------|----|------------|
| Projects | `29dda682bcf6806eaa2efe20631dab6c` | [Link](https://www.notion.so/29dda682bcf6806eaa2efe20631dab6c) |
| Work | `b589d1ef5ef64b35abcc88558bf5574f` | [Link](https://www.notion.so/b589d1ef5ef64b35abcc88558bf5574f) |
| About | `aab0a96e279d48b6833f6727e6301266` | [Link](https://www.notion.so/aab0a96e279d48b6833f6727e6301266) |

### Schema Mapping (Example: Projects)

| Notion Field | Type | Google Sheets Equivalent |
|--------------|------|-------------------------|
| title | title | title |
| slug | text | slug |
| date | number | date |
| Published | checkbox | publish control |
| Sort Order | number | manual order |
| Keyword | multi_select | keywords[] |
| link | url | link |
| Hook | text | hook |
| Detail | text | detail |
| image | text | image |

---

## Task List

### Phase 1: Notion Workspace Setup

- [x] Create Notion Integration
- [x] Create About, Projects, and Work Databases
- [x] Share Databases with Integration
- [x] Migrate Data from Google Sheets

### Phase 2: Backend API Setup

- [x] Create API Directory Structure
- [x] Install Notion SDK
- [x] Implement Notion Client Wrapper
- [x] Create Data Transformation Functions
- [x] Implement About, Projects, and Work Endpoints
- [x] Configure Environment Variables

### Phase 3: Frontend Implementation

- [x] Update Configuration Constants
- [x] Create Notion Context Provider
- [x] Update Components (About, Projects, Work) to use Notion data
- [x] Remove Google Sheets Provider and dependencies

---
*Note: This document is a consolidated version of several original planning documents.*
