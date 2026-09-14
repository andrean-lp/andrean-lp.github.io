import faqData from './faq.json';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqData {
  show?: boolean;
  title?: string;
  subtitle?: string;
  items: FaqItem[];
}

export const faq: FaqData = faqData;
export default faq;