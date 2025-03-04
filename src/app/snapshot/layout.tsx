import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hyper EVM Snapshot Tool",
  description: "Take a snapshot of any Hyper EVM NFT Collection.",
  openGraph: {
    title: "Hyper EVM Snapshot Tool",
    description: "Take a snapshot of any Hyper EVM NFT Collection.",
    url: "https://hyperfrogs.xyz/snapshot",
    type: "website",
    images: [
      {
        url: "/snapshotog-min.jpg",
        width: 1200,
        height: 630,
        alt: "Hyper EVM Snapshot Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hyper EVM Snapshot Tool",
    description: "Take a snapshot of any Hyper EVM NFT Collection.",
    creator: "@HyperFrogsNFT",
    site: "@HyperFrogsNFT",
    images: ["/snapshotog-min.jpg"],
  },
};

export default function SnapshotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}