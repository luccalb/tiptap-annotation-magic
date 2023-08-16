import { Plugin, PluginKey } from "@tiptap/pm/state";

import { AnnotationState } from "./AnnotationState";
import { Term } from "../contracts/term.model";
import { RenderStyles } from "./AnnotationMagic";

export const AnnotationPluginKey = new PluginKey("annotation-magic");
export interface AnnotationPluginOptions {
  styles: RenderStyles;
  onSelectionChange: (items: Term[]) => void;
  onAnnotationListChange: (items: Term[]) => void;
  instance: string;
}

export const AnnotationPlugin = (options: AnnotationPluginOptions) =>
  new Plugin({
    key: AnnotationPluginKey,

    state: {
      init() {
        return new AnnotationState({
          styles: options.styles,
          map: new Map<string, Term>(),
          instance: options.instance,
          onAnnotationListChange: options.onAnnotationListChange,
          onSelectionChange: options.onSelectionChange,
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
            selection.to,
          );
          options.onSelectionChange(annotations);
          return decorations;
        }

        // only cursor change
        const annotations = this.getState(state)!.termsAt(selection.from);

        options.onSelectionChange(annotations);

        return decorations;
      },
    },
  });
