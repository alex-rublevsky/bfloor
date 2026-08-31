// src/lib/productFormDraft.ts
export const PRODUCT_FORM_DRAFT_PREFIX = "product-form:";

export function clearFormDrafts(prefix: string) {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(prefix)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn("Unable to clear product form drafts", error);
  }
}
