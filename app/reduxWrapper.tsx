'use client'

import { Provider } from 'react-redux';
import { store } from '@/lib/store/redux';
import { ReactNode } from 'react';

interface ReduxWrapperProps {
  children: ReactNode;
}

export default function ReduxWrapper({ children }: ReduxWrapperProps) {
  return <Provider store={store}>{children}</Provider>;
}