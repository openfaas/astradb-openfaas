"use strict"

const { Client } = require("cassandra-driver");
const fs = require("fs").promises

module.exports = async (event, context) => {
  const clientID = await fs.readFile("/var/openfaas/secrets/astra-clientid", "utf8")
  const clientSecret = await fs.readFile("/var/openfaas/secrets/astra-clientsecret", "utf8")

  const client = new Client({
    cloud: {
      secureConnectBundle: "/var/openfaas/secrets/astra-secure-connect",
    },
    credentials: {
        username: clientID.trim(),
        password: clientSecret.trim(),
    },
  });

  await client.connect();

  // Execute a query
  const result = await client.execute("SELECT * FROM cycling.cyclist_name");

  console.log(`Your cluster returned ${result.rowLength} row(s)`);
  await client.shutdown();

  return context
    .status (200)
    .succeed (result.rows)
}
