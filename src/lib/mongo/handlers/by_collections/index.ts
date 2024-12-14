import {baf_products} from './baf_products'
import {connection_products} from './connection_products'
import {crm_products} from './crm_products'
import {erc_connect_service_products} from './erc_connect_service_products'
import {erc_connect_service_usd_rates} from './erc_connect_service_usd_rates'
import {erc_ware_products} from './erc_ware_products'
import {parsed_unified_products} from './parsed_unified_products'
import {site_clipsa_price_rules} from './site_clipsa_price_rules'
import {site_clipsa_products} from './site_clipsa_products'
import {stock_calculated_cp_av_products} from './stock_calculated_cp_av_products'
import {stock_products} from './stock_products'
import {crm_products_plus_stock} from './crm_products_plus_stock'
import {crm_products_zero_stock} from './crm_products_zero_stock'
import {crm_products_minus_stock} from './crm_products_minus_stock'

const by_collections = {
  baf_products,
  connection_products,
  crm_products,
  erc_connect_service_products,
  erc_connect_service_usd_rates,
  erc_ware_products,
  parsed_unified_products,
  site_clipsa_price_rules,
  site_clipsa_products,
  stock_calculated_cp_av_products,
  stock_products,
  crm_products_zero_stock,
  crm_products_plus_stock,
  crm_products_minus_stock
}

export {by_collections}
