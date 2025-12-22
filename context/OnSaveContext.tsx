"use client";

import { createContext, useContext } from "react";

interface OnSaveContextType {
  onSaveData: any;
  setOnSaveData: (data: any) => void;
}

export const OnSaveContext = createContext<OnSaveContextType | undefined>(undefined);

export function useOnSave() {
  const context = useContext(OnSaveContext);
  if (context === undefined) {
    throw new Error("useOnSave must be used within an OnSaveContext.Provider");
  }
  return context;
}
