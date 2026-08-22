/**
 * Single source of truth for the identity details the legal pages assert.
 *
 * These are the only values in the privacy policy and terms that are about
 * the *company* rather than the product, so they live here — change them
 * once when the registered entity, address, or governing law changes,
 * rather than hunting through two long documents.
 *
 * Registry details below are as recorded against UEN 202604354G with ACRA
 * (incorporated 28 January 2026, exempt private company limited by shares).
 */

/** Registered legal entity that operates Dataverse. */
export const legalEntity = "AlphaLeap Pte. Ltd.";

/** Short name used in running prose. */
export const shortName = "AlphaLeap";

/** ACRA Unique Entity Number. */
export const uen = "202604354G";

/** Registered office, as address lines. */
export const addressLines = [
  "68 Circular Road, #02-01",
  "Singapore 049422",
] as const;

/** Registered office as a single line, for use inside a sentence. */
export const registeredAddress = addressLines.join(", ");

/** General privacy / data-protection contact. */
export const privacyEmail = "jasper.laiwy@alphaleap.co";

/** General contact — currently the same mailbox as privacy. */
export const contactEmail = "jasper.laiwy@alphaleap.co";

/** Where the product itself lives. */
export const appUrl = "https://app.dataverse.alphaleap.co";

/** Jurisdiction whose law governs the terms. */
export const governingLaw = "Singapore";

/** Courts with exclusive jurisdiction over disputes. */
export const jurisdiction = "the courts of Singapore";

/** Date both documents were last substantively revised. */
export const lastUpdated = "22 August 2026";
