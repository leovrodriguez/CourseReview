// src/App.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import Navbar from './components/common/Navbar';
import './styles/global.css';

function App() {
  return (
    <Router>
    <div className="app-container">
      <Navbar />
      
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