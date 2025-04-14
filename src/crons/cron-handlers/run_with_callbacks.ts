import {getConnection} from "../../lib/databases/mongo/getConnection";
import {collections} from "../../lib/databases/mongo/collections";
import {ObjectId} from "mongodb";
import {CronHandlerParams} from "../../lib/interfaces";

const getBasicCronCallbacks = async (
  {name, description = ''}: { name: string, description?: string }
) => {

  const client = await getConnection()
  const collection = collections.logs.cronJobs(client)
  let docIdPromise: null | Promise<ObjectId> = null

  const getCurrentLogDoc = async () => {
    if (!docIdPromise) {
      throw new Error('docIdPromise не найден. Вероятно не был запущен начальный колбек')
    }
    const docId = await docIdPromise
    const doc = await collection.findOne({_id: docId})
    if (!doc) {
      throw new Error(`Документ лога не был найден в базе`)
    }
    return doc
  }

  const onStartCallback = async () => {
    try {
      docIdPromise = collection
        .insertOne({
          name,
          description,
          startedAt: new Date(),
          status: {status: 'in_process'},
          runLogs: [],
        })
        .then(doc => doc.insertedId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
  const onSuccessCallback = async () => {
    try {
      const doc = await getCurrentLogDoc()
      const finishedAt = new Date()
      const durationSeconds = Math.ceil(
        (finishedAt.getTime() - doc.startedAt.getTime()) / 1000
      )
      await collection.updateOne(
        {_id: doc._id},
        {
          $set: {
            status: {status: 'success', finishedAt, durationSeconds},
          }
        }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
  const onErrorCallback = async (reason: string) => {
    try {
      const doc = await getCurrentLogDoc()
      const finishedAt = new Date()
      const durationSeconds = Math.ceil(
        (finishedAt.getTime() - doc.startedAt.getTime()) / 1000
      )
      await collection.updateOne(
        {_id: doc._id},
        {
          $set: {
            status: {status: 'error', finishedAt, durationSeconds, reason},
          }
        }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }

  return {onStartCallback, onSuccessCallback, onErrorCallback}
}

const runWithCallbacks = async (
  {name, description, handler}: {
    name: string,
    description?: string,
    handler: (
      {onStartCallback, onSuccessCallback, onErrorCallback}: CronHandlerParams
    ) => Promise<void>,
  }
) => {
  const {
    onStartCallback, onSuccessCallback, onErrorCallback
  } = await getBasicCronCallbacks({name, description})

  await handler(
    {onStartCallback, onSuccessCallback, onErrorCallback}
  )
}

export {runWithCallbacks}
