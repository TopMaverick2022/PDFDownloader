import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import styles from './PdfDownloader.module.scss';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PrimaryButton } from '@fluentui/react';
import { IPdfDownloaderProps } from './IPdfDownloaderProps';
import { IOfferData } from './IOfferData';
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
  }, []);

  const handleDownload = React.useCallback(async (): Promise<void> => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const footerHeight = 20;
    const lineHeight = 5;

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

    // Sender line
    pdf.setFontSize(8);
    pdf.text(offerData.sender.line1, margin, 35);
    
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
    pdf.text(offerData.body1.enquiryPrefix + offerData.body1.enquiryDate, margin, y);
    y += 5;
    pdf.text(offerData.body2, margin, y);
    y += 10;
    pdf.text(offerData.body3, margin, y);
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
    const contentWidth = pdfWidth - margin * 2;

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
        
        const indent = 10;
        const textWidth = contentWidth - indent;
        const lines = pdf.splitTextToSize(text, textWidth);
        const height = lines.length * 4; // 4mm line height to match render
        
        if (currentY + height > pdfHeight - footerHeight - 10) {
            pdf.addPage();
            addPageHeader();
            currentY = margin + 25;
        }
        
        pdf.text(num, margin, currentY);
        pdf.text(lines, margin + indent, currentY, { align: align, maxWidth: textWidth });
        currentY += height + 1.5; // Reduced spacing
    };

    const addRichText = (num: string, textParts: (string | { text: string, url: string })[]): void => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const indent = 10;
        const maxWidth = contentWidth - indent;
        const lineHeight = 4;

        if (currentY + lineHeight > pdfHeight - footerHeight - 10) {
            pdf.addPage();
            addPageHeader();
            currentY = margin + 25;
        }

        pdf.text(num, margin, currentY);
        
        let currentLine: { text: string, url?: string }[] = [];
        let currentLineWidth = 0;
        
        const flushLine = (): void => {
             let x = margin + indent;
             currentLine.forEach(part => {
                 if (part.url) {
                     pdf.setTextColor(0, 0, 255);
                     pdf.text(part.text, x, currentY);
                     const w = pdf.getTextWidth(part.text);
                     pdf.line(x, currentY + 1, x + w, currentY + 1); // Manual underline
                     pdf.link(x, currentY - lineHeight + 1.5, w, lineHeight, { url: part.url });
                     pdf.setTextColor(0, 0, 0);
                 } else {
                     pdf.text(part.text, x, currentY);
                 }
                 x += pdf.getTextWidth(part.text);
             });
             currentY += lineHeight;
             currentLine = [];
             currentLineWidth = 0;
             
             if (currentY > pdfHeight - footerHeight - 10) {
                 pdf.addPage();
                 addPageHeader();
                 currentY = margin + 25;
             }
        };

        textParts.forEach(part => {
            const str = typeof part === 'string' ? part : part.text;
            const url = typeof part === 'string' ? undefined : part.url;
            
            // Split by words to wrap
            const words = str.split(/(\s+)/);
            words.forEach(word => {
                if (word === '') return;
                // Handle explicit newlines if any
                if (word.includes('\n')) {
                    const subWords = word.split('\n');
                    subWords.forEach((sw, idx) => {
                        if (sw) {
                             const w = pdf.getTextWidth(sw);
                             if (currentLineWidth + w > maxWidth) {
                                 flushLine();
                             }
                             currentLine.push({ text: sw, url: url });
                             currentLineWidth += w;
                        }
                        if (idx < subWords.length - 1) {
                            flushLine();
                        }
                    });
                    return;
                }
                
                const w = pdf.getTextWidth(word);
                if (currentLineWidth + w > maxWidth) {
                    flushLine();
                    // If word is space at start of line, skip
                    if (/^\s+$/.test(word)) return;
                }
                currentLine.push({ text: word, url: url });
                currentLineWidth += w;
            });
        });
        if (currentLine.length > 0) flushLine();
        currentY += 1.5;
    };

    const customerName = offerData.recipient.name;
    const supplierName = parsedPricelistItems[0]?.parsedDetails?.supplier || 'Universal Cables Ltd';
    const deliveryTerms = 'DAP';
    const destinationSite = 'Esposende';
    const recipientName = offerData.recipient.name;
    const stockItems = 'item 1.1.1 and 1.1.2 A1';
    const stockDeliveryTime = '4 weeks';
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
    addParagraph('2.1', `The prices offered are only valid in case ${customerName} purchases the entire quantity of the goods offered. In the event that ${customerName} decides to order less or more in relation to the offered quantity of goods, NKT reserves the right to adjust the prices for the then agreed delivery quantity.`);
    addParagraph('2.2', 'Cable drums are included in the contract price.');
    addParagraph('2.3', `All duties, fees, customs duties and non-German taxes shall be borne by ${customerName}.`);
    addParagraph('2.4', "Termination or cancellation of the contract requires NKT's approval and an agreement by the parties on the compensation due to NKT in this case.");
    
    currentY += 1;

    addSectionTitle('3.', 'Production facility cables');
    addParagraph('3.1', `In the event of an order, we reserve the right to supply the cable from our NKT supply chain partners ${supplierName}.`);

    currentY += 1;

    addSectionTitle('4.', '(if delivery outside of Germany) Export Regulations');
    addParagraph('4.1', `According to German Export Regulations as well as other national rulings, the export or import of material offered here might be subject to the approval of the German Authorities (Bundesausfuhramt – BAFA) or other national administrative authorities. Therefore, NKT and ${customerName} agree that any non-delivery or late delivery based on missing approval of responsible authorities, such as German export control authorities, is not subject to any ruling for delay or any other claim against NKT.`);

    currentY += 1;

    addSectionTitle('5.', 'Delivery');
    addParagraph('5.1', `The cables shall be delivered by NKT to the agreed installation site. Delivery shall occur in accordance with ${deliveryTerms} (INCOTERMS 2020). The destination site is: ${destinationSite}. Upon delivery of the cables, their integrity must be checked by the parties and confirmed to NKT by ${recipientName}. The unloading destination and in particular the installation site must be accessible for heavy duty transports.`);

    currentY += 1;

    addSectionTitle('6.', 'Delivery period');
    addParagraph('6.1', `The bonding cable(s) available in stock, according to chapter 3 Pricelist, (${stockItems} - subject to prior sales) can be delivered approx. ${stockDeliveryTime} after order confirmation. The bonding cable(s) ${productionItems} can be delivered approx. ${productionDeliveryTime} after order confirmation, subject to technical and commercial clarification (depending on the availability of ships and sea routes).`);

    currentY += 1;

    addSectionTitle('7.', 'Prices');
    addParagraph('7.1', `The prices offered are only valid in case ${customerName} purchases the entire quantity of the goods offered. In the event that ${customerName} decides to order less or more in relation to the offered quantity of goods, NKT reserves the right to adjust the prices for the then agreed delivery quantity.`);
    addParagraph('7.2', 'Cable drums are included in the contract price.');
    addParagraph('7.3', `All duties, fees, customs duties and non- German taxes shall be borne by ${customerName}.`);
    addParagraph('7.4', "Termination or cancellation of the contract requires NKT's approval and an agreement by the parties on the compensation due to NKT in this case.");

    currentY += 1;

    addSectionTitle('8.', 'Terms of payment');
    addParagraph('8.1', "If Internal: 30 days after delivery.\nIf Intercompany: According to the Intercompany Settlement.\nIf External: Needs to be defined.", 'left');

    currentY += 1;

    addSectionTitle('9.', 'Metal Adjustment');
    addParagraph('9.1', "Depending on the cable type offered, NKT’s products contain metals such as Copper, Aluminium or Lead. These metals are exchange-traded. Due to strong market fluctuations, it is common practice to adjust the final cable price based on the metal prices valid at the time of placing the order. This is meant to provide transparency and enables NKT to submit offers without adding any risk surcharge In the following a detailed description of this procedure and of the metals contained in NKT’s product is indicated.");
    
    addRichText('9.2', [
        "The cable prices quoted in our offer are prices inclusive non-ferrous metals (full-prices) based on\n",
        `Copper (M1Cu): ${copperPrice}\n`,
        "Official LME-Cash Seller & Settlement Price\n",
        "as published on ",
        { text: "http://www.lme.com/metals/non-ferrous/", url: "http://www.lme.com/metals/non-ferrous/" },
        ` and an exchange rate (Bloomberg Fixing BFIX) of US$ = ${exchangeRate} / EUR as published on `,
        { text: "https://www.bloomberg.com/markets/currencies/fx-fixings", url: "https://www.bloomberg.com/markets/currencies/fx-fixings" },
        `\non  ${dateTodayMinus1}.`
    ]);

    addParagraph('9.3', "Non-ferrous metal prices (Cash Seller & Settlement) will be charged as published by the London Metal Exchange in the afternoon of the day following the receipt of the clarified order. They will be converted into EUR/t with the exchange rate (BFIX) as published in the afternoon of the day following the receipt of the clarified order.");

    addParagraph('9.4', "The following formula is applied for calculating the price difference (PD):\n\nPD = (M2Cu-M1Cu) x FCu\n\nPD: price difference (EUR/km)\nM1Cu: metal price on which offer is based EUR/t\nM2Cu: metal price in EUR/t at the time of order as mentioned above (as described above and converted to Euros based on the relevant exchange rate US$/EUR)\nFCu: variation factor Copper (see pricing sheet)", 'left');

    addParagraph('9.5', "NKT will always cover the exact quantity of non-ferrous metals needed for the manufacturing of the products ordered.");
    addParagraph('9.6', `Should an order be cancelled or quantities reduced after covering the non-ferrous metals prices, NKT has to sell the surplus of non-ferrous metals purchased at the valid market price. Should there be a price difference, this will be settled between ${customerName} and NKT.`);
    addParagraph('9.7', "Should the order volume be increased after fixing the metal price NKT shall cover the additionally needed extra non-ferrous metals according to the rules described above.");

    currentY += 1;

    addSectionTitle('10.', 'Warranty');
    addParagraph('10.1', "NKT shall be liable for defects which occur within 24 months after the respective transfer of risk, but no later than 28 months after receipt of dispatch notice.");

    currentY += 1;

    addSectionTitle('11.', 'Limitation of Liability');
    addParagraph('11.1', "NKT's overall liability arising out of or in connection with this contract is limited to 10% of the original total net contract value. This includes, but is not limited to, claims arising from liability for defects, statutory claims, claims arising from termination and contractual penalties for delay, etc.");
    addParagraph('11.2', "NKT's liability for loss of profit, loss of business opportunities, loss of electrical energy, operational interruption, loss of production, increased financing or capital costs, damages which do not affect the goods itself (e.g. claims of third parties) as well as other consequential damages, are excluded.");
    addParagraph('11.3', "The above limitation of liability shall not apply in cases of damage caused intentionally or by gross negligence and in cases in which liability cannot be limited due to mandatory law, in particular due to injury to life, body or health. In such cases, NKT's liability is unlimited.");

    currentY += 1;

    addSectionTitle('12.', 'Validity');
    addParagraph('12.1', `This offer is valid until ${validityDate}. Accordingly, our prices and the times stated are only valid up to this date.`);

    currentY += 1;

    addSectionTitle('13.', 'Contact');
    addParagraph('', `${contact1Name} will be the contact person of NKT for commercial issues and can be reached at the following telephone numbers and addresses:`);
    addParagraph('', `Mobile: ${contact1Mobile}`, 'left');
    addRichText('', ['E-Mail: ', { text: contact1Email, url: `mailto:${contact1Email}` }]);
    
    currentY += 1;

    addParagraph('', `${contact2Name} will be the contact person of NKT for technical issues and can be reached at the following telephone numbers and addresses:`);
    addParagraph('', `Mobile: ${contact2Mobile}`, 'left');
    addRichText('', ['E-Mail: ', { text: contact2Email, url: `mailto:${contact2Email}` }]);

    addParagraph('', 'Best wishes from the NKT team.', 'left','bold');
    
    currentY += 20;

    addParagraph('',' This offer was automatically created and is valid without signature.');
    // Add footers to all pages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalPages = (pdf as any).internal.getNumberOfPages();
    pdf.setPage(1);
    addPage1Footer(totalPages);
    for(let i = 2; i <= totalPages; i++) {
        pdf.setPage(i);
        addGenericFooter(i, totalPages);
    }
    
    pdf.save('NKT-Offer.pdf');
  }, [parsedPricelistItems]);

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
