import { useState, useRef } from "react";
import { Upload, X, File, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string;
}

export function FileUploadZone({
  files,
  onFilesChange,
  maxFiles = 5,
  maxSize = 50,
  accept = "image/*,video/*,application/pdf"
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const sizeMB = file.size / (1024 * 1024);
      return sizeMB <= maxSize;
    });

    const updatedFiles = [...files, ...validFiles].slice(0, maxFiles);
    onFilesChange(updatedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    onFilesChange(updatedFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-5 w-5" />;
    if (file.type.startsWith("video/")) return <Video className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith("image/")) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="h-20 w-20 object-cover rounded-lg"
        />
      );
    }
    return (
      <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center">
        {getFileIcon(file)}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "glass-card rounded-xl p-8 text-center cursor-pointer transition-all hover-lift",
          isDragging && "border-primary bg-primary/5 shadow-neon"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-gradient-to-br from-primary to-accent animate-gradient">
            <Upload className="h-8 w-8 text-primary-foreground" />
          </div>
          
          <div>
            <p className="font-semibold text-lg">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Max {maxFiles} files, {maxSize}MB each
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative glass-card rounded-lg p-3 hover-scale group"
            >
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
              
              <div className="flex flex-col items-center gap-2">
                {getFilePreview(file)}
                <p className="text-xs text-center truncate w-full">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
