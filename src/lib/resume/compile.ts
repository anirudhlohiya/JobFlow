import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "data", "output");

function getTectonicPath(): string {
  return process.env.TECTONIC_PATH || "tectonic";
}

export async function compileLatex(latexSource: string, outputName?: string): Promise<{ pdfPath: string; pdfBase64: string }> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const stamp = Date.now().toString(36);
  const safeName = (outputName ?? `resume_${stamp}`).replace(/[^a-zA-Z0-9_-]/g, "_");
  const texPath = path.join(OUTPUT_DIR, `${safeName}.tex`);
  const pdfPath = path.join(OUTPUT_DIR, `${safeName}.pdf`);

  fs.writeFileSync(texPath, latexSource, "utf8");

  await runTectonic(texPath);

  if (!fs.existsSync(pdfPath)) {
    throw new Error("Tectonic did not produce a PDF. Check the resume LaTeX for errors.");
  }

  const pdfBase64 = fs.readFileSync(pdfPath).toString("base64");
  return { pdfPath, pdfBase64 };
}

function runTectonic(texPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tectonicPath = getTectonicPath();
    const proc = spawn(tectonicPath, [texPath], {
      cwd: OUTPUT_DIR,
      shell: process.platform === "win32",
    }); /*turbopackIgnore: true*/

    let stderr = "";
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`Tectonic compile timed out after 60s.\n${stderr}`));
    }, 60_000);

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Tectonic not found. Install it from https://tectonic-typesetting.github.io and ensure it's on PATH, or set TECTONIC_PATH in .env. (${err.message})`));
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`Tectonic exited with code ${code}.\n${stderr}`));
    });
  });
}

export function cleanupTempFiles(safeName: string): void {
  for (const ext of [".tex", ".aux", ".log", ".bbl", ".blg", ".toc", ".out"]) {
    const f = path.join(OUTPUT_DIR, `${safeName}${ext}`);
    try {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    } catch {
      // ignore
    }
  }
}