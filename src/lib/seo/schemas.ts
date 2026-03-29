import { absoluteUrl } from "./siteUrl";

export type BreadcrumbItem = { name: string; path: string };

export function breadcrumbListSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export type FaqItem = { question: string; answer: string };

export function faqPageSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function articleSchema(args: {
  headline: string;
  description: string;
  pagePath: string;
  datePublished: string;
  dateModified?: string;
  imagePath: string;
  authorName: string;
}) {
  const url = absoluteUrl(args.pagePath);
  const imageUrl = absoluteUrl(args.imagePath);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: args.headline,
    description: args.description,
    image: [imageUrl],
    datePublished: args.datePublished,
    dateModified: args.dateModified ?? args.datePublished,
    author: {
      "@type": "Person",
      name: args.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "RouteWings / FiyatRotasi",
      url: absoluteUrl("/"),
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}
