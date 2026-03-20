import { RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { Toaster } from 'sonner'
import { store, persistor } from '@/store/store'
import router from '@/routes'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorBoundary from '@/components/common/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingSpinner className="h-screen" size="lg" />} persistor={persistor}>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors closeButton duration={3000} />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  )
}

export default App
