import { createContext } from "react";

export type HistoryContextType = {
    canUndo: boolean;
    onUndo: () => void;
};

export const HistoryContext = createContext<HistoryContextType>({
    canUndo: false,
    onUndo: () => {},
});

