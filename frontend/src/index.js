import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Aplicar tema oscuro por defecto
document.documentElement.classList.add('dark-theme');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
