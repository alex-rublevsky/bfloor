import { generateSlug } from "@/lib/slugGeneration";
import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";

export const productForm = document.querySelector<HTMLFormElement>(
  "#product-form",
) as HTMLFormElement;

const submitButton =
  productForm.querySelector<HTMLButtonElement>("#submit-button");

const mode = productForm.dataset.mode;
let mediaBlocked = false;

const categorySelect = productForm.elements.namedItem(
  "categoryId",
) as HTMLSelectElement;

const categoryPolicies = JSON.parse(
  productForm.dataset.categoryPolicies ?? "{}",
) as Record<string, number[]>;

const attributeSelects = productForm.querySelectorAll<HTMLSelectElement>(
  "select[data-attribute-id]",
);

const brandSelect = productForm.elements.namedItem(
  "brandId",
) as HTMLSelectElement;

const collectionSelect = productForm.elements.namedItem(
  "collectionId",
) as HTMLSelectElement;

type CollectionOption = {
  value: string;
  label: string;
};

const collectionsByBrand = JSON.parse(
  productForm.dataset.collectionsByBrand ?? "{}",
) as Record<string, CollectionOption[]>;

function syncCollectionOptions() {
  const brandId = brandSelect.value;
  const currentCollectionId = collectionSelect.value;
  const collections = brandId ? (collectionsByBrand[brandId] ?? []) : [];

  for (const option of Array.from(collectionSelect.options)) {
    option.remove();
  }

  collectionSelect.append(
    new Option(brandId ? "Выбрать" : "Сначала выберите бренд", ""),
  );

  for (const collection of collections) {
    collectionSelect.append(new Option(collection.label, collection.value));
  }

  collectionSelect.disabled = !brandId;

  const collectionStillBelongsToBrand = collections.some(
    (collection) => collection.value === currentCollectionId,
  );

  collectionSelect.value = collectionStillBelongsToBrand
    ? currentCollectionId
    : "";
}

function syncAttributeVisibility() {
  const categoryId = categorySelect.value;

  const hiddenIds = new Set(
    categoryId ? (categoryPolicies[categoryId] ?? []) : [],
  );

  for (const select of attributeSelects) {
    const attributeId = Number(select.dataset.attributeId);
    const hidden = hiddenIds.has(attributeId);
    const wrapper = select.closest<HTMLElement>(".select-wrapper");

    if (hidden) {
      select.disabled = true;
      wrapper?.setAttribute("hidden", "");
      select.dataset.hiddenByCategory = "true";
    } else {
      select.disabled = false;
      wrapper?.removeAttribute("hidden");
      select.dataset.hiddenByCategory = "false";
    }
  }

  // TODO: grey out and deselect all value in the general attribute that has been picked in the variations. keep synced
}

syncAttributeVisibility();
function getFormState() {
  //TODO: This has several edge cases:
  // - checkbox order matters;
  // - missing unchecked values differ from explicit false values;
  // - empty select values may differ from null;
  // - whitespace differences count as changes even if the server trims them;
  // - generated slug changes are treated as changes;
  // - future file fields are represented only by filename, not file contents;
  // - field order changes can produce false differences.
  // Recommended solution:
  // - Normalize fields into a typed form-state object.
  // - Normalize numeric empty values to null.
  // - Represent checkboxes explicitly as booleans or sorted arrays.
  // - Compare semantic values rather than raw FormData.
  //
  // TODO: TEST FOR:
  // active checked;
  // active unchecked;
  // empty SKU;
  // empty discounted price;
  // empty square meters;
  // empty country;
  // no collection;
  // no brand.
  return JSON.stringify(
    [...new FormData(productForm).entries()].map(([key, value]) => [
      key,
      value instanceof File ? value.name : value,
    ]),
  );
}

const initialFormState = getFormState();

function updateSubmitButton() {
  if (!submitButton) return;

  const unchanged = getFormState() === initialFormState;
  submitButton.disabled = unchanged || mediaBlocked;
  submitButton.title = mediaBlocked
    ? "Дождитесь завершения загрузки или удалите фото с ошибкой"
    : "";
  const submitText = submitButton.querySelector(".submit-text");
  if (submitText) {
    submitText.textContent =
      mode === "edit"
        ? unchanged && !mediaBlocked
          ? "Нет изменений"
          : "Сохранить"
        : "Добавить";
  }
}

// Auto-generate slug from name
const nameInput = productForm.querySelector<HTMLInputElement>('[name="name"]');
const slugInput = productForm.querySelector<HTMLInputElement>('[name="slug"]');

function updateSlug() {
  if (!nameInput || !slugInput) return;
  slugInput.value = generateSlug(nameInput.value);
}

nameInput?.addEventListener("input", updateSlug);

