"use client"

import { type Icon } from "@tabler/icons-react"
import { type LucideIcon } from "lucide-react"
import { useRouter, usePathname } from "next/navigation" // Add usePathname
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon | LucideIcon
  }[]
}) {
  const router = useRouter()
  const pathname = usePathname() 

  const handleNavigation = (url: string) => {
    router.push(url)
  }
  
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}
            >
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => handleNavigation(item.url)}
                asChild={false}
                className={pathname === item.url ? "bg-green-600 hover:bg-green-500" : ""} 
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}