import { EditorState, Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import { TermItem } from "./TermItem";
import { AnnotationPluginKey } from "./AnnotationPlugin";
import {
  AddAnnotationAction,
  DeleteAnnotationAction,
  RenderStyles,
  UpdateAnnotationAction,
} from "./AnnotationMagic";
import { Term } from "../contracts/term.model";
import { createAnnotationRendering } from "./OverlapHelper";

export interface AnnotationStateOptions {
  styles: RenderStyles;
  map: Map<string, Term>;
  instance: string;
  onAnnotationListChange: (items: Term[]) => void;
  onSelectionChange: (items: Term[]) => void;
}

export class AnnotationState {
  options: AnnotationStateOptions;

  decorations = DecorationSet.empty;

  constructor(options: AnnotationStateOptions) {
    this.options = options;
  }

  randomId() {
    return Math.floor(Math.random() * 0xffffffff).toString();
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

  updateAnnotation(action: UpdateAnnotationAction) {
    const { map } = this.options;

    map.set(action.id, action.data);
  }

  deleteAnnotation(id: string) {
    const { map } = this.options;

    map.delete(id);
  }

  termsAt(position: number, to?: number): Term[] {
    return this.decorations.find(position, to || position).map((decoration) => {
      return new TermItem(decoration);
    });
  }

  allAnnotations(): Term[] {
    const { map } = this.options;
    return Array.from(map.entries(), ([key, value]) => {
      return {
        id: key,
        ...value,
      };
    });
  }

  createDecorations(state: EditorState) {
    const { map, styles } = this.options;
    const decorations: Decoration[] = [];

    // only terms, not connectives, are rendered
    const termList = Array.from(map, ([key, value]) => {
      return { ...value, id: key };
    }).filter((value) => {
      return "from" in value && "to" in value;
    });

    const annotationRendering = createAnnotationRendering(termList);

    annotationRendering.forEach((annotation) => {
      const from = annotation.from;
      const to = annotation.to;

      // eslint-disable-next-line
      console.log(`[${this.options.instance}] Decoration.inline()`, from, to, {
        id: annotation.id,
        data: annotation,
      });

      if (from === to) {
        console.warn(
          `[${this.options.instance}] corrupt decoration `,
          annotation.from,
          from,
          annotation.to,
          to,
        );
      }

      let baseClasses; // = "border-black p-0.5 font-semibold inline relative ";
      switch (annotation.rendering) {
        case "fragment-left":
          baseClasses = styles.leftFragment;
          break;
        case "fragment-middle":
          baseClasses = styles.middleFragment;
          break;
        case "fragment-right":
          baseClasses = styles.rightFragment;
          break;
        case "normal":
          baseClasses = styles.normal;
          break;
        default:
          break;
      }

      // set custom background color
      let customStyle = undefined;
      if (annotation.backgroundColor) {
        customStyle = {
          style: "background-color: " + annotation.backgroundColor + ";",
          class: baseClasses,
        };
      }

      decorations.push(
        Decoration.inline(
          from,
          to,
          customStyle || {
            class: baseClasses,
            style: "background-color: white;",
          },
          {
            id: annotation.id,
            data: annotation,
            inclusiveEnd: true,
          },
        ),
      );
    });

    this.decorations = DecorationSet.create(state.doc, decorations);
  }

  apply(transaction: Transaction, state: EditorState) {
    // Add/Remove annotations
    const action = transaction.getMeta(AnnotationPluginKey) as
      | AddAnnotationAction
      | UpdateAnnotationAction
      | DeleteAnnotationAction;

    if (action && action.type) {
      console.log(`[${this.options.instance}] action: ${action.type}`);

      if (action.type === "addAnnotation") {
        this.addAnnotation(action);
      }

      if (action.type === "updateAnnotation") {
        this.updateAnnotation(action);
      }

      if (action.type === "deleteAnnotation") {
        this.deleteAnnotation(action.id);
      }

      this.createDecorations(state);

      this.options.onAnnotationListChange(this.allAnnotations());

      return this;
    }

    // manually map annotation positions
    this.options.map.forEach((annotation, _) => {
      if ("from" in annotation && "to" in annotation) {
        annotation.from = transaction.mapping.map(annotation.from);
        annotation.to = transaction.mapping.map(annotation.to);
      }
    });

    this.createDecorations(state);

    return this;
  }
}
