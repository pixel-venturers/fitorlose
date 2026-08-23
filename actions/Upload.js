"use server";

import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

import { requireUser } from "@/lib/auth";
import { actionOk, toActionError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rate-limit";

const MB = 1024 * 1024;

// Allowed content types + size caps per upload kind (server-side enforced).
const UPLOAD_KINDS = {
  cover: {
    maxBytes: 5 * MB,
    types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  proof: {
    maxBytes: 25 * MB,
    types: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/quicktime",
      "application/pdf",
    ],
  },
};

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Buffer → Cloudinary via an upload stream. resource_type "auto" covers images,
// video and PDFs; the returned secure_url is the public https URL we store.
function uploadBuffer(buffer, { folder, publicId, resourceType }) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: false,
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

/** Validate + store an uploaded file on Cloudinary; returns its public URL. */
export async function UploadFile(formData) {
  try {
    const user = await requireUser();
    enforceRateLimit(`upload:${user.id}`, { limit: 30, windowMs: 600_000 });

    const kind = String(formData?.get?.("kind") ?? "proof");
    const config = UPLOAD_KINDS[kind] ?? UPLOAD_KINDS.proof;
    const file = formData?.get?.("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      throw new ValidationError({ file: "No file provided." });
    }
    if (!config.types.includes(file.type)) {
      throw new ValidationError({ file: "Unsupported file type." });
    }
    if (file.size > config.maxBytes) {
      throw new ValidationError({
        file: `File is too large (max ${Math.round(config.maxBytes / MB)}MB).`,
      });
    }
    if (!cloudinaryConfigured()) {
      throw new ValidationError({
        file: "File uploads aren't configured yet.",
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBuffer(buffer, {
      folder: `fitorlose/${kind}/${user.id}`,
      publicId: randomUUID(),
      resourceType: kind === "cover" ? "image" : "auto",
    });

    logger.info("File uploaded", { kind, userId: user.id, size: file.size });
    return actionOk({
      url: result.secure_url,
      name: file.name,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    return toActionError(error);
  }
}
