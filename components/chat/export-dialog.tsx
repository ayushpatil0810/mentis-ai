"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { exportConversation } from "@/lib/services/export-service";
import { toast } from "sonner";
import { 
  Loading01Icon, 
  Download01Icon, 
  DocumentAttachmentIcon, 
  CodeCircleIcon, 
  CheckmarkBadge01Icon 
} from "hugeicons-react";
import { cn } from "@/lib/utils";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chat: any;
  messages: any[];
}

export function ExportDialog({ isOpen, onClose, chat, messages }: ExportDialogProps) {
  const [format, setFormat] = useState<"markdown" | "pdf" | "json">("markdown");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeVersions, setIncludeVersions] = useState(false);
  const [includeTools, setIncludeTools] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!chat) return;
    setIsExporting(true);
    toast.info(`Preparing ${format.toUpperCase()} export...`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await exportConversation(chat, messages, {
        format,
        includeMetadata,
        includeVersions,
        includeTools,
      });
      toast.success("Export completed successfully!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to export conversation. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isExporting && !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[440px] rounded-[24px] border border-border shadow-2xl bg-background p-6 overflow-hidden gap-0"
        aria-busy={isExporting ? "true" : "false"}
      >
        <DialogHeader className="mb-5 select-none">
          <DialogTitle className="text-[17px] font-semibold tracking-tight text-foreground">
            Export Conversation
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground mt-1">
            Choose your preferred export format and metadata settings.
          </DialogDescription>
        </DialogHeader>

        {/* Format Options Selector - Styled matching Appearance Tab cards */}
        <div className="space-y-3 mb-6 select-none">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 block">
            Format Preference
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "markdown", label: "Markdown", icon: DocumentAttachmentIcon, desc: ".md text" },
              { id: "pdf", label: "PDF Format", icon: DocumentAttachmentIcon, desc: ".pdf layout" },
              { id: "json", label: "JSON Raw", icon: CodeCircleIcon, desc: ".json data" },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = format === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id as any)}
                  disabled={isExporting}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected
                      ? "border-foreground bg-card shadow-[0_8px_30px_rgba(0,0,0,0.03)] scale-[1.02] text-foreground font-semibold"
                      : "border-border/60 bg-card/40 hover:bg-card hover:border-border text-muted-foreground",
                    isExporting && "opacity-50 pointer-events-none"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 text-foreground animate-in fade-in zoom-in duration-200">
                      <CheckmarkBadge01Icon className="w-4.5 h-4.5" />
                    </div>
                  )}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors",
                    isSelected ? "bg-foreground/5" : "bg-muted"
                  )}>
                    <Icon className={cn("w-5 h-5", isSelected ? "text-foreground" : "text-muted-foreground")} />
                  </div>
                  <span className="text-[13px] tracking-tight">{f.label}</span>
                  <span className="text-[10px] text-muted-foreground/70 font-normal mt-0.5">{f.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Options Toggles - Simple check boxes */}
        <div className="space-y-3 mb-6 select-none">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 block">
            Export Options
          </label>
          <div className="space-y-3">
            {[
              {
                id: "metadata",
                label: "Include Metadata",
                desc: "Include date, model override, and parent chat linkages",
                checked: includeMetadata,
                onChange: setIncludeMetadata,
              },
              {
                id: "versions",
                label: "Include Response Versions",
                desc: "Export alternative version trees for edited messages",
                checked: includeVersions,
                onChange: setIncludeVersions,
              },
              {
                id: "tools",
                label: "Include Tool Results",
                desc: "Keep full transcripts of external tools and system data payloads",
                checked: includeTools,
                onChange: setIncludeTools,
              },
            ].map((opt) => (
              <label
                key={opt.id}
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:bg-muted/30 cursor-pointer select-none transition-colors",
                  isExporting && "opacity-50 pointer-events-none"
                )}
              >
                <input
                  type="checkbox"
                  checked={opt.checked}
                  disabled={isExporting}
                  onChange={(e) => opt.onChange(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border/80 bg-muted/50 text-primary focus:ring-ring focus:ring-2 focus:ring-offset-0 accent-primary cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-[13.5px] font-medium text-foreground leading-none">
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1.5 leading-normal">
                    {opt.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <DialogFooter className="gap-3 sm:gap-3 flex flex-row justify-end mt-2 select-none border-t border-border/30 pt-4">
          <Button
            variant="outline"
            type="button"
            disabled={isExporting}
            onClick={onClose}
            className="rounded-xl border-border/60 hover:bg-muted cursor-pointer h-9 px-4 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="rounded-xl h-9 px-4 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 cursor-pointer gap-2"
          >
            {isExporting ? (
              <>
                <Loading01Icon className="h-4 w-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download01Icon className="h-4 w-4" />
                <span>Export Conversation</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
