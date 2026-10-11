const casinoDetails = {
  "10bet": { initials: "10", className: "tenbet", subtitle: "WELCOME OFFER" },
  "Mzansibet": { initials: "MZ", className: "mzansi", subtitle: "WELCOME OFFER" },
  "Easybet": { initials: "EZ", className: "easybet", subtitle: "WELCOME OFFER" },
};

function formatMoney(amount, currency) {
  if (amount == null) return "Not stated";
  return `${currency || "ZAR"} ${Number(amount).toLocaleString("en-ZA")}`;
}

export default function BonusTable({ casinos }) {
  return (
    <section className="comparison-section">
      <div className="section-heading">
        <div>
          <div className="section-kicker">THE LINEUP</div>
          <h2>Welcome offers</h2>
          <p>Compare the key details side by side.</p>
        </div>
        <span className="offer-count">
          {String(casinos.length).padStart(2, "0")} OFFERS
        </span>
      </div>

      <div className="bonus-grid">
        {casinos.map((casino) => {
          const details = casinoDetails[casino.name] || {
            initials: casino.name.slice(0, 2).toUpperCase(),
            className: "",
            subtitle: "WELCOME OFFER",
          };

          return (
            <article className="bonus-card" key={casino.name}>
              <div className="card-top">
                <div className={`casino-logo ${details.className}`}>
                  {details.initials}
                </div>
                <div className="casino-identity">
                  <h3>{casino.name}</h3>
                  <span>{details.subtitle}</span>
                </div>
                <span className="card-arrow" aria-hidden="true">↗</span>
              </div>

              <div className="bonus-label">WELCOME BONUS</div>
              <div className="bonus-value">{casino.welcome_bonus || "Not stated"}</div>

              <div className="metrics">
                <div className="metric">
                  <span className="metric-label">WAGERING</span>
                  <strong>{casino.wagering_requirement == null
                    ? "N/A"
                    : `${casino.wagering_requirement}×`}</strong>
                  {casino.name === "Easybet" && (
                    <span className="metric-note">Selected slots*</span>
                  )}
                </div>
                <div className="metric">
                  <span className="metric-label">MIN. DEPOSIT</span>
                  <strong>{formatMoney(casino.min_deposit, casino.currency)}</strong>
                </div>
              </div>

              <a
                className="source-link"
                href={casino.source_url}
                target="_blank"
                rel="noreferrer"
              >
                View source <span aria-hidden="true">↗</span>
              </a>
            </article>
          );
        })}
      </div>

      <div className="table-wrap">
        <div className="table-heading">
          <div>
            <div className="section-kicker">AT A GLANCE</div>
            <h2>Side-by-side comparison</h2>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>CASINO</th>
              <th>WELCOME BONUS</th>
              <th>WAGERING</th>
              <th>MIN. DEPOSIT</th>
              <th>SOURCE</th>
            </tr>
          </thead>
          <tbody>
            {casinos.map((casino) => (
              <tr key={casino.name}>
                <td className="table-casino">{casino.name}</td>
                <td>{casino.welcome_bonus || "Not stated"}</td>
                <td>
                  {casino.wagering_requirement == null
                    ? "N/A"
                    : `${casino.wagering_requirement}×`}
                  {casino.name === "Easybet" && " (selected slots*)"}
                </td>
                <td>{formatMoney(casino.min_deposit, casino.currency)}</td>
                <td>
                  <a href={casino.source_url} target="_blank" rel="noreferrer">
                    View source ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="terms-note">
        * Easybet's scraped source describes the 15× wagering requirement as
        applying to selected slots. Check the linked source for the full terms
        and any other conditions.
      </p>
    </section>
  );
}