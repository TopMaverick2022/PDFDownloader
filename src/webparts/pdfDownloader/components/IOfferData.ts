export interface IOfferData {
  sender: {
    line1: string;
  };
  recipient: {
    name: string;
    address1: string;
    zipCity: string;
    country: string;
  };
  companyInfo: {
    name: string;
    address1: string;
    zipCity: string;
    country: string;
    phone: string;
    telefax: string;
    website: string;
    email: string;
  };
  contactPerson: {
    name: string;
    phone: string;
    mobile: string;
    email: string;
  };
  reference: {
    title: string;
    value: string;
    revision: string;
    note: string;
  };
  date: {
    date_value: string;
  };
  offer: {
    titlePrefix: string;
    offerNumber: string;
    subtitlePrefix: string;
    projectReference: string;
  };
  greeting: {
    salutation: string;
    recipientName: string;
  };
  body1: {
    enquiryPrefix: string;
    enquiryDate: string;
  };
  body2: string;
  body3: string;
  items: string[];
}
