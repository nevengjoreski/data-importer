import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { ActionButton } from '../../../components/ActionButton';
import { useImport } from '../../../features/import/context/useImport';

// --- Types ---

interface ImportHeaderProps {
    isImporting: boolean;
    isClearing?: boolean;
    onStartBatchImport?: () => void;
    onStartStreamImport?: () => void;
    onClearRecords?: () => void;
}

interface ConfirmationModalProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

// --- Sub-Components ---

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onCancel, onConfirm }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-4 text-gray-900">
                    <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold">{t('dashboard.clearConfirm.title')}</h3>
                </div>

                <p className="text-gray-600 mb-6 leading-relaxed">
                    {t('dashboard.clearConfirm.message')}
                </p>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-gray-300"
                    >
                        {t('dashboard.clearConfirm.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    >
                        {t('dashboard.clearConfirm.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export const ImportHeader: React.FC<ImportHeaderProps> = ({
    isImporting,
    isClearing = false,
    onStartBatchImport,
    onStartStreamImport,
    onClearRecords
}) => {
    const { t } = useTranslation();
    const { clearStatus, activeJob } = useImport();
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Memoize handlers to prevent unnecessary re-renders if passed down
    const handleClearClick = useCallback(() => setShowClearConfirm(true), []);
    const handleClearCancel = useCallback(() => setShowClearConfirm(false), []);

    const handleClearConfirm = useCallback(() => {
        setShowClearConfirm(false);
        onClearRecords?.();
    }, [onClearRecords]);

    const globalDisabled = isImporting || isClearing;

    return (
        <>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('dashboard.header.title')}
                    </h1>
                    <p className="text-gray-500">
                        {t('dashboard.header.subtitle')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Navigation Action */}
                    {activeJob && (
                        <button
                            onClick={clearStatus}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t('dashboard.progress.backToDashboard')}
                        </button>
                    )}

                    {/* Destructive Action */}
                    {onClearRecords && (
                        <ActionButton
                            onClick={handleClearClick}
                            disabled={globalDisabled}
                            isLoading={isClearing}
                            loadingText={t('dashboard.clearing')}
                            variant="outline"
                            size="lg"
                            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                        >
                            {t('dashboard.clearRecords')}
                        </ActionButton>
                    )}

                    {/* Primary Import Actions */}
                    <div className="flex gap-2">
                        {onStartBatchImport && (
                            <ActionButton
                                onClick={onStartBatchImport}
                                disabled={globalDisabled}
                                isLoading={isImporting}
                                loadingText={t('dashboard.header.importing')}
                                variant="secondary"
                                size="lg"
                            >
                                {t('dashboard.header.startBatchImport')}
                            </ActionButton>
                        )}

                        {onStartStreamImport && (
                            <ActionButton
                                onClick={onStartStreamImport}
                                disabled={globalDisabled}
                                isLoading={isImporting}
                                loadingText={t('dashboard.header.importing')}
                                variant="default" // Changed to default/primary for visual distinction
                                size="lg"
                            >
                                {t('dashboard.header.startStreamImport')}
                            </ActionButton>
                        )}
                    </div>
                </div>
            </header>

            <ConfirmationModal
                isOpen={showClearConfirm}
                onCancel={handleClearCancel}
                onConfirm={handleClearConfirm}
            />
        </>
    );
};