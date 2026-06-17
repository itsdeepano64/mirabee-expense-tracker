"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, FolderOpen, Plus, X } from "lucide-react";

type ReceiptUploadProps = {
  onFileChange: (file: File | null) => void;
  existingUrl?: string | null;
};

export function ReceiptUpload({ onFileChange, existingUrl }: ReceiptUploadProps) {
  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const displayUrl = preview ?? existingUrl ?? null;

  function handleFileSelected(file: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    if (file) {
      setPreview(URL.createObjectURL(file));
      onFileChange(file);
    } else {
      setPreview(null);
      onFileChange(null);
      if (cameraRef.current)  cameraRef.current.value  = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
    setSheetOpen(false);
  }

  return (
    <div className="space-y-2">
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--mb-text)" }}>
        Receipt (optional)
      </p>

      {/* Hidden inputs — separate so capture attr doesn't affect gallery pick */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
      />

      {displayUrl ? (
        /* ── Preview ── */
        <div className="relative overflow-hidden rounded-xl"
          style={{ border: "1.5px solid var(--mb-border)" }}>
          <Image
            src={displayUrl}
            alt="Receipt preview"
            width={400}
            height={300}
            className="h-40 w-full object-cover"
            unoptimized
          />
          {/* Change / remove buttons */}
          <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-2"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)" }}
            >
              <Plus size={13} />
              Change
            </button>
            <button
              type="button"
              onClick={() => handleFileSelected(null)}
              className="flex items-center justify-center rounded-lg px-3 py-1.5"
              style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)" }}
              aria-label="Remove receipt"
            >
              <X size={14} color="white" />
            </button>
          </div>
        </div>
      ) : (
        /* ── Empty state trigger ── */
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors"
          style={{
            border: "1.5px dashed var(--mb-border-strong)",
            background: "var(--mb-blue-xlight)",
            color: "var(--mb-blue)",
          }}
        >
          <Camera size={22} style={{ color: "var(--mb-blue)" }} />
          Add Receipt
        </button>
      )}

      {/* ── Action sheet overlay ── */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto"
            style={{
              maxWidth: 480,
              left: "50%",
              transform: "translateX(-50%)",
              borderRadius: "20px 20px 0 0",
              background: "var(--mb-card)",
              boxShadow: "var(--mb-shadow-lg)",
              padding: "20px 16px 32px",
            }}
          >
            {/* Handle bar */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full"
              style={{ background: "var(--mb-border-strong)" }} />

            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--mb-text)", marginBottom: 16, textAlign: "center" }}>
              Add Receipt
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => { setSheetOpen(false); setTimeout(() => cameraRef.current?.click(), 50); }}
                className="flex items-center gap-4 rounded-2xl p-4 text-left transition-colors"
                style={{ background: "var(--mb-blue-xlight)", border: "1.5px solid var(--mb-blue-light)" }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: "var(--mb-blue)", flexShrink: 0 }}>
                  <Camera size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mb-text)" }}>Take Photo</div>
                  <div style={{ fontSize: 12, color: "var(--mb-text-muted)", marginTop: 2 }}>Open camera to snap a receipt</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSheetOpen(false); setTimeout(() => galleryRef.current?.click(), 50); }}
                className="flex items-center gap-4 rounded-2xl p-4 text-left transition-colors"
                style={{ background: "var(--mb-green-light)", border: "1.5px solid var(--mb-border)" }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: "var(--mb-green)", flexShrink: 0 }}>
                  <FolderOpen size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mb-text)" }}>Choose from Library / Files</div>
                  <div style={{ fontSize: 12, color: "var(--mb-text-muted)", marginTop: 2 }}>Pick from photo library or file browser</div>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-4 w-full rounded-2xl py-3 text-sm font-semibold transition-colors"
              style={{ background: "var(--mb-border)", color: "var(--mb-text-muted)" }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
