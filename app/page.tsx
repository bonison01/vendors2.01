'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  bank_name?: string;
  // Add other fields if necessary
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const encodedRole = localStorage.getItem('role');

    if (!userId || !encodedRole) {
      router.push('/login');
      return;
    }

    try {
      const role = atob(encodedRole);

      if (role === 'Vendor') {
        // Fetch user data from your Next.js API route
        fetch('/api/user/getAllUser')
          .then((response) => response.json())
          .then((data: User[]) => { // Explicitly typing the data as an array of User objects
            const currentUser = data.find((user) => user.id === userId);

            if (currentUser) {
              if (!currentUser.bank_name) {
                router.push('/form');
              } else {
                router.push('/parcel');
              }
            } else {
              router.push('/login');
            }
          })
          .catch((error) => {
            console.error('Error fetching user data:', error);
            router.push('/login');
          });
      } else if (role === 'Admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to decode role:', error);
      router.push('/login');
    }
  }, [router]);

  return <></>;
}
