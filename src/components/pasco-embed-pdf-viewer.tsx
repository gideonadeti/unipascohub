"use client";

import { PDFViewer } from "@embedpdf/react-pdf-viewer";

type PascoEmbedPdfViewerProps = {
  fileUrl: string;
};

export function PascoEmbedPdfViewer({ fileUrl }: PascoEmbedPdfViewerProps) {
  return (
    <PDFViewer
      config={{
        src: fileUrl,
        tabBar: "never",
        theme: { preference: "system" },
        disabledCategories: [
          "annotation",
          "redaction",
          "form",
          "print",
          "export",
          "insert",
          "document-open",
          "history",
          "security-unlock-overlay",
        ],
        permissions: {
          overrides: {
            print: false,
          },
        },
      }}
    />
  );
}
