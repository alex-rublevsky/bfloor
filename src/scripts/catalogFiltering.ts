// TODO: after filtration the scroll should be taken to the start of the page

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
  const filtersParent = document.querySelector("aside") as HTMLElement;
  const filtersBlock = document.querySelector<HTMLElement>("#filtersBlock")!;
  const staticFeed = document.querySelector<HTMLElement>("#staticFeed")!;
  const filteredFeed = document.querySelector<HTMLElement>("#filteredFeed")!;
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

  // TODO: update the approach to use is-showing class, since this does work, but only from the second click
  const desktop = window.matchMedia("(min-width: 769px)");
  mobileFiltersButton.addEventListener("click", () => {
    if (!desktop.matches) {
      if (filtersParent.style.display === "none") {
        filtersParent.style.display = "block";
        mobileFiltersButton.innerText = "Применить";
        mobileFiltersButton.classList.remove("tertiary");
        mobileFiltersButton.classList.add("primary");
      } else {
        filtersParent.style.display = "none";
        mobileFiltersButton.innerText = "Фильтры";
        mobileFiltersButton.classList.remove("primary");
        mobileFiltersButton.classList.add("tertiary");
      }
    }
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
    for (const filter of filtersBlock.querySelectorAll<HTMLElement>(
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
        const wrapper = input.closest(".checkbox-wrapper");
        if (!wrapper) return;
        wrapper.hidden = !isVisible;
        const label = input.dataset.label ?? input.value;
        const count = counts[input.value] ?? 0;
        const labelText = wrapper.querySelector<HTMLElement>(
          ".filter-option-label",
        );
        if (labelText) labelText.textContent = `${label} (${count})`;
      });

      filter.hidden = Array.from(inputs).every((input) => {
        const wrapper = input.closest<HTMLElement>(".checkbox-wrapper");
        return !wrapper || wrapper.hidden;
      });
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
      price.textContent = metadata["price"] ? `${metadata["price"]}Р` : "";
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
    if (
      event.target instanceof HTMLInputElement &&
      event.target.type === "checkbox"
    ) {
      void filterProducts();
    }
  });
}
