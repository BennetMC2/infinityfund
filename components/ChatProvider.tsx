"use client";
import { useState } from "react";
import ChatToggleButton from "@/components/ChatToggleButton";
import ChatPanel from "@/components/ChatPanel";

export default function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {children}
      {!isOpen && <ChatToggleButton onClick={() => setIsOpen(true)} />}
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
