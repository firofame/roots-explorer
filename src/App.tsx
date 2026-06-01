import RootsExplorer from "./RootsExplorer";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <div className="stars-bg" />
      <header className="app-header">
        <div className="logo-container">
          <span className="logo-icon">🌱</span>
          <h1>Quranic Roots Explorer</h1>
        </div>
        <p className="app-subtitle">
          Discover Quranic vocabulary, analyze root frequencies, and explore word morphology
        </p>
      </header>

      <main className="main-container">
        <RootsExplorer />
      </main>

      <footer className="app-footer">
        <p>Quranic Roots Explorer · Built with React, Vite & TypeScript</p>
      </footer>
    </div>
  );
}

export default App;
