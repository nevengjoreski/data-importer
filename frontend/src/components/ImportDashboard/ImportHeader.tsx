import React from 'react';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

interface ImportHeaderProps {
    isImporting: boolean;
    onStartImport: () => void;
}

export const ImportHeader: React.FC<ImportHeaderProps> = ({ isImporting, onStartImport }) => {
    return (
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Dashboard</h1>
                <p className="text-gray-500">Manage and monitor data imports with real-time tracking</p>
            </div>
            <Button
                onClick={onStartImport}
                disabled={isImporting}
                size="lg"
                className="min-w-[200px]"
            >
                {isImporting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                    </>
                ) : (
                    'Start Import (1000 Records)'
                )}
            </Button>
        </div>
    );
};
