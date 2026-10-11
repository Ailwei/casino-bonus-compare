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

  return (
    <main className="app-shell">
      <nav className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">B</span>
          <span>Bonus<span className="brand-light">Index</span></span>
        </a>
        <span className="live-label">
          <span className="live-dot" /> DATA COMPARISON
        </span>
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
          <span><span className="live-dot" /> THREE OFFERS TRACKED</span>
          <span className="meta-divider" />
          <span>
            UPDATED{" "}
            {data?.scraped_at
              ? new Date(data.scraped_at).toLocaleString("en-ZA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Africa/Johannesburg",
                })
              : "LOADING"}
          </span>
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
          For comparison purposes only. Offers and eligibility may change.
          Verify all terms directly with each casino.
        </p>
        <p className="footer-bottom">SOURCES ARE LINKED TO EACH OFFER · PLAY RESPONSIBLY</p>
      </footer>
    </main>
  );
}