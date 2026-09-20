import React, { useState } from 'react';
import {
  Printer,
  FileDown,
  X,
  CheckCircle2,
  Copy,
  MessageCircle,
  Stamp,
} from 'lucide-react';
import { ExpenseVoucher, TempleProfile, PaymentOrderTemplateConfig } from '../../types/accounting';
import { storageService } from '../../services/storageService';
import { generateExpenseSanctionOrderPDF, numberToWordsIndian } from '../../services/pdfService';
import { isNativePrinterAvailable, printElementWithNativePrinter } from '../../services/nativePrinterService';
import { ModalPortal } from '../ui/ModalPortal';
import { useFeedback } from '../ui/Feedback';

interface PaymentOrderModalProps {
  voucher: ExpenseVoucher | null;
  onClose: () => void;
}

export const PaymentOrderModal: React.FC<PaymentOrderModalProps> = ({ voucher, onClose }) => {
  const { notify } = useFeedback();
  const [copied, setCopied] = useState(false);
  const [nativePrintBusy, setNativePrintBusy] = useState(false);
  const profile: TempleProfile = storageService.getTempleProfile();
  const template: PaymentOrderTemplateConfig = storageService.getActivePaymentOrderTemplate();

  if (!voucher) return null;

  const borderCss =
    template.borderStyle === 'double' ? 'double' : 'solid';

  const handlePrint = () => {
    // Payment orders always print on a full A4/A5 sheet (governance document).
    const pageSize = template.paperSize === 'A4' ? 'A4 portrait' : 'A5 portrait';
    const styleId = 'dynamic-payment-order-print-style';
    document.getElementById(styleId)?.remove();
    const style = document.createElement('style');
    style.id = styleId;
    style.media = 'print';
    style.textContent = `
      @page { size: ${pageSize}; margin: 8mm; }
      body * { visibility: hidden !important; }
      #printable-payment-order, #printable-payment-order * { visibility: visible !important; }
      #printable-payment-order {
        width: 100% !important;
        max-width: 100% !important;
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
    setTimeout(cleanup, 1000);
  };

  const handleDownloadPDF = () => {
    const doc = generateExpenseSanctionOrderPDF(voucher);
    doc.save(`${template.orderTitle.replace(/\s+/g, '_')}_${voucher.sanctionOrderNo}.pdf`);
  };

  const handleNativePrint = async () => {
    setNativePrintBusy(true);
    try {
      await printElementWithNativePrinter('printable-payment-order');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'POS printing failed.', 'error');
    } finally {
      setNativePrintBusy(false);
    }
  };

  const generateWhatsAppText = () => {
    const wordsLine = template.showAmountInWords
      ? `\nIn Words: ${numberToWordsIndian(voucher.amount)} Rupees Only`
      : '';
    const modeLine = template.showPaymentMode ? `\nMode: ${voucher.paymentMode}` : '';
    const refLine = voucher.refNo ? `\nRef: ${voucher.refNo}` : '';
    const sevaLine = voucher.sevaName ? `\nAllocation: ${voucher.sevaName}` : '';
    return `${profile.name}
${template.orderTitle}
--------------------------------
Order No: ${voucher.sanctionOrderNo}
Date: ${voucher.date} ${voucher.time}
Payee: ${voucher.payeeName}
Purpose: ${voucher.purpose}${sevaLine}
Expense Head: ${voucher.debitAccountName}
Paid From: ${voucher.creditAccountName}${modeLine}${refLine}
--------------------------------
${template.amountLabel}: Rs.${voucher.amount.toLocaleString('en-IN')}.00${wordsLine}
--------------------------------
${template.sanctionedByLabel}: ${voucher.sanctionedBy}
${template.footerNote}`;
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(generateWhatsAppText());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent(generateWhatsAppText());
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const isVoided = voucher.status === 'VOIDED';

  return (
    <ModalPortal>
    <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-fadeIn">
        {/* Modal Top Bar */}
        <div
          style={{ backgroundColor: template.primaryColor }}
          className="px-4 py-3 flex items-center justify-between text-white shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Stamp className="w-4 h-4" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs sm:text-sm leading-tight tracking-tight">
                  {template.name}
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-semibold">
                  {template.paperSize}
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-mono">{voucher.sanctionOrderNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Order Preview */}
        <div className="p-4 bg-stone-100/70 flex justify-center max-h-[72vh] overflow-y-auto scrollbar-thin">
          <div
            id="printable-payment-order"
            style={{
              borderColor: template.primaryColor,
              borderStyle: borderCss,
              borderWidth: template.borderStyle === 'double' ? '4px' : '2px',
            }}
            className="bg-white p-5 shadow-md text-stone-900 rounded-sm select-text relative w-full max-w-md text-[11px] leading-relaxed"
          >
            {isVoided && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-6xl font-black text-rose-600/15 rotate-[-20deg] tracking-widest">
                  VOIDED
                </span>
              </div>
            )}

            {/* Header */}
            <div className="text-center pb-3 border-b-2 border-stone-300">
              <div className="font-extrabold text-sm uppercase tracking-tight text-stone-950">
                {profile.name}
              </div>
              <div className="text-[10px] text-stone-600 mt-0.5">
                {profile.address}, {profile.city} - {profile.pincode}
              </div>
              <div className="text-[10px] text-stone-500">
                Ph: {profile.phone}
                {profile.registrationNo ? ` | Reg: ${profile.registrationNo}` : ''}
                {profile.panNumber ? ` | PAN: ${profile.panNumber}` : ''}
              </div>
              {template.headerNote && (
                <div className="text-[10px] italic text-stone-500 mt-1">{template.headerNote}</div>
              )}
              <div
                style={{
                  backgroundColor: `${template.primaryColor}12`,
                  color: template.primaryColor,
                  borderColor: `${template.primaryColor}40`,
                }}
                className="text-xs font-bold mt-2 py-1 px-3 rounded border uppercase tracking-wider inline-block"
              >
                {template.orderTitle}
              </div>
            </div>

            {/* Order Meta */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 py-2.5 border-b border-dashed border-stone-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-500">Order No:</span>
                <strong className="font-mono text-stone-950">{voucher.sanctionOrderNo}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Voucher No:</span>
                <strong className="font-mono text-stone-900">{voucher.voucherNo}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Date:</span>
                <span>{voucher.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Time:</span>
                <span>{voucher.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Status:</span>
                <strong className={isVoided ? 'text-rose-700' : 'text-emerald-700'}>{voucher.status}</strong>
              </div>
              {template.showPaymentMode && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Mode:</span>
                  <strong className="text-stone-900">{voucher.paymentMode}</strong>
                </div>
              )}
            </div>

            {/* Payee & Particulars */}
            <div className="py-2.5 border-b border-dashed border-stone-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-500">Pay To:</span>
                <strong className="text-stone-950 text-right">{voucher.payeeName}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-stone-500 shrink-0">Purpose:</span>
                <span className="text-right text-stone-900">{voucher.purpose}</span>
              </div>
              {voucher.sevaName && (
                <div className="flex justify-between gap-3">
                  <span className="text-stone-500 shrink-0">Allocation:</span>
                  <span className="text-right text-stone-800">{voucher.sevaName}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-stone-500 shrink-0">Category:</span>
                <span className="text-right text-stone-800">{voucher.category}</span>
              </div>
              {voucher.refNo && (
                <div className="flex justify-between gap-3">
                  <span className="text-stone-500 shrink-0">Bill / Ref No:</span>
                  <span className="text-right font-mono text-stone-800">{voucher.refNo}</span>
                </div>
              )}
            </div>

            {/* Accounting Box */}
            {template.showAccountingBox && (
              <div className="py-2.5 border-b border-dashed border-stone-300">
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-stone-300 rounded-md p-2">
                    <div className="text-[9px] uppercase tracking-wider text-stone-500 font-bold mb-0.5">
                      Debit (Expense Head)
                    </div>
                    <div className="font-semibold text-stone-900 text-[11px]">{voucher.debitAccountName}</div>
                  </div>
                  <div className="border border-stone-300 rounded-md p-2">
                    <div className="text-[9px] uppercase tracking-wider text-stone-500 font-bold mb-0.5">
                      Credit (Paid From)
                    </div>
                    <div className="font-semibold text-stone-900 text-[11px]">{voucher.creditAccountName}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="py-2.5 border-b-2 border-stone-300">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                  {template.amountLabel}
                </span>
                <span style={{ color: template.accentColor }} className="text-lg font-black font-mono">
                  ₹{voucher.amount.toLocaleString('en-IN')}.00
                </span>
              </div>
              {template.showAmountInWords && (
                <div className="text-[10px] text-stone-600 italic mt-0.5 text-right">
                  ({numberToWordsIndian(voucher.amount)} Rupees Only)
                </div>
              )}
            </div>

            {/* Notes */}
            {voucher.notes && (
              <div className="py-2 border-b border-dashed border-stone-300 text-[10px] text-stone-600">
                <span className="font-semibold text-stone-700">Note: </span>
                {voucher.notes}
              </div>
            )}

            {/* Voided reason */}
            {isVoided && voucher.voidedReason && (
              <div className="py-2 border-b border-dashed border-stone-300 text-[10px] text-rose-700">
                <span className="font-semibold">Void Reason: </span>
                {voucher.voidedReason}
              </div>
            )}

            {/* Footer declaration */}
            {template.footerNote && (
              <div className="py-2.5 text-center text-[10px] text-stone-600 italic">
                {template.footerNote}
              </div>
            )}

            {/* Signatures */}
            <div className="pt-6 grid grid-cols-3 gap-2 text-center text-[9px] text-stone-600">
              {template.showPreparedBy ? (
                <div className="border-t border-stone-400 pt-1">{template.preparedByLabel}</div>
              ) : (
                <div />
              )}
              {template.showCheckedBy ? (
                <div className="border-t border-stone-400 pt-1">{template.checkedByLabel}</div>
              ) : (
                <div />
              )}
              <div className="border-t border-stone-400 pt-1">
                <div className="font-semibold text-stone-900">{voucher.sanctionedBy}</div>
                {template.sanctionedByLabel}
              </div>
            </div>

            <div className="text-center text-[8px] text-stone-400 pt-3">
              *** OFFICIAL TEMPLE PAYMENT ORDER — For {profile.trustName || profile.name} ***
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`p-3 bg-white border-t border-stone-100 grid ${isNativePrinterAvailable() ? 'grid-cols-5' : 'grid-cols-4'} gap-2`}>
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
            <FileDown className="w-3.5 h-3.5 text-rose-700" />
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
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold text-xs border border-stone-200 transition cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-600" />
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
