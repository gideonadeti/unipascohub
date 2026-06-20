export const INSTITUTION_SYNONYMS: Record<string, string> = {
  // --- Public Universities ---
  ug: "University of Ghana",
  legon: "University of Ghana",
  knust: "Kwame Nkrumah University of Science and Technology",
  tech: "Kwame Nkrumah University of Science and Technology",
  ucc: "University of Cape Coast",
  uew: "University of Education Winneba",
  upsa: "University of Professional Studies Accra",
  umat: "University of Mines and Technology",
  uenr: "University of Energy and Natural Resources",
  uhas: "University of Health and Allied Sciences",
  uds: "University for Development Studies",
  ubids:
    "Simon Diedong Dombo University of Business and Integrated Development Studies",
  sdd_ubids:
    "Simon Diedong Dombo University of Business and Integrated Development Studies",
  sddubids:
    "Simon Diedong Dombo University of Business and Integrated Development Studies",
  utag: "University of Technology and Applied Sciences", // Often confused with the union, but used for CK Tedam UTAS
  untas: "C. K. Tedam University of Technology and Applied Sciences",
  ck_tedam: "C. K. Tedam University of Technology and Applied Sciences",
  cktedam: "C. K. Tedam University of Technology and Applied Sciences",
  gij: "University of Media, Arts and Communication",
  gil: "University of Media, Arts and Communication",
  nafti: "University of Media, Arts and Communication",
  unimac: "University of Media, Arts and Communication",
  aamusted:
    "Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development",

  // --- Technical Universities ---
  atu: "Accra Technical University",
  ksut: "Kumasi Technical University",
  kstu: "Kumasi Technical University",
  ttu: "Takoradi Technical University",
  ttu_gh: "Takoradi Technical University",
  htu: "Ho Technical University",
  ktu: "Koforidua Technical University",
  stut: "Sunyani Technical University",
  stu: "Sunyani Technical University",
  ttut: "Tamale Technical University",
  tatu: "Tamale Technical University",
  btu: "Bolgatanga Technical University",
  watu: "Wa Technical University",
  wtu: "Wa Technical University",
  cctu: "Cape Coast Technical University",

  // --- Private Universities & Colleges ---
  ashesi: "Ashesi University",
  central: "Central University",
  cu: "Central University",
  regent: "Regent University College of Science and Technology",
  guc: "Ghana Christian University College",
  vvu: "Valley View University",
  puc: "Pentecost University",
  pentvars: "Pentecost University",
  muc: "Methodist University Ghana",
  mug: "Methodist University Ghana",
  wiuc: "Wisconsin International University College",
  wisconsin: "Wisconsin International University College",
  aucc: "African University College of Communications",
  rmu: "Regional Maritime University",
  bui: "BlueCrest University College",
  bluecrest: "BlueCrest University College",
  anc: "African University College",
  knutsford: "Knutsford University College",
  radford: "Radford University College",
  lancaster: "Lancaster University Ghana",
  webster: "Webster University Ghana",
  ait: "Ghana-India Kofi Annan Centre of Excellence in ICT", // Or Accra Institute of Technology depending on context
  accra_institute_of_technology: "Accra Institute of Technology",

  // --- Specialized / Other Public Institutions ---
  gimpa: "Ghana Institute of Management and Public Administration",
  milgh: "Ghana Military Academy",
  gma: "Ghana Military Academy",
};

// Generated pattern handling case-insensitive boundaries safely
const INSTITUTION_SYNONYM_PATTERN = new RegExp(
  `\\b(${Object.keys(INSTITUTION_SYNONYMS).join("|")})\\b`,
  "gi",
);

export function expandInstitutionSynonyms(query: string): string {
  return query.replace(
    INSTITUTION_SYNONYM_PATTERN,
    (match) => INSTITUTION_SYNONYMS[match.toLowerCase()] ?? match,
  );
}
