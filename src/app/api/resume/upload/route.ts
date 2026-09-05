import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const content = await file.text();
    const name = file.name || "resume.tex";

    if (!content.includes("\\documentclass")) {
      return NextResponse.json(
        { error: "This doesn't look like a LaTeX resume — no \\documentclass found." },
        { status: 400 }
      );
    }

    // Save the file to data/resume/ for reference
    const resumeDir = path.join(process.cwd(), "data", "resume");
    if (!fs.existsSync(resumeDir)) fs.mkdirSync(resumeDir, { recursive: true });
    const filePath = path.join(resumeDir, "resume.tex");
    fs.writeFileSync(filePath, content, "utf8");

    // Upsert resume record
    const existing = await prisma.resume.findFirst({ where: { isDefault: true } });
    let resume;

    if (existing) {
      resume = await prisma.resume.update({
        where: { id: existing.id },
        data: { latexContent: content, name, isDefault: true },
      });
    } else {
      resume = await prisma.resume.create({
        data: { latexContent: content, name, isDefault: true },
      });
    }

    return NextResponse.json({ resume: { id: resume.id, name: resume.name, isDefault: resume.isDefault } });
  } catch (error) {
    console.error("[resume/upload] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}