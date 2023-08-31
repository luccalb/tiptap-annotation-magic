import {
  Annotation,
  AnnotationRendering,
  AnnotationFragment,
} from "../contracts/annotation";

interface ActionKeyframe {
  action: "open" | "close";
  annotationIndex: number;
  textAnchor: number;
}

export const isConflicting = (
  fromA: number,
  toA: number,
  fromB: number,
  toB: number,
): boolean => {
  // case 1: (non-conflicting) A is before B
  if (fromA < toB && toA < fromB) return false;
  // case 2: (non-conflicting) B is before A
  if (fromB < toA && toB < fromA) return false;
  // case 3: (conflicting) some kind of overlap
  return true;
};

export const createAnnotationRendering = (
  annotations: Annotation<any>[],
): AnnotationFragment<any>[] => {
  const renderedAnnotations: AnnotationFragment<any>[] = [];
  const openAnnotationStack: ActionKeyframe[] = [];
  //const actionMap: Map<number, ActionKeyframe[]> = new Map();
  const actionMap: ActionKeyframe[][] = [];
  const annotationFragmentation: boolean[] = [];

  // annotations = sortAnnotationsByStart(annotations);

  // STEP 1: Create a Map, containing the rendering actions for each index in the document.
  // this could be opening or closing an annotation
  annotations.forEach((term, index) => {
    // create an opening action keyframe
    let open: ActionKeyframe = {
      action: "open",
      annotationIndex: index,
      textAnchor: term.from,
    };
    // create a closing action keyframe
    let close: ActionKeyframe = {
      action: "close",
      annotationIndex: index,
      textAnchor: term.to,
    };
    let openMapElement = actionMap[open.textAnchor];
    // create empty actions list if necessary
    if (!openMapElement) actionMap[open.textAnchor] = [];
    actionMap[open.textAnchor].push(open);

    let closeMapElement = actionMap[close.textAnchor];
    if (!closeMapElement) actionMap[close.textAnchor] = [];
    actionMap[close.textAnchor].push(close);
  });

  actionMap // STEP 2: iterate the actionMap and generate the annotation UI elements
    .forEach((actions, _) => {
      actions.forEach((action) => {
        // check if there are still open annotations
        if (openAnnotationStack.length != 0) {
          let actionStackPeek =
            openAnnotationStack[openAnnotationStack.length - 1];
          if (
            actionStackPeek.action === "open" &&
            actionStackPeek.annotationIndex === action.annotationIndex &&
            action.action === "close"
          ) {
            // base case: the last opened annotation is closed by next action
            openAnnotationStack.pop();
            let rendering: AnnotationRendering = annotationFragmentation[
              action.annotationIndex
            ]
              ? "fragment-right"
              : "normal";
            let from: number = annotationFragmentation[action.annotationIndex]
              ? renderedAnnotations[renderedAnnotations.length - 1].to
              : annotations[action.annotationIndex].from;
            let normalTerm: AnnotationFragment<any> = {
              ...annotations[action.annotationIndex],
              from,
              rendering,
            };
            renderedAnnotations.push(normalTerm);
          } else if (
            actionStackPeek.action === "open" &&
            action.action === "close"
          ) {
            // annotation is closed while being overlapped by another annotation
            // -> find "open" action and remove it, otherwise a new truncated segment would be created
            let indexOfActionToRemove = openAnnotationStack.findIndex((a) => {
              return (
                a.textAnchor === annotations[action.annotationIndex].from &&
                a.annotationIndex === action.annotationIndex &&
                a.action === "open"
              );
            });
            if (indexOfActionToRemove > -1) {
              openAnnotationStack.splice(indexOfActionToRemove, 1);
            } else {
              throw Error(
                "Couldn't find opening keyframe for annotation " +
                  action.annotationIndex,
              );
            }
          } else if (
            actionStackPeek.action === "open" &&
            action.action === "open"
          ) {
            let fragment: AnnotationFragment<any>;
            if (annotationFragmentation[actionStackPeek.annotationIndex]) {
              // n-th truncation (n > 1): render a middle fragment
              fragment = {
                ...annotations[actionStackPeek.annotationIndex],
                rendering: "fragment-middle",
                // start where the last rendered annotation ends + 1
                from: renderedAnnotations[renderedAnnotations.length - 1].to,
                // stop where the next annotation begins - 1
                to: annotations[action.annotationIndex].from,
              };
            } else {
              // first-time-truncation: a new annotation begins, truncating the old open annotation
              fragment = {
                ...annotations[actionStackPeek.annotationIndex],
                rendering: "fragment-left",
                to: annotations[action.annotationIndex].from,
              };
              // mark the previous annotation as fragmented, by saving where the fragment ends
              annotationFragmentation[actionStackPeek.annotationIndex] = true;
            }

            renderedAnnotations.push(fragment);
            openAnnotationStack.push(action);
          }
        } else if (action.action === "open") {
          openAnnotationStack.push(action);
        }
      });
    });

  return renderedAnnotations;
};

export const sortAnnotationsByStart = (
  annotations: Annotation<any>[],
): Annotation<any>[] => {
  return annotations.sort((a, b) => a.from - b.from);
};
