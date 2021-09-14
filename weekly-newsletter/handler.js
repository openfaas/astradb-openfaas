'use strict'

const { createClient } = require("@astrajs/collections");
const fs = require("fs").promises

module.exports = async (event, context) => {
  let token = await fs.readFile("/var/openfaas/secrets/astra-token", "utf8")

  const astraClient = await createClient({
    astraDatabaseId: process.env.ASTRA_DB_ID,
    astraDatabaseRegion: process.env.ASTRA_DB_REGION,
    applicationToken: token.trim(),
  });

  // create a shortcut to the links in the ASTRA_DB_KEYSPACE keyspace
  const linksCollection = astraClient.
    namespace(process.env.ASTRA_DB_KEYSPACE).
    collection("links");

  if(event.method == "POST") {
    // application/json is parsed by default
    let newLink = event.body;
    const createdLink = await linksCollection.create(newLink);
    return context.
      status(200).
      succeed(createdLink);
  } else if(event.query.url) {
    try {
      let links = await linksCollection.find({ url: { $eq: event.query.url } });
      return context.
        status(200).
        succeed(links);
    } catch (err) {
      if(err.stack.includes("Request failed with status code 404")) {
        return context.
          status(200).
          succeed({});
      } else {
        console.error(err);
        return context.
          status(500).
          fail("Unable to query database");
      }
    }
  }

  let links;
  try {
    // Default with no url querystring
    links = await linksCollection.find({});
  } catch(err) {
    if(err.stack.includes("Request failed with status code 404")) {
      return context.
        status(200).
        succeed({});
    } else {
     console.error(err);
     return context.
      status(500).
      fail("Unable to query database");
    }
  }

  return context.
    status(200).
    succeed(links);
}