import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { connectSocket } from './services/socket';

// Initialize socket connection
connectSocket();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
