import { jsPDF } from 'jspdf';
import { Donation, ExpenseVoucher, TempleProfile } from '../types/accounting';
import { storageService } from './storageService';
import { ReceiptTemplateConfig } from '../types/accounting';
import { Donor } from '../types/accounting';

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return [r, g, b];
};

const generateThermalDonationReceiptPDF = (
  donation: Donation,
  profile: TempleProfile,
  template: ReceiptTemplateConfig,
): jsPDF => {
  const paperWidth = template.paperWidth === '58mm' ? 54 : 76;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [paperWidth, 180] });
  const [pRed, pGreen, pBlue] = hexToRgb(template.primaryColor);
  const margin = 4;
  const textWidth = paperWidth - margin * 2;
  let y = 8;
  const write = (text: string, size = 8, bold = false) => {
    doc.setFont('courier', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, textWidth);
    doc.text(lines, paperWidth / 2, y, { align: 'center' });
    y += lines.length * (size <= 7 ? 3.2 : 4.2);
  };

  doc.setDrawColor(pRed, pGreen, pBlue);
  doc.setLineWidth(0.5);
  doc.rect(2, 2, paperWidth - 4, 174);
  doc.setTextColor(pRed, pGreen, pBlue);
  write(template.motif, 9, true);
  write(template.invocation, 8, true);
  write(profile.name.toUpperCase(), 9, true);
  write(`${profile.city} ${profile.pincode} | ${profile.phone}`, 6.5);
  y += 1;
  doc.setDrawColor(170, 170, 170);
  doc.line(margin, y, paperWidth - margin, y);
  y += 5;
  doc.setTextColor(30, 41, 59);
  write(donation.donationType === 'IN_KIND' ? 'MATERIAL OFFERING RECEIPT' : 'SEVA & DONATION RECEIPT', 8, true);
  write(`Receipt: ${donation.receiptNo}`, 7);
  write(`${donation.date} ${donation.time}`, 7);
  write(`Devotee: ${donation.donorFirstName} ${donation.donorSecondName}`, 7);
  write(`Mobile: ${donation.donorPhone}`, 7);
  write(`Offering: ${donation.sevaName || donation.customPurposeName || 'Material offering'}`, 7);
  if (donation.donationType === 'IN_KIND' && donation.inKindDetails) {
    write(`Quantity: ${donation.inKindDetails.quantity} ${donation.inKindDetails.unit || 'Units'}`, 7);
  } else {
    write(`Amount: INR ${donation.amount.toLocaleString('en-IN')}`, 9, true);
    write(`Mode: ${donation.paymentMode}`, 7);
  }
  y += 1;
  doc.line(margin, y, paperWidth - margin, y);
  y += 5;
  write(template.blessingText, 6.5);
  if (template.showPrasadamNote && template.prasadamNoteText) write(`Prasadam: ${template.prasadamNoteText}`, 6.5);
  if (template.show80GNotice && template.taxExemptionText) write(template.taxExemptionText, 6.5);
  return doc;
};


