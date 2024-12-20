"use client"

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import Header from "../share/Header";

const ProviderLayout = ({ children }: { children: ReactNode }) => {

    return (
        <>
            <SessionProvider>
                <Header />
                {children}
            </SessionProvider>
        </>
    )
}

export default ProviderLayout;