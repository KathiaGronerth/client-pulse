/*
  Data layer entry point.

  The app consumes clients through getDashboardClients(); the only thing that
  decides where the data comes from is the `dataSource` line below. Swapping the
  MockAdapter for a live source is a one-line change.

  For a live setup, contacts come from Redtail and risk from Nitrogen, so you'd
  compose the two adapters behind one object, e.g.:

      import { RedtailAdapter } from "./RedtailAdapter";
      import { NitrogenAdapter } from "./NitrogenAdapter";
      const redtail = new RedtailAdapter({ apiKey, username, password });
      const nitrogen = new NitrogenAdapter({ accessToken, refreshToken });
      export const dataSource = {
        getClients: () => redtail.getClients(),
        getRiskData: () => nitrogen.getRiskData(),
      };

  (Both adapters currently throw NotImplementedError — they're integration stubs.)
*/

import { MockAdapter } from "./MockAdapter.js";
import { buildDashboardClients } from "./transform.js";

// --- the one-line configuration switch ---
export const dataSource = new MockAdapter();

/**
 * The flat client objects the dashboard renders, merged from the configured
 * data source (Redtail contacts + Nitrogen risk). Health scores are applied
 * separately by the component (lib/scoring.js).
 */
export function getDashboardClients() {
  const asOf = typeof dataSource.getSnapshotDate === "function"
    ? dataSource.getSnapshotDate()
    : new Date().toISOString().slice(0, 10);
  return buildDashboardClients(dataSource.getClients(), dataSource.getRiskData(), asOf);
}
