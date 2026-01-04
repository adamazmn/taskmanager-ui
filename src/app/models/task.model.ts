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
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

