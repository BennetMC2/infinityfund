"use client";

interface MemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MEME_VIDEOS = [
  { id: "RFvFh5-3IEs" },
  { id: "WyxgCvPOtz0" },
  { id: "s_padKPbfDo" },
  { id: "EEFMVIfl2UY" },
];

export default function MemeModal({ isOpen, onClose }: MemeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "clamp(12px, 4vw, 20px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "clamp(16px, 5vw, 24px)",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflowY: "auto",
          width: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "clamp(16px, 4vw, 24px)" }}>
          <h2 style={{ margin: 0, fontSize: "clamp(16px, 5vw, 20px)", fontWeight: 700, color: "var(--text-primary)" }}>
            🎬 Premium Content
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "clamp(20px, 5vw, 28px)",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "4px 8px",
              minWidth: "44px",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "clamp(16px, 5vw, 24px)" }}>
          {MEME_VIDEOS.map((video) => (
            <div key={video.id} style={{ aspectRatio: "16 / 9" }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${video.id}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: "8px", display: "block" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
