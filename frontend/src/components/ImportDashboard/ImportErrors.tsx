import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

import { ImportJob } from '../../types/import';
import { AlertCircle } from 'lucide-react';

interface ImportErrorsProps {
    errors?: ImportJob['errors'];
}

export const ImportErrors: React.FC<ImportErrorsProps> = ({ errors }) => {
    if (!errors || errors.length === 0) return null;

    return (
        <Card className="border-destructive/50">
            <CardHeader className="bg-destructive/10 pb-4">
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-destructive">Import Errors ({errors.length})</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="rounded-md border max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">#</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Record Data</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Error Message</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {errors.slice(0, 100).map((err, index) => (
                                <tr key={err.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <td className="p-4 align-middle font-medium">{index + 1}</td>
                                    <td className="p-4 align-middle font-mono text-xs">
                                        <div className="max-w-[300px] truncate bg-muted p-1 rounded" title={err.record_data}>
                                            {err.record_data}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <span className="inline-flex items-center rounded-full border border-destructive/50 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                            {err.error_message}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {errors.length > 100 && (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center text-muted-foreground text-sm italic">
                                        ... and {errors.length - 100} more errors not shown.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};
