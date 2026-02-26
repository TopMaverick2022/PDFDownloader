export interface IParsedDetails {
  cableType?: string;
  saleType?: string;
  supplier?: string;
  metalContent?: string;
  deliveryLength?: string;
  drumType?: string;
  drumCoverType?: string;
  drumDimensions?: string;
  weightGross?: string;
  [key: string]: string | undefined;
}

export interface IPricelistItem {
  itemNo: string;
  description: string;
  drawing?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: string; // Keep as string to accommodate formatted numbers like "35.880,00"
  details?: string[];
  parsedDetails?: IParsedDetails;
}

export interface IPricelistData {
  title: string;
  items: IPricelistItem[];
  totalLabel: string;
  totalValue: string;
  vatInfo: string;
}

