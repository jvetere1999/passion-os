"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { HardDrive } from "lucide-react";

interface StorageUsageProps {
  used: number;
  total: number;
}

export default function StorageUsage({ used, total }: StorageUsageProps) {
  const percentage = Math.round((used / total) * 100);
  const available = total - used;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getColor = () => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getWarning = () => {
    if (percentage >= 90) {
      return "⚠️ Storage almost full";
    }
    if (percentage >= 80) {
      return "⚠️ 80% of storage used";
    }
    return null;
  };

  const warning = getWarning();

  return (
    <Card className="border-slate-700 bg-slate-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-slate-400" />
          <CardTitle className="text-white">Storage Usage</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">{formatBytes(used)}</span>
              <span className="text-slate-400">{percentage}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${getColor()} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="text-right text-xs text-slate-500">
              {formatBytes(available)} available
            </div>
          </div>

          {/* Warning */}
          {warning && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-300">{warning}</p>
            </div>
          )}

          {/* Info */}
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-500 space-y-1">
            <p>✓ Versioning enabled</p>
            <p>✓ Automatic backups</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
