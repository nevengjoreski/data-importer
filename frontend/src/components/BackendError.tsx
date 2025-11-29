import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

interface BackendErrorProps {
    onRetry: () => void;
    isRetrying?: boolean;
}

export const BackendError: React.FC<BackendErrorProps> = ({ onRetry, isRetrying = false }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-red-100">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-4">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">Connection Error</CardTitle>
                    <CardDescription className="text-gray-500 mt-2">
                        We couldn't connect to the server. Please check your internet connection or try again later.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-red-50 border border-red-100 rounded-md p-3 text-sm text-red-800 text-center">
                        Backend service is unreachable
                    </div>
                </CardContent>
                <CardFooter className="justify-center pt-2">
                    <Button
                        onClick={onRetry}
                        disabled={isRetrying}
                        className="w-full sm:w-auto min-w-[120px]"
                    >
                        {isRetrying ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Retrying...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retry Connection
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};
