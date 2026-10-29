type FacetCounts = Record<string, number>;
type FilterCounts = Record<string, FacetCounts>;
type FilterSelections = Record<string, string[]>;
type SearchFilters = {
  [key: string]: unknown;
  Категория: string;
  all?: Array<{ any: Array<Record<string, string>> }>;
};

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
  const filtersBlock = document.querySelector<HTMLElement>("#filtersBlock")!;
  const staticFeed = document.querySelector<HTMLElement>("#staticFeed")!;
  const filteredFeed = document.querySelector<HTMLElement>("#filteredFeed")!;
  const cardTemplate = document.querySelector<HTMLTemplateElement>(
    "#product-card-template",
  )!;
  const imagePlaceholderTemplate =
    document.querySelector<HTMLTemplateElement>("#image-placeholder")!;

  if (
    !section ||
    !filtersBlock ||
    !staticFeed ||
    !filteredFeed ||
    !cardTemplate ||
    !imagePlaceholderTemplate
  ) {
    return;
  }

  const pagefindUrl = new URL("/pagefind/pagefind.js", window.location.origin)
    .href;
  const pagefind = (await import(
    /* @vite-ignore */ pagefindUrl
  )) as PagefindApi;
  await pagefind.filters();

  const category = section.dataset.category ?? "";
  const locationLabels = JSON.parse(
    section.dataset.locationLabels ?? "{}",
  ) as Record<string, string>;
  const baseSearch = await pagefind.search(null, {
    filters: { Категория: category },
  });
  const initialFacetCounts = baseSearch.filters;
  const paginations =
    document.querySelectorAll<HTMLElement>("[data-pagination]");

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
    const select = clone.querySelector<HTMLSelectElement>("select");
    const label = clone.querySelector<HTMLLabelElement>("label");
    const filter = clone.querySelector<HTMLElement>(".filter");
    if (!select || !label || !filter) return;

    label.textContent = name;
    filter.id = name;

    for (const [value, count] of Object.entries(counts)) {
      const option = document.createElement("option");

      option.value = value;
      option.dataset.label = getOptionLabel(name, value);
      option.textContent = `${option.dataset.label ?? value} (${count})`;

      select.append(option);
    }
    filtersBlock.append(clone);
  }

  for (const facetName of facets) {
    createFilter(facetName, initialFacetCounts[facetName]);
  }

  updateFacetOptions(initialFacetCounts);

  function getSelections(): FilterSelections {
    const selections: FilterSelections = {};

    for (const filter of filtersBlock.querySelectorAll<HTMLElement>(
      ".filter",
    )) {
      const select = filter.querySelector<HTMLSelectElement>("select");
      if (!select) continue;
      const values = Array.from(
        select.selectedOptions,
        (option) => option.value,
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
    for (const filter of filtersBlock.querySelectorAll<HTMLElement>(
      ".filter",
    )) {
      const select = filter.querySelector<HTMLSelectElement>("select");
      if (!select) continue;
      const counts = countsByFacet[filter.id] ?? {};

      for (const option of select.options) {
        const count = counts[option.value] ?? 0;

        option.textContent = `${option.dataset.label ?? option.value} (${count})`;
        option.hidden = count === 0 && !option.selected;
      }

      const hasVisibleOptions = Array.from(select.options).some(
        (option) => !option.hidden,
      );

      filter.hidden = !hasVisibleOptions;
    }
  }

  function showStaticFeed(): void {
    filteredFeed.hidden = true;
    staticFeed.hidden = false;

    paginations.forEach((pagination) => {
      pagination.hidden = false;
    });
  }

  function showFilteredFeed(): void {
    staticFeed.hidden = true;
    filteredFeed.hidden = false;

    paginations.forEach((pagination) => {
      pagination.hidden = true;
    });
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
    const price = card.querySelector<HTMLElement>("[data-card-price]");
    const name = card.querySelector<HTMLElement>("[data-card-name]");
    if (!link || !imageContainer || !discountPrice || !price || !name)
      return card;

    link.href = result.url.replace(/^\/client(?=\/)/, "");

    if (metadata.image) {
      const image = document.createElement("img");
      image.src = metadata.image.replace(/^\/client(?=\/)/, "");
      image.alt = productName;
      image.loading = "lazy";
      image.className = "skeleton";
      image.addEventListener("load", () => image.classList.remove("skeleton"), {
        once: true,
      });
      imageContainer.append(image);
    } else {
      const placeholder = imagePlaceholderTemplate.content.cloneNode(true);
      imageContainer.append(placeholder);
    }

    if (metadata.discounted_price) {
      discountPrice.textContent = `${metadata.discounted_price}Р`;
      price.textContent = `${metadata["price"] ?? ""}Р`;
      price.classList.add("line-through", "text-foreground-muted");
    } else {
      discountPrice.remove();
      price.textContent = metadata["Цена"] ? `${metadata["Цена"]}Р` : "";
    }

    name.textContent = productName;

    return card;
  }

  function renderFilteredResults(results: PagefindResultData[]): void {
    filteredFeed.replaceChildren();

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

  async function filterProducts(): Promise<void> {
    const version = ++latestSearchVersion;
    const selections = getSelections();
    const hasSelections = Object.keys(selections).length > 0;

    if (!hasSelections) {
      showStaticFeed();
      updateFacetOptions(initialFacetCounts);
      return;
    }

    showFilteredFeed();

    const filteredSearch = await pagefind.search(null, {
      filters: buildSearchFilters(selections),
    });

    if (version !== latestSearchVersion) return;

    const results = await Promise.all(
      filteredSearch.results.map((result) => result.data()),
    );

    if (version !== latestSearchVersion) return;

    renderFilteredResults(results);

    const countsByFacet = await getCountsByFacet(filteredSearch, selections);

    if (version !== latestSearchVersion) return;

    updateFacetOptions(countsByFacet);
  }

  filtersBlock.addEventListener("change", (event) => {
    if (event.target instanceof HTMLSelectElement) {
      void filterProducts();
    }
  });
}
