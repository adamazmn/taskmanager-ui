export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'done';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: TaskAttachment[];
}

export interface TaskAttachment {
  originalName: string;
  storedName: string;
  contentType: string;
  size: number;
  path: string;
}

