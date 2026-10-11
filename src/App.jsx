import { useEffect, useState } from "react";
import BonusTable from "./BonusTable";

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}bonuses.json`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load bonus data.");
        return response.json();
      })
      .then(setData)
      .catch(() => setError("Unable to load bonus data. Please try again later."));
  }, []);

  const count = data?.casinos?.length ?? 0;

  let updated = "LOADING";
  if (error) updated = "UNAVAILABLE";
  else if (data?.scraped_at) {
    updated = new Date(data.scraped_at).toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Johannesburg",
    });
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <a className="brand" href={import.meta.env.BASE_URL}>
          <span className="brand-mark">B</span>
          <span>Bonus<span className="brand-light">Index</span></span>
        </a>
        <span className="live-label">DAILY UPDATE</span>
      </nav>

      <section className="hero">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          SOUTH AFRICA · CASINO BONUSES
        </div>
        <h1>Compare bonuses.<br /><span>Know the terms.</span></h1>
        <p className="hero-copy">
          A straightforward comparison of welcome offers, wagering requirements
          and minimum deposits. Always check the full terms before signing up.
        </p>
        <div className="hero-meta">
          <span><span className="live-dot" /> {count} OFFERS TRACKED</span>
          <span className="meta-divider" />
          <span>UPDATED {updated}</span>
        </div>
      </section>

      {error ? (
        <p className="error-message">{error}</p>
      ) : !data ? (
        <p className="loading-message">Loading comparison data...</p>
      ) : (
        <BonusTable casinos={data.casinos || []} />
      )}

      <footer className="footer">
        <div className="footer-brand">BonusIndex<span>.</span></div>
        <p>
          For comparison purposes only. Figures are extracted automatically and
          may be wrong or out of date. Offers and eligibility may change.
          Verify all terms directly with each casino.
        </p>
        <p className="footer-bottom">
          18+ ONLY · SOURCES ARE LINKED TO EACH OFFER · PLAY RESPONSIBLY
        </p>
      </footer>
    </main>
  );
}