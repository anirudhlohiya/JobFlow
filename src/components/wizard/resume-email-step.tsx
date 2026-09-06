"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, RefreshCw } from "lucide-react";
import type { ExtractedJob } from "@/types";
import { listResumes, tailorResume, compileResume, pdfUrlFor } from "@/services/resume";
import { draftEmail } from "@/services/email";
import { updateApplication } from "@/services/applications";

interface Props {
  applicationId: string;
  job: ExtractedJob;
  onBack: () => void;
  onComplete: () => void;
}

export function ResumeEmailStep({ applicationId, job, onBack, onComplete }: Props) {
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [tailoredLatex, setTailoredLatex] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [activeTab, setActiveTab] = useState<"resume" | "email">("resume");

  useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      const data = await listResumes();
      if (cancelled) return;
      const defaultResume = data.resumes.find((r) => r.isDefault) ?? data.resumes[0];
      if (defaultResume) {
        setResumeId(defaultResume.id);
      } else {
        setError("No resume uploaded yet. Go to Settings → Resume to upload your .tex resume first.");
      }
    } catch {
      if (!cancelled) setError("Failed to load resumes.");
    }
  })();
  return () => {
    cancelled = true;
  };
}, []);

  async function handleGenerateResume() {
    if (!resumeId) {
      setError("No master resume found. Upload one in Settings first.");
      return;
    }
    setBusy("resume");
    setError(null);
    try {
      const { tailoredLatex } = await tailorResume(resumeId, job);
      setTailoredLatex(tailoredLatex);

      const { pdfPath } = await compileResume(tailoredLatex, `resume_${applicationId}`);
      setPdfUrl(pdfUrlFor(pdfPath));

      await updateApplication(applicationId, {
        tailoredLatex,
        tailoredPdfPath: pdfPath,
        status: "PENDING_REVIEW",
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function handleGenerateEmail() {
    setBusy("email");
    setError(null);
    try {
      const data = await draftEmail({
        job: {
          role: job.role,
          company: job.company,
          hrEmail: job.hrEmail,
          hrName: job.hrName,
          skills: job.skills,
          experience: job.experience,
          source: job.source,
          location: job.location,
        },
        resumeHighlights: "",
      });
      setSubject(data.subject);
      setEmailBody(data.body);

      await updateApplication(applicationId, {
        emailSubject: data.subject,
        emailBody: data.body,
        emailTemplate: data.templateId,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function handleSaveEmail() {
    try {
      await updateApplication(applicationId, { emailSubject: subject, emailBody });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <div className="rounded-md bg-warning-soft border border-warning/30 px-4 py-3 text-sm text-warning-deep">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleGenerateResume}
          disabled={!resumeId || busy !== ""}
          className="rounded-md h-10 bg-ink text-white hover:bg-ink/90"
        >
          {busy === "resume" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Tailoring…
            </>
          ) : (
            <>Generate Tailored Resume</>
          )}
        </Button>
        <Button
          onClick={handleGenerateEmail}
          disabled={busy !== ""}
          className="rounded-md h-10 bg-white text-ink border border-hairline hover:bg-hairline-soft"
        >
          {busy === "email" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Drafting…
            </>
          ) : (
            <>Draft Email</>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "resume" | "email")}>
        <TabsList className="bg-transparent border border-hairline rounded-full">
          <TabsTrigger value="resume" className="rounded-full data-[state=active]:bg-ink data-[state=active]:text-white">
            Resume Preview
          </TabsTrigger>
          <TabsTrigger value="email" className="rounded-full data-[state=active]:bg-ink data-[state=active]:text-white">
            Email Draft
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resume">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[20px] font-semibold tracking-[-0.4px]">
                Tailored Resume
              </CardTitle>
              {tailoredLatex && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateResume}
                  className="rounded-md text-ink"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Regenerate
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-[600px] border border-hairline rounded-[12px] bg-white"
                  title="Resume PDF preview"
                />
              ) : (
                <div className="border border-dashed border-hairline rounded-[12px] p-16 text-center text-sm text-mute">
                  Click “Generate Tailored Resume” to compile and preview the PDF.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="text-[20px] font-semibold tracking-[-0.4px]">
                Email Draft
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-ink font-medium mb-1.5 block">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-white border-hairline rounded-md"
                  placeholder="Application for {role} — {company}"
                />
              </div>
              <div>
                <label className="text-sm text-ink font-medium mb-1.5 block">Body</label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="bg-white border-hairline rounded-md min-h-[260px] font-mono text-[13px]"
                  placeholder="Your email body will appear here after drafting…"
                />
              </div>
              {subject && emailBody && (
                <div className="flex items-center justify-end">
                  <Button
                    onClick={async () => {
                      await handleSaveEmail();
                      onComplete();
                    }}
                    className="rounded-md h-10 px-4 bg-ink text-white hover:bg-ink/90"
                  >
                    Review &amp; Approve →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="rounded-md h-10 text-ink">
          Back
        </Button>
        {!subject && !emailBody && (
          <Button onClick={handleSaveEmail} variant="ghost" className="rounded-md h-10 text-ink">
            Skip Email (save draft)
          </Button>
        )}
      </div>
    </div>
  );
}