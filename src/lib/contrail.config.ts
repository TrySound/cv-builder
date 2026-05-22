import type { ContrailConfig } from "@atmo-dev/contrail";

export const config: ContrailConfig = {
  namespace: "com.weareonhire",
  collections: {
    profile: {
      collection: "com.weareonhire.profile",
    },
    recommendation: {
      collection: "com.weareonhire.recommendation",
    },
    basics: {
      collection: "id.sifa.profile.self",
    },
    position: {
      collection: "id.sifa.profile.position",
    },
    education: {
      collection: "id.sifa.profile.education",
    },
    skill: {
      collection: "id.sifa.profile.skill",
    },
    project: {
      collection: "id.sifa.profile.project",
    },
    language: {
      collection: "id.sifa.profile.language",
    },
    account: {
      collection: "id.sifa.profile.externalAccount",
    },
    publication: {
      collection: "site.standard.publication",
      discover: false,
    },
    document: {
      collection: "site.standard.document",
      discover: false,
    },
  },
};
