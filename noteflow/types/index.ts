export interface BaseNote {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note extends BaseNote { 
  content: string; 
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface ChecklistNote extends BaseNote { 
  items: ChecklistItem[]; 
}

export interface IdeaNote extends BaseNote { 
  tags: string[]; 
  color: string; 
}

export type AnyNote = Note | ChecklistNote | IdeaNote;