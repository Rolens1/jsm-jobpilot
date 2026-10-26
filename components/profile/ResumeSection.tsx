"use client";

import { useState, useRef, ChangeEvent, DragEvent, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  X,
  Loader2,
  Eye,
  ExternalLink,
  Sparkles,
  Download,
  AlertCircle,
} from "lucide-react";
import { generateResumePdf } from "@/actions/resume";
import { useTranslation } from "@/components/providers/LanguageProvider";

type Props = {
  selectedFile?: File | null;
  onFileSelect?: (file: File | null) => void;
  existingResumeUrl?: string | null;
  onExtractResume?: (file?: File | null) => void;
  isExtracting?: boolean;
  onGenerateResume?: () => void;
};

export function ResumeSection({
  selectedFile: externalSelectedFile,
  onFileSelect,
  existingResumeUrl,
  onExtractResume,
  isExtracting = false,
  onGenerateResume,
}: Props) {
  const { dict } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [internalSelectedFile, setInternalSelectedFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFile = externalSelectedFile !== undefined ? externalSelectedFile : internalSelectedFile;

  // Clean up object URL when component unmounts or preview closes
  useEffect(() => {
    return () => {
      if (previewBlobUrl && previewBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  const handleOpenPreview = () => {
    if (selectedFile) {
      if (previewBlobUrl && previewBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      const url = URL.createObjectURL(selectedFile);
      setPreviewBlobUrl(url);
      setIsPreviewOpen(true);
    } else if (existingResumeUrl) {
      setPreviewBlobUrl(`/api/resume?t=${Date.now()}`);
      setIsPreviewOpen(true);
    }
  };

  const handleGenerateResume = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const res = await generateResumePdf();
      if (!res.success) {
        setGenerationError(res.error || "Failed to generate resume.");
      } else {
        const freshUrl = res.resumeUrl || `/api/resume?t=${Date.now()}`;
        setPreviewBlobUrl(freshUrl);
        setIsPreviewOpen(true);
        onGenerateResume?.();
      }
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : "An unexpected error occurred during generation."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    if (previewBlobUrl && previewBlobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewBlobUrl(null);
  };

  const handleSelectFile = (file: File | null) => {
    if (onFileSelect) {
      onFileSelect(file);
    } else {
      setInternalSelectedFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        handleSelectFile(file);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        handleSelectFile(file);
      }
    }
  };

  const handleSelectResumeClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = () => {
    if (onFileSelect) {
      onFileSelect(null);
    } else {
      setInternalSelectedFile(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (previewBlobUrl && previewBlobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
  };

  return (
    <section
      aria-label={dict.profile.resumeTitle}
      className="w-full bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm"
    >
      <h2 className="text-lg font-bold text-text-primary tracking-tight">
        {dict.profile.resumeTitle}
      </h2>
      <p className="text-xs sm:text-sm text-text-secondary mt-1">
        {dict.profile.resumeSubtitle}
      </p>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Dropzone Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-6 border-2 border-dashed rounded-xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-200 ${
          isDragging
            ? "border-accent bg-accent-muted/40"
            : "border-border-muted bg-surface-secondary/40 hover:bg-surface-secondary/70"
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-accent-light/50 flex items-center justify-center text-accent mb-3.5">
          {isExtracting ? (
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>

        {isExtracting ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm sm:text-base font-bold text-text-primary">
              {dict.profile.analyzingResume}
            </p>
            <p className="text-xs text-text-secondary max-w-sm">
              {dict.profile.analyzingSub}
            </p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border shadow-xs text-xs sm:text-sm font-medium text-text-primary">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-xs">
                {selectedFile.name}
              </span>
              <span className="text-text-muted text-xs">
                ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
              <button
                type="button"
                onClick={handleClearFile}
                disabled={isExtracting}
                className="text-text-muted hover:text-error transition-colors ml-1 p-0.5 cursor-pointer disabled:opacity-50"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Actions for Selected File */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => onExtractResume?.(selectedFile)}
                disabled={isExtracting}
                className="bg-accent hover:bg-accent-dark text-accent-foreground font-semibold px-4 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{dict.profile.extractingButton}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{dict.profile.extractButton}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenPreview}
                className="px-3.5 py-2 bg-surface hover:bg-surface-secondary border border-border rounded-lg text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>{dict.profile.viewPdfButton}</span>
              </button>

              <button
                type="button"
                onClick={handleSelectResumeClick}
                disabled={isExtracting}
                className="px-3.5 py-2 bg-surface hover:bg-surface-secondary border border-border rounded-lg text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
              >
                {dict.profile.changeFileButton}
              </button>
            </div>

            <p className="text-xs text-text-secondary mt-1 max-w-md">
              {dict.profile.fileSelectedHint}
            </p>
          </div>
        ) : existingResumeUrl ? (
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border shadow-xs text-xs sm:text-sm font-medium text-text-primary">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span>{dict.profile.currentResumeSaved}</span>
              <span className="text-xs text-text-muted">
                ({dict.profile.pdfDocumentLabel})
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1 max-w-md">
              {dict.profile.resumeSubtitle}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => onExtractResume?.(null)}
                disabled={isExtracting}
                className="bg-accent hover:bg-accent-dark text-accent-foreground font-semibold px-4 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{dict.profile.extractingButton}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{dict.profile.extractButton}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenPreview}
                className="px-3.5 py-2 bg-surface hover:bg-surface-secondary border border-border rounded-lg text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>{dict.profile.viewPdfButton}</span>
              </button>

              <button
                type="button"
                onClick={handleSelectResumeClick}
                disabled={isExtracting}
                className="px-4 py-2 bg-surface hover:bg-surface-secondary border border-border rounded-lg text-xs sm:text-sm font-medium text-text-primary shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {dict.profile.changeFileButton}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm sm:text-base font-semibold text-text-primary">
              {dict.profile.dropzonePrompt}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {dict.profile.dropzoneHint}
            </p>
            <button
              type="button"
              onClick={handleSelectResumeClick}
              className="mt-4 px-4 py-2 bg-surface hover:bg-surface-secondary border border-border rounded-lg text-xs sm:text-sm font-medium text-text-primary shadow-xs transition-colors cursor-pointer"
            >
              {dict.profile.changeFileButton}
            </button>
          </>
        )}
      </div>

      {/* Generation Error Alert */}
      {generationError && (
        <div
          role="alert"
          className="mt-4 p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs sm:text-sm font-medium flex items-center justify-between gap-2.5"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-error" />
            <span>{generationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGenerationError(null)}
            className="text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
            title="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-6 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border/60">
        <div>
          <span className="text-xs sm:text-sm font-medium text-text-primary block">
            {dict.profile.generateAtsButton}
          </span>
          <span className="text-xs text-text-secondary block mt-0.5">
            {dict.profile.resumeSubtitle}
          </span>
        </div>
        <button
          type="button"
          onClick={handleGenerateResume}
          disabled={isGenerating || isExtracting}
          className="bg-accent hover:bg-accent-dark text-accent-foreground rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{dict.profile.generatingAtsButton}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{dict.profile.generateAtsButton}</span>
            </>
          )}
        </button>
      </div>

      {/* Resume PDF Preview Modal */}
      {isPreviewOpen && previewBlobUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={handleClosePreview}
        >
          <div
            className="relative w-full max-w-4xl bg-surface border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-secondary/40">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-text-primary text-sm sm:text-base">
                  {selectedFile?.name || dict.profile.resumeModalTitle}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewBlobUrl}
                  download="resume.pdf"
                  className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-dark text-accent-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{dict.profile.downloadPdf}</span>
                </a>
                <a
                  href={previewBlobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-secondary text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{dict.profile.openTab}</span>
                </a>
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PDF Viewer Body */}
            <div className="flex-1 p-2 bg-surface-secondary/20 min-h-[60vh]">
              <iframe
                src={previewBlobUrl}
                title="Resume PDF Preview"
                className="w-full h-[68vh] rounded-xl border border-border bg-surface"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
