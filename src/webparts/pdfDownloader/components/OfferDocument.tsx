import * as React from 'react';
import styles from './PdfDownloader.module.scss';
import { IOfferData } from './IOfferData';

interface IOfferDocumentProps {
  headerLogo: string;
  offerData: IOfferData;
}

export const OfferDocument: React.FC<IOfferDocumentProps> = ({ headerLogo, offerData }) => {

  return (
    <div>
      <div className={styles.headerContainer}>
        <div className={styles.headerLeft}>
          <div className={styles.senderInfo}>
            <p>{offerData.sender.line1}</p>
          </div>
          <div style={{ marginTop: '40px' }}>
            <p><strong>{offerData.recipient.name}</strong></p>
            <p>{offerData.recipient.address1}</p>
            <p>{offerData.recipient.zipCity}</p>
            <p>{offerData.recipient.country}</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <img src={headerLogo} className={styles.headerLogo} alt="NKT Logo" />

          <p><strong>{offerData.companyInfo.name}</strong></p>
          <p>{offerData.companyInfo.address1}</p>
          <p>{offerData.companyInfo.zipCity}</p>
          <p>{offerData.companyInfo.country}</p>
          <p>&nbsp;</p>
          <p>&nbsp;</p>
          <p>&nbsp;</p>
          <p>Phone: {offerData.companyInfo.phone}</p>
          <p>Telefax: {offerData.companyInfo.telefax}</p>
          <p>Internet: {offerData.companyInfo.website}</p>
          <p>E-Mail: {offerData.companyInfo.email}</p>
          <p>&nbsp;</p>
          <p><strong>Contact Person</strong></p>
          <p>{offerData.contactPerson.name}</p>
          <p>Phone: {offerData.contactPerson.phone}</p>
          <p>Mobile: {offerData.contactPerson.mobile}</p>
          <p>{offerData.contactPerson.email}</p>
          <p>&nbsp;</p>
          <p><strong>{offerData.reference.title}</strong></p>
          <p>{offerData.reference.value}</p>
          <p>{offerData.reference.revision}</p>
          <p>{offerData.reference.note}</p>
          <p>{offerData.date.date_value}</p>
        </div>
      </div>

      <div className={styles.offerTitle}>
        <h2>{offerData.offer.titlePrefix}{offerData.offer.offerNumber}</h2>
        <p>{offerData.offer.subtitlePrefix}{offerData.offer.projectReference}</p>
      </div>

      <div className={styles.body}>
        <p>{offerData.greeting.salutation}{offerData.greeting.recipientName}</p>
        <p>&nbsp;</p>
        <p>{offerData.body1.enquiryPrefix}{offerData.body1.enquiryDate}</p>
        <p>{offerData.body2}</p>
        <p>&nbsp;</p>
        <p>{offerData.body3}</p>
        <p>&nbsp;</p>
        {offerData.items.map((item: string, index: number) => (
          <p key={index}>{item}</p>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerColumn}>
          <p>Commerzbank AG -Lübeckertordamm 5</p>
          <p>20099 Hamburg</p>
          <p>Account. 0621951300 · BLZ 20040000</p>
          <p>Swift/BIC: COBADEFFX</p>
          <p>IBAN: DE78 2004 0000 0622 1717 00</p>
        </div>

        <div className={styles.footerColumn}>
          <p>Head Office: Cologne</p>
          <p>Registration Court: Amtsgericht Cologne,</p>
          <p>No. HRA 30677 · VAT Reg. No. DE 815 517 191</p>
          <p>Tax-No.: 218/5728/1753</p>
        </div>

        <div className={styles.footerColumn}>
          <p>Personally Liable Partner:</p>
          <p>NKT Verwaltungs GmbH Head Office: Cologne</p>
          <p>Registration Court: Amtsgericht Cologne · HRB 14110</p>
          <p>Board of Management: Lukas Sidler · Anders Jensen · Wilhelmus Hendrikx</p>
        </div>
      </div>
    </div>
  );
};
