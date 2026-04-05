import * as v from "valibot";

const ISO8601_REGEX =
  /^([1-2][0-9]{3}-[0-1][0-9]-[0-3][0-9]|[1-2][0-9]{3}-[0-1][0-9]|[1-2][0-9]{3})$/;

export const ISO8601Schema = v.pipe(v.string(), v.regex(ISO8601_REGEX));

export type ISO8601 = v.InferOutput<typeof ISO8601Schema>;

export const LocationSchema = v.object({
  address: v.optional(v.string()),
  postalCode: v.optional(v.string()),
  city: v.optional(v.string()),
  countryCode: v.optional(v.string()),
  region: v.optional(v.string()),
});

export type Location = v.InferOutput<typeof LocationSchema>;

export const ProfileSchema = v.object({
  network: v.optional(v.string()),
  username: v.optional(v.string()),
  url: v.optional(v.string()),
});

export type Profile = v.InferOutput<typeof ProfileSchema>;

export const BasicsSchema = v.object({
  name: v.optional(v.string()),
  label: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  url: v.optional(v.string()),
  summary: v.optional(v.string()),
  location: v.optional(LocationSchema),
  profiles: v.optional(v.array(ProfileSchema)),
});

export type Basics = v.InferOutput<typeof BasicsSchema>;

export const WorkSchema = v.object({
  name: v.optional(v.string()),
  location: v.optional(v.string()),
  description: v.optional(v.string()),
  position: v.optional(v.string()),
  url: v.optional(v.string()),
  startDate: v.optional(ISO8601Schema),
  endDate: v.optional(ISO8601Schema),
  summary: v.optional(v.string()),
  highlights: v.optional(v.array(v.string())),
});

export type Work = v.InferOutput<typeof WorkSchema>;

export const VolunteerSchema = v.object({
  organization: v.optional(v.string()),
  position: v.optional(v.string()),
  url: v.optional(v.string()),
  startDate: v.optional(ISO8601Schema),
  endDate: v.optional(ISO8601Schema),
  summary: v.optional(v.string()),
  highlights: v.optional(v.array(v.string())),
});

export type Volunteer = v.InferOutput<typeof VolunteerSchema>;

export const EducationSchema = v.object({
  institution: v.optional(v.string()),
  url: v.optional(v.string()),
  area: v.optional(v.string()),
  studyType: v.optional(v.string()),
  startDate: v.optional(ISO8601Schema),
  endDate: v.optional(ISO8601Schema),
  score: v.optional(v.string()),
  courses: v.optional(v.array(v.string())),
});

export type Education = v.InferOutput<typeof EducationSchema>;

export const AwardSchema = v.object({
  title: v.optional(v.string()),
  date: v.optional(ISO8601Schema),
  awarder: v.optional(v.string()),
  summary: v.optional(v.string()),
});

export type Award = v.InferOutput<typeof AwardSchema>;

export const CertificateSchema = v.object({
  name: v.optional(v.string()),
  date: v.optional(ISO8601Schema),
  url: v.optional(v.string()),
  issuer: v.optional(v.string()),
});

export type Certificate = v.InferOutput<typeof CertificateSchema>;

export const PublicationSchema = v.object({
  name: v.optional(v.string()),
  publisher: v.optional(v.string()),
  releaseDate: v.optional(ISO8601Schema),
  url: v.optional(v.string()),
  summary: v.optional(v.string()),
});

export type Publication = v.InferOutput<typeof PublicationSchema>;

export const SkillSchema = v.object({
  name: v.optional(v.string()),
  level: v.optional(v.string()),
  keywords: v.optional(v.array(v.string())),
});

export type Skill = v.InferOutput<typeof SkillSchema>;

export const LanguageSchema = v.object({
  language: v.optional(v.string()),
  fluency: v.optional(v.string()),
});

export type Language = v.InferOutput<typeof LanguageSchema>;

export const InterestSchema = v.object({
  name: v.optional(v.string()),
  keywords: v.optional(v.array(v.string())),
});

export type Interest = v.InferOutput<typeof InterestSchema>;

export const ReferenceSchema = v.object({
  name: v.optional(v.string()),
  reference: v.optional(v.string()),
});

export type Reference = v.InferOutput<typeof ReferenceSchema>;

export const ProjectSchema = v.object({
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  highlights: v.optional(v.array(v.string())),
  keywords: v.optional(v.array(v.string())),
  startDate: v.optional(ISO8601Schema),
  endDate: v.optional(ISO8601Schema),
  url: v.optional(v.string()),
  roles: v.optional(v.array(v.string())),
  entity: v.optional(v.string()),
  type: v.optional(v.string()),
});

export type Project = v.InferOutput<typeof ProjectSchema>;

export const MetaSchema = v.object({
  canonical: v.optional(v.string()),
  version: v.optional(v.string()),
  lastModified: v.optional(v.string()),
});

export type Meta = v.InferOutput<typeof MetaSchema>;

export const ResumeSchema = v.object({
  $schema: v.optional(v.string()),
  basics: v.optional(BasicsSchema),
  work: v.optional(v.array(WorkSchema)),
  volunteer: v.optional(v.array(VolunteerSchema)),
  education: v.optional(v.array(EducationSchema)),
  awards: v.optional(v.array(AwardSchema)),
  certificates: v.optional(v.array(CertificateSchema)),
  publications: v.optional(v.array(PublicationSchema)),
  skills: v.optional(v.array(SkillSchema)),
  languages: v.optional(v.array(LanguageSchema)),
  interests: v.optional(v.array(InterestSchema)),
  references: v.optional(v.array(ReferenceSchema)),
  projects: v.optional(v.array(ProjectSchema)),
  meta: v.optional(MetaSchema),
});

export type Resume = v.InferOutput<typeof ResumeSchema>;
