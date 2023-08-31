export declare type AnnotationRendering =
  | "normal"
  | "fragment-right"
  | "fragment-left"
  | "fragment-middle";

export interface Annotation {
  id: string;
  displayName: string;
  from: number;
  to: number;
  tag?: string;
  selectedText?: string;
  rendering?: AnnotationRendering;
  backgroundColor?: string;
}

export interface AnnotationFragment extends Annotation {
  selectedText?: string;
  from: number;
  to: number;
  rendering: AnnotationRendering;
  backgroundColor?: string;
}
