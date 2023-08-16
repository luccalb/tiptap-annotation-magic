import { Extension } from "@tiptap/core";

import { AnnotationPlugin, AnnotationPluginKey } from "./AnnotationPlugin";
import { Term } from "../contracts/term.model";

export interface AddAnnotationAction {
  type: "addAnnotation";
  data: any;
  from: number;
  to: number;
}

export interface UpdateAnnotationAction {
  type: "updateAnnotation";
  id: string;
  data: any;
}

export interface DeleteAnnotationAction {
  type: "deleteAnnotation";
  id: string;
}

export interface AnnotationOptions {
  HTMLAttributes: {
    [key: string]: any;
  };
  /**
   * An event listener which receives annotations for the current selection.
   */
  onSelectionChange: (items: Term[]) => {};
  /**
   * An event listener which receives all annotations.
   */
  onAnnotationListChange: (items: Term[]) => {};
  instance: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    annotation: {
      addAnnotation: (data: any) => ReturnType;
      updateAnnotation: (id: string, data: any) => ReturnType;
      deleteAnnotation: (id: string) => ReturnType;
    };
  }
}

export const AnnotationMagic = Extension.create<AnnotationOptions>({
  name: "annotation-magic",

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {
        class: "annotation",
      },
      onSelectionChange: (items) => items,
      onAnnotationListChange: (items) => items,
      document: null,
      field: "annotations",
      instance: "",
    };
  },

  onCreate() {
    // eslint-disable-next-line
    console.log(
      `[${this.options.instance}] plugin creation  → initial createDecorations`,
    );

    const transaction = this.editor.state.tr.setMeta(AnnotationPluginKey, {
      type: "createDecorations",
    });

    // send a transaction to editor view, telling it to re-render annotations
    this.editor.view.dispatch(transaction);
  },

  addCommands() {
    return {
      addAnnotation:
        (data: any) =>
        ({ dispatch, state }) => {
          const { selection } = state;

          if (selection.empty) {
            return false;
          }

          if (dispatch && data) {
            state.tr.setMeta(AnnotationPluginKey, <AddAnnotationAction>{
              type: "addAnnotation",
              from: selection.from,
              to: selection.to,
              data,
            });
          }

          return true;
        },
      updateAnnotation:
        (id: string, data: any) =>
        ({ dispatch, state }) => {
          if (dispatch) {
            state.tr.setMeta(AnnotationPluginKey, <UpdateAnnotationAction>{
              type: "updateAnnotation",
              id,
              data,
            });
          }

          return true;
        },
      deleteAnnotation:
        (id) =>
        ({ dispatch, state }) => {
          if (dispatch) {
            state.tr.setMeta(AnnotationPluginKey, <DeleteAnnotationAction>{
              type: "deleteAnnotation",
              id,
            });
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      AnnotationPlugin({
        HTMLAttributes: this.options.HTMLAttributes,
        onSelectionChange: this.options.onSelectionChange,
        onAnnotationListChange: this.options.onAnnotationListChange,
        instance: this.options.instance,
      }),
    ];
  },
});
