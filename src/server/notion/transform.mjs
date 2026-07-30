import { ContentError, DATABASE_IDS } from "./constants.mjs";
import {
  compareProjectRecords,
  compareWorkRecords,
  convertToMMYYYY,
  extractCheckboxValue,
  extractFileUrl,
  extractMultiSelectNames,
  extractNumberValue,
  extractProjectHook,
  extractRichText,
} from "./helpers.mjs";

export function prepareProjectsForPublicDisplay(records) {
  return records
    .filter((record) => record.published !== false)
    .sort(compareProjectRecords)
    .map(({ published, sortOrder, ...publicRecord }) => publicRecord);
}

export function prepareWorkForPublicDisplay(records) {
  return [...records].sort(compareWorkRecords);
}
export function transformProjectsData(
  results,
  projectContentByPageId = new Map(),
) {
  return results.map((page) => {
    const props = page.properties || {};
    const titleText =
      props.title?.title?.[0]?.plain_text ||
      props.Name?.title?.[0]?.plain_text ||
      "";
    const detail =
      extractRichText(
        props.Detail?.rich_text ||
          props.detail?.rich_text ||
          props.content?.rich_text ||
          props.Description?.rich_text ||
          [],
      ) ||
      projectContentByPageId.get(page.id) ||
      "";
    const rawHook = extractRichText(
      props.Hook?.rich_text || props.hook?.rich_text || [],
    );

    return {
      title: titleText,
      hook: extractProjectHook(rawHook, detail, titleText),
      detail,
      date:
        props.date?.number ||
        props.Date?.number ||
        props.date?.date?.start ||
        props.Date?.date?.start ||
        null,
      link: props.link?.url || props.Link?.url || null,
      slug:
        extractRichText(props.slug?.rich_text || props.Slug?.rich_text || []) ||
        page.id,
      image:
        extractFileUrl(props.Image?.files || props.image?.files || []) ||
        extractRichText(
          props.image?.rich_text || props.Image?.rich_text || [],
        ) ||
        null,
      keywords: extractMultiSelectNames(
        props.Keyword?.multi_select || props.keyword?.multi_select || [],
      ),
      published: extractCheckboxValue(props.Published, props.published) ?? true,
      sortOrder: extractNumberValue(
        props["Sort Order"],
        props.SortOrder,
        props.sortOrder,
      ),
    };
  });
}

export function transformWorkData(results) {
  return results.map((page) => {
    const props = page.properties || {};
    const fromDate = props.From?.date?.start || props.from?.date?.start || "";
    const toDate = props.To?.date?.start || props.to?.date?.start || "";

    return {
      title:
        props.title?.title?.[0]?.plain_text ||
        props.Title?.title?.[0]?.plain_text ||
        "",
      company: extractRichText(props.Company?.rich_text || []),
      description: extractRichText(props.Description?.rich_text || []),
      from: convertToMMYYYY(fromDate),
      to: convertToMMYYYY(toDate),
      place: extractRichText(props.Place?.rich_text || []),
      slug:
        extractRichText(props.slug?.rich_text || props.Slug?.rich_text || []) ||
        page.id,
    };
  });
}

export function transformAboutData(results) {
  return results.map((page) => {
    const props = page.properties || {};

    return {
      category:
        props.Category?.title?.[0]?.plain_text ||
        props.category?.title?.[0]?.plain_text ||
        "",
      description: extractRichText(
        props.Description?.rich_text ||
          props.Text?.rich_text ||
          props.Content?.rich_text ||
          [],
      ),
    };
  });
}

export function getDatasetTransformer(databaseType) {
  switch (databaseType) {
    case "projects":
      return transformProjectsData;
    case "work":
      return transformWorkData;
    case "about":
      return transformAboutData;
    default:
      throw new ContentError(`Invalid database type: ${databaseType}`, {
        code: "INVALID_DATABASE",
        status: 400,
        failureType: "invalid_database",
        details: {
          validTypes: Object.keys(DATABASE_IDS),
        },
      });
  }
}
