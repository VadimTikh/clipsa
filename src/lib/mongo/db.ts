const dbNames = {
  clipsa: 'Clipsa',
  crm: 'salesdrive'
}

const collectionsProd = {

  clipsaDb: {
    products: {
      parsed_unified: 'products_parsed_unified',
      stock: 'products_stock',
      site_clipsa: 'products_site_clipsa',
    },
    erc: {
      content: 'erc_content_products',
      specprice: 'erc_connect_service_specprice',
      rates: 'erc_connect_service_usd_rates',
    },
    baf: {
      products: 'baf_products',
    },
  },

  crmDb: {
    product_minus_stock: 'products-minus-stock',
    products_plus_stock: 'products-plus-stock',
    products_zero_stock: 'products-zero-stock'

  }
}

const collectionsDev = {

  clipsaDb: {
    products: {
      parsed_unified: 'products_parsed_unified',
      stock: 'products_stock',
      site_clipsa: 'products_site_clipsa',
    },
    erc: {
      content: 'erc_content_products',
      specprice: 'erc_connect_service_specprice',
      rates: 'erc_connect_service_usd_rates',
    },
    baf: {
      products: 'baf_products',
    },
  },

  crmDb: {
    product_minus_stock: 'products-minus-stock',
    products_plus_stock: 'products-plus-stock',
    products_zero_stock: 'products-zero-stock'

  }
}

const collections = process.env.NODE_ENV === 'production' ?
  collectionsProd :
  collectionsDev;

export {dbNames, collections};
