import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './PdfDownloader.module.scss';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PrimaryButton } from '@fluentui/react';
import { IPdfDownloaderProps } from './IPdfDownloaderProps';
import { IOfferData } from './IOfferData';
import { sp } from "@pnp/sp/presets/all";
import { IPricelistData, IPricelistItem, IParsedDetails } from './IPricelistData';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const headerLogo = require('../assets/header-logo.png');

// Define types for SharePoint list items
interface ISharePointListItem {
  Title: string;
  Description: string;
  DescriptionRichText: string;
}

// Define type for state setters
type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

const offerData: IOfferData = {
  sender: {
    line1: 'NKT GmbH & Co. KG · Ella-Barowsky-Straße 45-47 · 10829 Berlin',
  },
  recipient: {
    name: 'NKT Cables Portugal, S.A.',
    address1: 'Avenida 19 de Agosto No 126',
    zipCity: '4740-209 Esposende',
    country: 'Portugal'
  },
  companyInfo: {
    name: 'NKT GmbH & Co. KG',
    address1: 'Ella-Barowsky-Straße 45-47',
    zipCity: '10829 Berlin',
    country: 'Germany',
    phone: '+49 (0)30 60009-0',
    telefax: '+49 (0)30 60009-417',
    website: 'www.nkt.com',
    email: 'info@nkt.com'
  },
  contactPerson: {
    name: 'Andrea Zedlitz',
    phone: '+493060009313',
    mobile: '+491736293924',
    email: 'Andrea.Zedlitz@nkt.com'
  },
  reference: {
    title: 'Our Reference',
    value: '28060',
    revision: 'Revision 0',
    note: '(please state on orders)',
  },
  date: { date_value: '05.02.2026' },
  offer: {
    titlePrefix: 'Binding Offer: ',
    offerNumber: '28060',
    subtitlePrefix: 'Bonding Cables – ',
    projectReference: '[Project Name] [NKT Reference]'
  },
  greeting: {
    salutation: 'Dear ',
    recipientName: 'Mr. Araújo,'
  },
  body1: {
    enquiryPrefix: 'Thank you for your enquiry on ',
    enquiryDate: '08. January 2026.'
  },
  body2: 'We are pleased to hear of your interest in our cables.',
  body3: 'In response to your request, we are pleased to offer you the following bonding cables:',
  items: [
    'Type 2X2Y 1x120/120 RM 6/10 kV',
    'Type 2X2Y 1x240 RMV 6/10kV'
  ]
};

const tocItems = [
  { no: 1, title: 'Pricelist', page: 3 },
  { no: 2, title: 'Prices', page: 4 },
  { no: 3, title: 'Production facility cables', page: 5 },
  { no: 4, title: '(if delivery outside of Germany) Export Regulations', page: 5 },
  { no: 5, title: 'Delivery', page: 5 },
  { no: 6, title: 'Delivery period', page: 5 },
  { no: 7, title: 'Prices', page: 5 },
  { no: 8, title: 'Terms of payment', page: 5 },
  { no: 9, title: 'Metal Adjustment', page: 6 },
  { no: 10, title: 'Warranty', page: 6 },
  { no: 11, title: 'Limitation of Liability', page: 6 },
  { no: 12, title: 'Validity', page: 7 },
  { no: 13, title: 'Contact', page: 7 },
];

const originalPricelistItems: IPricelistItem[] = [
  {
    itemNo: '1.1.1',
    description: '2X2Y 1x240 RM 6/10 kV',
    qty: 650,
    unit: 'm',
    unitPrice: 55.20,
    total: '35.880,00',
    details: [
      'Bonding Cable watertight', 'Stock cable - subject to prior sale', 'Supplier: Universal Cables Ltd.',
      'Metal Content', 'Cu: 2.048,00 kg/km', 'Delivery length: 1 drum with 650 m',
      'Drum Type: Wooden', 'Drum cover type: None', 'Drum dimensions: 1.800 x 1.350 mm',
      'Weight gross: approx. 2.500 kg.'
    ]
  },
  {
    itemNo: '1.1.2',
    description: '2X2Y 1x120/120 RM 6/10 kV',
    qty: 1000,
    unit: 'm',
    unitPrice: 44.40,
    total: '44.400,00',
    details: [
      'Bonding Cable watertight', 'Supplier: Universal Cables Ltd.', 'Metal Content',
      'Cu: 2.184,00 kg/km', 'Delivery length: 1 drum with 1.000 m each', 'Drum Type: Steel',
      'Drum cover type: None', 'Drum dimensions: 2.000 x 1.350 mm', 'Weight gross: approx. 3.500 kg.'
    ]
  }
];

