import type { FleetRow } from "./model";

export type SortKey = "identities" | "routes" | "cut";

export function FleetTable({
  rows,
  query,
  sort,
  onSort,
  onClear,
}: {
  rows: FleetRow[];
  query: string;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (key: SortKey) => void;
  onClear: () => void;
}) {
  const totals = rows.reduce(
    (acc, row) => ({
      identities: acc.identities + row.identities,
      routes: acc.routes + row.routes,
      cut: acc.cut + row.cut,
    }),
    { identities: 0, routes: 0, cut: 0 },
  );

  const ariaSort = (key: SortKey) =>
    sort.key === key ? (sort.dir === -1 ? "descending" : "ascending") : "none";

  return (
    <div className="fleet">
      <div className="table-scroll">
        <table>
          <caption className="sr-only">Fleet accounts, identities, routes and minimum-cut edges</caption>
          <thead>
            <tr>
              <th scope="col" className="account-col">Account</th>
              <th scope="col" aria-sort={ariaSort("identities")}>
                <button type="button" onClick={() => onSort("identities")}>
                  Identities <i>{sort.key === "identities" ? (sort.dir === -1 ? "↓" : "↑") : "↕"}</i>
                </button>
              </th>
              <th scope="col" aria-sort={ariaSort("routes")}>
                <button type="button" onClick={() => onSort("routes")}>
                  Routes <i>{sort.key === "routes" ? (sort.dir === -1 ? "↓" : "↑") : "↕"}</i>
                </button>
              </th>
              <th scope="col" aria-sort={ariaSort("cut")}>
                <button type="button" onClick={() => onSort("cut")}>
                  Cut <i>{sort.key === "cut" ? (sort.dir === -1 ? "↓" : "↑") : "↕"}</i>
                </button>
              </th>
              <th scope="col">Severity</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className={row.key === "games-studio" ? "focus" : undefined}>
                <th scope="row" className="account-col">
                  <span className={`mark ${row.severity}`} aria-hidden="true" />
                  <div>
                    <b>{row.short}</b>
                    <span>{row.key} / {row.accountId}</span>
                  </div>
                </th>
                <td>{row.identities}</td>
                <td>{row.routes}</td>
                <td>{String(row.cut).padStart(2, "0")}</td>
                <td><span className={`sev ${row.severity}`}>{row.severity}</span></td>
                <td><span className={`state ${row.state}`}>{row.state}</span></td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 ? (
            <tfoot>
              <tr>
                <th scope="row">{rows.length} of 16 accounts</th>
                <td>{totals.identities}</td>
                <td>{totals.routes}</td>
                <td>{String(totals.cut).padStart(2, "0")}</td>
                <td colSpan={2}>Read-only / 0 writes</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {rows.length === 0 ? (
        <div className="fleet-empty">
          <p>No account matches &ldquo;{query}&rdquo;.</p>
          <button type="button" onClick={onClear}>Clear search</button>
        </div>
      ) : null}
    </div>
  );
}
