// src/App.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="app-nav">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/users">User Testing</a></li>
          </ul>
        </nav>
        
        <main className="app-content">
          <AppRoutes />
        </main>
        
        <footer className="app-footer">
          <p>Course Explorer Demo Application</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;