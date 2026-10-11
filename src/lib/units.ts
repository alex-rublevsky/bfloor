export const UNITS_OF_MEASUREMENT = [
  //TODO: simplify to only have one value for m2 ->
  // in usage is should check whether the unit has other spellings
  {
    id: "м2",
    value: "м²",
    one: "м²",
    few: "м²",
    many: "м²",
  },
  {
    id: "lm",
    value: "погонный метр",
    one: "погонный метр",
    few: "погонных метра",
    many: "погонных метров",
  },
  {
    id: "pi",
    value: "штука",
    one: "штука",
    few: "штуки",
    many: "штук",
  },
  {
    id: "pa",
    value: "упаковка",
    one: "упаковка",
    few: "упаковки",
    many: "упаковок",
  },
  {
    id: "l",
    value: "литр",
    one: "литр",
    few: "литра",
    many: "литров",
  },
] as const;
