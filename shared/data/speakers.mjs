import { getConnection } from "./connection.mjs"

async function findSpeakers({ query, limit = 200 }) {
    const db = getConnection()
    const collection = await db.collection("speakers")
    return await collection.find(query, { limit }).toArray()
}

async function upsertSpeaker(speaker) {
    const { _id, slug, name, image, url, twitter } = speaker
    const db = getConnection()
    const collection = await db.collection("speakers")
    let response
    if (_id) {
        response = await collection.updateOne({ _id }, { $set: { slug, name, image, url, twitter } })
    }
    else {
        response = await collection.insertOne({ slug, name, image, url, twitter })
    }
    return response
}

export {
    findSpeakers,
    upsertSpeaker
}