import React, { useState } from 'react';
import {
  Printer,
  QrCode,
  FileDown,
  X,
  CheckCircle2,
  Copy,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Donation, TempleProfile, ReceiptTemplateConfig } from '../../types/accounting';
import { storageService } from '../../services/storageService';
import { generateDonationReceiptPDF, numberToWordsIndian } from '../../services/pdfService';
import { isNativePrinterAvailable, printElementWithNativePrinter } from '../../services/nativePrinterService';
import { ModalPortal } from '../ui/ModalPortal';
import { useFeedback } from '../ui/Feedback';

interface ThermalReceiptModalProps {
  donation: Donation | null;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ donation, onClose }) => {
  const { notify } = useFeedback();
  const [copied, setCopied] = useState(false);
  const [nativePrintBusy, setNativePrintBusy] = useState(false);
  const profile: TempleProfile = storageService.getTempleProfile();
  const template: ReceiptTemplateConfig = storageService.getActiveReceiptTemplate();

  if (!donation) return null;

  const isMaterial = donation.donationType === 'IN_KIND';

  const handlePrint = () => {
    // Inject a paper-size specific @page rule so the browser prints the slip
    // at its true physical width instead of stretching it across an A4 sheet.
    const pw = template.paperWidth; // 'A5' | '80mm' | '58mm'
    const pageSize = pw === 'A5' ? 'A5 portrait' : pw === '58mm' ? '58mm auto' : '80mm auto';
    const pageMargin = pw === 'A5' ? '8mm' : '2mm';
    const contentWidth = pw === 'A5' ? '128mm' : pw === '58mm' ? '54mm' : '76mm';

    const styleId = 'dynamic-receipt-print-style';
    document.getElementById(styleId)?.remove();
    const style = document.createElement('style');
    style.id = styleId;
    style.media = 'print';
    style.textContent = `
      @page { size: ${pageSize}; margin: ${pageMargin}; }
      body * { visibility: hidden !important; }
      #printable-receipt, #printable-receipt * { visibility: visible !important; }
      #printable-receipt {
        width: ${contentWidth} !important;
        max-width: ${contentWidth} !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);

    const cleanup = () => {
      document.getElementById(styleId)?.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    // Fallback cleanup for browsers that don't fire afterprint reliably.
    setTimeout(cleanup, 1000);
  };

  const handleDownloadPDF = () => {
    const doc = generateDonationReceiptPDF(donation);
    doc.save(`Receipt_${donation.receiptNo}_${donation.donorFirstName}_${donation.donorSecondName}.pdf`);
  };

  const handleNativePrint = async () => {
    setNativePrintBusy(true);
    try {
      await printElementWithNativePrinter('printable-receipt');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'POS printing failed.', 'error');
    } finally {
      setNativePrintBusy(false);
    }
  };

  const streamText = isMaterial
    ? `Material Dravya: ${donation.inKindDetails?.category?.replace('_', ' ') || 'In-Kind'}`
    : donation.collectionType === 'REGULAR_SEVA'
    ? `Seva: ${donation.sevaName}`
    : donation.collectionType === 'YEARLY_REGULAR'
    ? `Yearly: ${donation.yearlyPeriod || 'Annual Collection'}`
    : `Custom: ${donation.customPurposeName || donation.sevaName}`;

  const generateWhatsAppText = () => {
    const gotraLine = template.showGothraNakshatra
      ? `${donation.donorGotra ? `Gotra: ${donation.donorGotra}\n` : ''}${donation.donorNakshatra ? `Nakshatra: ${donation.donorNakshatra}\n` : ''}`
      : '';
    const prasadamLine = template.showPrasadamNote && template.prasadamNoteText
      ? `\nPrasadam: ${template.prasadamNoteText}`
      : '';
    const taxLine = template.show80GNotice && template.taxExemptionText
      ? `\n80G Exemption: ${template.taxExemptionText}`
      : '';

    if (isMaterial && donation.inKindDetails) {
      return `${template.invocation}
${profile.name}
Official Material Offering Receipt
--------------------------------
Receipt No: ${donation.receiptNo}
Date: ${donation.date} ${donation.time}
Offering: Material Dravya Daan
Devotee: ${donation.donorFirstName} ${donation.donorSecondName}
Mobile: ${donation.donorPhone}
Village: ${donation.donorVillage}
${gotraLine}Item: ${donation.inKindDetails.itemDescription}
Quantity: ${donation.inKindDetails.quantity} ${donation.inKindDetails.unit || 'Units'}
--------------------------------
${template.blessingText}${prasadamLine}${taxLine} 🙏`;
    }

    return `${template.invocation}
${profile.name}
Official Offering & Seva Receipt
--------------------------------
Receipt No: ${donation.receiptNo}
Date: ${donation.date} ${donation.time}
Seva / Offering: ${donation.sevaName}
Amount: ₹${donation.amount.toLocaleString('en-IN')} (${donation.paymentMode}${donation.depositAccountName && donation.paymentMode !== 'CASH' ? ` - ${donation.depositAccountName}` : ''})
Devotee: ${donation.donorFirstName} ${donation.donorSecondName}
Mobile: ${donation.donorPhone}
Village: ${donation.donorVillage}
${gotraLine}--------------------------------
${template.blessingText}${prasadamLine}${taxLine} 🙏`;
  };

  const handleOpenWhatsApp = () => {
    let cleanPhone = donation.donorPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    const message = encodeURIComponent(generateWhatsAppText());
    const waUrl = cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    
    window.open(waUrl, '_blank');
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(generateWhatsAppText());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-amber-200 animate-fadeIn">
        {/* Modal Top Bar styled with Active Template Colors */}
        <div
          style={{ backgroundColor: template.primaryColor }}
          className="px-4 py-3 flex items-center justify-between text-white shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{template.motif.split(' ')[0] || '🪔'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs sm:text-sm leading-tight tracking-tight">
                  {isMaterial ? 'Material Offering Receipt' : 'Seva & Donation Receipt'}
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/20 text-white font-semibold">
                  {template.name.split(' ')[0]}
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-mono">{donation.receiptNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Preview (Thermal slip with Template Motifs & Sanskrit Shlokas) */}
        <div className="p-4 bg-stone-100/70 flex justify-center max-h-[72vh] overflow-y-auto scrollbar-thin">
          <div
            id="printable-receipt"
            style={{
              width: template.paperWidth === 'A5' ? '128mm' : template.paperWidth === '58mm' ? '54mm' : '76mm',
              maxWidth: '100%',
              boxSizing: 'border-box',
              borderColor: template.primaryColor,
              borderStyle: template.borderStyle === 'double' ? 'double' : template.borderStyle === 'dashed' ? 'dashed' : 'solid',
              borderWidth: template.borderStyle === 'double' ? '4px' : '2px',
            }}
            className="bg-white p-4 shadow-md font-mono leading-tight text-stone-900 rounded-sm select-text relative w-full text-[11px]"
            
          >
            {/* Top Sacred Invocation & Motifs */}
            <div className="text-center pb-2.5 border-b-2 border-dashed border-stone-300">
              <div className="text-xs font-bold tracking-widest text-stone-800 mb-0.5">
                {template.motif}
              </div>
              <div
                style={{ color: template.primaryColor }}
                className="text-xs font-bold tracking-wide"
              >
                {template.invocation}
              </div>
              {template.subInvocation && (
                <div className="text-[9px] text-stone-500 font-semibold mt-0.5">
                  {template.subInvocation}
                </div>
              )}

              {/* Temple Header */}
              <div className="font-extrabold text-xs text-stone-950 mt-1.5 uppercase tracking-tight">
                {profile.name}
              </div>
              <div className="text-[9px] text-stone-600 mt-0.5">
                {profile.address}, {profile.city} - {profile.pincode}
              </div>
              <div className="text-[9px] text-stone-500">
                Ph: {profile.phone} {profile.registrationNo ? `| Reg: ${profile.registrationNo}` : ''}
              </div>

              {/* Stream / Receipt Badge */}
              <div
                style={{
                  backgroundColor: `${template.primaryColor}15`,
                  color: template.primaryColor,
                  borderColor: `${template.primaryColor}40`,
                }}
                className="text-[10px] font-bold mt-2 py-0.5 px-2 rounded border uppercase tracking-wider inline-block"
              >
                {isMaterial ? 'SACRED DRAVYA DAAN' : streamText}
              </div>
            </div>

            {/* Receipt & Devotee Metadata */}
            <div className="py-2 border-b-2 border-dashed border-stone-300 space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span>Receipt No:</span>
                <strong className="font-mono text-stone-950">{donation.receiptNo}</strong>
              </div>
              <div className="flex justify-between items-center text-[10px] text-stone-600">
                <span>Date & Time:</span>
                <span>{donation.date} {donation.time}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-stone-600">
                <span>Payment Mode:</span>
                <strong className="text-stone-900">{isMaterial ? 'Dravya Daan' : donation.paymentMode}</strong>
              </div>

              {/* Devotee Info */}
              <div className="pt-1.5 border-t border-stone-200">
                <div className="flex justify-between">
                  <span className="text-stone-600">Devotee:</span>
                  <strong className="text-stone-950 text-right">
                    {donation.donorFirstName || donation.donorName?.split(' ')[0] || 'Devotee'} {donation.donorSecondName || donation.donorName?.split(' ').slice(1).join(' ') || ''}
                  </strong>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-stone-600">Mobile:</span>
                  <span className="font-mono">{donation.donorPhone}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-stone-600">Village / Town:</span>
                  <strong className="text-stone-900">{donation.donorVillage}</strong>
                </div>
                {template.showGothraNakshatra && (donation.donorGotra || donation.donorNakshatra) && (
                  <div className="text-[10px] text-stone-600 pt-0.5 flex justify-between">
                    {donation.donorGotra && <span>Gotra: <strong>{donation.donorGotra}</strong></span>}
                    {donation.donorNakshatra && <span>Nakshatra: <strong>{donation.donorNakshatra}</strong></span>}
                  </div>
                )}
              </div>
            </div>

            {/* Particulars Section */}
            <div className="py-2 border-b-2 border-dashed border-stone-300">
              <div className="flex justify-between font-bold pb-1 text-stone-800 text-[10px] uppercase tracking-wider border-b border-stone-200">
                <span>Offering Particulars</span>
                <span>{isMaterial ? 'Quantity' : 'Amount'}</span>
              </div>

              {isMaterial && donation.inKindDetails ? (
                <div className="py-1.5 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-stone-950 text-xs">
                      {donation.inKindDetails.itemDescription}
                    </span>
                    <span className="font-bold text-stone-950 font-mono text-xs">
                      {donation.inKindDetails.quantity} {donation.inKindDetails.unit || 'Units'}
                    </span>
                  </div>
                  {donation.inKindDetails.metalPurity && (
                    <div className="text-[9px] text-stone-600">
                      Purity: {donation.inKindDetails.metalPurity}
                      {donation.inKindDetails.weightGrams ? ` | Net: ${donation.inKindDetails.weightGrams}g` : ''}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between py-1.5 items-center">
                  <span className="font-bold text-stone-900 text-xs">{donation.sevaName}</span>
                  <span className="font-bold text-stone-950 font-mono text-xs">
                    ₹{donation.amount.toLocaleString('en-IN')}.00
                  </span>
                </div>
              )}
            </div>

            {/* Total Section for Monetary Donations */}
            {!isMaterial ? (
              <div className="py-2 border-b-2 border-dashed border-stone-300">
                <div className="flex justify-between items-center text-xs font-black">
                  <span>TOTAL AMOUNT:</span>
                  <span style={{ color: template.primaryColor }} className="text-sm font-mono">
                    ₹{donation.amount.toLocaleString('en-IN')}.00
                  </span>
                </div>
                <div className="text-[9px] text-stone-600 italic mt-0.5">
                  ({numberToWordsIndian(donation.amount)} Rupees Only)
                </div>
              </div>
            ) : (
              <div className="py-1.5 border-b-2 border-dashed border-stone-300 text-center text-[10px] font-bold text-stone-800">
                Sacred Dravya Daan Accepted with Thanks
              </div>
            )}

            {/* Authentic Temple Blessing Shloka & Custom Notices */}
            <div className="py-2 border-b-2 border-dashed border-stone-300 text-center space-y-1">
              <div className="text-[10px] font-bold text-stone-800 leading-snug">
                {template.blessingText}
              </div>
              {template.showPrasadamNote && (
                <div className="text-[9px] text-emerald-800 font-semibold bg-emerald-50 py-0.5 px-1 rounded border border-emerald-200">
                  {template.prasadamNoteText}
                </div>
              )}
              {template.show80GNotice && (
                <div className="text-[8px] text-stone-500 uppercase">
                  {template.taxExemptionText || 'Donations eligible for tax exemption under Section 80G'}
                </div>
              )}
            </div>

            {/* Optional Scannable QR Token Box */}
            {template.showQrCode && (
              <div className="py-2 border-b-2 border-dashed border-stone-300 text-center flex flex-col items-center">
                <div className="w-14 h-14 border-2 border-stone-800 flex items-center justify-center p-1 bg-white">
                  <QrCode className="w-10 h-10 text-stone-800" />
                </div>
                <span className="text-[7px] text-stone-500 mt-0.5 font-mono">
                  VERIFY TOKEN #{donation.receiptNo.slice(-6)}
                </span>
              </div>
            )}

            {/* Footer / Counter Sign-off */}
            <div className="pt-2 text-center text-[9px] text-stone-500 space-y-1">
              <div className="flex justify-between text-[9px]">
                <span>Counter: <strong>{donation.counterName}</strong></span>
                <span>Cashier: <strong>{donation.cashierName}</strong></span>
              </div>
              {(template.showTrusteeSign || template.showDevoteeSign) && (
                <div className="pt-3 flex justify-between items-end text-[9px] text-stone-600">
                  <div className="text-left">
                    {template.showDevoteeSign && (
                      <div className="border-t border-stone-400 pt-0.5 mt-2">Devotee Signature</div>
                    )}
                  </div>
                  <div className="text-right">
                    {template.showTrusteeSign && (
                      <>
                        <div className="font-semibold text-stone-800">For {profile.trustName || profile.name}</div>
                        <div className="border-t border-stone-400 pt-0.5 mt-1">{template.signatoryLabel || 'Authorized Signatory'}</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="text-[8px] text-stone-400 pt-1">
                *** DIGITAL OFFICIAL TEMPLE TOKEN ***
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`p-3 bg-white border-t border-amber-100 grid ${isNativePrinterAvailable() ? 'grid-cols-5' : 'grid-cols-4'} gap-2`}>
          <button
            onClick={handlePrint}
            style={{ backgroundColor: template.primaryColor }}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-white font-bold text-xs transition cursor-pointer shadow-xs hover:opacity-90 active:scale-98"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {isNativePrinterAvailable() && (
            <button
              onClick={handleNativePrint}
              disabled={nativePrintBusy}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
              title="Print directly to a configured POS printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{nativePrintBusy ? 'Printing' : 'POS'}</span>
            </button>
          )}

          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs border border-stone-300 transition cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-amber-700" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleOpenWhatsApp}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs active:scale-98"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleCopyWhatsApp}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-semibold text-xs border border-amber-200 transition cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-700" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
