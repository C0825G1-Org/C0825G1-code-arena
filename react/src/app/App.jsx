import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { router } from './router';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" theme="dark" />
    </>
  )
}

export default App
