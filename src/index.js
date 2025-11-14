// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './styles/tailwind.css';
import { AuthProvider } from './state/AuthContext';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>,
    rootElement
  );
} else {
  console.error('No se encontró el elemento root en el HTML.');
}
