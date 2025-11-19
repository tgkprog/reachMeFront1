import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}

// Hot Module Replacement (CRA/Webpack style)
declare const module: any;
if (module && module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    if (container) {
      const nextRoot = ReactDOM.createRoot(container);
      nextRoot.render(<NextApp />);
    }
  });
}
