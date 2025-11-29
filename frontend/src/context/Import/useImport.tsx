import { useContext } from "react";
import { ImportContext } from "./ImportContext";

export const useImport = () => {
    const context = useContext(ImportContext);
    if (context === undefined) {
        throw new Error('useImport must be used within an ImportProvider');
    }
    return context;
};