import { generateSlug } from "@/lib/slugGeneration";
import { ActionError } from "astro:actions";
import { z } from "astro/zod";

export function cleanNameAndValidateSlug(name: string, slug: string) {
  const cleanName = name.replace(/\s+/g, " ");
  if (slug !== generateSlug(cleanName)) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "Ярлык не совпадает с названием",
    });
  }
  return cleanName;
}

export const name = z
  .string({
    error: (iss) =>
      iss.input === null
        ? "Название обязательно"
        : "Название должно быть текстом",
  })
  .trim()
  .normalize()
  .max(100, "Название не должен быть длиннее 100 символов")
  .nonempty("Название не может быть пустым");

export const slug = z
  .string({
    error: (iss) =>
      iss.input === null ? "Ярлык обязателен" : "Ярлык должен быть текстом",
  })
  .trim()
  .normalize()
  .toLowerCase()
  .max(100, "Ярлык не должен быть длиннее 100 символов")
  .nonempty("Ярлык не может быть пустым");

export const description = z
  .string("Описание должно быть текстом")
  .trim()
  .normalize()
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const nullableNumber = (field: string) =>
  z
    .number(`${field} должно быть числом`)
    .nonnegative(`${field} не может быть отрицательным числом`)
    .transform((value) => (value === 0 ? null : value))
    .nullable();

export const id = (field: string) =>
  z
    .int({
      error: (iss) =>
        iss.input === null
          ? `ID ${field} обязателен`
          : `ID ${field} должно быть целым числом`,
    })
    .positive(`ID ${field} должен быть больше нуля`);
