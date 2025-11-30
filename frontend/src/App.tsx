import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImportPage } from './pages/import/Import.page';
import './lib/i18n';

import { Routes, Route, Navigate } from 'react-router-dom';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<ImportPage />} />
        <Route path="/import/:id" element={<ImportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
