import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ImportPage } from './Import.page';

import { useHealthCheck } from '../../features/import/queries/useImport.queries';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('../../features/import/queries/useImport.queries');
vi.mock('../../features/import/context/ImportContext', () => ({
    ImportProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('./components/ImportDashboard', () => ({
    ImportDashboard: () => <div data-testid="import-dashboard">Import Dashboard</div>
}));
vi.mock('./components/ImportHistory', () => ({
    ImportHistory: () => <div data-testid="import-history">Import History</div>
}));
vi.mock('../../components/BackendError', () => ({
    BackendError: ({ onRetry }: { onRetry: () => void }) => (
        <button onClick={onRetry} data-testid="retry-button">Retry</button>
    )
}));

describe('ImportPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show loader when loading', () => {
        (useHealthCheck as any).mockReturnValue({
            isLoading: true,
            isError: false,
            refetch: vi.fn()
        });

        render(
            <MemoryRouter>
                <ImportPage />
            </MemoryRouter>
        );
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show error component when health check fails', () => {
        (useHealthCheck as any).mockReturnValue({
            isLoading: false,
            isError: true,
            refetch: vi.fn()
        });

        render(
            <MemoryRouter>
                <ImportPage />
            </MemoryRouter>
        );
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('should show dashboard and history when health check succeeds', () => {
        (useHealthCheck as any).mockReturnValue({
            isLoading: false,
            isError: false,
            refetch: vi.fn()
        });

        render(
            <MemoryRouter>
                <ImportPage />
            </MemoryRouter>
        );
        expect(screen.getByTestId('import-dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('import-history')).toBeInTheDocument();
    });

    it('should handle retry', async () => {
        const refetchMock = vi.fn().mockResolvedValue({});
        (useHealthCheck as any).mockReturnValue({
            isLoading: false,
            isError: true,
            refetch: refetchMock
        });

        render(
            <MemoryRouter>
                <ImportPage />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByTestId('retry-button'));

        expect(refetchMock).toHaveBeenCalled();
    });
});
