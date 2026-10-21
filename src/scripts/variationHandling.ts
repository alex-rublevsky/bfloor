// import type { ProductFormVariation } from "@/db/dashboard/products/types";
import { productForm } from "./productHandling";
const variationsBlock = document.getElementById(
  "variationsBlock",
) as HTMLElement;
const addVariationButton = document.getElementById(
  "addVariationButton",
) as HTMLButtonElement;
const variationTemplate = document.getElementById(
  "variationEntry",
) as HTMLTemplateElement;
// const attributeTemplate = document.getElementById(
//   "variation-attribute-template",
// ) as HTMLTemplateElement;

function getSelectedVariationAttributes() {
  const variationAttributesListBox = document.getElementById(
    "variationAttributesListBox",
  ) as HTMLSelectElement;
  return Array.from(variationAttributesListBox.selectedOptions).map(
    (option) => option.value,
  );
}

function createVariation(variation?: any) {
  variationsBlock.append(variationTemplate.content.cloneNode(true));
}

// const initialSelectedVariationAttributes = getSelectedVariationAttributes();
// const allVariations = document.querySelectorAll<HTMLElement>("#variation");

const initialVariations = JSON.parse(productForm.dataset.variations ?? "[]");

// as ProductFormVariation[]

if (initialVariations) {
  for (const variation of initialVariations) {
    createVariation(variation);
  }
  //   initialVariations.forEach( (initialVariation as any) =>
  //     variationsBlock.append(variationTemplate.content.cloneNode(true))
  //
  //   );
}
//TODO: populate variations with attributes
// if (allVariations && initialSelectedVariationAttributes) {
//   initialSelectedVariationAttributes.forEach((attribute) =>
//     allVariations.forEach((variation) => variation.append(attribute)),
//   );
// }

addVariationButton.onclick = () => {
  createVariation();
};

variationsBlock.onclick = (event) => {
  const target = event.target as HTMLElement;
  const deleteButton = target.closest<HTMLButtonElement>(
    '[data-action="delete-variation"]',
  );

  if (!deleteButton) return;

  deleteButton.closest(".variation")?.remove();
};
