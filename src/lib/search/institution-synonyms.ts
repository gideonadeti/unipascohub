export const INSTITUTION_SYNONYMS: Record<string, string> = {
  ug: "University of Ghana",
  legon: "University of Ghana",
  knust: "Kwame Nkrumah University of Science and Technology",
  ucc: "University of Cape Coast",
  uew: "University of Education Winneba",
  upsa: "University of Professional Studies Accra",
  umat: "University of Mines and Technology",
};

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
