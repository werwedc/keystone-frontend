
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";

export default function MainLayout() {
  return (
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="p-6">
            <SidebarTrigger />
            <Outlet />
        </SidebarInset>
    </SidebarProvider>
  );
}
