"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SubmitProof } from "@/actions/Challenge";
import { UploadFile } from "@/actions/Upload";
import { FileVideo, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import { PROOF_TYPE } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_FILES = 6;
const MAX_SIZE_MB = 25;

/**
 * Proof upload for a challenge. Uploads each file to blob storage, then records
 * one submission per file via SubmitProof for admin review.
 */
export function ProofUpload({ challengeId, challengeTitle }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function addFiles(fileList) {
    const incoming = Array.from(fileList ?? []);
    const accepted = [];
    for (const file of incoming) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error(`${file.name}: only images and videos are allowed.`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name}: exceeds ${MAX_SIZE_MB}MB.`);
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        isImage: file.type.startsWith("image/"),
        url: URL.createObjectURL(file),
        file,
      });
    }
    setFiles((prev) => [...prev, ...accepted].slice(0, MAX_FILES));
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }

  async function submit() {
    if (files.length === 0) {
      toast.error("Add at least one photo or video.");
      return;
    }
    setSubmitting(true);
    try {
      let submitted = 0;
      for (const item of files) {
        const fd = new FormData();
        fd.append("kind", "proof");
        fd.append("file", item.file);
        const uploaded = await UploadFile(fd);
        if (!uploaded.ok) {
          toast.error(
            uploaded.error?.message ?? `Couldn't upload ${item.name}.`
          );
          continue;
        }
        const result = await SubmitProof({
          challengeId,
          type: item.isImage ? PROOF_TYPE.PHOTO : PROOF_TYPE.VIDEO,
          label: item.name,
          note,
          fileUrl: uploaded.data.url,
        });
        if (result.ok) submitted += 1;
        else toast.error(result.error?.message ?? "Couldn't submit proof.");
      }
      if (submitted > 0) {
        setFiles([]);
        setNote("");
        toast.success(
          `Submitted ${submitted} proof${submitted === 1 ? "" : "s"} for review.`
        );
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-card ring-foreground/10 rounded-xl p-4 ring-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="border-border/70 bg-background/40 hover:border-primary/50 hover:bg-muted/40 flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors"
      >
        <ImagePlus className="text-muted-foreground size-6" />
        <span className="text-sm font-medium">Upload photos or videos</span>
        <span className="text-muted-foreground text-xs">
          Up to {MAX_FILES} files · max {MAX_SIZE_MB}MB each
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(event) => addFiles(event.target.files)}
      />

      {files.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="group/preview bg-muted ring-foreground/10 relative aspect-square overflow-hidden rounded-lg ring-1"
            >
              {file.isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt={file.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-1 p-1 text-center">
                  <FileVideo className="text-muted-foreground size-5" />
                  <span className="text-muted-foreground line-clamp-2 text-[0.65rem]">
                    {file.name}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                aria-label={`Remove ${file.name}`}
                className={cn(
                  "bg-background/80 text-foreground absolute top-1 right-1 grid size-5 place-items-center rounded-full",
                  "opacity-0 transition-opacity group-hover/preview:opacity-100"
                )}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={`Add a note about your progress on "${challengeTitle}" (optional)`}
        className="mt-3"
        rows={2}
      />

      <div className="mt-3 flex justify-end">
        <Button onClick={submit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit proof"}
        </Button>
      </div>
    </div>
  );
}
