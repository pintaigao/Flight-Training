import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { StoreProvider } from './store/store';
import router from './router';
import { ThemeProvider } from './lib/theme/ThemeProvider';

import 'leaflet/dist/leaflet.css';
import './styles/tailwind.css';
import './styles/Base.scss';
import './styles/Ui.scss';
import { initRangeFill } from './lib/utils/rangeFill';

initRangeFill();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
