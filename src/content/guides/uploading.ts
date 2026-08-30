import type { Guide } from "./types";

export const uploadingGuide: Guide = {
  title: "How to upload",
  description:
    "How to share past exam papers on Uni Pasco Hub: contributor access, the upload form, file rules, and what happens after.",
  sections: [
    {
      title: "Become a contributor",
      paragraphs: [
        "Uploading requires a contributor account. Any signed-in user can get one instantly — no application, no waiting.",
      ],
      steps: [
        "Open the upload page.",
        "Click Become a contributor. Your account is upgraded on the spot.",
        "Continue to the form.",
      ],
      links: [{ label: "Upload pasco", href: "/pascos/new" }],
    },
    {
      title: "Pick the course",
      paragraphs: [
        "Every paper belongs to a course. Select institution, then program, then course — the dropdowns unlock in that order.",
        "Program or course missing? Use Add a program or Add a course in the same form. Added courses are usually available immediately; programs go through a quick review.",
        "You cannot upload files until a course is selected.",
      ],
    },
    {
      title: "Fill in the exam details",
      bullets: [
        "Academic year — the year the exam was written, like 2025/2026. The last ten years are available.",
        "Level — 100 to 400.",
        "Study mode — full time, part time, distance, evening, or weekend.",
        "Semester — first or second.",
        "Exam type — mid sem, end of sem, or resit.",
        "Content type — questions only, questions and answers, or answers only. If answers are included, also pick how complete the solutions are.",
        "Description (optional) — anything a student should know, up to 1000 characters.",
        "Complete upload — leave checked only if all pages are included. Uncheck it if pages are missing; students will see an Incomplete upload badge.",
      ],
    },
    {
      title: "Prepare your files first",
      paragraphs: [
        "Photograph all pages before you start the form — don't upload as you shoot.",
      ],
      bullets: [
        "Good light, flat surface, steady hands. Blurry pages are useless to everyone.",
        "Check every photo is readable before uploading.",
        "Keep pages in order.",
        "Papers carry personal data: names, index numbers, signatures, handwritten comments.",
        "Mask or crop them out in any photo editor before uploading. Applies to documents too.",
        "Uploads go live immediately with no review — whatever you upload is public at once.",
        "Don't share other students' scripts with their details visible.",
      ],
    },
    {
      title: "File rules",
      bullets: [
        "Allowed: PDF, images (JPG, PNG, WebP, GIF), and documents (DOC, DOCX, TXT, RTF, ODT).",
        "Not allowed: spreadsheets (XLS, XLSX, CSV, ODS) and password-protected PDFs.",
        "Up to 10 files per paper, 5 MB per file.",
        "Exact duplicates are blocked. If a file already exists on the hub, you get a link to it instead of a second copy.",
        "Large PDF? Compress it for free and try again.",
      ],
      links: [
        {
          label: "iLovePDF compressor",
          href: "https://www.ilovepdf.com/compress_pdf",
        },
      ],
    },
    {
      title: "After you submit",
      paragraphs: [
        "Papers publish immediately. There is no approval queue — your upload is live as soon as you submit.",
        "Moderation is reactive. If a paper collects enough dislikes, it goes under review. Moderators approve it back or reject it with a reason.",
        "Rejected papers are visible only to you. Edit and resubmit to bring them back.",
      ],
    },
    {
      title: "Manage your uploads",
      paragraphs: [
        "My contributions lists every paper you have uploaded with its status, plus your catalog requests. Edit or delete from there.",
        "Uploaders and moderators can edit a paper. Uploaders and admins can delete it.",
      ],
      links: [{ label: "My contributions", href: "/contributions" }],
    },
    {
      title: "Before you hit submit",
      bullets: [
        "Right course, right year, right level.",
        "All pages included, and the complete checkbox reflects it.",
        "No passwords, no spreadsheets, under 5 MB per file.",
        "No personal details visible on any page.",
        "Clear file names help students find what they need.",
      ],
      links: [{ label: "How to browse", href: "/guides/browsing" }],
    },
  ],
};
