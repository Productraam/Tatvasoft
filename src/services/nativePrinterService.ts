export interface NativePrinter {
  name: string;
  displayName?: string;
  description?: string;
  status?: number;
  isDefault?: boolean;
}

declare global {
  interface Window {
    templePrinter?: {
      listPrinters: () => Promise<NativePrinter[]>;
      printHtml: (payload: { html: string; deviceName?: string; silent?: boolean }) => Promise<{ success: boolean }>;
    };
  }
}

export const isNativePrinterAvailable = () => Boolean(window.templePrinter);

export const listNativePrinters = async (): Promise<NativePrinter[]> => {
  if (!window.templePrinter) return [];
  return window.templePrinter.listPrinters();
};

export const printElementWithNativePrinter = async (elementId: string, deviceName?: string) => {
  if (!window.templePrinter) {
    throw new Error('Native POS printing is available in the Electron desktop app only.');
  }

  const element = document.getElementById(elementId);
  if (!element) throw new Error('Printable content was not found.');

  const styles = Array.from(document.querySelectorAll('style'))
    .map((style) => style.textContent || '')
    .join('\n');
  const html = `<!doctype html><html><head><meta charset="UTF-8"><style>${styles}</style></head><body>${element.outerHTML}</body></html>`;
  return window.templePrinter.printHtml({ html, deviceName, silent: true });
};
