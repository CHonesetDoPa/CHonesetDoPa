/**
 * pgp.js
 * PGP key configuration.
 */

const publicUrl = (file) =>
  `${import.meta.env.BASE_URL}${file}`.replace(/\/{2,}/g, "/");

const pgpKeys = [
  {
    id: "current",
    label: "Current",
    status: "active",
    local: publicUrl("keys/CH-Newest.asc"),
    remote: "https://keys.openpgp.org/search?q=ch%40nekoc.cc",
    fileName: "CH.asc",
    userId: "CHonesetDoPa <ch@nekoc.cc>",
    algorithm: "255-bit EdDSA (Ed25519)",
    fingerprint: "F311 BD92 0581 4D90 451A 3D17 0E03 1123 70A0 B849",
    timeline: {
      date: "2026",
      labelKey: "verify.pgpKey.tabs.current",
    },
    provenance: {
      signers: [
        {
          userId: "CHonesetDoPa <ch@nekoc.cc> (Legacy 2024)",
        },
      ],
      signatures: [
        {
          path: publicUrl("signs/nto2026-10-03.asc.sig"),
          fileName: "0E03112370A0B849-C6881736D7BC83D8-2026-10-3.asc.sig",
        },
      ],
      descriptionKey: "verify.pgpKey.provenance.currentDescription",
    },
  },
  {
    id: "legacy-2024",
    label: "Legacy",
    status: "legacy",
    local: publicUrl("keys/Legacy-2024-CH.asc"),
    fileName: "Legacy-2024-CH.asc",
    userId: "CHonesetDoPa <ch@nekoc.cc>",
    algorithm: "256-bit ECDSA (NIST P-256)",
    fingerprint: "E802 A6BF 8C2B 8ED7 1B9D 08FF C688 1736 D7BC 83D8",
    timeline: {
      date: "2024",
      labelKey: "verify.pgpKey.tabs.legacyWithYear",
    },
    provenance: {
      signers: [
        {
          userId: "CHonesetDoPa <ch@nekoc.cc> (Current 2025)",
        },
      ],
      signatures: [
        {
          path: publicUrl("signs/otn2026-10-03.asc.sig"),
          fileName: "C6881736D7BC83D8-0E03112370A0B849-2026-10-3.asc.sig",
        },
      ],
      descriptionKey: "verify.pgpKey.provenance.legacyDescription",
    },
  },
];

export default { pgpKeys };
