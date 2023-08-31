export declare type AnnotationRendering =
  | "normal"
  | "fragment-right"
  | "fragment-left"
  | "fragment-middle";

export interface Annotation<K> {
  id: string;
  displayName: string;
  from: number;
  to: number;
  data?: K;
  tag?: string;
  selectedText?: string;
  rendering?: AnnotationRendering;
  backgroundColor?: string;
}

export interface AnnotationFragment<K> extends Annotation<K> {
  rendering: AnnotationRendering;
}
