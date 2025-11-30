import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImportPage } from './pages/import/Import.page';
import './lib/i18n';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ImportPage />
    </QueryClientProvider>
  );
}

export default App;
