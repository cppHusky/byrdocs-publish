"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button, ButtonKbd } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Upload as UploadIcon,
  FileText,
  Trash2,
  ExternalLink,
  AlertCircle,
  User,
  Loader2,
} from "lucide-react";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import CryptoJS from "crypto-js";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { GithubIcon } from "./icon/github";

interface FileUploadProps {
  allowedTypes: string[];
  onUploadSuccess: (key: string, fileInfo?: { name: string; size: number }) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  initialUploadedKey?: string; // 初始已上传的文件key
  initialFileInfo?: { name: string; size: number } | null; // 初始文件信息
  onReset?: () => void; // 重置回调
  onSwitchToUrl?: (url: string) => void; // 切换到粘贴链接模式的回调
  onFileSelected?: (file: File | null) => void; // 文件选择回调
  disableShortcuts?: boolean; // 禁用快捷键
}

interface S3Credentials {
  access_key_id: string;
  secret_access_key: string;
  session_token: string;
}

interface S3UploadResponse {
  success: boolean;
  code?: string;
  key?: string;
  host?: string;
  bucket?: string;
  tags?: { status: string };
  credentials?: S3Credentials;
  error?: string;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export default function FileUpload({ 
  allowedTypes, 
  onUploadSuccess, 
  onUploadError,
  className,
  initialUploadedKey,
  initialFileInfo,
  onReset,
  onSwitchToUrl,
  onFileSelected,
  disableShortcuts = false
}: FileUploadProps) {
  const { token, isLoading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [md5Progress, setMd5Progress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'calculating' | 'calculated' | 'preparing' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [md5Hash, setMd5Hash] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [highlightTypes, setHighlightTypes] = useState(false);
  const [uploadedKey, setUploadedKey] = useState<string>(''); // 保存上传成功的key
  const [fileExistsError, setFileExistsError] = useState<{ md5: string; extension: string } | null>(null); // 文件已存在错误信息
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);



  // Handle initial uploaded key
  useEffect(() => {
    if (initialUploadedKey && initialUploadedKey !== uploadedKey) {
      setUploadedKey(initialUploadedKey);
      setUploadStatus('success');
      setUploadProgress(100);
      // 从key中提取文件信息用于显示
      const keyParts = initialUploadedKey.split('.');
      if (keyParts.length >= 2) {
        const extension = keyParts[keyParts.length - 1];
        const md5 = keyParts.slice(0, -1).join('.');
        setMd5Hash(md5);
        if (!initialFileInfo?.name || !initialFileInfo?.size) {
          return;
        }
        const fileName = initialFileInfo?.name;
        const fileSize = initialFileInfo?.size;
        const virtualFile = new File([], fileName, { type: `application/${extension}` });
        Object.defineProperty(virtualFile, 'size', { value: fileSize, writable: false });
        setSelectedFile(virtualFile);
      }
    }
  }, [initialUploadedKey, uploadedKey, initialFileInfo]);

  // Calculate MD5 hash in chunks
  const calculateMD5 = useCallback(async (file: File, signal?: AbortSignal): Promise<string> => {
    return new Promise((resolve, reject) => {
      const hash = CryptoJS.algo.MD5.create();
      let currentChunk = 0;
      const chunks = Math.ceil(file.size / CHUNK_SIZE);

      const processChunk = async () => {
        // Check if operation was aborted
        if (signal?.aborted) {
          reject(new DOMException('MD5 calculation was aborted', 'AbortError'));
          return;
        }

        if (currentChunk >= chunks) {
          const md5 = hash.finalize().toString();
          resolve(md5);
          return;
        }

        const start = currentChunk * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        
        try {
          const arrayBuffer = await chunk.arrayBuffer();
          const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
          hash.update(wordArray);
          currentChunk++;
          
          setMd5Progress((currentChunk / chunks) * 100); // MD5 calculation progress
          
          // Use setTimeout to avoid blocking the UI
          setTimeout(processChunk, 0);
        } catch (error) {
          reject(error);
        }
      };

      // Listen for abort signal
      if (signal) {
        signal.addEventListener('abort', () => {
          reject(new DOMException('MD5 calculation was aborted', 'AbortError'));
        });
      }

      processChunk();
    });
  }, []);

  // Get S3 upload credentials
  const getS3Credentials = async (key: string, signal?: AbortSignal): Promise<S3UploadResponse> => {
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('https://byrdocs.org/api/s3/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ key }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Upload file to S3 using AWS SDK Upload
  const uploadToS3 = async (
    file: File,
    s3Config: S3UploadResponse,
    signal?: AbortSignal
  ): Promise<void> => {
    if (!s3Config.host || !s3Config.bucket || !s3Config.credentials || !s3Config.key) {
      throw new Error('Invalid S3 configuration');
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: s3Config.host,
      forcePathStyle: true,
      credentials: {
        accessKeyId: s3Config.credentials.access_key_id,
        secretAccessKey: s3Config.credentials.secret_access_key,
        sessionToken: s3Config.credentials.session_token,
      },
    });

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: s3Config.bucket,
        Key: s3Config.key,
        Body: file,
        Tagging: s3Config.tags ? Object.entries(s3Config.tags).map(([key, value]) => `${key}=${value}`).join('&') : undefined,
      },
      queueSize: 1,
      partSize: CHUNK_SIZE,
      leavePartsOnError: false,
    });

    upload.on("httpUploadProgress", (progress) => {
      if (progress.total) {
        const percentage = Math.round((progress.loaded! / progress.total) * 100);
        setUploadProgress(percentage);
      }
    });

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        upload.abort();
      });
    }

    await upload.done();
  };



  const validateAndSetFile = async (file: File) => {
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      setErrorMessage(`只支持 ${allowedTypes.join(', ')} 格式的文件`);
      setUploadStatus('error');
      setHighlightTypes(true);
      setTimeout(() => setHighlightTypes(false), 3000);
      return false;
    }

    setSelectedFile(file);
    onFileSelected?.(file);
    setUploadStatus('calculating');
    setMd5Progress(0);
    setUploadProgress(0);
    setErrorMessage('');
    setMd5Hash('');
    setFileExistsError(null);
    
    // Create new abort controller for MD5 calculation
    abortControllerRef.current = new AbortController();
    
    // Start calculating MD5 immediately
    try {
      const md5 = await calculateMD5(file, abortControllerRef.current.signal);
      setMd5Hash(md5);
      setUploadStatus('calculated');
      setMd5Progress(100);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setUploadStatus('idle');
        setMd5Progress(0);
        setUploadProgress(0);
        setSelectedFile(null);
        onFileSelected?.(null);
        return false;
      }
      setErrorMessage('计算文件哈希值失败');
      setUploadStatus('error');
    }
    
    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !md5Hash) return;

    setUploadStatus('preparing');
    setUploadProgress(0);
    setErrorMessage('');
    
    abortControllerRef.current = new AbortController();

    try {
      // Get file extension
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      const key = `${md5Hash}.${fileExtension}`;

      // Get S3 credentials
      const s3Config = await getS3Credentials(key, abortControllerRef.current.signal);
      
      if (!s3Config.success) {
        if (s3Config.code === 'FILE_EXISTS') {
          const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
          setFileExistsError({ md5: md5Hash, extension: fileExtension || 'pdf' });
          setUploadStatus('error');
          return;
        }
        throw new Error(s3Config.error || '获取上传凭证失败');
      }

      // Start uploading
      setUploadStatus('uploading');
      await uploadToS3(selectedFile, s3Config, abortControllerRef.current.signal);
      
      setUploadStatus('success');
      setUploadedKey(key);
      onUploadSuccess(key, selectedFile ? { name: selectedFile.name, size: selectedFile.size } : undefined);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setErrorMessage('上传已取消');
        setUploadStatus('error');
        return;
      }
      console.error('Upload failed:', error);
      setErrorMessage(error instanceof Error ? error.message : '上传失败');
      setUploadStatus('error');
      onUploadError?.(error instanceof Error ? error.message : '上传失败');
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileSelected?.(null);
    setUploadStatus('idle');
    setMd5Progress(0);
    setUploadProgress(0);
    setErrorMessage('');
    setMd5Hash('');
    setUploadedKey('');
    setFileExistsError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    onReset?.();
  };

  const handleUseExistingFile = () => {
    if (fileExistsError && onSwitchToUrl) {
      const url = `https://byrdocs.org/files/${fileExistsError.md5}.${fileExistsError.extension}`;
      
      setSelectedFile(null);
      onFileSelected?.(null);
      onReset?.();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      onSwitchToUrl(url);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-destructive';
      case 'uploading':
      case 'calculating':
      case 'preparing':
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'calculating':
        return '正在计算文件哈希值...';
      case 'calculated':
        return '准备上传';
      case 'preparing':
        return '正在获取上传凭证...';
      case 'uploading':
        return '正在上传...';
      case 'success':
        return '上传成功';
      case 'error':
        return '上传失败';
      default:
        return '准备上传';
    }
  };

  const handleLogin = () => {
    window.open('/login?close=true', '_blank');
  };


  if (!token) {
    return (
      <Card className={cn("w-full max-w-md mx-auto", className)}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <GithubIcon className="w-6 h-6 text-primary" />
            )}
          </div>
          <CardTitle>登录以上传文件</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleLogin} 
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            使用 GitHub 登录
            <ExternalLink className="w-4 h-4 mr-2" />
            {!disableShortcuts && <ButtonKbd invert={true}>l</ButtonKbd>}
          </Button>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <UploadIcon className="w-5 h-5" />
          上传文件
        </CardTitle>
        <CardDescription>
          
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedFile === null? (
          <div className="space-y-4">
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileText className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className={`text-sm mb-1 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`}>
                {isDragOver ? '释放文件以上传' : '拖动文件到此处或点击选择'} 
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-0 ml-1 pointer-events-none"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {!disableShortcuts && <ButtonKbd>u</ButtonKbd>}
                </Button>
              </p>
              <p className={`text-xs transition-colors ${
                highlightTypes 
                  ? 'text-red-600 font-medium' 
                  : 'text-muted-foreground'
              }`}>
                支持的文件类型: {allowedTypes.join(', ')}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={allowedTypes.map(type => `.${type}`).join(',')}
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={uploadStatus === 'calculating' || uploadStatus === 'preparing' || uploadStatus === 'uploading'}
              >
                <Trash2 className="w-4 h-4" />
                {!disableShortcuts && <ButtonKbd>d</ButtonKbd>}
              </Button>
            </div>

            {uploadStatus === 'calculating' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={getStatusColor()}>正在计算文件哈希值...</span>
                  <span className="text-muted-foreground">
                    {Math.round(md5Progress)}%
                  </span>
                </div>
                <Progress value={md5Progress} className="h-2" />
              </div>
            )}

            {uploadStatus === 'preparing' && (
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className={getStatusColor()}>{getStatusText()}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>
            )}

            {(uploadStatus === 'uploading' || uploadStatus === 'success') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={getStatusColor()}>
                    {uploadedKey ? (
                      <span className="ml-1 text-green-600 font-mono break-all">
                        <a 
                          href={`https://byrdocs.org/files/${uploadedKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {getStatusText()}
                          <ExternalLink size={12} className="inline-block ml-1" />
                        </a>
                      </span>
                    ) : getStatusText()}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm text-red-600">
                  {fileExistsError ? (
                    <div className="space-y-2">
                      <div>文件已存在</div>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        onClick={handleUseExistingFile}
                      >
                        使用该文件
                        {!disableShortcuts && <ButtonKbd>r</ButtonKbd>}
                      </Button>
                    </div>
                  ) : (
                    errorMessage
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {uploadStatus === 'calculated' || uploadStatus === 'error' ? (
                <Button 
                  onClick={handleUpload} 
                  className="flex-1"
                  disabled={!selectedFile || !md5Hash}
                >
                  <UploadIcon className="w-4 h-4 mr-1" />
                  上传
                  {!disableShortcuts && <ButtonKbd invert={true}>f</ButtonKbd>}
                </Button>
              ) : uploadStatus === 'calculating' ? (
                <>
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={handleCancel}
                  >
                    取消
                    {!disableShortcuts && <ButtonKbd>c</ButtonKbd>}
                  </Button>
                </>
              ) : uploadStatus === 'preparing' || uploadStatus === 'uploading' ? (
                <>
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={handleCancel}
                  >
                    取消
                    {!disableShortcuts && <ButtonKbd>c</ButtonKbd>}
                  </Button>
                </>
              ) : uploadStatus === 'success' ? (
                null
              ) : (
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  disabled
                >
                  {getStatusText()}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 