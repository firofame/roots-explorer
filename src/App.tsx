import RootsExplorer from "./RootsExplorer";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <div className="stars-bg" />
      <header className="app-header">
        <div className="logo-container">
          <span className="logo-icon">🌱</span>
          <h1>Understand what you recite in Salah</h1>
        </div>
        <p className="app-subtitle">
          Learn the most important Qur'anic roots one by one and track your progress toward understanding the vocabulary of your daily prayers.
        </p>
      </header>

      <main className="main-container">
        <RootsExplorer />
      </main>

      <footer className="app-footer">
        <p>Understand what you recite in Salah · Built with React, Vite & TypeScript</p>
      </footer>
    </div>
  );
}

export default App;
