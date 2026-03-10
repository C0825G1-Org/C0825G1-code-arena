import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './app/App.jsx'
import { store } from './app/store'
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from './shared/context/NotificationContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <NotificationProvider>
        <App />
        <Toaster
          position="top-right"
          containerStyle={{ top: 72, right: 24 }}
          toastOptions={{ style: { zIndex: 9999 } }}
        />
      </NotificationProvider>
    </Provider>
  </StrictMode>,
)
