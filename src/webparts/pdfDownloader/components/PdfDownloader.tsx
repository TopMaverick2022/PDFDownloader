import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
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
  const [isContentReady, setIsContentReady] = useState(false);
  const [enquiry, setEnquiry] = useState<any>([]);
  const [Price,setPrice] = useState<any>([]);
  const [productionFacilityCables, setProductionFacilityCables] = useState<any>([]);
  const [exportRegulations, setExportRegulations] = useState<any>([]);
  const [delivery, setDelivery] = useState<any>([]);
  const [deliveryPeriod, setDeliveryPeriod] = useState<any>([]);
  const [prices1, setPrices1] = useState<any>([]);
  const [metalAdjustment, setMetalAdjustment] = useState<any>([]);
  const [warranty, setWarranty] = useState<any>([]);
  const [limitationOfLiability, setLimitationOfLiability] = useState<any>([]);
  const [validity, setValidity] = useState<any>([]);
  const [contact, setContact] = useState<any>([]);
  const [automatic, setAutomatic] = useState<any>([]);
  const parsedPricelistItems = useMemo(() => {
    const parsedItems = originalPricelistItems.map(item => ({
      ...item,
      parsedDetails: parseDetails(item.details),
    }));
    return [...parsedItems, ...parsedItems, ...parsedItems];
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = headerLogo;
    img.onload = () => setIsContentReady(true);
    img.onerror = () => {
      console.error("Failed to load header logo for PDF generation.");
      setIsContentReady(true);
    }
    onLoad();
  }, []);

  // const onLoad = async (): Promise<void> => {
  //   let data = await sp.web.lists.getByTitle('OfferTemplate').items.select('*').get();
  //   console.log('Fetched data from SharePoint list:', data);
  //   let res = data.filter(data => data.Title == "Prices")
  //   console.log('Filtered data for Title "Price":', res);
  //   setPrice(res[0].Description)
    
  // }
