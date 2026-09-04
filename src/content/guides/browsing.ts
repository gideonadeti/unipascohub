import type { Guide } from "./types";

export const browsingGuide: Guide = {
  title: "How to browse",
  description:
    "How to find past exam papers on Uni Pasco Hub: search, filters, badges, and downloads.",
  sections: [
    {
      title: "Quick start",
      paragraphs: [
        "The fastest way to find a paper is the search box on the homepage. Type what you know — a course code, a year, a level — and press Enter.",
        "Results open on the browse page as cards. Click a card to open the paper.",
      ],
      links: [{ label: "Browse pascos", href: "/pascos" }],
    },
    {
      title: "Search understands structure",
      paragraphs: [
        "The search box parses your text into filters. You do not need the filter panel for things you can type.",
      ],
      bullets: [
        "A course code like DCIT 101 or MATH201 finds that course.",
        "A year like 2024/2025 filters to that academic year. A bare year like 2024 expands to 2024/2025.",
        "A bare level like 100, or level 200, filters to that level.",
        "Exam words map to types: mid sem, end of sem, finals, resit.",
        "Semester words work too: sem 1, sem 2.",
        "Institution shortcuts are recognized: UG, Legon, KNUST, ATU, UCC, UPSA, and more.",
        "Combine freely: DCIT 101 2024/2025 level 200.",
      ],
    },
    {
      title: "Course matches",
      paragraphs: [
        "If your text matches exactly one course, its filter is applied automatically.",
        "If several courses match, you get a pick-a-course list showing codes and institutions. Choose one to narrow the results.",
        "If no course matches, results still appear based on the rest of your search. Try a course code if you know it.",
      ],
    },
    {
      title: "Filters",
      paragraphs: [
        "The browse page has a filter panel: institution, program, course, year, level, study mode, semester, exam type, content type, and complete uploads only.",
        "Filters live in the URL. Copy the address bar to share a filtered view.",
        "Explicit filters override whatever the search text parsed.",
        "On mobile, the panel is behind the Filters button.",
      ],
    },
    {
      title: "Sorting and pages",
      paragraphs: [
        "Results sort by date added by default. Switch to views, likes, downloads, or academic year, ascending or descending.",
        "Pagination sits at the bottom of the results.",
      ],
    },
    {
      title: "What the badges mean",
      paragraphs: [
        "Cards and detail pages carry badges. They tell you what you are about to open:",
      ],
      bullets: [
        "Incomplete upload — the uploader marked pages as missing. Expect gaps.",
        "Partially solved — some questions have solutions.",
        "A content badge like Questions and answers — the paper includes answers, not just questions.",
        "A type badge like Mid sem or Resit — which exam the paper came from.",
      ],
    },
    {
      title: "Viewing and downloading",
      paragraphs: [
        "Sign in to view or download files. View opens PDFs and images in a reader on the page. Documents download instead of previewing.",
        "Papers with multiple files have a Download all button that gives you a ZIP.",
        "Files are served through short-lived signed links. Copying a file URL will not keep working.",
      ],
    },
    {
      title: "Reactions and reports",
      paragraphs: [
        "Sign in to like or dislike a paper. Dislikes are not just votes — enough of them move a paper into moderation review.",
        "Something wrong with the content? Use Report on the paper's page to send a content issue to moderators.",
      ],
    },
    {
      title: "If you cannot find it",
      bullets: [
        "Drop the year or level from your search and try again.",
        "Check a nearby year — course codes and titles change.",
        "Pick a course from the suggestions instead of free text.",
        "Still nothing? It may not exist yet. Upload it if you have it.",
      ],
      links: [
        { label: "How to upload", href: "/guides/uploading" },
        { label: "Browse pascos", href: "/pascos" },
      ],
    },
  ],
};
