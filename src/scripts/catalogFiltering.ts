// TODO: after filtration the scroll should be taken to the start of the page

import { getPaginationItems } from "@/lib/paginationWindow";

type FacetCounts = Record<string, number>;
type FilterCounts = Record<string, FacetCounts>;
type FilterSelections = Record<string, string[]>;
type SearchFilters = {
  [key: string]: unknown;
  Категория: string;
  all?: Array<{ any: Array<Record<string, string>> }>;
};

const FILTERS_PARAM = "filters";
const FILTERED_PAGE_PARAM = "fpage";
const FILTERED_PAGE_SIZE = 50;

type PagefindResultData = {
  url: string;
  meta?: Record<string, string | undefined>;
};

type PagefindSearchResult = {
  data(): Promise<PagefindResultData>;
};

type PagefindSearch = {
  filters: FilterCounts;
  results: PagefindSearchResult[];
};

export type PagefindApi = {
  filters(): Promise<FilterCounts>;
  search(
    query: string | null,
    options: { filters: SearchFilters },
  ): Promise<PagefindSearch>;
};

const FIXED_FACET_ORDER = [
  "Производитель",
  "Коллекция",
  "Толщина мм",
  "Дизайн",
  "Класс износостойкости",
  "Подложка",
  "Система монтажа",
  "Финишное покрытие",
  "Подходит для тёплых полов",
  "В наличии",
  "Страна производства",
];

