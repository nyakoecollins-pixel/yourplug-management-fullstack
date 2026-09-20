import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import crypto from "node:crypto";
import { imageSize } from "image-size";
import { prisma } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";
import { uploadFile, getDownloadUrl, deleteFile, isStorageConfigured } from "../integrations/storage.js";

export const appearanceAdminRouter = Router();
appearanceAdminRouter.use(authenticate, requireRole("ADMIN"));

export const appearancePublicRouter = Router();

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_DIMENSION = 6000; // guards against decompression-bomb-style huge images

/** Very basic SVG sanitization: strips script tags, event handler attributes,
 *  and javascript: URIs. This is a pragmatic mitigation, not a full sanitizer —
 *  if stronger guarantees are needed later, swap in a dedicated library. */
function sanitizeSvg(buffer: Buffer): Buffer {
  let svg = buffer.toString("utf8");
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
  svg = svg.replace(/\son\w+\s*=\s*"[^"]*"/gi, "").replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  svg = svg.replace(/javascript:/gi, "");
  svg = svg.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "");
  return Buffer.from(svg, "utf8");
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WebP, or SVG images are allowed."));
    }
    cb(null, true);
  },
});

// --- Media Library ---

appearanceAdminRouter.post("/media", upload.single("file"), async (req, res) => {
  if (!isStorageConfigured()) return res.status(503).json({ error: "File storage isn't configured yet." });
  if (!req.file) return res.status(400).json({ error: "No file provided." });

  let buffer = req.file.buffer;
  let width: number | undefined;
  let height: number | undefined;

  if (req.file.mimetype === "image/svg+xml") {
    buffer = sanitizeSvg(buffer);
  } else {
    try {
      const dims = imageSize(buffer);
      width = dims.width;
      height = dims.height;
      if ((width || 0) > MAX_DIMENSION || (height || 0) > MAX_DIMENSION) {
        return res.status(400).json({ error: `Image is too large — max ${MAX_DIMENSION}px on either side.` });
      }
    } catch {
      return res.status(400).json({ error: "Couldn't read this image — it may be corrupted." });
    }
  }

  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `site-graphics/${crypto.randomUUID()}-${safeName}`;

  try {
    await uploadFile(storageKey, buffer, req.file.mimetype);
  } catch (err: any) {
    return res.status(502).json({ error: err.message || "Couldn't upload the file right now." });
  }

  const asset = await prisma.mediaAsset.create({
    data: { fileName: req.file.originalname, mimeType: req.file.mimetype, sizeBytes: buffer.length, storageKey, width, height, uploadedById: req.user!.sub },
  });
  await audit(req.user!.sub, "media.uploaded", "MediaAsset", asset.id);

  res.status(201).json(asset);
});

appearanceAdminRouter.get("/media", async (_req, res) => {
  const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" } });
  const withUrls = await Promise.all(assets.map(async (a: typeof assets[number]) => {
    let url: string | null = null;
    try { url = await getDownloadUrl(a.storageKey); } catch { /* leave null, frontend falls back */ }
    return { ...a, url };
  }));
  res.json(withUrls);
});

appearanceAdminRouter.delete("/media/:id", async (req, res) => {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: req.params.id } });
  if (!asset) return res.status(404).json({ error: "Not found." });

  const inUse = await prisma.siteSetting.findFirst({ where: { value: asset.id } });
  const usedByService = await prisma.serviceEntry.findFirst({ where: { imageAssetId: asset.id } });
  if (inUse || usedByService) {
    return res.status(409).json({ error: "This image is currently in use — remove it from that slot first." });
  }

  try { await deleteFile(asset.storageKey); } catch { /* if storage delete fails, still remove the DB record below */ }
  await prisma.mediaAsset.delete({ where: { id: asset.id } });
  await audit(req.user!.sub, "media.deleted", "MediaAsset", asset.id);
  res.json({ deleted: true });
});

// --- Site settings (branding colors + which MediaAsset fills each homepage slot) ---

const settingsSchema = z.record(z.string());

appearanceAdminRouter.put("/site-settings", async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid settings payload." });

  await Promise.all(Object.entries(parsed.data).map(([key, value]) =>
    prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
  ));
  await audit(req.user!.sub, "site_settings.updated", "SiteSetting", Object.keys(parsed.data).join(","));
  res.json({ saved: true });
});

appearanceAdminRouter.get("/site-settings", async (_req, res) => {
  const settings = await prisma.siteSetting.findMany();
  res.json(Object.fromEntries(settings.map((s: typeof settings[number]) => [s.key, s.value])));
});

// --- Services manager ---

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  imageAssetId: z.string().optional().nullable(),
  icon: z.string().optional(),
  displayOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

appearanceAdminRouter.get("/services", async (_req, res) => {
  const services = await prisma.serviceEntry.findMany({ orderBy: { displayOrder: "asc" } });
  res.json(services);
});

appearanceAdminRouter.post("/services", async (req, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the service details." });
  const service = await prisma.serviceEntry.create({ data: parsed.data });
  await audit(req.user!.sub, "service.created", "ServiceEntry", service.id);
  res.status(201).json(service);
});

appearanceAdminRouter.patch("/services/:id", async (req, res) => {
  const parsed = serviceSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the service details." });
  const service = await prisma.serviceEntry.update({ where: { id: req.params.id }, data: parsed.data });
  await audit(req.user!.sub, "service.updated", "ServiceEntry", service.id);
  res.json(service);
});

appearanceAdminRouter.delete("/services/:id", async (req, res) => {
  await prisma.serviceEntry.delete({ where: { id: req.params.id } });
  await audit(req.user!.sub, "service.deleted", "ServiceEntry", req.params.id);
  res.json({ deleted: true });
});

// --- Public read endpoints — no auth, called by the live website on every page load ---
// URLs are resolved fresh on every call rather than stored, so they never go stale.

async function resolveImageUrl(assetId: string | null | undefined): Promise<string | null> {
  if (!assetId) return null;
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset) return null;
  try { return await getDownloadUrl(asset.storageKey); } catch { return null; }
}

appearancePublicRouter.get("/site-settings", async (_req, res) => {
  const settings = await prisma.siteSetting.findMany();
  const resolved: Record<string, string | null> = {};
  for (const s of settings) {
    // Color/text values pass through as-is; image slots are stored as a MediaAsset id
    // and resolved to a real signed URL here, on every request.
    resolved[s.key] = s.key.endsWith("_color") ? s.value : await resolveImageUrl(s.value);
  }
  res.json(resolved);
});

appearancePublicRouter.get("/services", async (_req, res) => {
  const services = await prisma.serviceEntry.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } });
  const withUrls = await Promise.all(services.map(async (s: typeof services[number]) => ({
    id: s.id, name: s.name, description: s.description, icon: s.icon,
    imageUrl: await resolveImageUrl(s.imageAssetId),
  })));
  res.json(withUrls);
});
