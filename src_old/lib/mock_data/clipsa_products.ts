import {ClipsaProduct} from "../../types";

const mockClipsaProducts: ClipsaProduct[] = [
  {
    sku: "P12345",
    old_price: 150.0,
    sell_price: 100.0,
    sell_price_components: {
      cost_price: 80.0,
      nacenka_formula: 15.0,
      nacenka_dop: 0,
    },
    rrc: {
      required: true,
      value: 120.0,
    },
    availability: true,
    hidden: false,
    suppliers: [
      { supplier_name: "SupplierA", sku: "S12345A" },
      { supplier_name: "SupplierB", sku: "S12345B" },
    ],
  },
  {
    sku: "P54321",
    old_price: 200.0,
    sell_price: 180.0,
    sell_price_components: {
      cost_price: 150.0,
      nacenka_formula: 20.0,
      nacenka_dop: 0,
    },
    rrc: {
      required: false,
      value: 0,
    },
    availability: false,
    hidden: true,
    suppliers: [
      { supplier_name: "SupplierC", sku: "S54321C" },
    ],
  },
  {
    sku: "P67890",
    old_price: 300.0,
    sell_price: 250.0,
    sell_price_components: {
      cost_price: 200.0,
      nacenka_formula: 30.0,
      nacenka_dop: 0,
    },
    rrc: {
      required: true,
      value: 280.0,
    },
    availability: true,
    hidden: false,
    suppliers: [
      { supplier_name: "SupplierD", sku: "S67890D" },
      { supplier_name: "SupplierE", sku: "S67890E" },
    ],
  },
  {
    sku: "P98765",
    old_price: 400.0,
    sell_price: 360.0,
    sell_price_components: {
      cost_price: 320.0,
      nacenka_formula: 25.0,
      nacenka_dop: 0,
    },
    rrc: {
      required: false,
      value: 0,
    },
    availability: false,
    hidden: true,
    suppliers: [
      { supplier_name: "SupplierF", sku: "S98765F" },
    ],
  },
  {
    sku: "P11111",
    old_price: 500.0,
    sell_price: 450.0,
    sell_price_components: {
      cost_price: 400.0,
      nacenka_formula: 30.0,
      nacenka_dop: 0,
    },
    rrc: {
      required: true,
      value: 480.0,
    },
    availability: true,
    hidden: false,
    suppliers: [
      { supplier_name: "SupplierG", sku: "S11111G" },
      { supplier_name: "SupplierH", sku: "S11111H" },
    ],
  },
];

export {mockClipsaProducts}
