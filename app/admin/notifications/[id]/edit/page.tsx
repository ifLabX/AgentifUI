'use client';

import { NotificationForm } from '../../shared/notification-form';

interface EditPageProps {
  params: { id: string };
}

export default function AdminNotificationEditPage({ params }: EditPageProps) {
  return <NotificationForm mode="edit" id={params.id} />;
}
