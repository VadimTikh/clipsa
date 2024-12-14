import {AnyBulkWriteOperation} from 'mongodb'
import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {ConnectionProduct, DocTypeByCollectionType} from "../../../../types";
import {log} from "../../../log";

const connection_products = {

  getConnections: async () => {

    try {

      const client = await getConnection();

      const collection = collections.products.connections(client);

      const connections = await collection.find({}).toArray()

      log.dev(`connection_products.getConnections fetched: ${connections.length} connections`);

      return connections;

    } catch (error) {
      log.all(`Ошибка connection_products.getConnections`);
      throw error;
    }
  },

  upsertConnections: async (connections: ConnectionProduct[]) => {

    try {

      const currentDate = new Date();

      const client = await getConnection();

      const collection = collections.products.connections(client)

      type DocType = DocTypeByCollectionType<typeof collection>

      const bulkOps: AnyBulkWriteOperation<DocType>[] = connections
        .map((connection) => {

          return {
            updateOne: {
              filter: {
                stock_sku: connection.stock_sku,
                parsed_sku: connection.parsed_sku,
                supplier_name: connection.supplier_name
              },
              update: {
                $set: connection,
                $setOnInsert: {
                  created_at: currentDate
                }
              },
              upsert: true,
            }
          }
        });

      const {upsertedCount, modifiedCount} =
        await collection.bulkWrite(bulkOps);

      log.dev(`connection_products.upsertConnections upsertedCount: ${upsertedCount}, modifiedCount:${modifiedCount}`)

    } catch (error) {
      log.all(`Ошибка connection_products.upsertConnections`)
      throw error
    }

  },

  deleteConnections: async (connections: ConnectionProduct[]) => {

    try {

      const client = await getConnection();

      const collection = collections.products.connections(client);

      type DocType = DocTypeByCollectionType<typeof collection>

      const bulkOps: AnyBulkWriteOperation<DocType>[] = connections.map((connection) => {

        return {
          deleteOne: {
            filter: {
              stock_sku: connection.stock_sku,
              parsed_sku: connection.parsed_sku,
              supplier_name: connection.supplier_name
            }
          }
        };
      });

      const {deletedCount} = await collection.bulkWrite(bulkOps);

      log.dev(`connection_products.deleteConnections deletedCount: ${deletedCount}`);

    } catch (error) {
      log.all(`Ошибка connection_products.deleteConnections`);
      throw error;
    }

  }

}

export {connection_products}
