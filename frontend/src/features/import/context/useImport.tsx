import { useContext } from "react";
import { ImportContext, ImportContextValue } from "./ImportContext";

export const useImport = (): ImportContextValue => {
    const context = useContext(ImportContext);
    if (context === undefined) {
        throw new Error('useImport must be used within an ImportProvider');
    }
    return context;
};