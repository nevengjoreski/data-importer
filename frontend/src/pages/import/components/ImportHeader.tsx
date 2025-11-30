import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../../../components/ActionButton';

interface ImportHeaderProps {
    isImporting: boolean;
    isClearing?: boolean;
    onStartImport: () => void;
    onStartEnterpriseImport?: () => void;
    onStartEnterpriseStreamImport?: () => void;
    onClearRecords?: () => void;
}

export const ImportHeader: React.FC<ImportHeaderProps> = ({
    isImporting,
    isClearing,
    onStartImport,
    onStartEnterpriseImport,
    onStartEnterpriseStreamImport,
    onClearRecords
}) => {
    const { t } = useTranslation();
    const isDisabled = isImporting || (isClearing ?? false);

    return (
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.header.title')}</h1>
                <p className="text-gray-500">{t('dashboard.header.subtitle')}</p>
            </div>
            <div className="flex gap-2">
                {onClearRecords && (
                    <ActionButton
                        onClick={onClearRecords}
                        disabled={isDisabled}
                        isLoading={isClearing}
                        loadingText={t('dashboard.clearing')}
                        variant="outline"
                        size="lg"
                    >
                        {t('dashboard.clearRecords')}
                    </ActionButton>
                )}
                {onStartEnterpriseImport && (
                    <ActionButton
                        onClick={onStartEnterpriseImport}
                        disabled={isDisabled}
                        isLoading={isImporting}
                        loadingText={t('dashboard.header.importing')}
                        variant="secondary"
                        size="lg"
                    >
                        Start Enterprise Import (Batch)
                    </ActionButton>
                )}
                {onStartEnterpriseStreamImport && (
                    <ActionButton
                        onClick={onStartEnterpriseStreamImport}
                        disabled={isDisabled}
                        isLoading={isImporting}
                        loadingText={t('dashboard.header.importing')}
                        variant="secondary"
                        size="lg"
                    >
                        Start Enterprise Import (Stream)
                    </ActionButton>
                )}
                <ActionButton
                    onClick={onStartImport}
                    disabled={isDisabled}
                    isLoading={isImporting}
                    loadingText={t('dashboard.header.importing')}
                    size="lg"
                    className="min-w-[200px]"
                >
                    {t('dashboard.header.startImport')}
                </ActionButton>
            </div>
        </div>
    );
};

