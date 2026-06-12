/*
  RedtailAdapter — INTEGRATION STUB (not implemented).

  Sketches how a live Redtail CRM connection would satisfy the DataSource
  interface. Auth and endpoints below follow Redtail's documented REST API.
  Every method throws NotImplementedError — this is a wiring placeholder, not a
  working client. To go live, implement the fetch calls and select this adapter
  in ./index.js (a one-line change).

  Base URL:   https://api2.redtailtechnology.com/crm/v1
  Auth:       1. POST /authentication with
                   Authorization: Basic base64("<api_key>:<username>:<password>")
                 -> returns a per-user UserKey.
              2. Subsequent requests send
                   Authorization: Userkeyauth base64("<api_key>:<user_key>")
  Endpoints:  GET /contacts?include=addresses,phones,emails (paginated via
                   ?page=&per_page=, envelope { contacts: [...], meta: {...} })
              GET /contacts/{id}/activities   (last engagement + open tasks)
              GET /contacts/{id}/accounts      (portfolio balances)
              GET /contacts/{id}/udfs          (cadence target, tier, life goal,
                                                life event, advisor note)
              Lookup tables: /lookups/servicing_advisors, /contactcategories,
                             /contactstatuses (for resolveContacts()).
  Secrets:    process.env.REDTAIL_API_KEY / REDTAIL_USERNAME / REDTAIL_PASSWORD
              (server-side only; never bundled to the client).
*/

import { DataSource, NotImplementedError } from "./DataSource.js";

export class RedtailAdapter extends DataSource {
  constructor({ apiKey, username, password, baseUrl = "https://api2.redtailtechnology.com/crm/v1" } = {}) {
    super();
    this.apiKey = apiKey;
    this.username = username;
    this.password = password;
    this.baseUrl = baseUrl;
  }

  getClients() {
    // Would: authenticate -> GET /contacts (paginate) -> for each, fetch
    // activities/accounts/udfs and lookup tables -> resolveContacts(...).
    throw new NotImplementedError("RedtailAdapter.getClients() is an integration stub");
  }

  getRiskData() {
    // Risk data comes from Nitrogen, not Redtail — see NitrogenAdapter.
    throw new NotImplementedError("RedtailAdapter does not provide risk data; use NitrogenAdapter");
  }
}
