'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const encodedRole = localStorage.getItem('role');

    if (!userId) {
      router.push('/login');
      return;
    }

    if (!encodedRole) {
      router.push('/login');
      return;
    }

    try {
      const role = atob(encodedRole);

      if (role === 'Vendor') {
        router.push('/parcel');
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

