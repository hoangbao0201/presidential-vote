import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const Layout = async ({ children }: { children: React.ReactNode }) => {
    const session = await getServerSession(authOptions);

    console.log(session)
    // if (!session) {
    //     redirect('/');
    // }

    return (
        <>
            {children}
        </>
    );
};

export default Layout;
