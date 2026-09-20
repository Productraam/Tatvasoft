import { ReceiptTemplateConfig, ReceiptTemplateId } from '../types/accounting';

// Two curated, fully-customizable donation receipt templates:
//  1. A5 full-page formal receipt (laser/inkjet printers, filing & 80G)
//  2. 80mm thermal counter slip (fast POS printing)
// Every field below is a Trustee-editable default that can be overridden from
// Catalogs → Receipt Templates without touching code.
export const INDIAN_TEMPLE_RECEIPT_TEMPLATES: ReceiptTemplateConfig[] = [
  {
    id: 'temple-a5-official',
    name: 'A5 Official Donation Receipt',
    designStyle: 'Full-Page A5 Formal Receipt',
    description:
      'Full A5 page receipt with double border, temple header, devotee & seva details, amount in words, 80G notice and signatory lines. Ideal for laser / inkjet printers and audit filing.',
    invocation: '॥ श्री गणेशाय नमः ॥',
    subInvocation: '॥ धर्मो रक्षति रक्षितः ॥',
    blessingText:
      'May the divine grace of the Sanctum Deity bring peace, health and prosperity to you and your family.',
    show80GNotice: true,
    taxExemptionText:
      'Donations are eligible for tax deduction under Section 80G of the Income Tax Act, 1961.',
    showPrasadamNote: false,
    prasadamNoteText: 'Please present this receipt at the Prasadam counter for holy teertha.',
    signatoryLabel: 'Authorized Signatory / Trustee',
    showTrusteeSign: true,
    showDevoteeSign: true,
    showGothraNakshatra: true,
    showQrCode: false,
    primaryColor: '#B45309', // Temple Amber Gold
    secondaryColor: '#D97706',
    accentBg: 'bg-amber-50',
    borderStyle: 'double',
    paperWidth: 'A5',
    motif: '🕉️ 🪔',
  },
  {
    id: 'thermal-80mm-slip',
    name: '80mm Thermal POS Slip',
    designStyle: 'Compact 80mm Thermal Counter Slip',
    description:
      'Fast, ink-light 80mm thermal slip for POS counters — invocation, receipt & devotee summary, amount, optional QR verification and prasadam token.',
    invocation: '॥ ॐ नमः शिवाय ॥',
    subInvocation: 'Official Temple Donation Slip',
    blessingText: 'Thank you for your pious offering. May peace and abundance prevail!',
    show80GNotice: true,
    taxExemptionText: 'Eligible for 80G deduction. Retain this slip for your records.',
    showPrasadamNote: true,
    prasadamNoteText: 'Present this token at the Prasadam counter.',
    signatoryLabel: 'Counter Cashier',
    showTrusteeSign: false,
    showDevoteeSign: false,
    showGothraNakshatra: true,
    showQrCode: true,
    primaryColor: '#C2410C', // Sacred Saffron
    secondaryColor: '#EA580C',
    accentBg: 'bg-orange-50',
    borderStyle: 'dashed',
    paperWidth: '80mm',
    motif: '🪔',
  },
];

export const DEFAULT_ACTIVE_TEMPLATE_ID: ReceiptTemplateId = 'temple-a5-official';

