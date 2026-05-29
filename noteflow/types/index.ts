export interface BaseNote {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  archived?: boolean;
  folderId?: string;
  reminderDate?: string;
  latitude?: number;
  longitude?: number;
}

export interface Note extends BaseNote { 
  content: string; 
}

export type ItemPriority = 'none' | 'low' | 'medium' | 'high';

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  priority?: ItemPriority;
  dueDate?: string;
}

export interface ChecklistNote extends BaseNote { 
  items: ChecklistItem[]; 
}

export interface IdeaNote extends BaseNote { 
  tags: string[]; 
  color: string;
  content?: string;
  pinned?: boolean;
}

export type AnyNote = Note | ChecklistNote | IdeaNote;

export interface Folder {
  id: string;
  name: string;
  color: string;
  type: 'note' | 'checklist' | 'idea';
  createdAt: Date;
  updatedAt: Date;
}