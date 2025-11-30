import React, { useState } from 'react';
import { useImport } from '../../../features/import/context/useImport';
import { ImportEmptyState } from './ImportEmptyState';
import { ImportErrors } from './ImportErrors';
import { ImportHeader } from './ImportHeader';
import { ImportProgress } from './ImportProgress';
import { ImportStats } from './ImportStats';
import { ErrorCategory } from '../../../lib/error-categorizer';

export const ImportDashboard: React.FC = () => {
    const { activeJob, isImporting, isClearing, startImport, startBatchImport, startStreamImport, clearRecords } = useImport();
    const [selectedCategory, setSelectedCategory] = useState<ErrorCategory | null>(null);

    return (
        <div id="import-dashboard" className="p-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <ImportHeader
                    isImporting={isImporting}
                    isClearing={isClearing}
                    onStartImport={startImport}
                    onStartBatchImport={startBatchImport}
                    onStartStreamImport={startStreamImport}
                    onClearRecords={clearRecords}
                />

                {activeJob ?
                    (
                        <div className="space-y-8">
                            <ImportProgress job={activeJob} />
                            <ImportStats
                                job={activeJob}
                                selectedCategory={selectedCategory}
                                onSelectCategory={setSelectedCategory}
                            />
                            <ImportErrors
                                errors={activeJob.errors}
                                selectedCategory={selectedCategory}
                            />
                        </div>
                    ) : (
                        <ImportEmptyState />
                    )}
            </div>
        </div>
    );
};

