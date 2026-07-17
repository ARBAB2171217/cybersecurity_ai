"use client";

import { useAdmin } from "@/hooks/useAdmin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { Dialog } from "@/components/ui/Dialog";
import { useEffect, useState } from "react";
import { AuditLogEntry } from "@/types/admin";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuditLogsTable() {
  const { auditLogs, logsPages, logFilters, setLogFilters, fetchAuditLogs, isLoading } = useAdmin();
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleSearchChange = (val: string) => {
    setLogFilters((prev) => ({ ...prev, search: val || undefined, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setLogFilters((prev) => ({ ...prev, page }));
  };

  const safeAuditLogs = auditLogs ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 bg-zinc-950/20 p-4 rounded-xl border border-border/40">
        <div className="flex-grow">
          <SearchBar
            value={logFilters.search || ""}
            onChange={handleSearchChange}
            placeholder="Search audit actions or IP addresses..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center border border-border/40 rounded-xl bg-zinc-950/10">
          <span className="text-xs text-muted-foreground font-semibold animate-pulse">Loading security audit records...</span>
        </div>
      ) : safeAuditLogs.length === 0 ? (
        <div className="h-64 flex items-center justify-center border border-border/40 rounded-xl bg-zinc-950/10 text-center p-6">
          <span className="text-xs font-semibold text-muted-foreground">No security logs found.</span>
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Log ID</TableHead>
                <TableHead>Admin User</TableHead>
                <TableHead>Security Action</TableHead>
                <TableHead>Target Resource</TableHead>
                <TableHead>Origin IP</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeAuditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">#{log.id}</TableCell>
                  <TableCell className="font-bold text-foreground">{log.adminName || "System Process"}</TableCell>
                  <TableCell className="font-mono text-xs text-primary">{log.action}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.resource}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.ipAddress}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedLog(log)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={logFilters.page || 1}
            totalPages={logsPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <Dialog
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Details"
      >
        {selectedLog && (
          <div className="space-y-3 text-left text-xs text-muted-foreground mt-4">
            <div>
              <span className="font-bold text-foreground block">Event Action</span>
              <span className="font-mono bg-zinc-950 px-1 py-0.5 rounded border border-border/40 text-primary block mt-0.5">{selectedLog.action}</span>
            </div>
            <div>
              <span className="font-bold text-foreground block">Target Resource</span>
              <span className="font-mono mt-0.5 block">{selectedLog.resource}</span>
            </div>
            <div>
              <span className="font-bold text-foreground block">Diagnostic Details</span>
              <p className="mt-1 leading-relaxed text-foreground">{selectedLog.details}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/20">
              <div>
                <span className="font-bold text-foreground block">Administrator</span>
                <span>{selectedLog.adminName || "System"}</span>
              </div>
              <div>
                <span className="font-bold text-foreground block">Origin IP</span>
                <span className="font-mono">{selectedLog.ipAddress}</span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button size="sm" onClick={() => setSelectedLog(null)}>
                Close Details
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
export default AuditLogsTable;
