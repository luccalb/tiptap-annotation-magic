import { Plugin, PluginKey } from '@tiptap/pm/state';

import { AnnotationState } from './AnnotationState';
import {Annotation} from "../contracts/annotation.model";

export const AnnotationPluginKey = new PluginKey('annotation-magic');

export interface AnnotationPluginOptions {
  HTMLAttributes: {
    [key: string]: any;
  };
  onSelectionChange: (items: Annotation[]) => {};
  onAnnotationListChange: (items: Annotation[]) => {};
  // map: Map<string, any>;
  instance: string;
}

export const AnnotationPlugin = (options: AnnotationPluginOptions) =>
  new Plugin({
    key: AnnotationPluginKey,

    state: {
      init() {
        return new AnnotationState({
          HTMLAttributes: options.HTMLAttributes,
          map: new Map<string, Annotation>(),
          instance: options.instance,
          onUpdateAll: options.onAnnotationListChange,
        });
      },
      apply(transaction, pluginState, oldState, newState) {
        return pluginState.apply(transaction, newState);
      },
    },

    props: {
      decorations(state) {
        const { decorations } = this.getState(state)!;
        const { selection } = state;

        // multiple characters selected
        if (!selection.empty) {
          const annotations = this.getState(state)!.termsAt(
            selection.from,
            selection.to
          );
          // @ts-ignore
          options.onSelectionChange(annotations);
          return decorations;
        }

        // only cursor change
        const annotations = this.getState(state)!.termsAt(selection.from);
        // const allAnnotations = this.getState(state).allAnnotations();

        options.onSelectionChange(annotations);
        // options.onUpdateAll(allAnnotations);

        return decorations;
      },
    },
  });
