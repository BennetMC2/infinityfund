"use client";

interface MemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MEME_VIDEOS = [
  { id: "RFvFh5-3IEs", title: "David Brent Classic" },
  { id: "WyxgCvPOtz0", title: "Gareth Moment" },
  { id: "s_padKPbfDo", title: "Morgana Banker" },
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
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflowY: "auto",
          width: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
            🎬 Premium Content
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          {MEME_VIDEOS.map((video) => (
            <div key={video.id}>
              <iframe
                width="100%"
                height="400"
                src={`https://www.youtube.com/embed/${video.id}`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: "8px" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
