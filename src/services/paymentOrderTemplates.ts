import { PaymentOrderTemplateConfig, PaymentOrderTemplateId } from '../types/accounting';

// Two curated, fully-customizable payment / expense sanction order templates.
// Every field is a Trustee-editable default that can be overridden from
// Catalogs → Payment Orders without touching code. Both print to PDF.
export const PAYMENT_ORDER_TEMPLATES: PaymentOrderTemplateConfig[] = [
  {
    id: 'a5-sanction-order',
    name: 'Sanction & Payment Order',
    designStyle: 'Formal Governance Sanction Order',
    description:
      'Trust-style sanction order with debit/credit accounting box, amount in words and three approval signatures. Ideal for auditor-ready expense governance.',
    headerNote: 'Expense Governance & Payment Authorisation',
    orderTitle: 'EXPENSE SANCTION & PAYMENT ORDER',
    amountLabel: 'SANCTIONED & PASSED FOR PAYMENT',
    footerNote:
      'Certified that the above expenditure is incurred for temple purposes and sanctioned as per trust rules.',
    showAccountingBox: true,
    showPaymentMode: true,
    showAmountInWords: true,
    preparedByLabel: 'Prepared By / Accountant',
    checkedByLabel: 'Checked & Verified By',
    sanctionedByLabel: 'Sanctioned By (Trustee)',
    showPreparedBy: true,
    showCheckedBy: true,
    primaryColor: '#1E293B', // Slate Navy
    accentColor: '#B91C1C',
    borderStyle: 'double',
    paperSize: 'A5',
  },
  {
    id: 'a5-payment-voucher',
    name: 'Payment Voucher',
    designStyle: 'Compact Cash / Bank Payment Voucher',
    description:
      'Streamlined payment voucher with payee, purpose, amount and two signatures. Best for quick cash/bank disbursements at the counter.',
    headerNote: 'Cash / Bank Payment Voucher',
    orderTitle: 'PAYMENT VOUCHER',
    amountLabel: 'AMOUNT PAID',
    footerNote: 'Received the above sum in full and final settlement.',
    showAccountingBox: false,
    showPaymentMode: true,
    showAmountInWords: true,
    preparedByLabel: 'Paid By / Cashier',
    checkedByLabel: 'Received By (Payee)',
    sanctionedByLabel: 'Approved By',
    showPreparedBy: true,
    showCheckedBy: true,
    primaryColor: '#B45309', // Temple Amber
    accentColor: '#C2410C',
    borderStyle: 'solid',
    paperSize: 'A5',
  },
];

export const DEFAULT_ACTIVE_PAYMENT_ORDER_ID: PaymentOrderTemplateId = 'a5-sanction-order';
