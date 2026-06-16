type MetadataValue = string | number | boolean | null | undefined | MetadataObject | MetadataValue[];
type MetadataObject = { [key: string]: MetadataValue };

type SchoolAssetSource = {
  logo_url?: string | null;
  seal_url?: string | null;
  headmaster_signature_url?: string | null;
  metadata?: MetadataObject | null;
  logoUrl?: string | null;
  sealUrl?: string | null;
  principalSignatureUrl?: string | null;
};

type TeacherAssetSource = {
  signature_url?: string | null;
  metadata?: MetadataObject | null;
  classTeacherSignatureUrl?: string | null;
};

function firstPresent(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getMetadataString(metadata: MetadataObject | null | undefined, key: string) {
  const value = metadata?.[key];

  return typeof value === "string" ? value : null;
}

export function resolveSchoolLogoUrl(school: SchoolAssetSource) {
  return firstPresent(school.logo_url, getMetadataString(school.metadata, "logo_url"), getMetadataString(school.metadata, "school_logo_url"), school.logoUrl);
}

export function resolveSchoolSealUrl(school: SchoolAssetSource) {
  return firstPresent(
    getMetadataString(school.metadata, "crest_url"),
    getMetadataString(school.metadata, "school_crest_url"),
    getMetadataString(school.metadata, "seal_url"),
    getMetadataString(school.metadata, "school_seal_url"),
    getMetadataString(school.metadata, "stamp_url"),
    getMetadataString(school.metadata, "school_stamp_url"),
    school.seal_url,
    school.sealUrl,
  );
}

export function resolvePrincipalSignatureUrl(school: SchoolAssetSource) {
  return firstPresent(
    getMetadataString(school.metadata, "principal_signature_url"),
    getMetadataString(school.metadata, "headmaster_signature_url"),
    getMetadataString(school.metadata, "signature_url"),
    school.principalSignatureUrl,
    school.headmaster_signature_url,
  );
}

export function resolveClassTeacherSignatureUrl(teacher: TeacherAssetSource) {
  return firstPresent(teacher.signature_url, getMetadataString(teacher.metadata, "signature_url"), teacher.classTeacherSignatureUrl);
}
