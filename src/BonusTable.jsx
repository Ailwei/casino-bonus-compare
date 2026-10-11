const casinoDetails = {
  "10bet": { initials: "10", className: "tenbet", subtitle: "WELCOME OFFER" },
  "Mzansibet": { initials: "MZ", className: "mzansi", subtitle: "WELCOME OFFER" },
  "Easybet": { initials: "EZ", className: "easybet", subtitle: "WELCOME OFFER" },
};

const NOT_STATED = "Not stated";

// Only allow http(s) links; anything else renders without an href.
function safeUrl(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function formatMoney(amount, currency) {
  if (amount == null) return NOT_STATED;
  const value = Number(amount).toLocaleString("en-ZA");
  return currency ? `${currency} ${value}` : value;
}

function formatWagering(value) {
  return value == null ? NOT_STATED : `${value}×`;
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
              <div className="bonus-value">{casino.welcome_bonus || NOT_STATED}</div>

              <div className="metrics">
                <div className="metric">
                  <span className="metric-label">WAGERING</span>
                  <strong>{formatWagering(casino.wagering_requirement)}</strong>
                </div>
                <div className="metric">
                  <span className="metric-label">MIN. DEPOSIT</span>
                  <strong>{formatMoney(casino.min_deposit, casino.currency)}</strong>
                </div>
              </div>

              <a
                className="source-link"
                href={safeUrl(casino.source_url)}
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
                <td>{casino.welcome_bonus || NOT_STATED}</td>
                <td>{formatWagering(casino.wagering_requirement)}</td>
                <td>{formatMoney(casino.min_deposit, casino.currency)}</td>
                <td>
                  <a
                    href={safeUrl(casino.source_url)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View source ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="terms-note">
        Wagering requirements and other conditions can differ by game or by part
        of an offer. Check the linked source and the casino's own terms for the
        full details.
      </p>
    </section>
  );
}