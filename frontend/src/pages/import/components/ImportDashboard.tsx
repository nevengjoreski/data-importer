import React from 'react';
import { useImport } from '../../../features/import/context/useImport';
import { ImportEmptyState } from './ImportEmptyState';
import { ImportErrors } from './ImportErrors';
import { ImportHeader } from './ImportHeader';
import { ImportProgress } from './ImportProgress';
import { ImportStats } from './ImportStats';

export const ImportDashboard: React.FC = () => {
    const { activeJob, isImporting, isClearing, startImport, startEnterpriseImport, startEnterpriseStreamImport, clearRecords } = useImport();

    return (
        <div id="import-dashboard" className="p-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <ImportHeader
                    isImporting={isImporting}
                    isClearing={isClearing}
                    onStartImport={startImport}
                    onStartEnterpriseImport={startEnterpriseImport}
                    onStartEnterpriseStreamImport={startEnterpriseStreamImport}
                    onClearRecords={clearRecords}
                />

                {activeJob ?
                    (
                        <div className="space-y-8">
                            <ImportProgress job={activeJob} />
                            <ImportStats job={activeJob} />
                            <ImportErrors errors={activeJob.errors} />
                        </div>
                    ) : (
                        <ImportEmptyState />
                    )}
            </div>
        </div>
    );
};

