"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/user.service";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Camera } from "lucide-react";

export function ProfilePictureUpload() {
  const { user, checkAuth } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed.");
      return;
    }

    setIsUploading(true);
    try {
      const res = await userService.uploadAvatar(file);
      if (res.success) {
        await checkAuth(); // Refresh user state
      } else {
        alert(res.message || "Failed to upload avatar.");
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to upload avatar.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const avatarUrl = (user as any)?.avatar 
    ? ((user as any).avatar.startsWith("http") ? (user as any).avatar : `${process.env.NEXT_PUBLIC_API_URL}${(user as any).avatar}`)
    : undefined;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border rounded-xl bg-card">
      <div className="relative group">
        <Avatar 
          src={avatarUrl} 
          alt={user?.fullName} 
          fallback={getInitials(user?.fullName)}
          size="lg"
          className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-md text-2xl sm:text-4xl bg-primary/10 text-primary font-bold" 
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
        >
          {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8" />}
        </button>
      </div>
      
      <div className="text-center sm:text-left space-y-2 flex-1">
        <h3 className="font-semibold text-lg">Profile Picture</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Upload a new profile picture. Recommended size is 256x256px. Max file size is 5MB.
        </p>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
        />
        <div className="pt-2">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Upload Image</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
