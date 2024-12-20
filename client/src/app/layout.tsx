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
                <div className="relative bg-custom-image bg-no-repeat bg-center bg-cover bg-fixed">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>
                    <ProviderLayout>{children}</ProviderLayout>
                </div>
            </body>
        </html>
    );
}
