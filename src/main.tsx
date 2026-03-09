import React from 'react';
import ReactDOM from 'react-dom/client';
import router from './router';
import { RouterProvider } from 'react-router-dom';
import { StoreProvider } from './store/store';
import { ThemeProvider } from './lib/theme/ThemeProvider';

import 'leaflet/dist/leaflet.css';
import './styles/tailwind.css';
import './styles/Base.scss';
import './styles/Ui.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
