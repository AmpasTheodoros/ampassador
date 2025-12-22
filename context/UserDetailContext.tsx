"use client";

import { createContext, useContext } from "react";

interface UserDetail {
  id: string;
  clerkUserId: string;
  clerkOrgId: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserDetailContextType {
  userDetail: UserDetail | null | undefined;
  setUserDetail: (user: UserDetail | null) => void;
}

export const UserDetailContext = createContext<UserDetailContextType | undefined>(undefined);

export function useUserDetail() {
  const context = useContext(UserDetailContext);
  if (context === undefined) {
    throw new Error("useUserDetail must be used within a UserDetailContext.Provider");
  }
  return context;
}
