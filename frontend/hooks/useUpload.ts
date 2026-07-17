import { useState } from "react";
import { uploadService } from "@/services/upload.service";
import type { Report } from "@/types";

export function useUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResult(null);
      setError(null);
    } else {
      setFile(null);
    }
  };

  const upload = async (denomination: number) => {
    if (!file) {
      setError("Please select a banknote image file to analyze.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await uploadService.detectCurrency({
        file,
        denomination: denomination as any,
      });
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.message || "Failed to analyze banknote.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze banknote.");
    } finally {
      setIsLoading(false);
    }
  };


  const clear = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return {
    file,
    isLoading,
    result,
    error,
    selectFile,
    upload,
    clear,
  };
}
export default useUpload;
