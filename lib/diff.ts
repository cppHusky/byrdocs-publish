export interface FileChange {
  id: string;
  filename: string;
  status: "created" | "modified" | "deleted";
  content: string;
  previousContent?: string;
  timestamp: Date;
  canRevert?: boolean;
}

import { diffLines, diffWordsWithSpace, Change } from 'diff';

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface WordDiff {
  type: "added" | "removed" | "unchanged";
  content: string;
}

export function generateDiff(oldContent = "", newContent = ""): DiffLine[] {
  const changes = diffLines(oldContent, newContent);
  const result: DiffLine[] = [];
  
  let oldLineNumber = 1;
  let newLineNumber = 1;
  
  for (const change of changes) {
    const lines = change.value.split('\n');
    // Remove the last empty line if it exists (from split)
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    
    for (const line of lines) {
      if (change.added) {
        result.push({
          type: "added",
          content: line,
          newLineNumber: newLineNumber++,
        });
      } else if (change.removed) {
        result.push({
          type: "removed",
          content: line,
          oldLineNumber: oldLineNumber++,
        });
      } else {
        result.push({
          type: "unchanged",
          content: line,
          oldLineNumber: oldLineNumber++,
          newLineNumber: newLineNumber++,
        });
      }
    }
  }
  
  return result;
}

export function generateWordDiff(oldText = "", newText = ""): WordDiff[] {
  const changes = diffWordsWithSpace(oldText, newText);
  
  return changes.map((change: Change) => ({
    type: change.added ? "added" : change.removed ? "removed" : "unchanged",
    content: change.value,
  }));
}
