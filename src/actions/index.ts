import { product } from "@/actions/product";
import { category } from "@/actions/category";
import { brand } from "@/actions/brand";
import { collection } from "@/actions/collection";
import { attribute } from "@/actions/attribute";
import { attributeValue } from "@/actions/attributeValue";

export const server = {
  product,
  category,
  brand,
  collection,
  attribute,
  attributeValue,
};
