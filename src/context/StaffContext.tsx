"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface StaffContextType {
  previewData: boolean;
  setPreviewData: (val: boolean | ((prev: boolean) => boolean)) => void;
  branch: string;
  setBranch: (b: string) => void;
  transactionModalOpen: boolean;
  setTransactionModalOpen: (open: boolean) => void;
  staffGuideOpen: boolean;
  setStaffGuideOpen: (open: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  notifications: Array<{
    id: string;
    title: string;
    time: string;
    type: "info" | "warning" | "success";
    read: boolean;
  }>;
  markNotificationsAsRead: () => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [previewData, setPreviewData] = useState<boolean>(false);
  const [branch, setBranch] = useState<string>("Central Library (New Delhi · Main branch)");
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [staffGuideOpen, setStaffGuideOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "12 loans are overdue today. Automated reminders queued.",
      time: "10 mins ago",
      type: "warning" as const,
      read: false,
    },
    {
      id: "2",
      title: "Reservation ready: 'India After Gandhi' awaiting pickup by Rahul Verma.",
      time: "42 mins ago",
      type: "info" as const,
      read: false,
    },
    {
      id: "3",
      title: "Payment recorded: ₹250 cash receipt RCP-2026-1082 reconciled.",
      time: "2 hours ago",
      type: "success" as const,
      read: true,
    },
    {
      id: "4",
      title: "Catalogue sync: 24 new titles accessioned this morning.",
      time: "4 hours ago",
      type: "info" as const,
      read: true,
    },
  ]);

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <StaffContext.Provider
      value={{
        previewData,
        setPreviewData,
        branch,
        setBranch,
        transactionModalOpen,
        setTransactionModalOpen,
        staffGuideOpen,
        setStaffGuideOpen,
        notificationsOpen,
        setNotificationsOpen,
        notifications,
        markNotificationsAsRead,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error("useStaff must be used within a StaffProvider");
  }
  return context;
}
