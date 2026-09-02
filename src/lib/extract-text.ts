// Browser-side document text extraction (PDF / DOCX / TXT).
// Runs in the client only: the Worker runtime cannot host pdf.js or mammoth.

export const ACCEPTED_DOC_TYPES = ".pdf,.docx,.doc,.txt,.md,.rtf";
export const MAX_DOC_BYTES = 5 * 1024 * 1024;

export class ExtractError extends Error {}

function extensionOf(name: string) {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx + 1).toLowerCase();
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    );
  }
  await doc.destroy();
  return pages.filter(Boolean).join("\n\n");
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value.trim();
}

/** Extracts plain text from a recruiter-supplied document. */
export async function extractTextFromFile(file: File): Promise<string> {
  if (file.size > MAX_DOC_BYTES) {
    throw new ExtractError("File is larger than 5MB.");
  }

  const ext = extensionOf(file.name);
  let text = "";

  try {
    if (ext === "pdf" || file.type === "application/pdf") {
      text = await extractPdf(file);
    } else if (ext === "docx") {
      text = await extractDocx(file);
    } else if (ext === "txt" || ext === "md" || ext === "rtf" || file.type.startsWith("text/")) {
      text = (await file.text()).trim();
    } else if (ext === "doc") {
      throw new ExtractError(
        "Legacy .doc files aren't supported — save as .docx or PDF and try again.",
      );
    } else {
      throw new ExtractError("Unsupported file type. Use PDF, DOCX or TXT.");
    }
  } catch (error) {
    if (error instanceof ExtractError) throw error;
    console.error("[extract-text]", error);
    throw new ExtractError("Could not read that file. Try a different format.");
  }

  if (text.replace(/\s/g, "").length < 40) {
    throw new ExtractError(
      "Barely any text found — the file may be a scanned image. Paste the text instead.",
    );
  }
  return text;
}
