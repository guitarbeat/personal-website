export interface AboutItem {
  category: string;
  description: string;
}

export interface ProjectItem {
  title: string;
  hook: string;
  detail: string;
  date: string | number | null;
  link: string | null;
  slug: string;
  image: string | null;
  keywords: string[];
}

export interface WorkItem {
  title: string;
  company: string;
  description: string;
  from: string;
  to: string | null;
  place: string;
  slug: string;
}

export interface NotionData {
  about: AboutItem[];
  projects: ProjectItem[];
  work: WorkItem[];
}

export interface ContentMeta {
  source: "live" | "snapshot";
  degraded: boolean;
  fetchedAt: string;
  snapshotUpdatedAt: string | null;
  snapshotAgeSeconds: number | null;
  schemaVersion: 3;
}

export interface ContentResponse {
  meta: ContentMeta;
  data: NotionData;
}
