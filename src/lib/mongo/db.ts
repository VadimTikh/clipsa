const dbName = 'Clipsa';

const collectionsProd = {
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
};

const collectionsDev = {
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
    products: 'TEST_baf_products',
  },
};

const collections = process.env.NODE_ENV === 'production' ?
  collectionsProd :
  collectionsDev;

export {dbName, collections};
