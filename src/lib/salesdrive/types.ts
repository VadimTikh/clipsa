const dontUpdateFieldsValues = [
  "price",
  "discount",
  "name",
  "description",
  "images",
  "nameForDocuments",
  "nameTranslate",
  "descriptionTranslate"
] as const;

export type DontUpdateFields = typeof dontUpdateFieldsValues[number];

export type Product = {
  id: string,
  expenses?: number,
  currencyExpenses?: 'UAH'
  name?: string,
  sku?: string,
  images?: {
    fullsize: string,
    thumbnail: string
  }[],
  description?: string,
  nameTranslate?: string,
  nameForDocuments?: string,
  weight?: string,
}
