'use client';

import React from 'react';

interface InstanceFormContainerProps {
  children: React.ReactNode;
}

export const InstanceFormContainer: React.FC<InstanceFormContainerProps> = ({
  children,
}) => {
  return <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>;
};
