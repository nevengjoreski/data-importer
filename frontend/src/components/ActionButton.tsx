import React from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface ActionButtonProps {
    onClick: () => void;
    disabled: boolean;
    isLoading?: boolean;
    loadingText: string;
    children: React.ReactNode;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    onClick,
    disabled,
    isLoading = false,
    loadingText,
    children,
    variant = 'default',
    size = 'default',
    className,
}) => {
    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            variant={variant}
            size={size}
            className={className}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText}
                </>
            ) : (
                children
            )}
        </Button>
    );
};
