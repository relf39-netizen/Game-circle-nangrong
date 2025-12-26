import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Application started successfully");
  } catch (err) {
    console.error("Critical Render Failure:", err);
    container.innerHTML = `<div style="padding:40px; text-align:center; color:#ef4444; background: #fef2f2; border: 1px solid #fee2e2; margin: 20px; border-radius: 12px;">
      <h3 style="margin-bottom: 10px; font-weight: bold;">System Render Error</h3>
      <p>${String(err)}</p>
    </div>`;
  }
} else {
  console.error("Root container not found in DOM");
}