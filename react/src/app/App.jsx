import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { router } from './router';
import { NotificationProvider } from '../shared/context/NotificationContext';

function App() {
  return (
    <>
      <RouterProvider
        router={router}
        future={{ v7_startTransition: true }}
      />
      <ToastContainer position="top-right" theme="dark" />
    </>
  )
}

export default App
