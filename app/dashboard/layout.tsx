import SideNav from "@/app/ui/dashboard/sidenav";
import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: 'Dashboard',
};

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex h-screen flex-col md:flex-row md: overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}

export default Layout;