const parseDetails = (details: string[] | undefined): IParsedDetails => {
  const parsed: IParsedDetails = {};
  if (!details) {
    return parsed;
  }

  const detailMappings: { [key: string]: keyof IParsedDetails } = {
    'Supplier': 'supplier',
    'Delivery length': 'deliveryLength',
    'Drum Type': 'drumType',
    'Drum cover type': 'drumCoverType',
    'Drum dimensions': 'drumDimensions',
    'Weight gross': 'weightGross',
  };

  for (let i = 0; i < details.length; i++) {
    const detail = details[i];

    if (detail.includes(':')) {
      const parts = detail.split(':');
      const key = parts[0].trim();
      const value = parts.slice(1).join(':').trim();

      if (detailMappings[key]) {
        parsed[detailMappings[key]] = value;
      } else if (key.toLowerCase() === 'cu') {
        if (!parsed.metalContent) {
          parsed.metalContent = detail;
        }
      }
    } else {
      if (detail === 'Bonding Cable watertight') {
        parsed.cableType = detail;
      } else if (detail === 'Stock cable - subject to prior sale') {
        parsed.saleType = detail;
      } else if (detail === 'Metal Content') {
        if (i + 1 < details.length) {
          parsed.metalContent = details[i + 1];
          i++; // consume next item
        }
      }
    }
  }
  return parsed;
};

const pricelistData: IPricelistData = {
  title: '1.Pricelist',
  items: [...originalPricelistItems, ...originalPricelistItems, ...originalPricelistItems],
  totalLabel: 'TOTAL - Project',
  totalValue: '80.280,00 EUR',
  vatInfo: 'The respective amount of VAT in accordance with legal regulations shall be added to the prices. VAT will be disclosed separately.'
};

