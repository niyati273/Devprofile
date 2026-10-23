
import { useState } from "react";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("stars");

  async function searchGitHub(event) {
    event.preventDefault();

    const name = username.trim();
    if (!name) return;

    setLoading(true);
    setError("");
    setProfile(null);
    setRepos([]);

    try {
      const [profileResponse, reposResponse] = await Promise.all([
        fetch(`https://api.github.com/users/${encodeURIComponent(name)}`),
        fetch(
          `https://api.github.com/users/${encodeURIComponent(name)}/repos?per_page=100&sort=updated`
        ),
      ]);

      if (!profileResponse.ok) {
        throw new Error(
          profileResponse.status === 404
            ? "Username not found. Check the spelling and try again."
            : "GitHub couldn't load this profile. Please try again."
        );
      }

      if (!reposResponse.ok) {
        throw new Error("Couldn't load repositories. Please try again.");
      }

      const profileData = await profileResponse.json();
      const repoData = await reposResponse.json();

      setProfile(profileData);
      setRepos(repoData);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const sortedRepos = [...repos].sort((a, b) => {
    if (sort === "stars") return b.stargazers_count - a.stargazers_count;
    if (sort === "forks") return b.forks_count - a.forks_count;
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  const languages = repos.reduce((result, repo) => {
    if (repo.language) {
      result[repo.language] = (result[repo.language] || 0) + 1;
    }
    return result;
  }, {});

  const topLanguages = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalStars = repos.reduce(
    (total, repo) => total + repo.stargazers_count,
    0
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="DevProfile home">
          <span className="brand-icon">D</span>
          <span>dev<span className="brand-light">profile</span></span>
        </a>

        <p className="nav-label">WORKSPACE</p>
        <div className="nav-item active">▦ &nbsp; Overview</div>
        <div className="nav-item">⌘ &nbsp; Repositories</div>
        <div className="nav-item">◉ &nbsp; Language insights</div>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <span>Powered by GitHub API</span>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <span className="breadcrumb">Workspace / Overview</span>
          <span className="live-label"><span /> LIVE DATA</span>
        </header>

        <section className="welcome">
          <p className="eyebrow">DEVELOPER INTELLIGENCE</p>
          <h1>Understand the code<br />behind the <span>profile.</span></h1>
          <p className="subtitle">
            Explore GitHub profiles, discover standout repositories,
            and uncover developer activity through data.
          </p>

          <form className="search-form" onSubmit={searchGitHub}>
            <span className="search-icon">⌕</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter a GitHub username..."
              aria-label="GitHub username"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Analyzing..." : "Analyze profile →"}
            </button>
          </form>
          <p className="search-hint">Try a public profile, such as torvalds or gaearon.</p>
        </section>

        {error && <div className="error-message">{error}</div>}

        {loading && (
          <div className="loading-panel">
            <div className="spinner" />
            Fetching profile and repository data...
          </div>
        )}

        {profile && !loading && (
          <>
            <section className="profile-card">
              <img src={profile.avatar_url} alt="" className="avatar" />
              <div className="profile-info">
                <p className="eyebrow">GITHUB DEVELOPER</p>
                <h2>{profile.name || profile.login}</h2>
                <p className="handle">@{profile.login}</p>
                <p className="bio">{profile.bio || "No public bio provided."}</p>
                <div className="profile-links">
                  {profile.location && <span>⌖ {profile.location}</span>}
                  <a href={profile.html_url} target="_blank" rel="noreferrer">
                    View GitHub ↗
                  </a>
                </div>
              </div>
              <div className="joined">
                JOINED
                <strong>{new Date(profile.created_at).getFullYear()}</strong>
              </div>
            </section>

            <section className="stats-grid">
              <Stat label="PUBLIC REPOS" value={profile.public_repos} icon="▤" />
              <Stat label="FOLLOWERS" value={profile.followers} icon="◎" />
              <Stat label="FOLLOWING" value={profile.following} icon="↗" />
              <Stat label="TOTAL REPO STARS" value={totalStars} icon="☆" />
            </section>

            <section className="insights-grid">
              <div className="panel language-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">CODE BREAKDOWN</p>
                    <h3>Language insights</h3>
                  </div>
                  <span className="panel-icon">◉</span>
                </div>

                {topLanguages.length ? (
                  topLanguages.map(([language, count]) => {
                    const percentage = Math.round((count / Math.max(repos.length, 1)) * 100);
                    return (
                      <div className="language-row" key={language}>
                        <div className="language-label">
                          <span>{language}</span>
                          <span>{count} repos · {percentage}%</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="muted">No language data available.</p>
                )}
                <p className="footnote">Based on primary languages of fetched public repositories.</p>
              </div>

              <div className="panel highlight-panel">
                <p className="eyebrow">TOP PROJECT</p>
                {sortedRepos[0] ? (
                  <>
                    <h3>{sortedRepos[0].name}</h3>
                    <p className="muted">
                      {sortedRepos[0].description || "No description provided."}
                    </p>
                    <div className="project-stats">
                      <span>☆ {sortedRepos[0].stargazers_count} stars</span>
                      <span>⑂ {sortedRepos[0].forks_count} forks</span>
                    </div>
                    <a
                      className="text-link"
                      href={sortedRepos[0].html_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Explore repository ↗
                    </a>
                  </>
                ) : (
                  <p className="muted">No public repositories found.</p>
                )}
              </div>
            </section>

            <section className="repositories-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PROJECT PORTFOLIO</p>
                  <h2>Repositories <span className="count">{repos.length}</span></h2>
                </div>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="stars">Most stars</option>
                  <option value="forks">Most forks</option>
                  <option value="updated">Recently updated</option>
                </select>
              </div>

              <div className="repo-grid">
                {sortedRepos.slice(0, 12).map((repo) => (
                  <a
                    className="repo-card"
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    key={repo.id}
                  >
                    <div className="repo-title">
                      <span className="repo-symbol">⌘</span>
                      <span>{repo.name}</span>
                      <span className="external">↗</span>
                    </div>
                    <p>{repo.description || "No description provided."}</p>
                    <div className="repo-meta">
                      <span>{repo.language || "Other"}</span>
                      <span>☆ {repo.stargazers_count}</span>
                      <span>⑂ {repo.forks_count}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </>
        )}

        {!profile && !loading && !error && (
          <section className="empty-state">
            <div className="empty-icon">⌘</div>
            <h3>Your next discovery starts here.</h3>
            <p>Search for a GitHub developer to reveal their public coding portfolio.</p>
          </section>
        )}

        <footer>DE VPROFILE · BUILT FOR THE CURIOUS DEVELOPER</footer>
      </section>
    </main>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong>{value.toLocaleString()}</strong>
    </div>
  );
}

export default App;
