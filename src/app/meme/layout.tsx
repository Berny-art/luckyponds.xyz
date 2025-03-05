import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hyper Frogs Meme Generator",
  description: "Generate Memes with your Hyper Frog.",
  openGraph: {
    title: "Hyper Frogs Meme Generator",
    description: "Generate Memes with your Hyper Frog.",
    url: "https://hyperfrogs.xyz/meme",
    type: "website",
    images: [
      {
        url: "/memeog-min.jpg",
        width: 1200,
        height: 630,
        alt: "Hyper EVM Snapshot Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hyper Frogs Meme Generator",
    description: "Generate Memes with your Hyper Frog.",
    creator: "@HyperFrogsNFT",
    site: "@HyperFrogsNFT",
    images: ["/memeog-min.jpg"],
  },
};

export default function SnapshotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}