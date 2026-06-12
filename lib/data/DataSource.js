/*
  DataSource — the interface every adapter implements.

  Two methods feed the dashboard:
    getClients()  -> Redtail-shaped contact records (resolved against lookups)
    getRiskData() -> Nitrogen-shaped risk records (joined by client_external_id)

  Concrete adapters: MockAdapter (synthetic JSON fixtures, the default),
  RedtailAdapter + NitrogenAdapter (live-integration stubs). The flat client
  objects the UI renders are produced by lib/data/transform.js from these two
  feeds, so swapping the data source never touches the UI.
*/

export class NotImplementedError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotImplementedError";
  }
}

export class DataSource {
  /** @returns {object[]} Redtail-shaped contacts. */
  getClients() {
    throw new NotImplementedError("getClients() must be implemented by a DataSource subclass");
  }

  /** @returns {object[]} Nitrogen-shaped risk records. */
  getRiskData() {
    throw new NotImplementedError("getRiskData() must be implemented by a DataSource subclass");
  }
}