export async function initCatalogFiltering(): Promise<void> {
  const section = document.querySelector<HTMLElement>("section");
  const filtersParent = document.querySelector<HTMLElement>("#catalogFilters");
  const filtersBlock = document.querySelector<HTMLElement>("#filtersBlock");
  const filtersLoading = document.querySelector<HTMLElement>("#filtersLoading");
  const filteringError = document.querySelector<HTMLElement>(
    "#catalogFilteringError",
  );
  const productErrorTemplate = document.querySelector<HTMLTemplateElement>(
    "#catalogProductErrorTemplate",
  );
  const loadingSkeletonTemplate = document.querySelector<HTMLTemplateElement>(
    "#catalog-loading-skeleton",
  );
  const staticFeed = document.querySelector<HTMLElement>("#staticFeed")!;
  const filteredFeed = document.querySelector<HTMLElement>("#filteredFeed")!;
  const paginations =
    document.querySelectorAll<HTMLElement>("[data-pagination]");
  const filteredPaginationTemplate =
    document.querySelector<HTMLTemplateElement>(
      "[data-filtered-pagination-link]",
    );
  const cardTemplate = document.querySelector<HTMLTemplateElement>(
    "#product-card-template",
  )!;
  const mobileFiltersButton = document.getElementById(
    "mobileFiltersButton",
  ) as HTMLButtonElement;
  const imagePlaceholderTemplate =
    document.querySelector<HTMLTemplateElement>("#image-placeholder")!;

  if (
    !section ||
    !filtersParent ||
    !filtersBlock ||
    !filtersLoading ||
    !filteringError ||
    !productErrorTemplate ||
    !loadingSkeletonTemplate ||
    !staticFeed ||
    !filteredFeed ||
    !cardTemplate ||
    !imagePlaceholderTemplate ||
    !filteredPaginationTemplate
  ) {
    return;
  }

  const filtersBlockElement: HTMLElement = filtersBlock;
  const filteringErrorElement: HTMLElement = filteringError;
  const productErrorTemplateElement: HTMLTemplateElement = productErrorTemplate;
  const loadingSkeletonTemplateElement: HTMLTemplateElement =
    loadingSkeletonTemplate;
  const filteredPaginationTemplateElement: HTMLTemplateElement =
    filteredPaginationTemplate;

  // TODO: should this be prerendered on the page and simply hidde/revealed when needed?
  function renderFilteredLoadingState(): void {
    const fragment = document.createDocumentFragment();
    const status = document.createElement("span");
    status.className = "sr-only";
    status.setAttribute("role", "status");
    status.textContent = "Загружаем товары";
    fragment.append(status);
    for (let index = 0; index < 8; index++) {
      fragment.append(loadingSkeletonTemplateElement.content.cloneNode(true));
    }
    filteredFeed.setAttribute("aria-busy", "true");
    filteredFeed.replaceChildren(fragment);
  }

  const hasFilterUrlState = new URLSearchParams(window.location.search).has(
    FILTERS_PARAM,
  );
  if (hasFilterUrlState) {
    staticFeed.hidden = true;
    filteredFeed.hidden = false;
    renderFilteredLoadingState();
    paginations.forEach((pagination) => {
      pagination.hidden = true;
    });
  }

  const mobile = window.matchMedia("(width < 768px)");
  mobileFiltersButton.addEventListener("click", () => {
    if (!mobile.matches) return;

    const isOpen = filtersParent.classList.toggle("mobileFiltersOpen");
    mobileFiltersButton.setAttribute("aria-expanded", String(isOpen));
    mobileFiltersButton.innerText = isOpen ? "Применить" : "Фильтры";
    mobileFiltersButton.classList.toggle("primary", isOpen);
    mobileFiltersButton.classList.toggle("tertiary", !isOpen);

    document.documentElement.style.overflow = isOpen ? "hidden" : "";
  });

  const category = section.dataset.category ?? "";
  const locationLabels = JSON.parse(
    section.dataset.locationLabels ?? "{}",
  ) as Record<string, string>;

  const pagefindUrl = new URL("/pagefind/pagefind.js", window.location.origin)
    .href;
  let pagefind: PagefindApi;
  let baseSearch: PagefindSearch;
  try {
    pagefind = (await import(/* @vite-ignore */ pagefindUrl)) as PagefindApi;
    // Pagefind only returns facet counts with searches after filter indexes load.
    await pagefind.filters();
    baseSearch = await pagefind.search(null, {
      filters: { Категория: category },
    });
  } catch (error) {
    console.error("Не удалось загрузить фильтры каталога", error);

    if (hasFilterUrlState) {
      staticFeed.hidden = false;
      filteredFeed.hidden = true;
      filteredFeed.removeAttribute("aria-busy");
      filteredFeed.replaceChildren();
      paginations.forEach((pagination) => {
        pagination.hidden = pagination.querySelectorAll("a").length <= 2;
      });
    }

    filtersLoading.hidden = true;
    filteringErrorElement.hidden = false;
    return;
  }

  filtersLoading.hidden = true;
  filtersBlockElement.hidden = false;
  const initialFacetCounts = baseSearch.filters;
  const staticPaginationMarkup = Array.from(paginations, (pagination) =>
    Array.from(pagination.childNodes, (node) => node.cloneNode(true)),
  );
  // The Astro page segment remains the unfiltered fallback; fpage is separate filtered state.
  const currentCategoryPath = window.location.pathname.replace(/\/$/, "");

  function getOptionLabel(facetName: string, value: string): string {
    if (facetName === "В наличии") {
      return locationLabels[value] ?? value;
    }
    return value;
  }

  const facetRank = new Map(
    FIXED_FACET_ORDER.map((name, index) => [name, index]),
  );

  const facets = Object.keys(initialFacetCounts)
    .filter((name) => name !== "Категория")
    .sort((a, b) => {
      const rankA = facetRank.get(a) ?? Infinity;
      const rankB = facetRank.get(b) ?? Infinity;

      if (rankA !== rankB) return rankA - rankB;

      return a.localeCompare(b, "ru");
    });

  function createFilter(name: string, counts: FacetCounts): void {
    const filterTemplate = document.querySelector<HTMLTemplateElement>(
      "#filter-block-template",
    );
    if (!filterTemplate) return;
    const clone = filterTemplate.content.cloneNode(true) as DocumentFragment;
    const legend = clone.querySelector<HTMLLegendElement>("legend");
    const options = clone.querySelector<HTMLElement>(".filter-options");
    const filter = clone.querySelector<HTMLFieldSetElement>(".filter");
    const optionTemplate = document.querySelector<HTMLTemplateElement>(
      "#filter-option-template",
    );
    if (!legend || !options || !filter || !optionTemplate) return;

    legend.textContent = name;
    filter.id = name;

    Object.entries(counts).forEach(([value, count], index) => {
      const option = optionTemplate.content.cloneNode(true) as DocumentFragment;
      const input = option.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      );
      const optionLabel = option.querySelector<HTMLLabelElement>("label");
      const labelText = option.querySelector<HTMLElement>(
        ".filter-option-label",
      );
      if (!input || !optionLabel || !labelText) return;

      const id = `filter-${facets.indexOf(name)}-${index}`;
      const label = getOptionLabel(name, value);
      input.id = id;
      input.name = name;
      input.value = value;
      input.dataset.label = label;
      optionLabel.htmlFor = id;
      labelText.textContent = `${label} (${count})`;
      options.append(option);
    });
    filtersBlockElement.append(clone);
  }

  for (const facetName of facets) {
    createFilter(facetName, initialFacetCounts[facetName]);
  }

  function syncCollectionFilterVisibility(): void {
    const brandFilter =
      filtersBlockElement.querySelector<HTMLElement>("#Производитель");
    const collectionFilter =
      filtersBlockElement.querySelector<HTMLElement>("#Коллекция");
    if (!brandFilter || !collectionFilter) return;

    const hasSelectedBrand =
      brandFilter.querySelector('input[type="checkbox"]:checked') !== null;
    collectionFilter.hidden = !hasSelectedBrand;

    if (!hasSelectedBrand) {
      collectionFilter
        .querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')
        .forEach((input) => {
          input.checked = false;
        });
    }
  }

  updateFacetOptions(initialFacetCounts);

  function getSelections(): FilterSelections {
    const selections: FilterSelections = {};

    for (const filter of filtersBlockElement.querySelectorAll<HTMLElement>(
      ".filter",
    )) {
      const values = Array.from(
        filter.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"]:checked',
        ),
        (input) => input.value,
      );

      if (values.length > 0) {
        selections[filter.id] = values;
      }
    }

    return selections;
  }

  function buildSearchFilters(selections: FilterSelections): SearchFilters {
    const conditions: NonNullable<SearchFilters["all"]> = [];

    for (const [facetName, values] of Object.entries(selections)) {
      conditions.push({
        any: values.map((value) => ({ [facetName]: value })),
      });
    }

    const filters: SearchFilters = { Категория: category };

    if (conditions.length > 0) {
      filters.all = conditions;
    }

    return filters;
  }

  async function getCountsByFacet(
    filteredSearch: PagefindSearch,
    selections: FilterSelections,
  ): Promise<FilterCounts> {
    const countsByFacet = { ...filteredSearch.filters };
    const selectedFacetNames = Object.keys(selections);

    const omittedFacetSearches = await Promise.all(
      selectedFacetNames.map(async (facetName) => {
        const selectionsWithoutFacet = { ...selections };
        delete selectionsWithoutFacet[facetName];

        const search = await pagefind.search(null, {
          filters: buildSearchFilters(selectionsWithoutFacet),
        });

        return [facetName, search.filters[facetName] ?? {}] as const;
      }),
    );

    for (const [facetName, counts] of omittedFacetSearches) {
      countsByFacet[facetName] = counts;
    }

    return countsByFacet;
  }

  function updateFacetOptions(countsByFacet: FilterCounts): void {
    const hasSelectedBrand =
      filtersBlockElement.querySelector(
        '#Производитель input[type="checkbox"]:checked',
      ) !== null;

    for (const filter of filtersBlockElement.querySelectorAll<HTMLElement>(
      ".filter",
    )) {
      const options = filter.querySelector<HTMLElement>(".filter-options");
      if (!options) continue;
      const counts = countsByFacet[filter.id] ?? {};
      const selectedValues = new Set(
        Array.from(
          options.querySelectorAll<HTMLInputElement>(
            'input[type="checkbox"]:checked',
          ),
          (input) => input.value,
        ),
      );
      const inputs = options.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]',
      );
      inputs.forEach((input) => {
        const isVisible =
          (counts[input.value] ?? 0) > 0 || selectedValues.has(input.value);
        const wrapper = input.closest<HTMLLabelElement>(".checkbox-wrapper");
        if (!wrapper) return;
        wrapper.hidden = !isVisible;
        const label = input.dataset.label ?? input.value;
        const count = counts[input.value] ?? 0;
        const labelText = wrapper.querySelector<HTMLElement>(
          ".filter-option-label",
        );
        if (labelText) labelText.textContent = `${label} (${count})`;
      });

      const hasVisibleOptions = Array.from(inputs).some((input) => {
        const wrapper = input.closest<HTMLLabelElement>(".checkbox-wrapper");
        return wrapper && !wrapper.hidden;
      });
      filter.hidden =
        !hasVisibleOptions || (filter.id === "Коллекция" && !hasSelectedBrand);
    }
  }

  function showStaticFeed(): void {
    filteredFeed.hidden = true;
    staticFeed.hidden = false;

    paginations.forEach((pagination, index) => {
      pagination.replaceChildren(
        ...staticPaginationMarkup[index].map((node) => node.cloneNode(true)),
      );
      pagination.hidden = pagination.querySelectorAll("a").length <= 2;
    });
  }

  function showFilteredFeed(): void {
    staticFeed.hidden = true;
    filteredFeed.hidden = false;
  }

  function makePageLink(
    label: string,
    pageNumber: number,
    currentPage: number,
    totalPages: number,
    kind: "number" | "control" = "control",
  ): HTMLAnchorElement {
    const fragment = filteredPaginationTemplateElement.content.cloneNode(
      true,
    ) as DocumentFragment;
    const link = fragment.querySelector<HTMLAnchorElement>("a");
    const labelElement = fragment.querySelector<HTMLElement>(
      "[data-pagination-label]",
    );
    if (!link || !labelElement) return document.createElement("a");
    const active = kind === "number" && pageNumber === currentPage;
    link.classList.remove(
      "primary",
      "secondary",
      "tertiary",
      "disabled",
      "active",
    );
    link.classList.add(
      active ? "primary" : kind === "number" ? "tertiary" : "secondary",
    );
    if (active) link.classList.add("disabled", "active");
    const url = new URL(window.location.href);
    url.pathname = currentCategoryPath;
    url.searchParams.set(FILTERS_PARAM, JSON.stringify(getSelections()));
    if (pageNumber > 1)
      url.searchParams.set(FILTERED_PAGE_PARAM, String(pageNumber));
    else url.searchParams.delete(FILTERED_PAGE_PARAM);
    link.href = url.toString();
    link.setAttribute("data-filtered-page", String(pageNumber));
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
    labelElement.textContent = label;
    if (
      (label === "«" && currentPage === 1) ||
      (label === "‹" && currentPage === 1) ||
      (label === "›" && currentPage === totalPages) ||
      (label === "»" && currentPage === totalPages)
    ) {
      link.setAttribute("aria-disabled", "true");
      link.tabIndex = -1;
    }
    return link;
  }

  function renderFilteredPagination(
    currentPage: number,
    totalPages: number,
  ): void {
    paginations.forEach((pagination) => {
      pagination.replaceChildren();
      pagination.hidden = totalPages <= 1;
      if (totalPages <= 1) return;
      pagination.append(makePageLink("«", 1, currentPage, totalPages));
      pagination.append(
        makePageLink(
          "‹",
          Math.max(1, currentPage - 1),
          currentPage,
          totalPages,
        ),
      );
      for (const item of getPaginationItems(currentPage, totalPages)) {
        if (item === "ellipsis") {
          const ellipsis = document.createElement("span");
          ellipsis.className = "paginationEllipsis";
          ellipsis.textContent = "…";
          ellipsis.setAttribute("aria-hidden", "true");
          pagination.append(ellipsis);
        } else {
          pagination.append(
            makePageLink(String(item), item, currentPage, totalPages, "number"),
          );
        }
      }
      pagination.append(
        makePageLink(
          "›",
          Math.min(totalPages, currentPage + 1),
          currentPage,
          totalPages,
        ),
      );
      pagination.append(makePageLink("»", totalPages, currentPage, totalPages));
    });
  }

  function readUrlState(): { selections: FilterSelections; page: number } {
    const params = new URLSearchParams(window.location.search);
    let selections: FilterSelections = {};
    try {
      const parsed = JSON.parse(params.get(FILTERS_PARAM) ?? "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        selections = Object.fromEntries(
          Object.entries(parsed).filter(
            ([key, values]) =>
              Array.isArray(values) &&
              values.every((value) => typeof value === "string"),
          ),
        ) as FilterSelections;
      }
    } catch {
      // Malformed or stale filter parameters are ignored and removed on normalization.
    }
    const page = Number.parseInt(params.get(FILTERED_PAGE_PARAM) ?? "1", 10);
    return { selections, page: Number.isFinite(page) && page > 0 ? page : 1 };
  }

  function writeUrlState(
    selections: FilterSelections,
    page: number,
    mode: "push" | "replace",
  ): void {
    const url = new URL(window.location.href);
    url.searchParams.delete(FILTERS_PARAM);
    url.searchParams.delete(FILTERED_PAGE_PARAM);
    if (Object.keys(selections).length > 0) {
      url.searchParams.set(FILTERS_PARAM, JSON.stringify(selections));
      if (page > 1) url.searchParams.set(FILTERED_PAGE_PARAM, String(page));
    }
    window.history[mode === "push" ? "pushState" : "replaceState"]({}, "", url);
  }

  async function loadFilteredPage(
    results: PagefindSearchResult[],
    requestedPage: number,
    version: number,
  ): Promise<number> {
    const totalPages = Math.ceil(results.length / FILTERED_PAGE_SIZE);
    const currentPage =
      totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);
    renderFilteredPagination(currentPage, totalPages);
    const pageResults = results.slice(
      (currentPage - 1) * FILTERED_PAGE_SIZE,
      currentPage * FILTERED_PAGE_SIZE,
    );
    const data = await Promise.all(pageResults.map((result) => result.data()));
    if (version !== latestSearchVersion) return currentPage;
    renderFilteredResults(data);
    return currentPage;
  }

  function createProductCard(result: PagefindResultData): DocumentFragment {
    const metadata = result.meta ?? {};
    const productName = result.meta?.title ?? "Без названия";

    // TODO: is .firstElementChild needed here?
    const card = cardTemplate.content.cloneNode(true) as DocumentFragment;
    const link = card.querySelector<HTMLAnchorElement>("a");
    const imageContainer = card.querySelector<HTMLElement>(".entityImage");
    const discountPrice = card.querySelector<HTMLElement>(
      "[data-card-sale-price]",
    );
    const discountUnit = card.querySelector<HTMLElement>(
      "[data-card-sale-unit]",
    );
    const price = card.querySelector<HTMLElement>("[data-card-price]");
    const unit = card.querySelector<HTMLElement>("[data-card-unit]");
    const name = card.querySelector<HTMLElement>("[data-card-name]");
    if (
      !link ||
      !imageContainer ||
      !discountPrice ||
      !discountUnit ||
      !price ||
      !unit ||
      !name
    )
      return card;

    link.href = result.url.replace(/^\/client(?=\/)/, "");

    if (metadata.card_image) {
      const image = document.createElement("img");
      image.src = metadata.card_image.replace(/^\/client(?=\/)/, "");
      image.alt = productName;
      image.loading = "lazy";
      image.decoding = "async";
      imageContainer.classList.add("skeleton");
      image.addEventListener(
        "load",
        () => imageContainer.classList.remove("skeleton"),
        {
          once: true,
        },
      );
      image.addEventListener(
        "error",
        () => imageContainer.classList.remove("skeleton"),
        {
          once: true,
        },
      );
      imageContainer.append(image);
    } else {
      const placeholder = imagePlaceholderTemplate.content.cloneNode(true);
      imageContainer.append(placeholder);
    }

    if (metadata.discounted_price) {
      discountPrice.textContent = `${metadata.discounted_price}Р`;
      price.className = "discountedPrice";
      price.textContent = metadata["price"] ? `${metadata["price"]}Р` : "";
      if (metadata.unit) discountUnit.textContent = metadata.unit;
      else discountUnit.remove();
      unit.remove();
    } else {
      discountPrice.remove();
      price.textContent = metadata["price"] ? `${metadata["price"]}Р` : "";
      price.className = "price";
      discountUnit.remove();
      if (metadata.unit) unit.textContent = metadata.unit;
      else unit.remove();
    }

    name.textContent = productName;

    return card;
  }

  function renderFilteredResults(results: PagefindResultData[]): void {
    filteredFeed.replaceChildren();
    filteredFeed.removeAttribute("aria-busy");

    if (results.length === 0) {
      const emptyMessage = document.createElement("p");
      // TODO:style this to be pretty
      emptyMessage.textContent = "Товаров не найдено";
      filteredFeed.append(emptyMessage);
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const result of results) {
      fragment.append(createProductCard(result));
    }

    filteredFeed.append(fragment);
  }

  let latestSearchVersion = 0;

  async function filterProducts(
    options: { page?: number; history?: "push" | "replace" | false } = {},
  ): Promise<void> {
    const version = ++latestSearchVersion;
    filteringErrorElement.hidden = true;
    syncCollectionFilterVisibility();
    const selections = getSelections();
    const hasSelections = Object.keys(selections).length > 0;

    if (!hasSelections) {
      showStaticFeed();
      filteredFeed.replaceChildren();
      filteredFeed.removeAttribute("aria-busy");
      updateFacetOptions(initialFacetCounts);
      if (options.history) writeUrlState({}, 1, options.history);
      return;
    }

    showFilteredFeed();
    renderFilteredLoadingState();
    if (options.history)
      writeUrlState(selections, options.page ?? 1, options.history);

    try {
      const filteredSearch = await pagefind.search(null, {
        filters: buildSearchFilters(selections),
      });

      if (version !== latestSearchVersion) return;

      const requestedPage = options.page ?? 1;
      const currentPage = await loadFilteredPage(
        filteredSearch.results,
        requestedPage,
        version,
      );
      if (version !== latestSearchVersion) return;
      if (currentPage !== requestedPage)
        writeUrlState(selections, currentPage, "replace");

      try {
        const countsByFacet = await getCountsByFacet(
          filteredSearch,
          selections,
        );
        if (version !== latestSearchVersion) return;
        updateFacetOptions(countsByFacet);
      } catch (error) {
        console.error("Не удалось обновить счётчики фильтров каталога", error);
      }
    } catch (error) {
      if (version !== latestSearchVersion) return;
      console.error("Не удалось выполнить фильтрацию каталога", error);
      filteredFeed.replaceChildren();
      filteredFeed.removeAttribute("aria-busy");
      paginations.forEach((pagination) => {
        pagination.hidden = true;
      });
      filteredFeed.append(productErrorTemplateElement.content.cloneNode(true));
    }
  }

  filtersBlockElement.addEventListener("change", (event) => {
    if (
      event.target instanceof HTMLInputElement &&
      event.target.type === "checkbox"
    ) {
      void filterProducts({ page: 1, history: "push" });
    }
  });

  paginations.forEach((pagination) => {
    pagination.addEventListener("click", (event) => {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[data-filtered-page]")
          : null;
      if (!target || filteredFeed.hidden) return;
      event.preventDefault();
      if (target.getAttribute("aria-disabled") === "true") return;
      const page = Number(target.dataset.filteredPage);
      if (!Number.isFinite(page) || page < 1) return;
      writeUrlState(getSelections(), page, "push");
      void filterProducts({ page, history: "replace" });
      filteredFeed.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  function restoreFromUrl(): void {
    const { selections, page } = readUrlState();
    for (const input of filtersBlockElement.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    )) {
      input.checked = selections[input.name]?.includes(input.value) ?? false;
    }
    syncCollectionFilterVisibility();
    const validSelections = getSelections();
    if (Object.keys(validSelections).length > 0) {
      const params = new URLSearchParams(window.location.search);
      const rawPage = params.get(FILTERED_PAGE_PARAM);
      const invalidOrExtraParams =
        Object.keys(selections).length !==
          Object.keys(validSelections).length ||
        Object.entries(selections).some(
          ([key, values]) =>
            values.length !== (validSelections[key]?.length ?? 0),
        ) ||
        (rawPage !== null && (page === 1 || rawPage !== String(page)));
      if (invalidOrExtraParams) writeUrlState(validSelections, page, "replace");
      filteringErrorElement.hidden = true;
      void filterProducts({ page, history: false });
    } else {
      const url = new URL(window.location.href);
      if (
        url.searchParams.has(FILTERS_PARAM) ||
        url.searchParams.has(FILTERED_PAGE_PARAM)
      )
        writeUrlState({}, 1, "replace");
      showStaticFeed();
      filteredFeed.replaceChildren();
      filteredFeed.removeAttribute("aria-busy");
      filteringErrorElement.hidden = true;
    }
  }

  window.addEventListener("popstate", restoreFromUrl);
  restoreFromUrl();
}
