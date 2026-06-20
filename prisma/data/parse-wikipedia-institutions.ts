import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WIKIPEDIA_SOURCE_URL =
  "https://en.wikipedia.org/wiki/List_of_universities_in_Ghana";

const CATEGORY_TITLES = new Set([
  "Public university",
  "Private university",
  "Regional university",
  "University college",
]);

const SKIP_NAME_PATTERNS = [
  /^Sikkim Manipal/i,
  /^Karunya University/i,
  /^Webster University$/i,
  /^China Europe International/i,
  /^University of Wales/i,
  /^Australian Institute/i,
  /^North American Center/i,
  /^Maastricht School/i,
  /^United Nations University$/i,
  /^List of universities/i,
  /^Template/i,
  /^Special:/i,
  /^Dependencies and/i,
  /^Sovereign states/i,
  /affiliated institutions$/i,
  /^Diplomatic Missions Training/i,
  /^Other university colleges/i,
  /^Chartered private tertiary/i,
  /^Professional public institutes/i,
  /^There are fifteen/i,
  /^Regional university$/i,
  /^States with limited/i,
];

/** Normalize Wikipedia names to match search synonym canonical forms where needed. */
const NAME_ALIASES: Record<string, string> = {
  "University of Professional Studies":
    "University of Professional Studies Accra",
  "University of Professional Studies, Accra":
    "University of Professional Studies Accra",
  "University of Education, Winneba": "University of Education Winneba",
  "CK Tedam University for Technology and Applied Sciences":
    "C. K. Tedam University of Technology and Applied Sciences",
  "Simon Diedong Dombo University for Business and Integrated Development Studies":
    "Simon Diedong Dombo University of Business and Integrated Development Studies",
  "Akenten Appiah Menkah University of Skills Training and Entrepreneurial Development":
    "Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development",
  "Lancaster University, Ghana": "Lancaster University Ghana",
  "Webster University Ghana Campus": "Webster University Ghana",
  "BlueCrest College (formerly NIIT Ghana College)":
    "BlueCrest University College",
  "Central University College": "Central University",
  "Central University (Ghana)": "Central University",
  "Pentecost University College": "Pentecost University",
  "Methodist University College Ghana": "Methodist University Ghana",
  "Accra Polytechnic": "Accra Technical University",
  "Cape Coast Polytechnic": "Cape Coast Technical University",
  "Ghana Telecom University College":
    "Ghana Communication Technology University",
  "Kwame Nkrumah University of Science & Technology":
    "Kwame Nkrumah University of Science and Technology",
  "Ghana Armed Forces Command and Staff College - Master's degree":
    "Ghana Armed Forces Command and Staff College",
  "Meridian (Insaaniyya) University College": "Meridian University College",
  "Akrofi-Christaller Institute":
    "Akrofi-Christaller Institute of Theology, Mission and Culture",
};

function cleanPlainText(value: string): string {
  return value
    .replace(/\[\[?\d+\]?\]\([^)]*\)/g, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\(page does not exist\)/gi, "")
    .replace(/,\s*(Kumasi|Mampong)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseInstitutionCell(cell: string): string | null {
  const titleMatch = cell.match(/"([^"]+)"\s*\)/);
  if (titleMatch) {
    return cleanPlainText(titleMatch[1]);
  }

  const linkMatch = cell.match(/^\[([^\]]+)\]/);
  if (linkMatch) {
    return cleanPlainText(linkMatch[1]);
  }

  const plain = cleanPlainText(cell.split("[")[0] ?? "");
  return plain.length > 0 ? plain : null;
}

function shouldSkipName(name: string): boolean {
  if (name.length < 4) {
    return true;
  }

  if (CATEGORY_TITLES.has(name)) {
    return true;
  }

  return SKIP_NAME_PATTERNS.some((pattern) => pattern.test(name));
}

function normalizeName(name: string): string {
  return NAME_ALIASES[name] ?? name;
}

function isInstitutionTitle(title: string): boolean {
  return /(University|College|Institute|Institution|Seminary|Academy|Polytechnic|Technical)/i.test(
    title,
  );
}

function isTableHeaderRow(institutionCell: string, nickname: string): boolean {
  return institutionCell === "Institution" && nickname === "Nickname";
}

function extractLinkTitles(cell: string): string[] {
  const titles: string[] = [];
  const linkPattern = /\[([^\]]+)\]\([^)]*"([^"]+)"\)/g;

  for (const match of cell.matchAll(linkPattern)) {
    const title = cleanPlainText(match[2] ?? "");
    if (title.length >= 4 && isInstitutionTitle(title)) {
      titles.push(title);
    }
  }

  return titles;
}

function parseTableRows(markdown: string): string[] {
  const names = new Set<string>();
  const referencesIndex = markdown.indexOf("## References");
  const tableMarkdown =
    referencesIndex === -1 ? markdown : markdown.slice(0, referencesIndex);

  for (const line of tableMarkdown.split("\n")) {
    if (!line.startsWith("|") || line.includes("---")) {
      continue;
    }

    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length < 4) {
      continue;
    }

    const institutionCell = cells[1] ?? "";
    const nickname = cells[2] ?? "";

    if (!institutionCell || isTableHeaderRow(institutionCell, nickname)) {
      continue;
    }

    // Footer summary rows: category in col 1, institution links in col 2.
    const categoryTitle = institutionCell.match(/"([^"]+)"\s*\)/)?.[1];
    if (categoryTitle && CATEGORY_TITLES.has(categoryTitle)) {
      for (const title of extractLinkTitles(cells[2] ?? "")) {
        if (!shouldSkipName(title)) {
          names.add(normalizeName(title));
        }
      }
      continue;
    }

    const hasNickname =
      nickname.length > 0 &&
      nickname !== "Nickname" &&
      !/^\d{4}$/.test(nickname);
    const parsedName = parseInstitutionCell(institutionCell);
    const validWithoutNickname =
      !hasNickname &&
      parsedName !== null &&
      isInstitutionTitle(parsedName) &&
      !shouldSkipName(parsedName);

    if (!hasNickname && !validWithoutNickname) {
      continue;
    }

    if (!parsedName || shouldSkipName(parsedName)) {
      continue;
    }

    names.add(normalizeName(parsedName));
  }

  return [...names].sort((left, right) => left.localeCompare(right));
}

export function loadGhanaInstitutionNames(): string[] {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const markdownPath = join(moduleDir, "list-of-universities-in-ghana.md");
  const markdown = readFileSync(markdownPath, "utf8");

  if (!markdown.includes("List of universities in Ghana")) {
    throw new Error(
      `Unexpected Wikipedia export at ${markdownPath}. Expected article titled "List of universities in Ghana".`,
    );
  }

  return parseTableRows(markdown);
}

export const GHANA_INSTITUTIONS_SOURCE_URL = WIKIPEDIA_SOURCE_URL;
