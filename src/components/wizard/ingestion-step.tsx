"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Upload, FileImage, X } from "lucide-react";
import type { ExtractedJob } from "@/types";

interface IngestionStepProps {
  onComplete: (data: {
    extracted: ExtractedJob;
    text: string;
    images: string[];
  }) => void;
}

export function IngestionStep({ onComplete }: IngestionStepProps) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "image" | "mixed">("text");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasInput = text.trim().length > 5 || images.length > 0;

  async function handleExtract() {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "text" || (activeTab === "mixed" && text.trim() && images.length === 0)) {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Extraction failed.");
        onComplete({ extracted: data.job, text, images: [] });
      } else {
        // Extract from first image
        const image = images[0];
        const res = await fetch("/api/extract/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Image extraction failed.");
        onComplete({ extracted: data.job, text: "", images });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    const newImages: string[] = [];
    for (const file of newFiles) {
      if (!file.type.startsWith("image/")) continue;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          newImages.push(reader.result);
          if (newImages.length === newFiles.filter((f) => f.type.startsWith("image/")).length) {
            setImages((prev) => [...prev, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="bg-transparent border border-hairline rounded-full">
          <TabsTrigger value="text" className="rounded-full data-[state=active]:bg-ink data-[state=active]:text-white">
            Paste Text
          </TabsTrigger>
          <TabsTrigger value="image" className="rounded-full data-[state=active]:bg-ink data-[state=active]:text-white">
            Upload Image
          </TabsTrigger>
          <TabsTrigger value="mixed" className="rounded-full data-[state=active]:bg-ink data-[state=active]:text-white">
            Mixed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <Card>
            <CardContent className="p-6">
              <label className="text-sm text-ink font-medium mb-2 block">
                Paste the job post
              </label>
              <p className="text-[12px] text-mute mb-3">
                Copy from WhatsApp / Telegram / LinkedIn and paste below.
              </p>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"Hiring: Backend Developer at Acme Corp\nLocation: Remote\nSkills: Node.js, PostgreSQL, AWS...\nEmail CVs to hr@acme.com"}
                className="min-h-[220px] bg-white border-hairline rounded-md text-[14px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image">
          <Card>
            <CardContent className="p-6">
              <label className="text-sm text-ink font-medium mb-2 block">
                Upload a job post screenshot
              </label>
              <p className="text-[12px] text-mute mb-4">
                PNG, JPG, or WEBP. The AI reads the screenshot directly (vision).
              </p>
              <div
                className="border-2 border-dashed border-hairline rounded-[12px] p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-body transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(e.dataTransfer.files);
                }}
              >
                <Upload className="w-8 h-8 text-mute" />
                <p className="text-sm text-body">Drag &amp; drop or click to upload</p>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md h-9 bg-white text-ink border-hairline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Choose Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative border border-hairline rounded-[12px] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Job post ${i + 1}`} className="w-full h-32 object-cover" />
                      <button
                        onClick={() => setImages(images.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-6 h-6 bg-ink/70 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mixed">
          <Card>
            <CardContent className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-sm text-ink font-medium mb-2 block">Paste text</label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Optional: paste the post text here…"
                  className="min-h-[120px] bg-white border-hairline rounded-md"
                />
              </div>
              <div>
                <label className="text-sm text-ink font-medium mb-2 block">Or add images</label>
                <div
                  className="border-2 border-dashed border-hairline rounded-[12px] p-6 flex items-center gap-3 cursor-pointer hover:border-body"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileImage className="w-5 h-5 text-mute" />
                  <span className="text-sm text-body">Click to add job post screenshots</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>
              </div>
              {images.length > 0 && (
                <p className="text-[12px] text-mute">{images.length} image(s) added</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="rounded-md bg-warning-soft border border-warning/30 px-4 py-3 text-sm text-warning-deep">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          onClick={handleExtract}
          disabled={!hasInput || loading}
          className="rounded-md h-10 px-4 bg-ink text-white hover:bg-ink/90"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Extracting…
            </>
          ) : (
            "Extract Job Details →"
          )}
        </Button>
      </div>
    </div>
  );
}