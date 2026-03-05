export interface StructureHighlight {
  index: number;
  color?: string;
}

export interface ArrayStructure {
  id: string;
  type: 'array';
  label: string;
  data: (number | string | boolean | null)[];
  highlights: number[];
  pointers: Record<string, number>;
}

export interface HashMapStructure {
  id: string;
  type: 'hash-map';
  label: string;
  data: Record<string, string | number | boolean>;
}

export interface VariableStructure {
  id: string;
  type: 'variable';
  label: string;
  data: string | number | boolean | null;
}

export interface LinkedListNode {
  value: string | number;
  next?: string;
}

export interface LinkedListStructure {
  id: string;
  type: 'linked-list';
  label: string;
  data: LinkedListNode[];
  highlights?: number[];
  pointers?: Record<string, number>;
}

export interface StackStructure {
  id: string;
  type: 'stack';
  label: string;
  data: (string | number | boolean)[];
  highlights?: number[];
}

export interface TreeNode {
  value: string | number;
  left?: number | null;
  right?: number | null;
}

export interface TreeStructure {
  id: string;
  type: 'tree';
  label: string;
  data: (TreeNode | null)[];
  highlights?: number[];
}

export interface MatrixStructure {
  id: string;
  type: 'matrix';
  label: string;
  data: (string | number | boolean | null)[][];
  highlights?: [number, number][];
}

export type Structure =
  | ArrayStructure
  | HashMapStructure
  | VariableStructure
  | LinkedListStructure
  | StackStructure
  | TreeStructure
  | MatrixStructure;

export interface Step {
  description: string;
  structures: Structure[];
  codeLineHighlight?: number;
}

export interface AlgoTrace {
  title: string;
  steps: Step[];
  code: string;
  language: string;
}

export interface SavedTrace {
  id: string;
  title: string;
  trace: AlgoTrace;
  savedAt: string;
  category?: string;
  tags?: string[];
}
