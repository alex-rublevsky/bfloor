type Variation = {
  id: number;
  price: number;
  discountedPrice: number | null;
  squareMetersPerPack: number | null;
  values: number[];
};

type Facet = {
  attributeId: number;
  values: number[];
};

const formatPrice = (price: number) =>
  Intl.NumberFormat().format(price).replaceAll(",", " ");

const root = document.querySelector<HTMLElement>("[data-variation-prices]");

if (root) {
  const variations = JSON.parse(
    root.dataset.variations ?? "[]",
  ) as Variation[];
  const facets = Array.from(
    root.parentElement?.querySelectorAll<HTMLElement>(
      "[data-variation-facet]",
    ) ?? [],
  );
  const price = root.querySelector<HTMLElement>("[data-current-price]");
  const regularPrice = root.querySelector<HTMLElement>(
    "[data-regular-price]",
  );
  const packArea = root.parentElement?.querySelector<HTMLElement>(
    "[data-variation-pack-area]",
  );
  const attributeIds = facets.map((facet) =>
    Number(facet.dataset.attributeId),
  );

  // Incomplete legacy rows are excluded from picker matching; otherwise a
  // missing slot could be mistaken for a selectable combination.
  const indexedVariations = variations.filter(
    (variation) => variation.values.length === attributeIds.length,
  );
  if (
    variations.length > 0 &&
    facets.length > 0 &&
    price &&
    regularPrice &&
    indexedVariations.length > 0
  ) {
    const valueAt = (variation: Variation, attributeId: number) =>
      variation.values[attributeIds.indexOf(attributeId)];
    const selected = new Map<number, number>();

    for (const facet of facets) {
      const selectedButton = facet.querySelector<HTMLButtonElement>(
        '[data-variation-option][aria-pressed="true"]',
      );
      if (selectedButton) {
        selected.set(
          Number(facet.dataset.attributeId),
          Number(selectedButton.dataset.valueId),
        );
      }
    }

    const updateAvailability = () => {
      for (const facet of facets) {
        const attributeId = Number(facet.dataset.attributeId);
        facet
          .querySelectorAll<HTMLButtonElement>("[data-variation-option]")
          .forEach((button) => {
            const valueId = Number(button.dataset.valueId);
            const available = indexedVariations.some((variation) => {
              if (valueAt(variation, attributeId) !== valueId) return false;
              return [...selected].every(
                ([selectedAttributeId, selectedValueId]) =>
                  selectedAttributeId === attributeId ||
                  valueAt(variation, selectedAttributeId) === selectedValueId,
              );
            });
            button.dataset.available = String(available);
          });
      }
    };

    const updateSelection = (variation: (typeof indexedVariations)[number]) => {
      selected.clear();
      for (const attributeId of attributeIds) {
        const valueId = valueAt(variation, attributeId);
        if (valueId !== undefined) selected.set(attributeId, valueId);
      }

      for (const facet of facets) {
        const attributeId = Number(facet.dataset.attributeId);
        facet
          .querySelectorAll<HTMLButtonElement>("[data-variation-option]")
          .forEach((button) => {
            button.setAttribute(
              "aria-pressed",
              String(
                Number(button.dataset.valueId) === selected.get(attributeId),
              ),
            );
          });
      }

      const discountedPrice = variation.discountedPrice;
      price.textContent = formatPrice(discountedPrice ?? variation.price);
      price.setAttribute(
        "data-pagefind-meta",
        discountedPrice == null ? "price" : "discounted_price",
      );
      regularPrice.textContent =
        discountedPrice == null ? "" : formatPrice(variation.price);
      regularPrice.hidden = discountedPrice == null;
      if (discountedPrice == null)
        regularPrice.removeAttribute("data-pagefind-meta");
      else regularPrice.setAttribute("data-pagefind-meta", "price");

      if (packArea) {
        packArea.hidden = variation.squareMetersPerPack == null;
        packArea.textContent =
          variation.squareMetersPerPack == null
            ? ""
            : `Площадь упаковки: ${variation.squareMetersPerPack} м²`;
      }

      updateAvailability();
    };

    const resolveSelection = (attributeId: number, valueId: number) => {
      let best: (typeof indexedVariations)[number] | undefined;
      let bestRetained = -1;
      for (const variation of indexedVariations) {
        if (valueAt(variation, attributeId) !== valueId) continue;
        let retained = 0;
        for (const [currentAttributeId, currentValueId] of selected) {
          if (
            currentAttributeId !== attributeId &&
            valueAt(variation, currentAttributeId) === currentValueId
          )
            retained++;
        }
        if (retained > bestRetained) {
          best = variation;
          bestRetained = retained;
        }
      }
      if (best) updateSelection(best);
    };

    root.parentElement?.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>(
        "[data-variation-option]",
      );
      if (!button) return;

      const facet = button.closest<HTMLElement>("[data-variation-facet]");
      if (!facet) return;
      resolveSelection(
        Number(facet.dataset.attributeId),
        Number(button.dataset.valueId),
      );
    });

    updateAvailability();
  }
}