const onLoad = async (): Promise<void> => {
try {
      const items: { Title: string, Description: string, DescriptionRichText: string }[] = await sp.web.lists.getByTitle('OfferTemplate').items.select('Title', 'Description', 'DescriptionRichText').get();
      console.log('Fetched data from SharePoint list:', items);

      // A map for title to state setter function
      const stateSetterMap: { [key: string]: (value: any) => void } = {
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
  };


  const handleDownload = React.useCallback(async (): Promise<void> => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const footerHeight = 20;
    const lineHeight = 5;
    const contentWidth = pdfWidth - margin * 2;

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

      pdf.setFont('helvetica', 'normal');
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

    // --- PAGE 1: OFFER DOCUMENT ---
    addPageHeader();

    // Sender line - gray color
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(offerData.sender.line1, margin, 35);
    pdf.setTextColor(0, 0, 0);

    // Recipient
    let y = 45;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(offerData.recipient.name, margin, y);
    y += lineHeight;
    pdf.setFont('helvetica', 'normal');
    pdf.text(offerData.recipient.address1, margin, y);
    y += lineHeight;
    pdf.text(offerData.recipient.zipCity, margin, y);
    y += lineHeight;
    pdf.text(offerData.recipient.country, margin, y);


    let rightY = margin + 20;

    const drawRightColText = (text: string, isBold = false): void => {
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.text(text, rightColX, rightY);
      rightY += lineHeight;
    };

    drawRightColText(offerData.companyInfo.name, true);
    drawRightColText(offerData.companyInfo.address1);
    drawRightColText(offerData.companyInfo.zipCity);
    drawRightColText(offerData.companyInfo.country);
    rightY += lineHeight; // Spacer
    drawRightColText(`Phone: ${offerData.companyInfo.phone}`);
    drawRightColText(`Telefax: ${offerData.companyInfo.telefax}`);
    drawRightColText(`Internet: ${offerData.companyInfo.website}`);
    drawRightColText(`E-Mail: ${offerData.companyInfo.email}`);
    rightY += lineHeight; // Spacer
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
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(offerData.date.date_value, margin, y);
    y += 5;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(offerData.offer.titlePrefix + offerData.offer.offerNumber, margin, y);
    y += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(offerData.offer.subtitlePrefix + offerData.offer.projectReference, margin, y);

    y += 15;
    pdf.text(offerData.greeting.salutation + offerData.greeting.recipientName, margin, y);
    y += 10;
    
    // Helper functions for text processing
    const stripHtml = (html: string): string => {
      if (!html) return '';
      // Replace common block tags with newlines to preserve spacing
      const htmlWithNewlines = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/div>/gi, '\n');
      const doc = new DOMParser().parseFromString(htmlWithNewlines, 'text/html');
      return doc.body.textContent || "";
    };

    const getText = (state: any): string => {
      if (Array.isArray(state) && state.length > 0 && state[0] && typeof state[0].Description === 'string') {
        return stripHtml(state[0].Description);
      } else if (typeof state === 'string') {
        return stripHtml(state);
      }
      return '';
    };

    const getRichText = (state: any): string => {
      if (Array.isArray(state) && state.length > 0 && state[0] && typeof state[0].DescriptionRichText === 'string') {
        return stripHtml(state[0].DescriptionRichText);
      }
      return '';
    };

    const replaceVars = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/\$\{customerName\}/g, customerName)
        .replace(/\$\{supplierName\}/g, supplierName)
        .replace(/\$\{deliveryTerms\}/g, deliveryTerms)
        .replace(/\$\{destinationSite\}/g, destinationSite)
        .replace(/\$\{recipientName\}/g, recipientName)
        .replace(/\$\{stockItems\}/g, stockItems)
        .replace(/\$\{stockDeliveryTime\}/g, stockDeliveryTime)
        .replace(/\$\{productionItems\}/g, productionItems)
        .replace(/\$\{productionDeliveryTime\}/g, productionDeliveryTime)
        .replace(/\$\{copperPrice\}/g, copperPrice)
        .replace(/\$\{exchangeRate\}/g, exchangeRate)
        .replace(/\$\{dateTodayMinus1\}/g, dateTodayMinus1)
        .replace(/\$\{validityDate\}/g, validityDate)
        .replace(/\$\{contact1Name\}/g, contact1Name)
        .replace(/\$\{contact1Mobile\}/g, contact1Mobile)
        .replace(/\$\{contact1Email\}/g, contact1Email)
        .replace(/\$\{contact2Name\}/g, contact2Name)
        .replace(/\$\{contact2Mobile\}/g, contact2Mobile)
        .replace(/\$\{contact2Email\}/g, contact2Email)
        .replace(/\$\{enquiryDate\}/g, enquiryDate);
    };
    
    const enquiryContent = replaceVars(getText(enquiry));
    const enquiryLines = pdf.splitTextToSize(enquiryContent, contentWidth);
    pdf.text(enquiryLines, margin, y);
    y += enquiryLines.length * lineHeight;
    y += 5;
    offerData.items.forEach(item => {
      y += 5;
      pdf.text(item, margin, y);
    });

    // --- PAGE 2: TABLE OF CONTENTS ---
    pdf.addPage();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text("Table of contents", margin, margin + 15);
    autoTable(pdf, {
      head: [['S.No', 'Title', 'Page No']],
      body: tocItems.map(item => [item.no, item.title, item.page]),
      startY: margin + 25,
      headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [0, 0, 0] },
      didDrawPage: (data) => addPageHeader()
    });

    // --- PAGE 3+: PRICELIST ---
    pdf.addPage();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(pricelistData.title, margin, margin + 15);

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
      headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0] },
      styles: { lineColor: [0, 0, 0], lineWidth: 0.1, textColor: [0, 0, 0] },
      didDrawPage: (data) => addPageHeader(),
      columnStyles: {
        3: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (pdf as any).lastAutoTable.finalY;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(pricelistData.vatInfo, margin, finalY + 10, { maxWidth: pdfWidth - margin * 2 });

    // --- ADDITIONAL CONTENT PAGES ---
    pdf.addPage();
    addPageHeader();

    let currentY = margin + 25;

    const addSectionTitle = (num: string, title: string): void => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      if (currentY + 10 > pdfHeight - footerHeight - 10) {
        pdf.addPage();
        addPageHeader();
        currentY = margin + 25;
      }
      pdf.text(`${num} ${title}`, margin, currentY);
      currentY += 7;
    };

    const addParagraph = (num: string, text: string, align: 'left' | 'justify' = 'justify', fontWeight: 'normal' | 'bold' = 'normal'): void => {
      pdf.setFont('helvetica', fontWeight);
      pdf.setFontSize(10);

      const fullText = num ? `${num}        ${text}` : text;
      const lines = pdf.splitTextToSize(fullText, contentWidth);
      const height = lines.length * 4.5;

      if (currentY + height > pdfHeight - footerHeight - 10) {
        pdf.addPage();
        addPageHeader();
        currentY = margin + 25;
      }

      pdf.text(lines, margin, currentY, { align: align, maxWidth: contentWidth });
      currentY += height + 1;
    };

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

    addSectionTitle('2.', 'Prices');
    const priceContent = replaceVars(getText(Price));
    if (priceContent) addParagraph('', priceContent);

    currentY += 1;

    addSectionTitle('3.', 'Production facility cables');
    const prodContent = replaceVars(getText(productionFacilityCables));
    if (prodContent) addParagraph('', prodContent);

    currentY += 1;

    addSectionTitle('4.', '(if delivery outside of Germany) Export Regulations');
    const exportContent = replaceVars(getText(exportRegulations));
    if (exportContent) addParagraph('', exportContent);

    currentY += 1;

    addSectionTitle('5.', 'Delivery');
    const deliveryContent = replaceVars(getText(delivery));
    if (deliveryContent) addParagraph('', deliveryContent);

    currentY += 1;

    addSectionTitle('6.', 'Delivery period');
    const deliveryPeriodContent = replaceVars(getText(deliveryPeriod));
    if (deliveryPeriodContent) addParagraph('', deliveryPeriodContent);

    currentY += 1;

    addSectionTitle('7.', 'Prices');
    const prices1Content = replaceVars(getText(prices1));
    if (prices1Content) addParagraph('', prices1Content);

    currentY += 1;

    addSectionTitle('8.', 'Terms of payment');
    addParagraph('', "If Internal: 30 days after delivery.\nIf Intercompany: According to the Intercompany Settlement.\nIf External: Needs to be defined.", 'left');

    currentY += 1;

    addSectionTitle('9.', 'Metal Adjustment');
    const metalContent = replaceVars(getText(metalAdjustment));
    if (metalContent) addParagraph('', metalContent);

    currentY += 1;

    addSectionTitle('10.', 'Warranty');
    const warrantyContent = replaceVars(getText(warranty));
    if (warrantyContent) addParagraph('', warrantyContent);

    currentY += 1;

    addSectionTitle('11.', 'Limitation of Liability');
    const liabilityContent = replaceVars(getText(limitationOfLiability));
    if (liabilityContent) addParagraph('', liabilityContent);

    currentY += 1;

    addSectionTitle('12.', 'Validity');
    const validityContent = replaceVars(getText(validity));
    if (validityContent) addParagraph('', validityContent);

    currentY += 1;

    addSectionTitle('13.', 'Contact');
    const contactContent = replaceVars(getText(contact));
    if (contactContent) addParagraph('', contactContent);

    const automaticRichContent = replaceVars(getRichText(automatic));
    if (automaticRichContent) addParagraph('', automaticRichContent, 'left', 'bold');

    currentY += 20;

    const automaticContent = replaceVars(getText(automatic));
    if (automaticContent) addParagraph('', automaticContent);
    // Add footers to all pages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
