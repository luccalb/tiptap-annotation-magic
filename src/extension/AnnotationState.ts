import { EditorState, Transaction } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

import { TermItem } from './TermItem';
import { AnnotationPluginKey } from './AnnotationPlugin';
import {
  AddAnnotationAction,
  AddConnectiveAction,
  DeleteAnnotationAction,
  UpdateAnnotationAction,
} from './nai-annotation';
import { Term } from '../contracts/term.model';
import { Connective } from '../contracts/connective.model';
import { createAnnotationRendering } from './OverlapHelper';

export interface AnnotationStateOptions {
  HTMLAttributes: {
    [key: string]: any;
  };
  map: Map<string, Term | Connective>;
  instance: string;
  onUpdateAll: (items: any[]) => {};
}

export class AnnotationState {
  options: AnnotationStateOptions;

  decorations = DecorationSet.empty;

  constructor(options: AnnotationStateOptions) {
    this.options = options;
  }

  randomId() {
    // TODO: That seems … to simple.
    return Math.floor(Math.random() * 0xffffffff).toString();
  }

  // @ts-ignore
  findAnnotation(id: string) {
    const current = this.decorations.find();

    for (let i = 0; i < current.length; i += 1) {
      if (current[i].spec.id === id) {
        return current[i];
      }
    }
  }

  addAnnotation(action: AddAnnotationAction) {
    const { map } = this.options;
    const { from, to, data } = action;

    map.set(this.randomId(), {
      from: from,
      to: to,
      ...data,
    });
  }

  addConnective(action: AddConnectiveAction) {
    const { map } = this.options;

    map.set(this.randomId(), action.data);
  }

  updateAnnotation(action: UpdateAnnotationAction) {
    const { map } = this.options;

    map.set(action.id, {
      ...action.data,
    });
  }

  deleteAnnotation(id: string) {
    const { map } = this.options;

    // TODO: check if annotation is referenced by any connectives

    map.delete(id);
  }

  termsAt(position: number, to?: number): Term[] {
    return this.decorations.find(position, to || position).map((decoration) => {
      return new TermItem(decoration);
    });
  }

  allAnnotations() {
    const { map } = this.options;
    return Array.from(map.entries(), ([key, value]) => {
      return {
        id: key,
        ...value,
      };
    });
  }

  createDecorations(state: EditorState) {
    const { map, HTMLAttributes } = this.options;
    const decorations: Decoration[] = [];

    // only terms, not connectives, are rendered
    const termList = Array.from(map, ([key, value]) => {
      return { ...value, id: key };
    }).filter((value) => {
      return 'from' in value && 'to' in value;
    });

    const annotationRendering = createAnnotationRendering(termList);

    annotationRendering.forEach((annotation) => {
      const from = annotation.from;
      const to = annotation.to;

      // eslint-disable-next-line
      console.log(
        `[${this.options.instance}] Decoration.inline()`,
        from,
        to,
        HTMLAttributes,
        {
          id: annotation.id,
          data: annotation,
        }
      );

      if (from === to) {
        console.warn(
          `[${this.options.instance}] corrupt decoration `,
          annotation.from,
          from,
          annotation.to,
          to
        );
      }

      let baseClasses = 'border-black p-0.5 font-semibold inline relative ';
      switch (annotation.rendering) {
        case 'fragment-left':
          baseClasses += 'rounded-l-lg -mr-2 pr-2 border-r-0 border-2 z-0';
          break;
        case 'fragment-middle':
          baseClasses += 'border-t-2 border-b-2 -mr-2 -ml-2 px-2 z-0';
          break;
        case 'fragment-right':
          baseClasses += 'rounded-r-lg -ml-2 pl-2 border-l-0 border-2 z-0';
          break;
        case 'normal':
          baseClasses += 'rounded-lg border-2 z-10';
          break;
        default:
          break;
      }

      // set custom background color
      let customStyle = undefined;
      if (annotation.backgroundColor) {
        customStyle = {
          style: 'background-color: ' + annotation.backgroundColor + ';',
          class: baseClasses,
        };
      }

      decorations.push(
        Decoration.inline(
          from,
          to,
          customStyle || {
            ...HTMLAttributes,
            class: baseClasses,
            style: 'background-color: white;',
          },
          {
            id: annotation.id,
            data: annotation,
            inclusiveEnd: true,
          }
        )
      );
    });

    this.decorations = DecorationSet.create(state.doc, decorations);
  }

  apply(transaction: Transaction, state: EditorState) {
    // Add/Remove annotations
    const action = transaction.getMeta(AnnotationPluginKey) as
      | AddAnnotationAction
      | UpdateAnnotationAction
      | DeleteAnnotationAction
      | AddConnectiveAction;

    if (action && action.type) {
      // eslint-disable-next-line
      console.log(`[${this.options.instance}] action: ${action.type}`);

      if (action.type === 'addAnnotation') {
        this.addAnnotation(action);
      }

      if (action.type === 'updateAnnotation') {
        this.updateAnnotation(action);
      }

      if (action.type === 'deleteAnnotation') {
        this.deleteAnnotation(action.id);
      }

      if (action.type === 'addConnective') {
        this.addConnective(action);
      }

      this.createDecorations(state);

      this.options.onUpdateAll(this.allAnnotations());

      return this;
    }

    console.log(
      `[${this.options.instance}] isChangeOrigin: true → createDecorations`
    );
    // manually map annotation positions
    this.options.map.forEach((annotation, key) => {
      if ('from' in annotation && 'to' in annotation) {
        annotation.from = transaction.mapping.map(annotation.from);
        annotation.to = transaction.mapping.map(annotation.to);
      }
    });

    this.createDecorations(state);

    return this;
  }
}