const PdfDownloader: React.FC<IPdfDownloaderProps> = (): React.ReactElement<IPdfDownloaderProps> => {
  const [isContentReady, setIsContentReady] = useState<boolean>(false);
  const [enquiry, setEnquiry] = useState<ISharePointListItem[]>([]);
  const [Price, setPrice] = useState<ISharePointListItem[]>([]);
  const [productionFacilityCables, setProductionFacilityCables] = useState<ISharePointListItem[]>([]);
  const [exportRegulations, setExportRegulations] = useState<ISharePointListItem[]>([]);
  const [delivery, setDelivery] = useState<ISharePointListItem[]>([]);
  const [deliveryPeriod, setDeliveryPeriod] = useState<ISharePointListItem[]>([]);
  const [prices1, setPrices1] = useState<ISharePointListItem[]>([]);
  const [metalAdjustment, setMetalAdjustment] = useState<ISharePointListItem[]>([]);
  const [warranty, setWarranty] = useState<ISharePointListItem[]>([]);
  const [limitationOfLiability, setLimitationOfLiability] = useState<ISharePointListItem[]>([]);
  const [validity, setValidity] = useState<ISharePointListItem[]>([]);
  const [contact, setContact] = useState<ISharePointListItem[]>([]);
  const [automatic, setAutomatic] = useState<ISharePointListItem[]>([]);
  
  const parsedPricelistItems = useMemo((): (IPricelistItem & { parsedDetails: IParsedDetails })[] => {
    const parsedItems = originalPricelistItems.map(item => ({
      ...item,
      parsedDetails: parseDetails(item.details),
    }));
    return [...parsedItems, ...parsedItems, ...parsedItems];
  }, []);

  // Define onLoad before using it in useEffect
  const onLoad = useCallback(async (): Promise<void> => {
    try {
      const items: ISharePointListItem[] = await sp.web.lists.getByTitle('OfferTemplate').items.select('Title', 'Description', 'DescriptionRichText').get();
      console.log('Fetched data from SharePoint list:', items);

      const stateSetterMap: Record<string, StateSetter<ISharePointListItem[]>> = {
        "Prices": setPrice,
        "Production facility cables": setProductionFacilityCables,
        "(if delivery outside of Germany) Export Regulations": setExportRegulations,
        "Delivery": setDelivery,
        "Delivery period": setDeliveryPeriod,
        "Metal Adjustment": setMetalAdjustment,
        "Warranty": setWarranty,
        "Limitation of Liability": setLimitationOfLiability,
        "Validity": setValidity,
        "Contact": setContact,
        "Enquiry": setEnquiry, 
        "Automatic": setAutomatic,       
        "Prices1": setPrices1,
      };
      
      for (const item of items) {
        console.log(`Title: ${item.Title}, Description: ${item.Description}`);
        if (stateSetterMap[item.Title]) {
          stateSetterMap[item.Title]([item]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data from SharePoint list:", error);
    }
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = headerLogo;
    img.onload = () => setIsContentReady(true);
    img.onerror = () => {
      console.error("Failed to load header logo for PDF generation.");
      setIsContentReady(true);
    }
    
    // Use void operator to handle promise
    void onLoad();
  }, [onLoad]);

  const handleDownload = useCallback(async (): Promise<void> => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const footerHeight = 20;
    const lineHeight = 5;
    const contentWidth = pdfWidth - margin * 2;
    const highlightColor = '#000080';

    pdf.setFont('arial'); // Set default font

    const logoWidth = 45;
    const rightColX = pdfWidth - margin - logoWidth;

    const addPageHeader = (): void => {
      pdf.addImage(headerLogo, 'PNG', rightColX, margin, logoWidth, 15);
    };

    const addGenericFooter = (pageNumber: number, totalPages: number): void => {
      pdf.setFontSize(8);
      const footerY = pdfHeight - footerHeight + 5;
      pdf.text(`NKT GmbH & Co. KG`, margin, footerY + lineHeight, { baseline: 'bottom' });

      const col2X = margin + 60;
      pdf.text(offerData.reference.value, col2X, footerY, { baseline: 'bottom' });
      pdf.text(offerData.reference.revision, col2X, footerY + lineHeight, { baseline: 'bottom' });

      const col3X = margin + 120;
      pdf.text(`Confidential`, col3X, footerY + lineHeight, { baseline: 'bottom' });

      pdf.text(`Page ${pageNumber} / ${totalPages}`, pdfWidth - margin, footerY + lineHeight, { align: 'right', baseline: 'bottom' });
    };

    const addPage1Footer = (totalPages: number): void => {
      const footerY = pdfHeight - footerHeight - 4;

      pdf.setLineWidth(0.2);
      pdf.line(margin, footerY - 4, pdfWidth - margin, footerY - 4);

      pdf.setFont('arial', 'normal');
      pdf.setFontSize(6);
      const col1X = margin;
      const col2X = margin + 65;
      const col3X = margin + 130;
      let y = footerY;
      const lineSpacing = 3;

      pdf.text('Commerzbank AG -Lübeckertordamm 5', col1X, y);
      y += lineSpacing;
      pdf.text('20099 Hamburg', col1X, y);
      y += lineSpacing;
      pdf.text('Account. 0621951300 · BLZ 20040000', col1X, y);
      y += lineSpacing;
      pdf.text('Swift/BIC: COBADEFFX', col1X, y);
      y += lineSpacing;
      pdf.text('IBAN: DE78 2004 0000 0622 1717 00', col1X, y);

      y = footerY;
      pdf.text('Head Office: Cologne', col2X, y);
      y += lineSpacing;
      pdf.text('Registration Court: Amtsgericht Cologne,', col2X, y);
      y += lineSpacing;
      pdf.text('No. HRA 30677 · VAT Reg. No. DE 815 517 191', col2X, y);
      y += lineSpacing;
      pdf.text('Tax-No.: 218/5728/1753', col2X, y);

      y = footerY;
      pdf.text('Personally Liable Partner:', col3X, y);
      y += lineSpacing;
      pdf.text('NKT Verwaltungs GmbH Head Office: Cologne', col3X, y);
      y += lineSpacing;
      pdf.text('Registration Court: Amtsgericht Cologne · HRB 14110', col3X, y);
      y += lineSpacing;
      pdf.text('Board of Management: Lukas Sidler · Anders', col3X, y);
      y += lineSpacing;
      pdf.text('Jensen · Wilhelmus Hendrikx', col3X, y);
    };

    // Helper functions for text processing
    const stripHtml = (html: string): string => {
      if (!html) return '';
      const htmlWithNewlines = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/div>/gi, '\n');
      const doc = new DOMParser().parseFromString(htmlWithNewlines, 'text/html');
      return doc.body.textContent || "";
    };

    const getText = (state: ISharePointListItem[]): string => {
      if (Array.isArray(state) && state.length > 0 && state[0] && typeof state[0].Description === 'string') {
        return stripHtml(state[0].Description);
      }
      return '';
    };

    // Variables for replacement - defined BEFORE replaceVars function
    const customerName = offerData.recipient.name;
    const supplierName = parsedPricelistItems[0]?.parsedDetails?.supplier || 'Universal Cables Ltd';
    const deliveryTerms = 'DAP';
    const destinationSite = 'Esposende';
    const recipientName = offerData.recipient.name;
    const stockItems = 'item 1.1.1 and 1.1.2 A1';
    const stockDeliveryTime = '4 weeks';
    const enquiryDate = offerData.body1.enquiryDate;
    const productionItems = 'item 1.1.2';
    const productionDeliveryTime = '34 weeks';
    const copperPrice = "13.310,00 USD/t";
    const exchangeRate = "1,168200";
    const dateTodayMinus1 = "insert date: today minus 1";
    const validityDate = "31.01.2026";
    const contact1Name = "Senior Commercial & Tender Manager Mrs. Andrea Zedlitz";
    const contact1Mobile = "+491736293924";
    const contact1Email = "Andrea.Zedlitz@nkt.com";
    const contact2Name = "Senior Technical Offer & Order Manager Mr. Oliver Sablic";
    const contact2Mobile = "+491607479305";
    const contact2Email = "Oliver.Sablic@nkt.com";

    const replaceVars = (text: string): string => {
      if (!text) return '';
      return text
        // Customer/Company variations
        .replace(/\[customer\s*name\]/gi, customerName)
        .replace(/\[company\s*name\]/gi, customerName)
        // Supplier variations
        .replace(/\[supplier\s*name\]/gi, supplierName)
        .replace(/\[suppliername\]/gi, supplierName)
        .replace(/\[supllier\s*name\]/gi, supplierName)
        .replace(/\[suplliername\]/gi, supplierName)
        // Delivery variations
        .replace(/\[delivery\s*terms\]/gi, deliveryTerms)
        .replace(/\[delivery\s*incoterm\]/gi, deliveryTerms)
        .replace(/\[deliveryincoterm\]/gi, deliveryTerms)
        // Location/Destination variations
        .replace(/\[destination\s*site\]/gi, destinationSite)
        .replace(/\[location\]/gi, destinationSite)
        // Recipient/Address variations
        .replace(/\[recipient\s*name\]/gi, recipientName)
        .replace(/\[address\]/gi, recipientName)
        // Stock items
        .replace(/\[stock\s*items\]/gi, stockItems)
        .replace(/\[stock\s*delivery\s*time\]/gi, stockDeliveryTime)
        // Production items
        .replace(/\[production\s*items\]/gi, productionItems)
        .replace(/\[production\s*delivery\s*time\]/gi, productionDeliveryTime)
        // Copper/Metal variations
        .replace(/\[copper\s*price\]/gi, copperPrice)
        .replace(/\[copper\s*content\]/gi, copperPrice)
        .replace(/\[metal\s*price\]/gi, copperPrice)
        // Exchange rate
        .replace(/\[exchange\s*rate\]/gi, exchangeRate)
        // Date variations
        .replace(/\[date\s*today\s*minus\s*1\]/gi, dateTodayMinus1)
        .replace(/\[insert\s*date\]/gi, dateTodayMinus1)
        .replace(/\[validity\s*date\]/gi, validityDate)
        .replace(/\[enquiry\s*date\]/gi, enquiryDate)
        // Contact information
        .replace(/\[contact\s*1\s*name\]/gi, contact1Name)
        .replace(/\[contact\s*1\s*mobile\]/gi, contact1Mobile)
        .replace(/\[contact\s*1\s*email\]/gi, contact1Email)
        .replace(/\[contact\s*2\s*name\]/gi, contact2Name)
        .replace(/\[contact\s*2\s*mobile\]/gi, contact2Mobile)
        .replace(/\[contact\s*2\s*email\]/gi, contact2Email);
    };

    // --- PAGE 1: OFFER DOCUMENT ---
    addPageHeader();

    // Sender line - gray color
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(offerData.sender.line1, margin, 35);
    pdf.setTextColor(0, 0, 0); // Reset color

    // Recipient
    let y = 45;
    pdf.setFontSize(10);
    pdf.setFont('arial', 'bold');
    pdf.text(offerData.recipient.name, margin, y);
    y += lineHeight;
    pdf.setFont('arial', 'normal');
    pdf.text(offerData.recipient.address1, margin, y);
    y += lineHeight;
    pdf.text(offerData.recipient.zipCity, margin, y);
    y += lineHeight;
    pdf.text(offerData.recipient.country, margin, y);

    // Right Column
    let rightY = margin + 20;
    pdf.setTextColor(highlightColor); // Set color for the right column

    const drawRightColText = (text: string, isBold = false): void => {
      pdf.setFont('arial', isBold ? 'bold' : 'normal');
      pdf.text(text, rightColX, rightY);
      rightY += lineHeight;
    };

    drawRightColText(offerData.companyInfo.name, true);
    drawRightColText(offerData.companyInfo.address1);
    drawRightColText(offerData.companyInfo.zipCity);
    drawRightColText(offerData.companyInfo.country);
    rightY += lineHeight;
    drawRightColText(`Phone: ${offerData.companyInfo.phone}`);
    drawRightColText(`Telefax: ${offerData.companyInfo.telefax}`);
    drawRightColText(`Internet: ${offerData.companyInfo.website}`);
    drawRightColText(`E-Mail: ${offerData.companyInfo.email}`);
    rightY += lineHeight;
    drawRightColText('Contact Person', true);
    drawRightColText(offerData.contactPerson.name);
    drawRightColText(`Phone: ${offerData.contactPerson.phone}`);
    drawRightColText(`Mobile: ${offerData.contactPerson.mobile}`);
    drawRightColText(offerData.contactPerson.email);
    rightY += lineHeight;
    drawRightColText(offerData.reference.title, true);
    drawRightColText(offerData.reference.value);
    drawRightColText(offerData.reference.revision);
    drawRightColText(offerData.reference.note);

    y = Math.max(y, rightY) + 5;
    
    // Date
    pdf.setFont('georgia', 'bold');
    pdf.setFontSize(8);
    pdf.text(offerData.date.date_value, margin, y);
    y += 5;

    // Offer Title
    pdf.setFont('georgia', 'bold');
    pdf.setFontSize(8);
    pdf.text(offerData.offer.titlePrefix + offerData.offer.offerNumber, margin, y);
    y += 7;

    // Offer Subtitle
    pdf.setFont('georgia', 'bold');
    pdf.setFontSize(14);
    pdf.text(offerData.offer.subtitlePrefix + offerData.offer.projectReference, margin, y);

    // Reset styles for subsequent text
    pdf.setFont('arial', 'normal');
    pdf.setFontSize(10);

    pdf.setTextColor(0, 0, 0); // Reset color for main body

    y += 15;
    pdf.text(offerData.greeting.salutation + offerData.greeting.recipientName, margin, y);
    y += 10;
    
    const body1Text = `${offerData.body1.enquiryPrefix}${offerData.body1.enquiryDate}`;
    const fullBodyText = `${body1Text}

${offerData.body2}

${offerData.body3}`;
    const bodyLines = pdf.splitTextToSize(fullBodyText, contentWidth);
    pdf.text(bodyLines, margin, y);
    y += bodyLines.length * lineHeight;

    y += 5;
    offerData.items.forEach(item => {
      y += 5;
      pdf.text(item, margin, y);
    });

    // --- PAGE 2: TABLE OF CONTENTS ---
    pdf.addPage();
    pdf.setFont('arial', 'bold');
    pdf.setFontSize(16);
    pdf.text("Table of contents", margin, margin + 15);
    autoTable(pdf, {
      head: [['S.No', 'Title', 'Page No']],
      body: tocItems.map(item => [item.no, item.title, item.page]),
      startY: margin + 25,
      headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [0, 0, 0], font: 'arial' },
      styles: { font: 'arial' },
      didDrawPage: (data) => addPageHeader()
    });

    // --- PAGE 3: PRICELIST ---
    pdf.addPage();
    pdf.setFont('georgia', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(highlightColor);
    pdf.text(pricelistData.title, margin, margin + 15);
    pdf.setTextColor(0, 0, 0); // Reset color
    pdf.setFont('arial', 'normal'); // Reset font

    const totalSum = parsedPricelistItems.reduce((sum, item) => {
      if (!item.total) return sum;
      const val = parseFloat(item.total.replace(/\./g, '').replace(',', '.'));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
    const formattedTotal = totalSum.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR';

    const tableBody = parsedPricelistItems.map(item => {
      const details = item.parsedDetails ? Object.entries(item.parsedDetails)
        .map(([key, value]) => {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
          return `${formattedKey}: ${value}`;
        })
        .join('\n') : '';
      const description = item.description + (details ? '\n' + details : '');
      return [
        item.itemNo,
        description,
        '',
        item.qty,
        item.unit,
        typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2).replace('.', ',') : item.unitPrice,
        item.total
      ];
    });
    tableBody.push(['', 'TOTAL - Project', '', '', '', '', formattedTotal]);

    autoTable(pdf, {
      head: [['Item-No.', 'Description', 'Drawing', 'Qty.', 'Unit', 'Unit Price EUR', 'Total EUR']],
      body: tableBody,
      theme: 'grid',
      startY: margin + 25,
      margin: { top: 40, bottom: 30, left: margin, right: margin },
      headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0], font: 'arial' },
      styles: { lineColor: [0, 0, 0], lineWidth: 0.1, textColor: [0, 0, 0], font: 'arial' },
      didDrawPage: (data) => addPageHeader(),
      columnStyles: {
        3: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (pdf as any).lastAutoTable.finalY;
    pdf.setFont('arial', 'normal');
    pdf.setFontSize(10);
    pdf.text(pricelistData.vatInfo, margin, finalY + 10, { maxWidth: pdfWidth - margin * 2 });

    // --- PAGE 4 AND BEYOND: ADDITIONAL CONTENT ---
    pdf.addPage();
    addPageHeader();

    let currentY = margin + 25;

    // Helper function for section titles
    const addSectionTitle = (num: string, title: string): void => {
      // Check if we need a new page BEFORE adding the title
      if (currentY > pdfHeight - footerHeight - 25) {
        pdf.addPage();
        addPageHeader();
        currentY = margin + 25;
      }
      
      pdf.setFont('georgia', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(highlightColor);
      pdf.text(`${num} ${title}`, margin, currentY);
      pdf.setTextColor(0, 0, 0); // Reset color
      currentY += 7;
    };

    // Helper function to add content with proper flow
    const addContent = (text: string): void => {
      if (!text) return;
      
      pdf.setFont('arial', 'normal');
      pdf.setFontSize(9);
      
      const lines = pdf.splitTextToSize(text, contentWidth);
      const lineHeight_px = 4.5;
      const paragraphHeight = lines.length * lineHeight_px;
      
      // Check if we need a new page for this content
      if (currentY + paragraphHeight > pdfHeight - footerHeight - 15) {
        pdf.addPage();
        addPageHeader();
        currentY = margin + 25;
      }
      
      // Write the content
      for (let i = 0; i < lines.length; i++) {
        pdf.text(lines[i], margin, currentY + (i * lineHeight_px));
      }
      
      currentY += paragraphHeight + 2;
    };

    // Section 2: Prices
    addSectionTitle('2.', 'Prices');
    const priceContent = replaceVars(getText(Price));
    if (priceContent) addContent(priceContent);

    // Section 3: Production facility cables
    addSectionTitle('3.', 'Production facility cables');
    const prodContent = replaceVars(getText(productionFacilityCables));
    if (prodContent) addContent(prodContent);

    // Section 4: Export Regulations
    addSectionTitle('4.', '(if delivery outside of Germany) Export Regulations');
    const exportContent = replaceVars(getText(exportRegulations));
    if (exportContent) addContent(exportContent);

    // Section 5: Delivery
    addSectionTitle('5.', 'Delivery');
    const deliveryContent = replaceVars(getText(delivery));
    if (deliveryContent) addContent(deliveryContent);

    // Section 6: Delivery period
    addSectionTitle('6.', 'Delivery period');
    const deliveryPeriodContent = replaceVars(getText(deliveryPeriod));
    if (deliveryPeriodContent) addContent(deliveryPeriodContent);

    // Section 7: Prices
    addSectionTitle('7.', 'Prices');
    const prices1Content = replaceVars(getText(prices1));
    if (prices1Content) addContent(prices1Content);

    // Section 8: Terms of payment
    addSectionTitle('8.', 'Terms of payment');
    
    // Special handling for Terms of payment with italic keys
    if (currentY > pdfHeight - footerHeight - 25) {
      pdf.addPage();
      addPageHeader();
      currentY = margin + 25;
    }
    
    pdf.setFont('arial', 'italic');
    pdf.setFontSize(9);
    pdf.text('If Internal:', margin, currentY);
    pdf.setFont('arial', 'normal');
    pdf.text(' 30 days after delivery.', margin + pdf.getTextWidth('If Internal:'), currentY);
    currentY += 4.5;
    
    pdf.setFont('arial', 'italic');
    pdf.text('If Intercompany:', margin, currentY);
    pdf.setFont('arial', 'normal');
    pdf.text(' According to the Intercompany Settlement.', margin + pdf.getTextWidth('If Intercompany:'), currentY);
    currentY += 4.5;
    
    pdf.setFont('arial', 'italic');
    pdf.text('If External:', margin, currentY);
    pdf.setFont('arial', 'normal');
    pdf.text(' Needs to be defined.', margin + pdf.getTextWidth('If External:'), currentY);
    currentY += 6.5;

    // Section 9: Metal Adjustment
    addSectionTitle('9.', 'Metal Adjustment');
    const metalContent = replaceVars(getText(metalAdjustment));
    if (metalContent) {
      // Split metal content into paragraphs for better flow
      const paragraphs = metalContent.split('\n\n');
      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          addContent(paragraph);
        }
      }
    }

    // Section 10: Warranty
    addSectionTitle('10.', 'Warranty');
    const warrantyContent = replaceVars(getText(warranty));
    if (warrantyContent) addContent(warrantyContent);

    // Section 11: Limitation of Liability
    addSectionTitle('11.', 'Limitation of Liability');
    const liabilityContent = replaceVars(getText(limitationOfLiability));
    if (liabilityContent) {
      // Split liability content into paragraphs
      const paragraphs = liabilityContent.split('\n\n');
      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          addContent(paragraph);
        }
      }
    }

    // Section 12: Validity
    addSectionTitle('12.', 'Validity');
    const validityContent = replaceVars(getText(validity));
    if (validityContent) addContent(validityContent);

    // Section 13: Contact
    addSectionTitle('13.', 'Contact');
    const contactContent = replaceVars(getText(contact));
    if (contactContent) {
      // Split contact content into paragraphs
      const paragraphs = contactContent.split('\n\n');
      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          addContent(paragraph);
        }
      }
    }

    // Automatic content
    const automaticContent = replaceVars(getText(automatic));
    if (automaticContent) {
      // Check if we need a new page
      if (currentY > pdfHeight - footerHeight - 25) {
        pdf.addPage();
        addPageHeader();
        currentY = margin + 25;
      }
      addContent(automaticContent);
    }

    // Best wishes - add with proper spacing
    if (currentY > pdfHeight - footerHeight - 20) {
      pdf.addPage();
      addPageHeader();
      currentY = margin + 25;
    }
    
    addContent("Best wishes from the NKT team.");
    addContent("This offer was automatically created and is valid without signature.");

    // Add footers to all pages
    const totalPages = (pdf as any).internal.getNumberOfPages();
    pdf.setPage(1);
    addPage1Footer(totalPages);
    for (let i = 2; i <= totalPages; i++) {
      pdf.setPage(i);
      addGenericFooter(i, totalPages);
    }

    pdf.save('NKT-Offer.pdf');
  }, [
    parsedPricelistItems, enquiry, Price, productionFacilityCables,
    exportRegulations, delivery, deliveryPeriod, prices1, metalAdjustment,
    warranty, limitationOfLiability, validity, contact, automatic
  ]);

  return (
    <section className={styles.pdfDownloader}>
      <PrimaryButton
        onClick={handleDownload}
        text={isContentReady ? "Download as PDF" : "Loading..."}
        disabled={!isContentReady}
        styles={{
          root: { backgroundColor: '#0078d4', borderColor: '#0078d4' },
          rootHovered: { backgroundColor: '#005a9e', borderColor: '#005a9e' },
          rootPressed: { backgroundColor: '#005a9e', borderColor: '#005a9e' }
        }}
      />
    </section>
  );
};

export default PdfDownloader;