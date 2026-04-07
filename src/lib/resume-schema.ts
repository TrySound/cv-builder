import * as v from "valibot";
import { ISO8601Schema } from "./jsonresume";

export const EmploymentTypeSchema = v.union([
  v.literal("fulltime"),
  v.literal("parttime"),
  v.literal("contract"),
  v.literal("freelance"),
  v.literal("internship"),
]);

export type EmploymentType = v.InferOutput<typeof EmploymentTypeSchema>;

export const WorkplaceTypeSchema = v.union([
  v.literal("onsite"),
  v.literal("remote"),
  v.literal("hybrid"),
]);

export type WorkplaceType = v.InferOutput<typeof WorkplaceTypeSchema>;

export const ProfileSchema = v.object({
  name: v.string(),
  email: v.optional(v.string()),
  linkedin: v.optional(v.string()),
  github: v.optional(v.string()),
  website: v.optional(v.string()),
  location: v.optional(v.string()),
  headline: v.optional(v.string()),
  summary: v.optional(v.string()),
  industry: v.optional(v.string()),
});

export type Profile = v.InferOutput<typeof ProfileSchema>;

export const PositionSchema = v.object({
  company: v.string(),
  title: v.string(),
  location: v.optional(v.string()),
  workplaceType: v.optional(WorkplaceTypeSchema),
  employmentType: v.optional(EmploymentTypeSchema),
  description: v.optional(v.string()),
  startedAt: v.optional(ISO8601Schema),
  endedAt: v.optional(ISO8601Schema),
});

export type Position = v.InferOutput<typeof PositionSchema>;

export const EducationSchema = v.object({
  institution: v.string(),
  degree: v.string(),
  field: v.optional(v.string()),
  description: v.optional(v.string()),
  startedAt: v.optional(ISO8601Schema),
  endedAt: v.optional(ISO8601Schema),
});

export type Education = v.InferOutput<typeof EducationSchema>;

export const ProjectSchema = v.object({
  name: v.string(),
  description: v.optional(v.string()),
  url: v.optional(v.string()),
  startedAt: v.optional(ISO8601Schema),
  endedAt: v.optional(ISO8601Schema),
});

export type Project = v.InferOutput<typeof ProjectSchema>;

export const ResumeSchema = v.object({
  profile: ProfileSchema,
  positions: v.array(PositionSchema),
  education: v.array(EducationSchema),
  projects: v.array(ProjectSchema),
  preferredWorkplace: v.array(WorkplaceTypeSchema),
  skills: v.array(v.string()),
  languages: v.array(v.string()),
});

export type Resume = v.InferOutput<typeof ResumeSchema>;
