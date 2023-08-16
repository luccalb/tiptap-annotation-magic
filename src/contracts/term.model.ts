import { Annotation } from './annotation.model';

export declare type AnnotationRendering =
  | 'normal'
  | 'fragment-right'
  | 'fragment-left'
  | 'fragment-middle';

export interface Term extends Annotation {
  selectedText?: string;
  from?: number;
  to?: number;
  rendering?: AnnotationRendering;
  backgroundColor?: string;
}

export interface RenderedTerm extends Term {
  selectedText?: string;
  from?: number;
  to?: number;
  rendering: AnnotationRendering;
  backgroundColor?: string;
}
