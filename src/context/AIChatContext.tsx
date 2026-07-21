import React, { createContext, useContext, ReactNode } from 'react';
import { useAIChat } from '../components/AIChatWidget';
import { AIChatWidget } from '../components/AIChatWidget';

interface AIChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: { children: ReactNode }) {
  const chat = useAIChat(false);

  return (
    <AIChatContext.Provider value={chat}>
      {children}
      <AIChatWidget
        isOpen={chat.isOpen}
        onOpenChange={chat.setIsOpen}
      />
    </AIChatContext.Provider>
  );
}

export function useAIChatContext() {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error('useAIChatContext must be used within an AIChatProvider');
  }
  return context;
}
