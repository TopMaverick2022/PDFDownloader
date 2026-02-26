import * as React from 'react';
import styles from './PdfDownloader.module.scss';
import { IPricelistData } from './IPricelistData';

interface IPricelistProps {
  headerLogo: string;
  pricelistData: IPricelistData;
  showLogo?: boolean;
}

export const Pricelist: React.FC<IPricelistProps> = ({ headerLogo, pricelistData, showLogo = true }) => {
  return (
    <div className={styles.content}>
      {showLogo && (
        <div className={styles.headerContainer}>
          <div /> {/* Left grid column */}
          <div className={styles.headerRight}>
            <img src={headerLogo} className={styles.headerLogo} alt="NKT Logo" />
          </div>
        </div>
      )}
      <h2 style={{ marginTop: '20mm', marginBottom: '10mm', fontSize: '14pt', fontWeight: 'bold' }}>{pricelistData.title}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
        <thead>
          <tr style={{ fontWeight: 'bold', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
            <td style={{ width: '10%', padding: '5px' }}>Item-No.</td>
            <td style={{ width: '35%', padding: '5px' }}>Description</td>
            <td style={{ width: '10%', padding: '5px' }}>Drawing</td>
            <td style={{ width: '5%', padding: '5px', textAlign: 'right' }}>Qty.</td>
            <td style={{ width: '5%', padding: '5px' }}>Unit</td>
            <td style={{ width: '15%', padding: '5px', textAlign: 'right' }}>Unit Price EUR</td>
            <td style={{ width: '15%', padding: '5px', textAlign: 'right' }}>Total EUR</td>
          </tr>
        </thead>
        <tbody>
          {pricelistData.items.map((item, index) => (
            <React.Fragment key={index}>
              <tr style={{ verticalAlign: 'top', borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '5px' }}>{item.itemNo}</td>
                <td style={{ padding: '5px' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{item.description}</p>
                  {item.details && item.details.map((detail, i) => (
                    <p key={i} style={{ margin: '5px 0 0 0' }}>{detail}</p>
                  ))}
                </td>
                <td style={{ padding: '5px' }}>{item.drawing || ''}</td>
                <td style={{ padding: '5px', textAlign: 'right' }}>{item.qty}</td>
                <td style={{ padding: '5px' }}>{item.unit}</td>
                <td style={{ padding: '5px', textAlign: 'right' }}>{item.unitPrice.toFixed(2).replace('.', ',')}</td>
                <td style={{ padding: '5px', textAlign: 'right' }}>{item.total}</td>
              </tr>
            </React.Fragment>
          ))}
          <tr style={{ borderTop: '1px solid #000' }}>
            <td colSpan={6} style={{ textAlign: 'right', fontWeight: 'bold', padding: '10px 5px' }}>{pricelistData.totalLabel}</td>
            <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '10px 5px' }}>{pricelistData.totalValue}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: '10mm', fontSize: '9pt' }}>
        <p>{pricelistData.vatInfo}</p>
      </div>
    </div>
  );
};
