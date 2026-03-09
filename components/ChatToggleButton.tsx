"use client";
import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #f59e0b, #d97706)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 55,
        boxShadow: "0 4px 20px rgba(245, 158, 11, 0.4)",
      }}
    >
      <MessageSquare size={24} color="#000" />
    </motion.button>
  );
}