// 1. UNIFIED SINGLE OFFICIAL DONATION RECEIPT
export const generateDonationReceiptPDF = (donation: Donation): jsPDF => {
  const profile: TempleProfile = storageService.getTempleProfile();
  const template: ReceiptTemplateConfig = storageService.getActiveReceiptTemplate();
  if (template.paperWidth !== 'A5') {
    return generateThermalDonationReceiptPDF(donation, profile, template);
  }
  const [pRed, pGreen, pBlue] = hexToRgb(template.primaryColor);
  const [sRed, sGreen, sBlue] = hexToRgb(template.secondaryColor);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  // Auspicious Kesari & Gold Double Border
  doc.setDrawColor(pRed, pGreen, pBlue);
  doc.setLineWidth(1.2);
  doc.rect(margin, margin, pageWidth - margin * 2, doc.internal.pageSize.getHeight() - margin * 2);

  doc.setDrawColor(sRed, sGreen, sBlue);
  doc.setLineWidth(0.4);
  doc.rect(margin + 2, margin + 2, pageWidth - (margin + 2) * 2, doc.internal.pageSize.getHeight() - (margin + 2) * 2);

  // Header - Om & Temple Name
  doc.setTextColor(pRed, pGreen, pBlue);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(template.invocation, pageWidth / 2, margin + 9, { align: 'center' });

  if (template.subInvocation) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(sRed, sGreen, sBlue);
    doc.text(template.subInvocation, pageWidth / 2, margin + 13.5, { align: 'center' });
  }

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name.toUpperCase(), pageWidth / 2, margin + (template.subInvocation ? 19 : 17), { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`, pageWidth / 2, margin + 23, {
    align: 'center',
  });
  doc.text(`Trust Reg No: ${profile.registrationNo} | Contact: ${profile.phone}`, pageWidth / 2, margin + 28, {
    align: 'center',
  });

  // Collection Stream Tag Band (Event / Yearly / Custom)
  doc.setFillColor(255, 248, 241);
  doc.rect(margin + 4, margin + 32, pageWidth - (margin + 4) * 2, 8, 'F');
  doc.setDrawColor(254, 219, 195);
  doc.rect(margin + 4, margin + 32, pageWidth - (margin + 4) * 2, 8, 'D');

  const streamLabel =
    donation.collectionType === 'REGULAR_SEVA'
      ? `SEVA OFFERING: ${donation.sevaName}`
      : donation.collectionType === 'YEARLY_REGULAR'
      ? `REGULAR YEARLY COLLECTION: ${donation.yearlyPeriod || 'Annual Seva'}`
      : `CUSTOM SEVA: ${donation.customPurposeName || donation.sevaName}`;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(streamLabel.toUpperCase(), pageWidth / 2, margin + 37, { align: 'center' });

  // Receipt Title Band
  doc.setFillColor(pRed, pGreen, pBlue);
  doc.rect(margin + 4, margin + 42, pageWidth - (margin + 4) * 2, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(
    donation.donationType === 'IN_KIND'
      ? 'OFFICIAL IN-KIND OFFERING RECEIPT'
      : 'OFFICIAL SEVA & DONATION RECEIPT',
    pageWidth / 2,
    margin + 47.5,
    { align: 'center' }
  );

  // Devotee Details (First Name, Second Name, Mobile, Village Mandatory)
  let y = margin + 57;
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  doc.setFont('helvetica', 'bold');
  doc.text('Receipt No:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  doc.text(donation.receiptNo, margin + 30, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Date & Time:', pageWidth - margin - 48, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${donation.date} ${donation.time}`, pageWidth - margin - 26, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Devotee Name:', margin + 6, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(pRed, pGreen, pBlue);
  doc.text(`${donation.donorFirstName} ${donation.donorSecondName}`, margin + 30, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Mobile Number:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  doc.text(donation.donorPhone, margin + 30, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Village / City:', pageWidth - margin - 48, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(donation.donorVillage, pageWidth - margin - 26, y);

  // Optional Gotra & Nakshatra
  if (template.showGothraNakshatra && (donation.donorGotra || donation.donorNakshatra)) {
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Gotra / Nakshatra:', margin + 6, y);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${donation.donorGotra ? `Gotra: ${donation.donorGotra}` : ''} ${
        donation.donorNakshatra ? `| Nakshatra: ${donation.donorNakshatra}` : ''
      }`,
      margin + 36,
      y
    );
  }

  // Particulars Table Box
  y += 9;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.rect(margin + 6, y, pageWidth - (margin + 6) * 2, 30, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Offering / Particulars', margin + 10, y + 6);
  doc.text('Type', margin + 72, y + 6);
  doc.text(donation.donationType === 'IN_KIND' ? 'Quantity' : 'Amount (INR)', pageWidth - margin - 10, y + 6, {
    align: 'right',
  });

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 6, y + 9, pageWidth - margin - 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(
    donation.donationType === 'IN_KIND' && donation.inKindDetails
      ? donation.inKindDetails.itemDescription
      : donation.sevaName,
    margin + 10,
    y + 17
  );
  doc.text(
    donation.donationType === 'IN_KIND' ? 'Dravya Daan' : donation.paymentMode,
    margin + 72,
    y + 17
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(pRed, pGreen, pBlue);
  if (donation.donationType === 'IN_KIND' && donation.inKindDetails) {
    doc.text(
      `${donation.inKindDetails.quantity} ${donation.inKindDetails.unit || 'Units'}`,
      pageWidth - margin - 10,
      y + 17,
      { align: 'right' }
    );
  } else {
    doc.text(`INR ${donation.amount.toLocaleString('en-IN')}/-`, pageWidth - margin - 10, y + 17, { align: 'right' });
  }

  if (donation.donationType === 'IN_KIND' && donation.inKindDetails) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Category: ${donation.inKindDetails.category.replace('_', ' ')}${
        donation.inKindDetails.metalPurity ? ` | Purity: ${donation.inKindDetails.metalPurity}` : ''
      }${donation.inKindDetails.weightGrams ? ` | Net: ${donation.inKindDetails.weightGrams}g` : ''}`,
      margin + 10,
      y + 24
    );
  } else if (donation.transactionRef) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Ref: ${donation.transactionRef}`, margin + 10, y + 24);
  }

  // Amount in Words (Only for Monetary)
  y += 36;
  if (donation.donationType !== 'IN_KIND') {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Amount in Words:', margin + 6, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rupees ${numberToWordsIndian(donation.amount)} Only`, margin + 35, y);
  } else {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(230, 81, 0);
    doc.text('Sacred Material Dravya Daan Accepted with Thanks', margin + 6, y);
  }

  // Footer & Blessings
  y += 16;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Issued at: ${donation.counterName} (Operator: ${donation.cashierName})`, margin + 6, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(pRed, pGreen, pBlue);
  doc.text(template.blessingText, margin + 6, y + 5);

  let extraNoteY = y + 10;
  if (template.showPrasadamNote && template.prasadamNoteText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text(`Prasadam: ${template.prasadamNoteText}`, margin + 6, extraNoteY);
    extraNoteY += 4.5;
  }

  if (template.show80GNotice && template.taxExemptionText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(template.taxExemptionText, margin + 6, extraNoteY);
  }

  if (template.showDevoteeSign) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Devotee Signature', margin + 6, y + 20);
  }

  if (template.showTrusteeSign) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.text(`For ${(profile.trustName || profile.name).toUpperCase()}`, pageWidth - margin - 10, y + 10, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(template.signatoryLabel || 'Authorised Signatory / Trustee', pageWidth - margin - 10, y + 20, { align: 'right' });
  }

  return doc;
};

// 2. UNIFIED EXPENSE SANCTION & APPROVAL ORDER COPY (template-driven)
export const generateExpenseSanctionOrderPDF = (voucher: ExpenseVoucher): jsPDF => {
  const profile: TempleProfile = storageService.getTempleProfile();
  const template = storageService.getActivePaymentOrderTemplate();
  const [pRed, pGreen, pBlue] = hexToRgb(template.primaryColor);
  const [aRed, aGreen, aBlue] = hexToRgb(template.accentColor);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: template.paperSize === 'A4' ? 'a4' : 'a5',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // Border (style-driven)
  doc.setDrawColor(pRed, pGreen, pBlue);
  doc.setLineWidth(template.borderStyle === 'double' ? 1.0 : 0.8);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
  if (template.borderStyle === 'double') {
    doc.setLineWidth(0.4);
    doc.rect(margin + 2, margin + 2, pageWidth - (margin + 2) * 2, pageHeight - (margin + 2) * 2);
  }

  // Header
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name.toUpperCase(), pageWidth / 2, margin + 10, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${profile.address}, ${profile.city} - Trust Reg No: ${profile.registrationNo}`, pageWidth / 2, margin + 16, {
    align: 'center',
  });
  if (template.headerNote) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(aRed, aGreen, aBlue);
    doc.text(template.headerNote, pageWidth / 2, margin + 20, { align: 'center' });
  }

  // Order Title Banner
  doc.setFillColor(pRed, pGreen, pBlue);
  doc.rect(margin + 4, margin + 22, pageWidth - (margin + 4) * 2, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(template.orderTitle.toUpperCase(), pageWidth / 2, margin + 27.5, { align: 'center' });

  let y = margin + 38;
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  doc.setFont('helvetica', 'bold');
  doc.text('Sanction Order No:', margin + 6, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(aRed, aGreen, aBlue);
  doc.text(voucher.sanctionOrderNo, margin + 42, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Order Date:', pageWidth - margin - 45, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${voucher.date} ${voucher.time}`, pageWidth - margin - 24, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Payee / Priest / Vendor:', margin + 6, y);
  doc.setFont('helvetica', 'bold');
  doc.text(voucher.payeeName, margin + 42, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Purpose of Expenditure:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  doc.text(voucher.purpose, margin + 42, y);

  // Accounting Details Box (optional)
  if (template.showAccountingBox) {
    y += 9;
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin + 6, y, pageWidth - (margin + 6) * 2, template.showPaymentMode ? 28 : 20, 'FD');

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.text('Debit Account (Expense Head):', margin + 10, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(voucher.debitAccountName, margin + 60, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('Credit Account (Paid From):', margin + 10, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(voucher.creditAccountName, margin + 60, y + 13);

    if (template.showPaymentMode) {
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Mode & Reference:', margin + 10, y + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(`${voucher.paymentMode} ${voucher.refNo ? `(Ref: ${voucher.refNo})` : ''}`, margin + 60, y + 20);
    }
    y += template.showPaymentMode ? 33 : 25;
  } else {
    y += 9;
    if (template.showPaymentMode) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Payment Mode & Reference:', margin + 6, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${voucher.paymentMode} ${voucher.refNo ? `(Ref: ${voucher.refNo})` : ''}`, margin + 52, y);
    }
    y += 6;
  }

  // Sanctioned Amount Box
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.rect(margin + 6, y, pageWidth - (margin + 6) * 2, template.showAmountInWords ? 14 : 10, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(aRed, aGreen, aBlue);
  doc.text(`${template.amountLabel.toUpperCase()}:`, margin + 10, y + 6);
  doc.setFontSize(12);
  doc.text(`INR ${voucher.amount.toLocaleString('en-IN')}.00`, pageWidth - margin - 10, y + 6, { align: 'right' });

  if (template.showAmountInWords) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`(Rupees ${numberToWordsIndian(voucher.amount)} Only)`, margin + 10, y + 11);
    y += 14;
  } else {
    y += 10;
  }

  // Footer note / declaration
  if (template.footerNote) {
    y += 6;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(template.footerNote, pageWidth - margin * 2 - 12), margin + 6, y);
    y += 6;
  }

  // Signatures
  y += 12;
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');

  if (template.showPreparedBy) {
    doc.text(template.preparedByLabel, margin + 10, y);
  }
  if (template.showCheckedBy) {
    doc.text(template.checkedByLabel, pageWidth / 2, y, { align: 'center' });
  }
  doc.setFont('helvetica', 'bold');
  doc.text(template.sanctionedByLabel, pageWidth - margin - 10, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`(${voucher.sanctionedBy})`, pageWidth - margin - 10, y + 5, { align: 'right' });

  return doc;
};

// Helper: Convert numbers to Indian Rupees Words
export function numberToWordsIndian(num: number): string {
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function inWords(n: number): string {
    let str = '';
    if (n >= 10000000) {
      str += inWords(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += inWords(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += inWords(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      str += inWords(Math.floor(n / 100)) + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) str += a[n] + ' ';
      else {
        str += b[Math.floor(n / 10)] + ' ';
        if (n % 10 > 0) str += a[n % 10] + ' ';
      }
    }
    return str.trim();
  }

  return inWords(Math.floor(num));
}

// Annual per-donor giving statement — a formal 80G tax-exemption certificate
// listing all monetary donations by a donor within a financial year.
export const generateDonor80GStatementPDF = (
  donor: Donor,
  donations: Donation[],
  fyLabel: string
): jsPDF => {
  const profile: TempleProfile = storageService.getTempleProfile();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Outer border
  doc.setDrawColor(180, 83, 9);
  doc.setLineWidth(0.8);
  doc.rect(margin, margin, contentWidth, doc.internal.pageSize.getHeight() - margin * 2);

  // Header
  doc.setTextColor(180, 83, 9);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('|| Shri Ganeshaya Namah ||', pageWidth / 2, margin + 8, { align: 'center' });

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name.toUpperCase(), pageWidth / 2, margin + 16, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`, pageWidth / 2, margin + 21, {
    align: 'center',
  });
  doc.text(
    `Trust Reg No: ${profile.registrationNo}   |   PAN: ${profile.panNumber}   |   Contact: ${profile.phone}`,
    pageWidth / 2,
    margin + 25.5,
    { align: 'center' }
  );

  // Title band
  doc.setFillColor(180, 83, 9);
  doc.rect(margin + 3, margin + 29, contentWidth - 6, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ANNUAL DONATION STATEMENT & 80G TAX EXEMPTION CERTIFICATE', pageWidth / 2, margin + 35, {
    align: 'center',
  });

  // Donor details block
  let y = margin + 46;
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9.5);
  const leftX = margin + 6;
  const rightX = pageWidth / 2 + 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Financial Year:', leftX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(fyLabel, leftX + 30, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Statement Date:', rightX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toISOString().split('T')[0], rightX + 32, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Devotee Name:', leftX, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text(donor.name, leftX + 30, y);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Mobile:', rightX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(donor.phone || '-', rightX + 32, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('PAN:', leftX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(donor.pan || 'Not Provided', leftX + 30, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Village / City:', rightX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(donor.village || '-', rightX + 32, y);

  if (donor.address) {
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Address:', leftX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(donor.address, contentWidth - 40), leftX + 30, y);
  }

  // Table header
  y += 12;
  const colReceipt = leftX;
  const colDate = leftX + 42;
  const colSeva = leftX + 68;
  const colMode = leftX + 130;
  const colAmount = pageWidth - margin - 6;

  doc.setFillColor(245, 245, 244);
  doc.rect(leftX, y - 5, contentWidth - 12, 8, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Receipt No', colReceipt + 1, y);
  doc.text('Date', colDate, y);
  doc.text('Seva / Purpose', colSeva, y);
  doc.text('Mode', colMode, y);
  doc.text('Amount (INR)', colAmount, y, { align: 'right' });

  y += 5;
  doc.setDrawColor(214, 211, 209);
  doc.line(leftX, y, pageWidth - margin - 6, y);

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  let total = 0;
  const sorted = [...donations].sort((a, b) => a.date.localeCompare(b.date));
  for (const d of sorted) {
    y += 6;
    if (y > doc.internal.pageSize.getHeight() - margin - 40) {
      doc.addPage();
      y = margin + 12;
    }
    total += d.amount;
    doc.text(d.receiptNo, colReceipt + 1, y);
    doc.text(d.date, colDate, y);
    doc.text(doc.splitTextToSize(d.sevaName || '-', 58)[0], colSeva, y);
    doc.text(d.paymentMode, colMode, y);
    doc.text(d.amount.toLocaleString('en-IN'), colAmount, y, { align: 'right' });
  }

  // Total
  y += 8;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(leftX, y - 4, pageWidth - margin - 6, y - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('TOTAL DONATIONS', colSeva, y);
  doc.setTextColor(180, 83, 9);
  doc.text(`INR ${total.toLocaleString('en-IN')}/-`, colAmount, y, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`(Rupees ${numberToWordsIndian(total)} Only)`, colSeva, y);

  // 80G legal note
  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const note =
    'This is to certify that the above donations were received by the Trust during the stated financial year. ' +
    'Donations to this Trust are eligible for deduction under Section 80G of the Income Tax Act, 1961, subject to the ' +
    'limits and conditions specified therein. Please retain this statement for your income tax records.';
  doc.text(doc.splitTextToSize(note, contentWidth - 12), leftX, y);

  // Signatory
  const signY = doc.internal.pageSize.getHeight() - margin - 20;
  doc.setDrawColor(148, 163, 184);
  doc.line(pageWidth - margin - 60, signY, pageWidth - margin - 8, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Authorised Signatory / Trustee', pageWidth - margin - 34, signY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('This is a computer-generated statement.', leftX, signY + 5);

  return doc;
};
