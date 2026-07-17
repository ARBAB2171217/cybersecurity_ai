"use client";

import { useReports } from "@/hooks/useReports";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useState } from "react";
import Link from "next/link";
import { Trash2, Eye, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { VALID_DENOMINATIONS } from "@/lib/constants";

import { useSearchParams } from "next/navigation";

export function ReportsTable() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || undefined;
  const { reports, total, pages, filters, isLoading, updateFilters, deleteReport } = useReports({ search: initialSearch });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const safeReports = reports ?? [];

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteReport(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end glass-card p-5">
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Search Scans</label>
          <SearchBar value={filters.search || ""} onChange={(val) => updateFilters({ search: val })} placeholder="Search serials or types..." />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Report Type</label>
          <Select
            value={filters.category || ""}
            onChange={(e) => updateFilters({ category: e.target.value || undefined, denomination: undefined, qrType: undefined, threatLevel: undefined })}
          >
            <option value="">All Types</option>
            <option value="Counterfeit Currency">Currency Scans</option>
            <option value="QR Code">QR Intelligence</option>
          </Select>
        </div>

        {filters.category === "QR Code" ? (
          <>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">QR Type</label>
              <Select
                value={filters.qrType || ""}
                onChange={(e) => updateFilters({ qrType: e.target.value || undefined })}
              >
                <option value="">All QR Types</option>
                <option value="UPI Payment">UPI Payment</option>
                <option value="Website URL">Website URL</option>
                <option value="WiFi">WiFi Network</option>
                <option value="SMS">SMS Message</option>
                <option value="Email">Email Draft</option>
                <option value="Phone Number">Phone Call</option>
              </Select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Threat Level</label>
              <Select
                value={filters.threatLevel || ""}
                onChange={(e) => updateFilters({ threatLevel: e.target.value || undefined })}
              >
                <option value="">All Threat Levels</option>
                <option value="Safe">Safe</option>
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
                <option value="Critical">Critical Risk</option>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Denomination</label>
              <Select
                value={filters.denomination || ""}
                onChange={(e) => updateFilters({ denomination: e.target.value || undefined })}
              >
                <option value="">All Denominations</option>
                {VALID_DENOMINATIONS.map((val) => (
                  <option key={val} value={val}>
                    ₹{val}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Verdict Status</label>
              <Select
                value={filters.status || ""}
                onChange={(e) => updateFilters({ status: (e.target.value as any) || undefined })}
              >
                <option value="">All Verification States</option>
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </div>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center glass-card">
          <span className="text-sm text-muted font-medium animate-pulse">Querying report catalog...</span>
        </div>
      ) : safeReports.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center glass-card text-center p-6">
          <span className="text-xs font-semibold text-muted-foreground">No reports matching selected filters.</span>
        </div>
      ) : (
        <div className="space-y-4 glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>AI Verdict</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeReports.map((report) => {
                const isQR = report.category === "QR Code";
                const isScreenshot = report.evidenceType && report.evidenceType !== "Currency Note" && report.evidenceType !== "QR Code";
                const qrDetails = report.rawAiResponse?.qr_details;
                const riskAnalysis = qrDetails?.risk_analysis;
                const riskScore = riskAnalysis?.risk_score ?? 0;
                const riskLevel = riskAnalysis?.risk_level ?? "Unknown";

                return (
                  <TableRow key={report.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">#{report.id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={isQR ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : isScreenshot ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}>
                        {isQR ? "QR Code" : isScreenshot ? "Screenshot" : "Currency"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isQR ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-foreground text-sm">{qrDetails?.qr_type || "Unknown QR"}</span>
                          <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]" title={qrDetails?.decoded_value}>
                            {qrDetails?.decoded_value}
                          </span>
                        </div>
                      ) : isScreenshot ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-foreground text-sm">{report.evidenceType}</span>
                          <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]" title={report.category}>
                            {report.category}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-foreground text-sm">₹{report.denomination}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Serial: {report.serialNumber || "N/A"}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {isQR ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                          riskLevel.toLowerCase() === 'safe' || riskLevel.toLowerCase() === 'low'
                            ? "text-emerald-400"
                            : riskLevel.toLowerCase() === 'medium'
                            ? "text-amber-400"
                            : "text-destructive"
                        }`}>
                          {riskLevel.toLowerCase() === 'safe' || riskLevel.toLowerCase() === 'low' ? (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          ) : (
                            <ShieldAlert className="h-3.5 w-3.5" />
                          )}
                          {riskLevel} (Score: {riskScore})
                        </span>
                      ) : isScreenshot ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                          report.isCounterfeit ? "text-destructive" : report.isCounterfeit === null ? "text-amber-400" : "text-emerald-400"
                        }`}>
                          {report.isCounterfeit ? (
                            <>
                              <ShieldAlert className="h-3.5 w-3.5" /> High Risk Scam
                            </>
                          ) : report.isCounterfeit === null ? (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5" /> Suspicious
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5" /> Safe
                            </>
                          )}
                        </span>
                      ) : (
                        report.isCounterfeit ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive">
                            <ShieldAlert className="h-3.5 w-3.5" /> Counterfeit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                            <ShieldCheck className="h-3.5 w-3.5" /> Genuine
                          </span>
                        )
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.status === "APPROVED" ? "success" : report.status === "REJECTED" ? "destructive" : "default"}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link href={`/detection-result/${report.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTargetId(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            currentPage={filters.page || 1}
            totalPages={pages}
            onPageChange={(page) => updateFilters({ page })}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Scan Report"
        description="Are you sure you want to delete this scan report? This action is permanent."
      />
    </div>
  );
}
export default ReportsTable;
