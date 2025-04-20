'use client'

import React, {useEffect} from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { useDispatch } from 'react-redux';
import { setUser } from '@/lib/store/userSilce';

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const dispatch = useDispatch();

    useEffect(() => {
        const initializeUser = async () => {
            const userId = localStorage.getItem('user_id');
            if (userId) {
                try {
                    const response = await fetch(`/api/user/getUserById?user_id=${userId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    const data = await response.json();

                    if (response.ok) {
                        dispatch(setUser(data.user));
                    } else {
                        console.error('Failed to fetch user:', data.error);
                        // Clear invalid user_id and role from localStorage
                        localStorage.removeItem('user_id');
                        localStorage.removeItem('role');
                    }
                } catch (error) {
                    console.error('Error fetching user:', error);
                    // Clear invalid user_id and role from localStorage
                    localStorage.removeItem('user_id');
                    localStorage.removeItem('role');
                }
            }
        };

        initializeUser();
    }, [dispatch]);

    return (
        <>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 52)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }
            >
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-2">
                            {children}
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}