import { PRODUCT_FORM_DRAFT_PREFIX } from "@/lib/formDrafts";
const formStorageKey = `${PRODUCT_FORM_DRAFT_PREFIX}${location.pathname}`;
let draftPersistenceWarningShown = false;

function trySaveDraft(key: string, state: Record<string, string[]>) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch (error) {
    if (!draftPersistenceWarningShown) {
      console.warn("Product form draft persistence is unavailable", error);
      draftPersistenceWarningShown = true;
    }
  }
}
function saveDraft() {
  // TODO: analyzse this potential issue. is it relevant or important?
  // Disabled hidden selects are absent from FormData, so after a category change:
  // 1. an attribute is selected;
  // 2. the category is changed so that attribute becomes hidden;
  // 3. the draft is saved;
  // 4. the hidden select is omitted from session storage;
  // 5. the page is restored;
  // 6. the value may be lost from the draft.
  const state: Record<string, string[]> = {};
  for (const [name, value] of new FormData(productForm)) {
    // Files cannot be restored from sessionStorage.
    if (typeof value !== "string") continue;

    state[name] ??= [];
    state[name].push(value);
  }
  trySaveDraft(formStorageKey, state);
}

let saveTimer: number | undefined;
function scheduleDraftSave() {
  window.clearTimeout(saveTimer);

  saveTimer = window.setTimeout(() => {
    saveDraft();
  }, 400);
}
function flushDraftSave() {
  window.clearTimeout(saveTimer);
  saveTimer = undefined;
  saveDraft();
}
function readDraft(key: string): Record<string, string[]> | null {
  let rawState: string | null;

  try {
    rawState = window.sessionStorage.getItem(key);
  } catch (error) {
    console.warn("Unable to read product form draft", error);
    return null;
  }

  if (!rawState) return null;

  try {
    const parsed: unknown = JSON.parse(rawState);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    const state: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (
        !Array.isArray(value) ||
        !value.every((item) => typeof item === "string")
      ) {
        return null;
      }

      state[key] = value;
    }

    return state;
  } catch (error) {
    console.warn("Unable to parse product form draft", error);
    return null;
  }
}
function restoreDraft() {
  const state = readDraft(formStorageKey);

  if (!state) return;

  for (const element of Array.from(productForm.elements)) {
    if (!(
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    )) {
      continue;
    }

    if (!element.name) continue;

    const values = state[element.name] ?? [];

    if (
      element instanceof HTMLInputElement &&
      (element.type === "checkbox" || element.type === "radio")
    ) {
      element.checked = values.includes(element.value);
    } else if (element instanceof HTMLSelectElement && element.multiple) {
      for (const option of Array.from(element.options)) {
        option.selected = values.includes(option.value);
      }
    } else if (
      element instanceof HTMLInputElement &&
      ["submit", "button", "reset", "file"].includes(element.type)
    ) {
      continue;
    } else {
      element.value = values[0] ?? "";
    }
  }

  syncCollectionOptions();
  syncAttributeVisibility();
  updateSubmitButton();
}

productForm.addEventListener("input", () => {
  updateSubmitButton();
  scheduleDraftSave();
});
productForm.addEventListener("change", (event) => {
  if (event.target === categorySelect) {
    syncAttributeVisibility();
  }
  if (event.target === brandSelect) {
    syncCollectionOptions();
  }
  updateSubmitButton();
  scheduleDraftSave();
});
// productForm.addEventListener("media-state-change", (event) => {
//   const state = (
//     event as CustomEvent<{ uploading: boolean; hasError: boolean }>
//   ).detail;
//   mediaBlocked = state.uploading || state.hasError;
//   updateSubmitButton();
// });
window.addEventListener("pageshow", restoreDraft);

//event listeners
productForm.addEventListener("submit", async (event) => {
  if (!submitButton || submitButton.disabled) {
    event.preventDefault();
    return;
  }
  flushDraftSave();
  submitButton.setAttribute("disabled", "");
  submitButton.setAttribute("aria-busy", "true");
});

//TODO: like in submit button this should get spinner
const deleteButton = document.querySelector<HTMLButtonElement>(
  "#delete-button",
) as HTMLButtonElement;
if (deleteButton) {
  deleteButton.addEventListener("click", async () => {
    const formData = new FormData(productForm) as FormData;
    const name = formData.get("name") as string;
    if (!confirm(`Удалить товар ${name}?`)) {
      return;
    }

    try {
      deleteButton.disabled = true;
      deleteButton.setAttribute("aria-busy", "true");
      const { error } = await actions.product.deleteProduct(formData);
      if (error) {
        confirm(`Не удалось удалить товар: ${error.message}`);
        throw new Error(`Не удалось удалить товар: ${error.message}`);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.log(error);
      deleteButton.disabled = false;
      deleteButton.setAttribute("aria-busy", "false");
    }
  });
}
