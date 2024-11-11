const dbName = 'Clipsa';

const collections = {
  erc: {
    content: 'erc_content_products',
    specprice: 'erc_connect_service_specprice',
    rates: 'erc_connect_service_usd_rates',
  },
  baf: {
    products: 'baf_products',
  },
};

export {dbName, collections};
