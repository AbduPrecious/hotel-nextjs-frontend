'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type AlertType = 'info' | 'success' | 'error' | 'warning';

interface ConfirmOptions {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType) => void;
  closeAlert: () => void;
  alertData: { message: string; type: AlertType; visible: boolean };
  showConfirm: (options: ConfirmOptions) => void;
  closeConfirm: () => void;
  confirmData: { visible: boolean; title: string; message: string; onConfirm: () => void; onCancel?: () => void };
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertData, setAlertData] = useState<{
    message: string;
    type: AlertType;
    visible: boolean;
  }>({
    message: '',
    type: 'info',
    visible: false,
  });

  const [confirmData, setConfirmData] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    visible: false,
    title: 'Confirm',
    message: '',
    onConfirm: () => {},
    onCancel: undefined,
  });

  const showAlert = (message: string, type: AlertType = 'info') => {
    setAlertData({ message, type, visible: true });
  };

  const closeAlert = () => {
    setAlertData((prev) => ({ ...prev, visible: false }));
  };

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmData({
      visible: true,
      title: options.title || 'Confirm',
      message: options.message,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  };

  const closeConfirm = () => {
    setConfirmData((prev) => ({ ...prev, visible: false }));
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        closeAlert,
        alertData,
        showConfirm,
        closeConfirm,
        confirmData,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}