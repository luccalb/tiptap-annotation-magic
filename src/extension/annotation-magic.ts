import { Extension } from "@tiptap/core";
import { AnnotationPlugin, AnnotationPluginKey } from "./pm/annotation-plugin";
import { Annotation } from "../contracts";

export interface RenderStyles {
  rightFragment: string;
  leftFragment: string;
  normal: string;
  middleFragment: string;
}

export interface AddAnnotationAction<K> {
  type: "addAnnotation";
  from: number;
  to: number;
  data: K;
}

export interface UpdateAnnotationAction<K> {
  type: "updateAnnotation";
  id: string;
  data: K;
}

export interface DeleteAnnotationAction {
  type: "deleteAnnotation";
  id: string;
}

interface AnnotationOptions<K> {
  styles: RenderStyles;
  /**
   * An event listener which receives annotations for the current selection.
   */
  onSelectionChange: (items: Annotation<K>[]) => void;
  /**
   * An event listener which receives all annotations.
   */
  onAnnotationListChange: (items: Annotation<K>[]) => void;
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

export function AnnotationMagic<K>(): Extension {
  return Extension.create<AnnotationOptions<K>>({
    name: "annotation-magic",

    priority: 1000,

    addOptions() {
      return {
        styles: {
          rightFragment: "",
          leftFragment: "",
          normal: "",
          middleFragment: "",
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
          (data: K) =>
          ({ dispatch, state }) => {
            const { selection } = state;

            if (selection.empty) {
              return false;
            }

            if (dispatch && data) {
              state.tr.setMeta(AnnotationPluginKey, <AddAnnotationAction<K>>{
                type: "addAnnotation",
                from: selection.from,
                to: selection.to,
                data,
              });
            }

            return true;
          },
        updateAnnotation:
          (id: string, data: K) =>
          ({ dispatch, state }) => {
            if (dispatch) {
              state.tr.setMeta(AnnotationPluginKey, <UpdateAnnotationAction<K>>{
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
        AnnotationPlugin<K>({
          styles: this.options.styles,
          onSelectionChange: this.options.onSelectionChange,
          onAnnotationListChange: this.options.onAnnotationListChange,
          instance: this.options.instance,
        }),
      ];
    },
  });
}
