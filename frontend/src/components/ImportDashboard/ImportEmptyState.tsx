import React from 'react';
import { Card, CardContent } from '../ui/card';
import { UploadCloud } from 'lucide-react';

export const ImportEmptyState: React.FC = () => {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <UploadCloud className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No Active Import</h3>
                <p className="text-muted-foreground max-w-sm">
                    Click the "Start Import" button above to begin processing 1000 test records.
                </p>
            </CardContent>
        </Card>
    );
};
