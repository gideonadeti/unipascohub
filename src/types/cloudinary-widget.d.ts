export type CloudinaryWidgetUploadInfo = {
  public_id: string;
  secure_url: string;
  bytes: number;
  resource_type?: string;
  original_filename?: string;
  format?: string;
  display_name?: string;
};

export type CloudinaryWidgetResult = {
  event: string;
  info?: CloudinaryWidgetUploadInfo;
};

export type CloudinaryPrepareUploadParams = {
  file?: File | { name?: string };
  source?: File | { name?: string } | string;
  filename?: string;
  fileName?: string;
  name?: string;
  publicId?: string;
  public_id?: string;
  timestamp?: number;
  asset_folder?: string;
  upload_preset?: string;
};

export type CloudinaryPreBatchData = {
  files?: Array<{ name: string; size?: number }>;
};

export type CloudinaryPreBatchCallbackResult = {
  cancel?: boolean;
  error?: string;
};

export type CloudinaryUploadWidget = {
  open: () => void;
  close: () => void;
  destroy: () => void;
};

export type CloudinaryUploadWidgetConstructor = {
  createUploadWidget: (
    options: Record<string, unknown>,
    callback: (error: unknown, result: CloudinaryWidgetResult) => void,
  ) => CloudinaryUploadWidget;
};

declare global {
  interface Window {
    cloudinary?: CloudinaryUploadWidgetConstructor;
  }
}
