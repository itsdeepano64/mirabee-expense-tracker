"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type ReceiptUploadProps = {
  onFileChange: (file: File | null) => void;
};

export function ReceiptUpload({ onFileChange }: ReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(file: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    if (file) {
      setPreview(URL.createObjectURL(file));
      onFileChange(file);
    } else {
      setPreview(null);
      onFileChange(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>Receipt photo (optional)</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleChange(e.target.files?.[0] ?? null)}
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-rose/20">
          <Image
            src={preview}
            alt="Receipt preview"
            width={400}
            height={300}
            className="h-40 w-full object-cover"
            unoptimized
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 bg-white/90"
            onClick={() => handleChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-rose/30 bg-rose/5 text-sm text-muted-foreground transition-colors hover:bg-rose/10"
        >
          <Camera className="h-6 w-6 text-rose-dark" />
          Tap to take photo or choose from gallery
        </button>
      )}
    </div>
  );
}