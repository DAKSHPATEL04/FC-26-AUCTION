"use client";

import { useState } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { Download, FileSpreadsheet, FileText, Loader2, Sparkles, ShieldAlert } from "lucide-react";
import { toast } from "@/lib/toast";

export default function ExportPage() {
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleExportCsv = () => {
    setDownloadingCsv(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      window.open(`${apiUrl}/api/stats/export/csv`, "_blank");
      toast.success("Exported CSV successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to trigger CSV export.");
    } finally {
      setTimeout(() => setDownloadingCsv(false), 2000);
    }
  };

  const handleExportPdf = () => {
    setDownloadingPdf(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      window.open(`${apiUrl}/api/stats/export/pdf`, "_blank");
      toast.success("Exported PDF successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to trigger PDF export.");
    } finally {
      setTimeout(() => setDownloadingPdf(false), 2000);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-2">
            <Download className="text-accent-blue" /> Export Summary
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Export the official roster allocations and draft history records in universal spreadsheet and document formats.
          </p>
        </div>

        {/* Warning / Admin note */}
        <div className="flex items-start gap-3 rounded-xl border border-accent-amber/15 bg-accent-amber/5 p-4 text-xs text-text-secondary">
          <ShieldAlert className="text-accent-amber flex-shrink-0 mt-0.5" size={16} />
          <div>
            <p className="font-bold text-text-primary mb-0.5">Official Records Protocol</p>
            <p>
              These exports compile all drafted players who have been marked as "sold". Any active bidding or players currently in the pool will not be listed in these reports until their drafts are officially resolved.
            </p>
          </div>
        </div>

        {/* Export Options Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* CSV CARD */}
          <div className="border border-border bg-surface rounded-2xl p-6 flex flex-col justify-between hover:border-accent-blue transition-colors">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-accent-green/10 flex items-center justify-center text-accent-green">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-text-primary">Export CSV Spreadsheet</h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Download a comma-separated `.csv` file. This format is perfect for imports into Excel, Google Sheets, or fantasy draft trackers.
                </p>
              </div>
              <ul className="text-[11px] text-text-muted space-y-1.5 list-disc pl-4">
                <li>Detailed player list with original ratings and positions.</li>
                <li>Clear team assignment and final winning bid prices.</li>
                <li>Lightweight format for custom calculations and custom leagues.</li>
              </ul>
            </div>

            <button
              onClick={handleExportCsv}
              disabled={downloadingCsv}
              className="mt-8 flex w-full items-center justify-center gap-2 bg-accent-green hover:bg-accent-green/80 text-black font-bold text-sm py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {downloadingCsv ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Preparing Sheet...
                </>
              ) : (
                <>
                  <Download size={16} /> Download CSV
                </>
              )}
            </button>
          </div>

          {/* PDF CARD */}
          <div className="border border-border bg-surface rounded-2xl p-6 flex flex-col justify-between hover:border-accent-blue transition-colors">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-text-primary flex items-center gap-1.5">
                  Export PDF Report <Sparkles size={14} className="text-accent-amber" />
                </h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Download a stylized `.pdf` document with official league headers, tables, and formatted draft records suitable for printing or sharing.
                </p>
              </div>
              <ul className="text-[11px] text-text-muted space-y-1.5 list-disc pl-4">
                <li>Formatted and branded layout.</li>
                <li>Alphabetized table structure.</li>
                <li>Roster sheets with details on clubs and nations.</li>
              </ul>
            </div>

            <button
              onClick={handleExportPdf}
              disabled={downloadingPdf}
              className="mt-8 flex w-full items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/80 text-white font-bold text-sm py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating Document...
                </>
              ) : (
                <>
                  <Download size={16} /> Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
