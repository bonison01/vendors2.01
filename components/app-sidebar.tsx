'use client'

import * as React from "react"
import {
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconUsers,
} from "@tabler/icons-react"
import { PackagePlus, Truck, PackageSearch, ClipboardPenLine } from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAppSelector } from "@/hooks/useAppSelector"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Parcel",
    url: "/parcel",
    icon: ClipboardPenLine,
  },
  {
    title: "Order List",
    url: "/order-list",
    icon: PackageSearch,
  },
  {
    title: "Product List",
    url: "/product-list",
    icon: IconListDetails,
  },
  {
    title: "Add Product",
    url: "/add-product",
    icon: PackagePlus,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: IconUsers,
  },
]

const navAdmin = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Parcel",
    url: "/admin/parcel-service",
    icon: ClipboardPenLine,
  },
  {
    title: "Order List",
    url: "/admin/delivery-order",
    icon: PackageSearch,
  },
  {
    title: "Service Book",
    url: "/admin/service-book",
    icon: Truck,
  },
  {
    title: "Profile",
    url: "/admin/profile",
    icon: IconUsers,
  },
]

const navDel = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Product List",
    url: "/list-product",
    icon: IconListDetails,
  },
  {
    title: "Add Product",
    url: "/add-product",
    icon: PackagePlus,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: IconUsers,
  },
]

const navSecondary = [
  {
    title: "Get Help",
    url: "#",
    icon: IconHelp,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAppSelector((state) => state.user.user)
  const role = typeof window !== "undefined" ? atob(localStorage.getItem("role") || "") : ""

  // Determine navigation items based on role
  const navItems = role === "Admin" ? navAdmin : role === "Vendor" ? navMain : navDel

  // Default user data if Redux store is empty
  const userData = {
    name: user?.name || "Guest",
    email: user?.email || "No email",
    avatar: user?.photo || "/default-avatar.jpg",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}