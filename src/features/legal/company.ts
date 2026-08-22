/**
 * Single source of truth for the identity details the legal pages assert.
 *
 * These are the only values in the privacy policy and terms that are about
 * the *company* rather than the product, so they live here — change them
 * once when the registered entity, address, or governing law changes,
 * rather than hunting through two long documents.
 */

/** Registered legal entity that operates Dataverse. */
export const legalEntity = "AlphaLeap AI Pte. Ltd.";

/** Short name used in running prose. */
export const shortName = "AlphaLeap";

/** Registered office. Shown in full in the contact blocks. */
export const registeredAddress = "Singapore";

/** General privacy / data-protection contact. */
export const privacyEmail = "privacy@alphaleap.co";

/** Fallback contact — the address beta users already have. */
export const contactEmail = "jasper.laiwy@alphaleap.co";

/** Where the product itself lives. */
export const appUrl = "https://app.dataverse.alphaleap.co";

/** Jurisdiction whose law governs the terms. */
export const governingLaw = "Singapore";

/** Courts with exclusive jurisdiction over disputes. */
export const jurisdiction = "the courts of Singapore";

/** Date both documents were last substantively revised. */
export const lastUpdated = "22 August 2026";
