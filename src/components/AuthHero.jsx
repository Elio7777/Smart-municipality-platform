// Shared red-skyline hero panel used by login / register / admin-login.
// Tagline + stats are passed in so each page keeps its original copy.

export default function AuthHero({ tagline, accent, subtitle, stats }) {
  return (
    <div className="auth-hero">
      <div className="hero-logo">
        <span className="logo-mark"></span>
        Smart Municipality
      </div>

      <div className="hero-skyline">
        <svg viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="240" cy="36" r="32" fill="#E11D2E" opacity="0.15" />
          <circle cx="240" cy="36" r="22" fill="#E11D2E" opacity="0.85" />

          <rect x="10" y="120" width="36" height="80" fill="#1F1F1F" stroke="#E11D2E" strokeWidth="1" />
          <rect x="50" y="90" width="42" height="110" fill="#262626" stroke="#E11D2E" strokeWidth="1" />
          <rect x="96" y="60" width="50" height="140" fill="#1F1F1F" stroke="#E11D2E" strokeWidth="1" />
          <rect x="150" y="100" width="38" height="100" fill="#262626" stroke="#E11D2E" strokeWidth="1" />
          <rect x="192" y="80" width="40" height="120" fill="#1F1F1F" stroke="#E11D2E" strokeWidth="1" />
          <rect x="236" y="130" width="34" height="70" fill="#262626" stroke="#E11D2E" strokeWidth="1" />

          <rect x="18" y="130" width="6" height="6" fill="#E11D2E" />
          <rect x="32" y="130" width="6" height="6" fill="#E11D2E" />
          <rect x="18" y="148" width="6" height="6" fill="#E11D2E" />
          <rect x="32" y="148" width="6" height="6" fill="#E11D2E" />
          <rect x="18" y="166" width="6" height="6" fill="#E11D2E" />
          <rect x="32" y="166" width="6" height="6" fill="#E11D2E" />

          <rect x="58" y="100" width="6" height="6" fill="#E11D2E" />
          <rect x="72" y="100" width="6" height="6" fill="#E11D2E" />
          <rect x="58" y="118" width="6" height="6" fill="#E11D2E" />
          <rect x="72" y="118" width="6" height="6" fill="#E11D2E" />
          <rect x="58" y="136" width="6" height="6" fill="#E11D2E" />
          <rect x="72" y="136" width="6" height="6" fill="#E11D2E" />
          <rect x="58" y="154" width="6" height="6" fill="#E11D2E" />
          <rect x="72" y="154" width="6" height="6" fill="#E11D2E" />

          <rect x="106" y="72" width="7" height="7" fill="#E11D2E" />
          <rect x="122" y="72" width="7" height="7" fill="#E11D2E" />
          <rect x="136" y="72" width="7" height="7" fill="#E11D2E" />
          <rect x="106" y="92" width="7" height="7" fill="#E11D2E" />
          <rect x="122" y="92" width="7" height="7" fill="#E11D2E" />
          <rect x="136" y="92" width="7" height="7" fill="#E11D2E" />
          <rect x="106" y="112" width="7" height="7" fill="#E11D2E" />
          <rect x="122" y="112" width="7" height="7" fill="#E11D2E" />
          <rect x="136" y="112" width="7" height="7" fill="#E11D2E" />
          <rect x="106" y="132" width="7" height="7" fill="#E11D2E" />
          <rect x="122" y="132" width="7" height="7" fill="#E11D2E" />
          <rect x="136" y="132" width="7" height="7" fill="#E11D2E" />

          <rect x="158" y="112" width="6" height="6" fill="#E11D2E" />
          <rect x="172" y="112" width="6" height="6" fill="#E11D2E" />
          <rect x="158" y="130" width="6" height="6" fill="#E11D2E" />
          <rect x="172" y="130" width="6" height="6" fill="#E11D2E" />
          <rect x="158" y="148" width="6" height="6" fill="#E11D2E" />
          <rect x="172" y="148" width="6" height="6" fill="#E11D2E" />

          <rect x="200" y="92" width="6" height="6" fill="#E11D2E" />
          <rect x="214" y="92" width="6" height="6" fill="#E11D2E" />
          <rect x="200" y="110" width="6" height="6" fill="#E11D2E" />
          <rect x="214" y="110" width="6" height="6" fill="#E11D2E" />
          <rect x="200" y="128" width="6" height="6" fill="#E11D2E" />
          <rect x="214" y="128" width="6" height="6" fill="#E11D2E" />
          <rect x="200" y="146" width="6" height="6" fill="#E11D2E" />
          <rect x="214" y="146" width="6" height="6" fill="#E11D2E" />

          <rect x="244" y="142" width="6" height="6" fill="#E11D2E" />
          <rect x="258" y="142" width="6" height="6" fill="#E11D2E" />
          <rect x="244" y="160" width="6" height="6" fill="#E11D2E" />
          <rect x="258" y="160" width="6" height="6" fill="#E11D2E" />

          <line x1="0" y1="200" x2="280" y2="200" stroke="#E11D2E" strokeWidth="2" />
        </svg>
      </div>

      <div className="hero-bottom">
        <p className="hero-tagline">
          {tagline} <span className="accent">{accent}</span>
        </p>
        <p className="hero-subtitle">{subtitle}</p>

        <div className="hero-stats">
          {stats.map((s, i) => (
            <div key={i}>
              <p className="hero-stat-value">{s.value}</p>
              <p className="hero-stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
