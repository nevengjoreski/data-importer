import { useState, useEffect } from 'react';
import { ImportDashboard } from './components/ImportDashboard';
import { ImportHistory } from './components/ImportHistory';
import { BackendError } from './components/BackendError';
import { ImportProvider } from './context/Import/ImportContext';

function App() {
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const checkHealth = async () => {
    try {
      setIsRetrying(true);
      const response = await fetch('http://localhost:4000/health');
      if (response.ok) {
        setIsBackendAvailable(true);
      } else {
        setIsBackendAvailable(false);
      }
    } catch (error) {
      setIsBackendAvailable(false);
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (isBackendAvailable === false) {
    return <BackendError onRetry={checkHealth} isRetrying={isRetrying} />;
  }

  // Optional: Loading state while checking health
  if (isBackendAvailable === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ImportProvider>
      <ImportHistory />
      <ImportDashboard />
    </ImportProvider>
  )
}

export default App
