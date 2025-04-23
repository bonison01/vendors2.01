'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useDispatch } from 'react-redux';
import { setUser } from '@/lib/store/userSilce';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      // Retrieve user_id and role from localStorage
      const userId = localStorage.getItem('user_id');
      const encodedRole = localStorage.getItem('role');

      // If user_id or role is missing, redirect to login
      if (!userId || !encodedRole) {
        localStorage.removeItem('user_id');
        localStorage.removeItem('role');
        router.push('/login');
        return;
      }

      try {
        // Decode base64-encoded role
        const role = atob(encodedRole);

        // Check if role is Admin
        if (role !== 'Admin') {
          router.push('/');
          return;
        }

        // Fetch user data
        const response = await fetch(`/api/user/getUserById?user_id=${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          // Verify role from API matches Admin
        //   if (data.user.role === 'Admin') {
            dispatch(setUser(data.user));
            setIsAuthorized(true);
        //   } else {
        //     throw new Error('User is not an Admin');
        //   }
        } else {
          throw new Error(data.error || 'Failed to fetch user');
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        // localStorage.removeItem('user_id');
        // localStorage.removeItem('role');
        // router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [dispatch, router]);

  // Show loading state or nothing while checking authorization
  if (isLoading || !isAuthorized) {
    return <div className="h-screen flex justify-center items-center p-6">Loading...</div>;
  }

  return (
    <div>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 52)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="@container/main flex flex-1 flex-col gap-2">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
