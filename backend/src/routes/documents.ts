import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";
import { uploadFile, getDownloadUrl, isStorageConfigured } from "../integrations/storage.js";

export const documentsRouter = Router();
documentsRouter.use(authenticate);

// Allowlist only — images, PDFs, and common office documents. Never executables.
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("That file type isn't allowed. Use an image, PDF, or Word/Excel document."));
    }
    cb(null, true);
  },
});

documentsRouter.post("/requests/:id/documents", upload.single("file"), async (req, res) => {
  if (!isStorageConfigured()) {
    return res.status(503).json({ error: "File storage isn't configured yet. Contact YourPlug support." });
  }
  if (!req.file) return res.status(400).json({ error: "No file provided." });

  const request = await prisma.procurementRequest.findUnique({ where: { id: req.params.id } });
  if (!request) return res.status(404).json({ error: "Request not found." });

  const isOwner = request.customerId === req.user!.sub;
  const isStaff = req.user!.role === "AGENT" || req.user!.role === "ADMIN";
  if (!isOwner && !isStaff) return res.status(403).json({ error: "You can't upload to this request." });

  // A customer's own upload is always customer-visible; only staff can mark something internal-only.
  const visibility = isStaff && req.body.visibility === "internal" ? "internal" : "customer";

  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `requests/${request.id}/${crypto.randomUUID()}-${safeName}`;

  try {
    await uploadFile(storageKey, req.file.buffer, req.file.mimetype);
  } catch (err: any) {
    return res.status(502).json({ error: err.message || "Couldn't upload the file right now." });
  }

  const doc = await prisma.document.create({
    data: {
      requestId: request.id, uploadedById: req.user!.sub, fileName: req.file.originalname,
      mimeType: req.file.mimetype, sizeBytes: req.file.size, storageKey, visibility,
    },
  });
  await prisma.requestEvent.create({ data: { requestId: request.id, label: `Document uploaded: ${req.file.originalname}` } });
  await audit(req.user!.sub, "document.uploaded", "Document", doc.id);

  res.status(201).json({ id: doc.id, fileName: doc.fileName, mimeType: doc.mimeType, sizeBytes: doc.sizeBytes, visibility: doc.visibility, createdAt: doc.createdAt });
});

documentsRouter.get("/requests/:id/documents", async (req, res) => {
  const request = await prisma.procurementRequest.findUnique({ where: { id: req.params.id } });
  if (!request) return res.status(404).json({ error: "Request not found." });

  const isOwner = request.customerId === req.user!.sub;
  const isStaff = req.user!.role === "AGENT" || req.user!.role === "ADMIN";
  if (!isOwner && !isStaff) return res.status(403).json({ error: "You can't view these documents." });

  const documents = await prisma.document.findMany({
    where: { requestId: req.params.id, ...(isStaff ? {} : { visibility: "customer" }) },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: true },
  });
  res.json(documents.map((d: typeof documents[number]) => ({
    id: d.id, fileName: d.fileName, mimeType: d.mimeType, sizeBytes: d.sizeBytes,
    visibility: d.visibility, uploadedBy: d.uploadedBy.name, createdAt: d.createdAt,
  })));
});

// A short-lived signed link — never a permanent public URL, and only ever
// handed to someone who has access to the document's underlying request.
documentsRouter.get("/documents/:id/download", async (req, res) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id }, include: { request: true } });
  if (!doc) return res.status(404).json({ error: "Document not found." });

  const isOwner = doc.request.customerId === req.user!.sub;
  const isStaff = req.user!.role === "AGENT" || req.user!.role === "ADMIN";
  if (!isOwner && !isStaff) return res.status(403).json({ error: "You can't access this document." });
  if (!isStaff && doc.visibility === "internal") return res.status(403).json({ error: "You can't access this document." });

  try {
    const url = await getDownloadUrl(doc.storageKey);
    res.json({ url });
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Couldn't generate a download link right now." });
  }
});
