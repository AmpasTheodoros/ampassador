"use client";

import React, { useEffect, useState } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { UserDetailContext } from "@/context/UserDetailContext";
import { OnSaveContext } from "@/context/OnSaveContext";

interface UserDetail {
  id: string;
  clerkUserId: string;
  clerkOrgId: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function Provider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const [userDetail, setUserDetail] = useState<UserDetail | null | undefined>(undefined);
  const [onSaveData, setOnSaveData] = useState<any>(null);

  useEffect(() => {
    // Only sync when both user and org are loaded
    if (userLoaded && orgLoaded && user) {
      syncUser();
    }
  }, [user, userLoaded, orgLoaded, organization?.id]);

  const syncUser = async () => {
    try {
      // Only sync if user is authenticated
      if (!user) {
        setUserDetail(null);
        return;
      }

      // If user is not in an organization, set userDetail to null
      if (!organization?.id) {
        setUserDetail(null);
        return;
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to sync user:", await response.text());
        return;
      }

      const data = await response.json();
      
      if (data.user) {
        setUserDetail(data.user);
      } else {
        setUserDetail(null);
      }
    } catch (error) {
      console.error("Error syncing user:", error);
      // Don't set to null on error, keep previous state
    }
  };

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <OnSaveContext.Provider value={{ onSaveData, setOnSaveData }}>
        {children}
      </OnSaveContext.Provider>
    </UserDetailContext.Provider>
  );
}

export default Provider;