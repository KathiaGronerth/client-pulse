/*
  NitrogenAdapter — INTEGRATION STUB (not implemented).

  Sketches how a live Nitrogen (formerly Riskalyze) connection would satisfy the
  DataSource interface. Every method throws NotImplementedError — this is a
  wiring placeholder, not a working client.

  NOTE: Nitrogen's API is partner/OAuth-gated. There is no self-service public
  developer portal; access requires a partner agreement (request via
  nitrogenwealth.com/api). Endpoints and field names below reflect the
  documented concepts, not a verified public schema — confirm against the gated
  docs before implementing.

  Base URL:   https://api.nitrogenwealth.com  (partner-issued; confirm on grant)
  Auth:       OAuth 2.0 authorization-code flow —
                   Authorization: Bearer <access_token>
              with refresh-token rotation; tokens issued under the partner app.
  Endpoints:  GET /clients         (client Risk Number = tolerance)
              GET /clients/{id}
              GET /portfolios/{id}  (portfolio Risk Number = actual, GPA,
                                     six-month / 95% historical range)
              Responses wrap the payload under a top-level `data` key.
  Secrets:    process.env.NITROGEN_CLIENT_ID / NITROGEN_CLIENT_SECRET /
              NITROGEN_ACCESS_TOKEN / NITROGEN_REFRESH_TOKEN (server-side only).
*/

import { DataSource, NotImplementedError } from "./DataSource.js";

export class NitrogenAdapter extends DataSource {
  constructor({ accessToken, refreshToken, baseUrl = "https://api.nitrogenwealth.com" } = {}) {
    super();
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.baseUrl = baseUrl;
  }

  getClients() {
    // Contact records come from Redtail, not Nitrogen — see RedtailAdapter.
    throw new NotImplementedError("NitrogenAdapter does not provide contacts; use RedtailAdapter");
  }

  getRiskData() {
    // Would: GET /clients (+ /portfolios) under Bearer auth -> unwrap `data` ->
    // map to { client_external_id, risk_number, risk_status, risk_trend,
    // probability_of_success, portfolio: { risk_number, six_month_range } }.
    throw new NotImplementedError("NitrogenAdapter.getRiskData() is an integration stub");
  }
}
