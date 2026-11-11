"use client";

import { useId, useRef, useState } from "react";
import { imageToBase64, pdfToText } from "@/lib/files";
import { SAMPLES } from "@/lib/samples";

export type BriefPayload = {
  text?: string;
  image?: { mediaType: "image/jpeg"; data: string };
  mode: "student" | "teacher";
};

type Mode = "text" | "file";

export function BriefInput({ onSubmit, busy }: { onSubmit: (p: BriefPayload) => void; busy: boolean }) {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [courtMode, setCourtMode] = useState<"student" | "teacher">("student");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [image, setImage] = useState<BriefPayload["image"]>();
  const [fileText, setFileText] = useState<string>("");
  const [fileBusy, setFileBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const ids = { text: useId(), file: useId(), err: useId() };

  function clearFile() {
    setFileName(null);
    setPreview(null);
    setImage(undefined);
    setFileText("");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function handleFile(file: File | undefined) {
    setError(null);
    clearFile();
    if (!file) return;
    setFileBusy(true);
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const t = await pdfToText(file);
        if (t.length < 10) {
          throw new Error(
            "This PDF has no readable text (it may be a scan). Take a screenshot or photo of it and upload that instead.",
          );
        }
        setFileText(t);
      } else if (file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|gif)$/i.test(file.name)) {
        const img = await imageToBase64(file);
        setImage(img);
        setPreview(`data:${img.mediaType};base64,${img.data}`);
      } else {
        throw new Error("Please choose a photo (JPG/PNG) or a PDF.");
      }
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't read that file.");
      clearFile();
    } finally {
      setFileBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: BriefPayload = { mode: courtMode };
    if (mode === "text") {
      if (text.trim().length < 10) {
        setError("Paste the assignment brief first (at least a sentence).");
        return;
      }
      payload.text = text.trim();
    } else {
      if (!image && !fileText) {
        setError("Choose a photo or PDF of the assignment first.");
        return;
      }
      if (image) payload.image = image;
      if (fileText) payload.text = fileText;
    }
    onSubmit(payload);
  }

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => {
        setMode(m);
        setError(null);
      }}
      className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition ${
        mode === m ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <form onSubmit={submit} className="space-y-5" aria-describedby={error ? ids.err : undefined} noValidate>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Who&apos;s bringing this case?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["student", "I'm a student", "Get the questions to ask"],
              ["teacher", "I'm a teacher", "Get an airtight brief"],
            ] as const
          ).map(([m, label, hint]) => (
            <label
              key={m}
              className={`cursor-pointer rounded-2xl border p-3 transition ${
                courtMode === m ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line bg-surface hover:border-accent"
              }`}
            >
              <input type="radio" name="court-mode" value={m} checked={courtMode === m} onChange={() => setCourtMode(m)} className="sr-only" />
              <span className="block font-semibold">{label}</span>
              <span className="block text-xs text-muted">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div role="tablist" aria-label="How do you want to add the assignment?" className="flex gap-1 rounded-full bg-line/60 p-1">
        {tab("text", "Paste text")}
        {tab("file", "Photo or PDF")}
      </div>

      {mode === "text" ? (
        <div className="space-y-2">
          <label htmlFor={ids.text} className="block text-sm font-medium">
            Assignment instructions
          </label>
          <textarea
            id={ids.text}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            maxLength={12000}
            placeholder="Paste the assignment brief…"
            className="w-full resize-y rounded-2xl border border-line bg-surface p-4 text-base leading-relaxed placeholder:text-muted/70 focus:border-accent focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-sm text-muted">No brief handy? Try a case:</span>
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setText(s.text)}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-foreground hover:border-accent hover:text-accent"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor={ids.file} className="block text-sm font-medium">
            Photo, screenshot or PDF of the assignment
          </label>
          <label
            htmlFor={ids.file}
            className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface p-6 text-center hover:border-accent"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Your assignment photo" className="max-h-64 rounded-lg object-contain" />
            ) : fileText ? (
              <span className="text-sm text-foreground">PDF read: {fileText.split(/\s+/).length} words found</span>
            ) : (
              <>
                <span aria-hidden className="text-3xl">📄</span>
                <span className="font-medium">{fileBusy ? "Reading your file…" : "Tap to take a photo or choose a file"}</span>
                <span className="text-sm text-muted">Printed or handwritten sheets work. Make sure the text is in focus.</span>
              </>
            )}
          </label>
          <input
            ref={fileInput}
            id={ids.file}
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {fileName && (
            <div className="flex items-center justify-between text-sm text-muted">
              <span className="truncate">{fileName}</span>
              <button type="button" onClick={clearFile} className="font-medium text-accent underline-offset-2 hover:underline">
                Remove
              </button>
            </div>
          )}
        </div>
      )}


      {error && (
        <p id={ids.err} role="alert" className="rounded-xl bg-must-soft px-4 py-3 text-sm text-must">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || fileBusy}
        className="w-full rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-accent-strong disabled:opacity-60"
      >
        {busy ? "Court is in session…" : "Start trial ⚖️"}
      </button>
      <p className="text-center text-xs text-muted">
        No account needed. The brief is sent to an AI to run the trial and isn&apos;t stored by Loophole Court.
      </p>
    </form>
  );
}
