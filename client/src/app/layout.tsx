import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import ProviderLayout from "@/components/layouts/ProviderLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "PRESIDENTIAL-VOTE",
    description: "Votting",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} text-[#EAECEF] bg-[#202328]`}>
                <ProviderLayout>{children}</ProviderLayout>
            </body>
        </html> //bg-[#202328]
    );
}
