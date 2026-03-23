"use client";
import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Send, ImagePlus } from "lucide-react";

interface ImageAttachment {
  data: string;
  mediaType: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: ImageAttachment[];
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  function flushList() {
    if (listItems.length === 0) return;
    const Tag = listOrdered ? "ol" : "ul";
    elements.push(
      <Tag
        key={`list-${elements.length}`}
        style={{
          margin: "4px 0",
          paddingLeft: 20,
          ...(listOrdered ? {} : { listStyleType: "disc" }),
        }}
      >
        {listItems.map((item, i) => (
          <li key={i} style={{ marginBottom: 2 }}>
            {renderInline(item)}
          </li>
        ))}
      </Tag>
    );
    listItems = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ulMatch = line.match(/^[-*]\s+(.*)/);
    const olMatch = line.match(/^\d+\.\s+(.*)/);

    if (ulMatch) {
      if (listOrdered && listItems.length) flushList();
      listOrdered = false;
      listItems.push(ulMatch[1]);
    } else if (olMatch) {
      if (!listOrdered && listItems.length) flushList();
      listOrdered = true;
      listItems.push(olMatch[1]);
    } else {
      flushList();
      if (line.trim() === "") {
        if (i > 0 && i < lines.length - 1) {
          elements.push(<div key={`br-${i}`} style={{ height: 8 }} />);
        }
      } else {
        elements.push(
          <p key={`p-${i}`} style={{ margin: 0 }}>
            {renderInline(line)}
          </p>
        );
      }
    }
  }
  flushList();
  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ fontWeight: 600 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function ChatPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [stagedImages, setStagedImages] = useState<ImageAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) textareaRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    function handleEsc(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  function readFilesAsImages(files: FileList | File[]) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        setStagedImages((prev) => [...prev, { data: base64, mediaType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      readFilesAsImages(imageFiles);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if ((!text && stagedImages.length === 0) || streaming) return;

    const images = stagedImages.length > 0 ? [...stagedImages] : undefined;
    const userMsg: Message = { role: "user", content: text, images };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStagedImages([]);
    setStreaming(true);

    try {
      const apiMessages = newMessages.map((m) => {
        if (m.images && m.images.length > 0) {
          const content: Array<
            | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
            | { type: "text"; text: string }
          > = [
            ...m.images.map((img) => ({
              type: "image" as const,
              source: { type: "base64" as const, media_type: img.mediaType, data: img.data },
            })),
            { type: "text" as const, text: m.content || "What do you see in this image?" },
          ];
          return { role: m.role, content };
        }
        return { role: m.role, content: m.content };
      });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            assistantText += parsed.text;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: assistantText };
              return updated;
            });
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        ...(prev[prev.length - 1]?.role === "assistant" && prev[prev.length - 1]?.content === ""
          ? []
          : []),
        { role: "assistant" as const, content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([]);
    setInput("");
    setStagedImages([]);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 59,
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: 400,
              height: "100vh",
              background: "var(--surface)",
              borderLeft: "1px solid var(--border)",
              zIndex: 60,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: "bold",
                    color: "#000",
                  }}
                >
                  G
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                  GAMBLOR
                </span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: 6,
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={onClose}
                  title="Close"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: 6,
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {messages.length === 0 && (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    color: "var(--text-secondary)",
                    textAlign: "center",
                    padding: "40px 20px",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#000",
                    }}
                  >
                    G
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                    GAMBLOR
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                    Your AI betting analyst. Ask me about fund performance, upcoming matchups, or get help evaluating picks.
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      marginTop: 8,
                      width: "100%",
                    }}
                  >
                    {[
                      "How is the fund performing, Gamblor?",
                      "Which bet types should I feed you?",
                      "Am I in your neon tentacle grip yet?",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInput(q);
                          textareaRef.current?.focus();
                        }}
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "8px 12px",
                          color: "var(--text-secondary)",
                          fontSize: 12,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "10px 14px",
                      borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background:
                        msg.role === "user"
                          ? "linear-gradient(135deg, #f59e0b, #d97706)"
                          : "var(--surface-2)",
                      color: msg.role === "user" ? "#000" : "var(--text-primary)",
                      fontSize: 13,
                      lineHeight: 1.5,
                      fontWeight: msg.role === "user" ? 500 : 400,
                    }}
                  >
                    {msg.role === "user" && msg.images && msg.images.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: msg.content ? 8 : 0 }}>
                        {msg.images.map((img, j) => (
                          <img
                            key={j}
                            src={`data:${img.mediaType};base64,${img.data}`}
                            alt="Attached"
                            style={{ maxWidth: 200, maxHeight: 150, borderRadius: 8, display: "block" }}
                          />
                        ))}
                      </div>
                    )}
                    {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                    {streaming && i === messages.length - 1 && msg.role === "assistant" && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 6,
                          height: 14,
                          background: "var(--accent)",
                          marginLeft: 2,
                          animation: "blink 1s step-end infinite",
                          verticalAlign: "text-bottom",
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: "12px 20px 16px",
                borderTop: "1px solid var(--border)",
                flexShrink: 0,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files) readFilesAsImages(e.target.files);
                  e.target.value = "";
                }}
              />

              {stagedImages.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  {stagedImages.map((img, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img
                        src={`data:${img.mediaType};base64,${img.data}`}
                        alt="Staged"
                        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, display: "block" }}
                      />
                      <button
                        onClick={() => setStagedImages((prev) => prev.filter((_, j) => j !== i))}
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: "none",
                          background: "var(--text-secondary)",
                          color: "var(--surface)",
                          fontSize: 11,
                          lineHeight: 1,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-end",
                }}
              >
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach image"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <ImagePlus size={18} />
                </button>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Speak to Gamblor..."
                  rows={1}
                  style={{
                    flex: 1,
                    resize: "none",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontFamily: "inherit",
                    outline: "none",
                    maxHeight: 120,
                    lineHeight: 1.4,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
                <button
                  onClick={sendMessage}
                  disabled={(!input.trim() && stagedImages.length === 0) || streaming}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "none",
                    background:
                      (input.trim() || stagedImages.length > 0) && !streaming
                        ? "linear-gradient(135deg, #f59e0b, #d97706)"
                        : "var(--surface-2)",
                    cursor: (input.trim() || stagedImages.length > 0) && !streaming ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Send
                    size={16}
                    color={(input.trim() || stagedImages.length > 0) && !streaming ? "#000" : "var(--text-secondary)"}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Blink cursor animation */}
          <style>{`
            @keyframes blink {
              50% { opacity: 0; }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}
