export type GuideLink = {
  label: string;
  href: string;
};

export type GuideSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: string[];
  links?: GuideLink[];
};

export type Guide = {
  title: string;
  description: string;
  sections: GuideSection[];
};
