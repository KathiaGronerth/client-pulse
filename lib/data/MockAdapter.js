/*
  MockAdapter — the default DataSource. Reads synthetic fixtures bundled at
  build time and returns them in the same shape a live adapter would: Redtail
  contacts resolved against their lookup tables, and Nitrogen risk records.

  This is the only adapter wired up by default (see ./index.js). The fixtures
  are field-faithful to the documented Redtail / Nitrogen APIs so that swapping
  in a real adapter is a configuration change, not a data reshape.
*/

import { DataSource } from "./DataSource.js";
import { resolveContacts } from "./transform.js";
import contactsEnvelope from "./fixtures/redtail-contacts.json";
import lookups from "./fixtures/redtail-lookups.json";
import riskEnvelope from "./fixtures/nitrogen-risk.json";

export class MockAdapter extends DataSource {
  getClients() {
    // Unwrap the Redtail `{ contacts, meta }` envelope and resolve *_id keys.
    return resolveContacts(contactsEnvelope.contacts, lookups);
  }

  getRiskData() {
    // Unwrap the Nitrogen `{ data }` envelope.
    return riskEnvelope.data;
  }

  /** Snapshot date the fixture's activity data is measured against. */
  getSnapshotDate() {
    return contactsEnvelope.meta.as_of;
  }
}
