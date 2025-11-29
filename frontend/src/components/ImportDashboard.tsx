import React from 'react';
import { ImportStats } from './ImportDashboard/ImportStats';
import { ImportProgress } from './ImportDashboard/ImportProgress';
import { ImportErrors } from './ImportDashboard/ImportErrors';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useImport } from '../context/Import/useImport';

export const ImportDashboard: React.FC = () => {
    const { activeJob, isImporting, error, startImport, clearRecords, clearStatus } = useImport();

    const handleClearRecords = async () => {
        if (globalThis.confirm('Are you sure you want to clear all records? This action cannot be undone.')) {
            await clearRecords();
        }
    };


    return (
        <div id="import-dashboard" className="space-y-6 p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex gap-2">
                    {!activeJob && !isImporting && (
                        <>
                            <Button onClick={startImport}>
                                Start Import
                            </Button>
                            <Button onClick={handleClearRecords} variant="outline">
                                Clear Records
                            </Button>
                        </>
                    )}
                    {(activeJob || isImporting) && (
                        <Button onClick={clearStatus} variant="destructive">
                            Back to Dashboard
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {activeJob ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Import Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ImportProgress job={activeJob} />
                            </CardContent>
                        </Card>

                        <div>
                            <ImportStats job={activeJob} />
                        </div>
                    </div>

                    <div className="w-full">
                        <ImportErrors errors={activeJob.errors} />
                    </div>
                </div>
            ) : (
                !isImporting && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Content Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                                    Chart Placeholder
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Content by Category</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                                    Chart Placeholder
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            )}
        </div>
    );
};
