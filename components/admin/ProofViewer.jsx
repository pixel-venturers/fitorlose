"use client";

import { Activity, Eye, FileImage, FileVideo } from "lucide-react";

import { formatDateTime } from "@/lib/formatters";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const KIND_ICON = { image: FileImage, video: FileVideo, activity: Activity };

/** "View" button opening a dialog with the submitted proof media + metadata. */
export function ProofViewer({ submission }) {
  const media = submission.media ?? [];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="xs" variant="outline">
          <Eye />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submitted proof</DialogTitle>
          <DialogDescription>
            {submission.challenge.title} · {submission.user.name} ·{" "}
            {formatDateTime(submission.submittedAt)}
          </DialogDescription>
        </DialogHeader>

        {submission.note ? (
          <p className="text-muted-foreground text-sm">{submission.note}</p>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          {media.map((item) => {
            const IconComponent = KIND_ICON[item.kind] ?? FileImage;
            return (
              <div
                key={item.label}
                className="border-border bg-muted overflow-hidden rounded-lg border"
              >
                {item.kind === "video" ? (
                  <div className="flex aspect-video items-center justify-center">
                    <FileVideo className="text-muted-foreground size-6" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.label}
                    className="aspect-video w-full object-cover"
                  />
                )}
                <div className="text-muted-foreground flex items-center gap-1.5 px-2 py-1.5 text-xs">
                  <IconComponent className="size-3.5" />
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        {submission.flagged ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            <span className="font-semibold">Flagged:</span>{" "}
            {submission.flagReason}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
