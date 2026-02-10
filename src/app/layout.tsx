import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Karbon Agency | Meta & Instagram Ads for Sim Racing Businesses",
    template: "%s | Karbon Agency",
  },
  description:
    "The only marketing agency specializing exclusively in Meta & Instagram ads for sim racing businesses, racing simulator venues, F1 experiences, motorsport entertainment centers, and drift simulation arcades. We fill your seats with targeted social media advertising.",
  keywords: [
    "sim racing marketing",
    "racing simulator advertising",
    "sim racing ads",
    "Meta ads sim racing",
    "Instagram ads racing simulator",
    "F1 simulator marketing",
    "motorsport marketing agency",
    "racing simulator business marketing",
    "sim racing venue advertising",
    "sim racing social media ads",
    "racing experience marketing",
    "drift simulator advertising",
    "iRacing venue marketing",
    "sim racing center ads",
    "F1 experience advertising",
    "motorsport entertainment marketing",
    "racing simulator bookings",
    "sim racing digital marketing",
    "racing simulator lead generation",
    "sim racing Facebook ads",
    "sim racing Instagram ads",
    "karbon agency",
    "racing simulator social media",
    "motorsport venue advertising",
    "sim racing business growth",
    "racing arcade marketing",
    "virtual racing marketing",
    "esports racing marketing",
    "racing lounge advertising",
    "sim racing corporate events marketing",
  ],
  authors: [{ name: "Karbon Agency", url: "https://karbonagency.com" }],
  creator: "Karbon Agency",
  publisher: "Karbon Agency",
  metadataBase: new URL("https://karbonagency.com"),
  alternates: {
    canonical: "https://karbonagency.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://karbonagency.com",
    siteName: "Karbon Agency",
    title: "Karbon Agency | Meta & Instagram Ads for Sim Racing Businesses",
    description:
      "The only marketing agency specializing exclusively in Meta & Instagram ads for sim racing businesses. Hyper-targeted campaigns for racing simulator venues, F1 experiences, drift simulators, and motorsport entertainment centers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Karbon Agency | Meta & Instagram Ads for Sim Racing",
    description:
      "The only ad agency built exclusively for sim racing businesses. Meta & Instagram ads that fill every seat — racing simulators, F1 experiences, drift arcades, and motorsport venues.",
    creator: "@karbonagency",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Marketing Agency",
  classification: "Sim Racing Marketing, Motorsport Advertising, Racing Simulator Business Growth",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://karbonagency.com/#organization",
      name: "Karbon Agency",
      url: "https://karbonagency.com",
      logo: "https://karbonagency.com/logo.png",
      description:
        "Karbon Agency is the only marketing agency specializing exclusively in Meta & Instagram advertising for sim racing businesses, racing simulator venues, F1 experience centers, drift simulation arcades, and motorsport entertainment facilities.",
      foundingDate: "2025",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+1-866-996-3824",
        contactType: "sales",
        availableLanguage: "English",
      },
      sameAs: [],
      knowsAbout: [
        "Sim Racing Marketing",
        "Racing Simulator Advertising",
        "Meta Ads for Sim Racing",
        "Instagram Ads for Racing Simulators",
        "F1 Simulator Marketing",
        "Motorsport Entertainment Marketing",
        "Drift Simulator Advertising",
        "Racing Venue Digital Marketing",
        "iRacing Center Marketing",
        "Virtual Racing Experience Advertising",
        "Esports Racing Venue Marketing",
        "Racing Arcade Advertising",
        "Corporate Sim Racing Events",
        "Racing Lounge Marketing",
        "Sim Racing Lead Generation",
        "Racing Simulator Booking Campaigns",
        "Motorsport Social Media Advertising",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://karbonagency.com/#website",
      url: "https://karbonagency.com",
      name: "Karbon Agency",
      description:
        "Meta & Instagram advertising agency for sim racing businesses, racing simulator venues, and motorsport entertainment centers",
      publisher: { "@id": "https://karbonagency.com/#organization" },
    },
    {
      "@type": "WebPage",
      "@id": "https://karbonagency.com/#webpage",
      url: "https://karbonagency.com",
      name: "Karbon Agency | Meta & Instagram Ads for Sim Racing Businesses",
      description:
        "The only ad agency specializing exclusively in Meta & Instagram ads for sim racing businesses — racing simulators, F1 experiences, drift arcades, motorsport venues.",
      isPartOf: { "@id": "https://karbonagency.com/#website" },
      about: { "@id": "https://karbonagency.com/#organization" },
    },
    {
      "@type": "Service",
      "@id": "https://karbonagency.com/#service",
      name: "Sim Racing Meta & Instagram Advertising",
      description:
        "Hyper-targeted Meta and Instagram ad campaigns built exclusively for sim racing businesses. We handle everything from creative production to campaign optimization — filling seats for racing simulator venues, F1 experiences, drift simulation centers, motorsport arcades, and virtual racing lounges.",
      provider: { "@id": "https://karbonagency.com/#organization" },
      serviceType: "Digital Marketing & Advertising",
      areaServed: {
        "@type": "Country",
        name: "United States",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Sim Racing Marketing Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Meta Ads for Sim Racing Venues",
              description: "Facebook advertising campaigns targeting motorsport fans, gamers, corporate event planners, and car enthusiasts to book sim racing sessions.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Instagram Ads for Racing Simulators",
              description: "Instagram Stories, Reels, and feed ads showcasing the thrill of sim racing to drive bookings for F1 simulators, drift experiences, and racing arcades.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Racing Simulator Creative Production",
              description: "High-energy video ads, carousel hooks, and story sequences built around sim racing, F1 experiences, drift simulation, and motorsport entertainment.",
            },
          },
        ],
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Karbon Agency?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Karbon Agency is the only marketing agency that specializes exclusively in Meta and Instagram advertising for sim racing businesses, including racing simulator venues, F1 experience centers, drift simulation arcades, and motorsport entertainment facilities.",
          },
        },
        {
          "@type": "Question",
          name: "What types of sim racing businesses does Karbon Agency work with?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We work with all types of sim racing and motorsport entertainment businesses including racing simulator venues, F1 experience centers, drift simulation arcades, iRacing lounges, esports racing facilities, virtual racing centers, corporate sim racing event spaces, and racing entertainment complexes.",
          },
        },
        {
          "@type": "Question",
          name: "How does sim racing advertising work on Meta and Instagram?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We create hyper-targeted ad campaigns on Facebook and Instagram that reach motorsport enthusiasts, gamers, car lovers, corporate event planners, and experience seekers. Our ads use high-energy racing content to drive bookings for sim racing sessions, F1 experiences, drift simulations, and group events.",
          },
        },
        {
          "@type": "Question",
          name: "Why should sim racing businesses choose a specialized marketing agency?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Generic marketing agencies don't understand the sim racing customer. Karbon Agency knows exactly who books simulator sessions — from F1 fans and drift enthusiasts to corporate groups and birthday parties. Our laser focus on motorsport entertainment means higher conversion rates and lower cost per booking.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-black">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-black`}>
        {children}
      </body>
    </html>
  );
}
