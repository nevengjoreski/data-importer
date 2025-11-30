import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../../../components/ActionButton';
import { ArrowLeft } from 'lucide-react';
import { useImport } from '../../../features/import/context/useImport';

interface ImportHeaderProps {
    isImporting: boolean;
    isClearing?: boolean;
    onStartImport: () => void;
    onStartBatchImport?: () => void;
    onStartStreamImport?: () => void;
    onClearRecords?: () => void;
}

export const ImportHeader: React.FC<ImportHeaderProps> = ({
    isImporting,
    isClearing,
    onStartImport,
    onStartBatchImport,
    onStartStreamImport,
    onClearRecords
}) => {
    const { t } = useTranslation();
    const { clearStatus, activeJob } = useImport();

    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const isDisabled = isImporting || (isClearing ?? false);

    const handleClearClick = () => {
        setShowClearConfirm(true);
    };

    const handleClearConfirm = () => {
        setShowClearConfirm(false);
        onClearRecords?.();
    };

    const handleClearCancel = () => {
        setShowClearConfirm(false);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.header.title')}</h1>
                    <p className="text-gray-500">{t('dashboard.header.subtitle')}</p>
                </div>
                <div className="flex gap-2 flex-wrap">

                    {activeJob && (
                        <div className="flex justify-start">
                            <button
                                onClick={clearStatus}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {t('dashboard.progress.backToDashboard')}
                            </button>
                        </div>
                    )}

                    {onClearRecords && (
                        <ActionButton
                            onClick={handleClearClick}
                            disabled={isDisabled}
                            isLoading={isClearing}
                            loadingText={t('dashboard.clearing')}
                            variant="outline"
                            size="lg"
                        >
                            {t('dashboard.clearRecords')}
                        </ActionButton>
                    )}


                    <div className="flex gap-2">
                        <ActionButton
                            onClick={onStartImport}
                            disabled={isDisabled}
                            isLoading={isImporting}
                            loadingText={t('dashboard.header.importing')}
                            size="lg"
                        >
                            {t('dashboard.header.startImport')}
                        </ActionButton>
                        {onStartBatchImport && (
                            <ActionButton
                                onClick={onStartBatchImport}
                                disabled={isDisabled}
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
                                disabled={isDisabled}
                                isLoading={isImporting}
                                loadingText={t('dashboard.header.importing')}
                                variant="secondary"
                                size="lg"
                            >
                                {t('dashboard.header.startStreamImport')}
                            </ActionButton>
                        )}
                    </div>
                </div>
            </div>

            {showClearConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{t('dashboard.clearConfirm.title')}</h3>
                        <p className="text-gray-600 mb-6">{t('dashboard.clearConfirm.message')}</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleClearCancel}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                {t('dashboard.clearConfirm.cancel')}
                            </button>
                            <button
                                onClick={handleClearConfirm}
                                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                {t('dashboard.clearConfirm.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

