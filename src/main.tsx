import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './scene.css';
import './mobile.css';
import { PwaStatus } from './components/PwaStatus';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <PwaStatus />
  </React.StrictMode>,
);
