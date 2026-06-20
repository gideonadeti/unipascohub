export const INSTITUTION_SYNONYMS: Record<string, string> = {
  // --- Public Universities ---
  ug: "University of Ghana",
  legon: "University of Ghana",
  knust: "Kwame Nkrumah University of Science and Technology",
  tech: "Kwame Nkrumah University of Science and Technology",
  ucc: "University of Cape Coast",
  capevars: "University of Cape Coast",
  cape_vars: "University of Cape Coast",
  uew: "University of Education Winneba",
  ups: "University of Professional Studies Accra",
  upsa: "University of Professional Studies Accra",
  umat: "University of Mines and Technology",
  uenr: "University of Energy and Natural Resources",
  uhas: "University of Health and Allied Sciences",
  uds: "University for Development Studies",
  uesd: "University of Environment and Sustainable Development",
  ubids:
    "Simon Diedong Dombo University of Business and Integrated Development Studies",
  sdd_ubids:
    "Simon Diedong Dombo University of Business and Integrated Development Studies",
  sddubids:
    "Simon Diedong Dombo University of Business and Integrated Development Studies",
  untas: "C. K. Tedam University of Technology and Applied Sciences",
  ckt_utas: "C. K. Tedam University of Technology and Applied Sciences",
  cktutas: "C. K. Tedam University of Technology and Applied Sciences",
  ck_tedam: "C. K. Tedam University of Technology and Applied Sciences",
  cktedam: "C. K. Tedam University of Technology and Applied Sciences",
  gij: "Ghana Institute of Journalism",
  gil: "Ghana Institute of Languages",
  nafti: "National Film and Television Institute",
  aamusted:
    "Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development",
  aam_usted:
    "Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development",

  // --- Technical Universities ---
  atu: "Accra Technical University",
  accra_polytechnic: "Accra Technical University",
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
  cape_coast_polytechnic: "Cape Coast Technical University",

  // --- Private Universities & Colleges ---
  ashesi: "Ashesi University",
  central: "Central University",
  cu: "Central University",
  regent: "Regent University College of Science and Technology",
  guc: "Ghana Christian University College",
  vvu: "Valley View University",
  puc: "Presbyterian University College",
  presbyterian: "Presbyterian University College",
  pent: "Pentecost University",
  pentvars: "Pentecost University",
  muc: "Methodist University Ghana",
  mucg: "Methodist University Ghana",
  mug: "Methodist University Ghana",
  wiuc: "Wisconsin International University College",
  wisconsin: "Wisconsin International University College",
  aucc: "African University College of Communications",
  rmu: "Regional Maritime University",
  bui: "BlueCrest University College",
  bluecrest: "BlueCrest University College",
  knutsford: "Knutsford University College",
  radford: "Radford University College",
  lancaster: "Lancaster University Ghana",
  lug: "Lancaster University Ghana",
  webster: "Webster University Ghana",
  ait: "Accra Institute of Technology",
  accra_institute_of_technology: "Accra Institute of Technology",
  anu: "All Nations University",
  cug: "Catholic University College of Ghana",
  iucg: "Islamic University College, Ghana",
  hcu: "Heritage Christian University",
  kaaf: "KAAF University",
  zuc: "Zenith University College",
  zenith: "Zenith University College",
  gcuc: "Garden City University College",
  garden_city: "Garden City University College",

  // --- Specialized / Other Public Institutions ---
  gimpa: "Ghana Institute of Management and Public Administration",
  gctu: "Ghana Communication Technology University",
  ghana_telecom: "Ghana Communication Technology University",
  gafcsc: "Ghana Armed Forces Command and Staff College",
};

const INSTITUTION_SYNONYM_KEYS = Object.keys(INSTITUTION_SYNONYMS).sort(
  (left, right) => right.length - left.length,
);

const INSTITUTION_SYNONYM_PATTERN = new RegExp(
  `\\b(${INSTITUTION_SYNONYM_KEYS.join("|")})\\b`,
  "gi",
);

export function expandInstitutionSynonyms(query: string): string {
  return query.replace(
    INSTITUTION_SYNONYM_PATTERN,
    (match) => INSTITUTION_SYNONYMS[match.toLowerCase()] ?? match,
  );
}
