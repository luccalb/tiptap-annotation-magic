import { Extension } from '@tiptap/core';

import { AnnotationPlugin, AnnotationPluginKey } from './AnnotationPlugin';
import { Connective } from '../contracts/connective.model';
import { Term } from '../contracts/term.model';

export interface AddAnnotationAction {
  type: 'addAnnotation';
  data: any;
  from: number;
  to: number;
}

export interface AddConnectiveAction {
  type: 'addConnective';
  data: Connective;
}

export interface UpdateAnnotationAction {
  type: 'updateAnnotation';
  id: string;
  data: any;
}

export interface DeleteAnnotationAction {
  type: 'deleteAnnotation';
  id: string;
}

export interface AnnotationOptions {
  HTMLAttributes: {
    [key: string]: any;
  };
  /**
   * An event listener which receives annotations for the current selection.
   */
  onUpdate: (items: Term[]) => {};
  /**
   * An event listener which receives all annotations.
   */
  onUpdateAll: (items: (Term | Connective)[]) => {};

  /**
   * A raw map, where annotations will be stored
   */
  map: Map<string, any>;
  instance: string;
}

function getMapFromOptions(options: AnnotationOptions): Map<string, any> {
  return options.map;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    annotation: {
      addConnective: (data: Connective) => ReturnType;
      addAnnotation: (data: any) => ReturnType;
      updateAnnotation: (id: string, data: any) => ReturnType;
      deleteAnnotation: (id: string) => ReturnType;
    };
  }
}

export const NaiAnnotation = Extension.create<AnnotationOptions>({
  name: 'annotation',

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'annotation',
      },
      onUpdate: (decorations) => decorations,
      onUpdateAll: (decorations) => decorations,
      document: null,
      field: 'annotations',
      map: null,
      instance: '',
    };
  },

  onCreate() {
    // eslint-disable-next-line
    console.log(
      `[${this.options.instance}] plugin creation  → initial createDecorations`
    );

    const transaction = this.editor.state.tr.setMeta(AnnotationPluginKey, {
      type: 'createDecorations',
    });

    // send a transaction to editor view, telling it to re-render annotations
    this.editor.view.dispatch(transaction);
  },

  addCommands() {
    return {
      addConnective:
        (data: Connective) =>
        ({ dispatch, state }) => {
          if (dispatch && data) {
            state.tr.setMeta(AnnotationPluginKey, <AddConnectiveAction>{
              type: 'addConnective',
              data,
            });
          }
          return true;
        },
      addAnnotation:
        (data: any) =>
        ({ dispatch, state }) => {
          const { selection } = state;

          if (selection.empty) {
            return false;
          }

          if (dispatch && data) {
            state.tr.setMeta(AnnotationPluginKey, <AddAnnotationAction>{
              type: 'addAnnotation',
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
              type: 'updateAnnotation',
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
              type: 'deleteAnnotation',
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
        onSelectionChange: this.options.onUpdate,
        onAnnotationListChange: this.options.onUpdateAll,
        map: getMapFromOptions(this.options),
        instance: this.options.instance,
      }),
    ];
  },
});
