import {
  createAnnotationRendering,
  isConflicting,
  sortAnnotationsByStart,
} from "./rendering-engine";
import { Annotation, AnnotationFragment } from "../contracts/annotation";

const conflictTestCases = [
  { a: { from: 1, to: 2 }, b: { from: 2, to: 3 }, overlapping: true },
  { b: { from: 1, to: 2 }, a: { from: 2, to: 3 }, overlapping: true },
  { a: { from: 1, to: 3 }, b: { from: 2, to: 3 }, overlapping: true },
  { b: { from: 1, to: 3 }, a: { from: 2, to: 3 }, overlapping: true },
  { a: { from: 1, to: 2 }, b: { from: 3, to: 4 }, overlapping: false },
  { b: { from: 1, to: 2 }, a: { from: 3, to: 4 }, overlapping: false },
];

describe("Test conflicting annotation", () => {
  test("Should declare non conflicting test cases as such", () => {
    for (let testCase of conflictTestCases) {
      expect(
        isConflicting(
          testCase.a.from,
          testCase.a.to,
          testCase.b.from,
          testCase.b.to,
        ),
      ).toBe(testCase.overlapping);
    }
  });
});

describe("Test sorting of annotaiton list", () => {
  const testList: Annotation[] = [
    {
      id: "abc",
      from: 5,
      to: 6,
      displayName: "X",
      tag: "X",
    },
    {
      id: "abc",
      from: 3,
      to: 9,
      displayName: "X",
      tag: "X",
    },
    {
      id: "abc",
      from: 0,
      to: 5,
      displayName: "X",
      tag: "X",
    },
  ];

  const resultList: Annotation[] = [
    {
      id: "abc",
      from: 0,
      to: 5,
      displayName: "X",
      tag: "X",
    },
    {
      id: "abc",
      from: 3,
      to: 9,
      displayName: "X",
      tag: "X",
    },
    {
      id: "abc",
      from: 5,
      to: 6,
      displayName: "X",
      tag: "X",
    },
  ];

  test("should sort the annotation list by starting point of the annotation", () => {
    expect(sortAnnotationsByStart(testList)).toEqual(resultList);
  });
});

describe("Mapping the annotation list to a flat representation", () => {
  const testCases: {
    inputAnnotations: Annotation[];
    flatMapping: AnnotationFragment[];
    name?: string;
  }[] = [
    {
      name: "Simple overlap",
      inputAnnotations: [
        {
          id: "abc",
          from: 0,
          to: 5,
          displayName: "X",
          tag: "X",
        },
        {
          id: "abc",
          from: 4,
          to: 8,
          displayName: "Y",
          tag: "Y",
        },
        {
          id: "abc",
          from: 10,
          to: 15,
          displayName: "Z",
          tag: "Z",
        },
      ],
      flatMapping: [
        {
          id: "abc",
          from: 0,
          to: 4,
          displayName: "X",
          tag: "X",
          rendering: "fragment-left",
        },
        {
          id: "abc",
          from: 4,
          to: 8,
          displayName: "Y",
          tag: "Y",
          rendering: "normal",
        },
        {
          id: "abc",
          from: 10,
          to: 15,
          displayName: "Z",
          tag: "Z",
          rendering: "normal",
        },
      ],
    },
    {
      name: "No overlap",
      inputAnnotations: [
        {
          id: "abc",
          from: 11,
          to: 15,
          displayName: "Z",
          tag: "Z",
        },
        {
          id: "abc",
          from: 0,
          to: 5,
          displayName: "X",
          tag: "X",
        },
        {
          id: "abc",
          from: 6,
          to: 10,
          displayName: "Y",
          tag: "Y",
        },
      ],
      flatMapping: [
        {
          id: "abc",
          from: 0,
          to: 5,
          displayName: "X",
          tag: "X",
          rendering: "normal",
        },
        {
          id: "abc",
          from: 6,
          to: 10,
          displayName: "Y",
          tag: "Y",
          rendering: "normal",
        },
        {
          id: "abc",
          from: 11,
          to: 15,
          displayName: "Z",
          tag: "Z",
          rendering: "normal",
        },
      ],
    },
    {
      name: "Simple overlap 2",
      inputAnnotations: [
        {
          id: "abc",
          from: 0,
          to: 5,
          displayName: "X",
          tag: "X",
        },
        {
          id: "abc",
          from: 4,
          to: 10,
          displayName: "Y",
          tag: "Y",
        },
        {
          id: "abc",
          from: 9,
          to: 15,
          displayName: "Z",
          tag: "Z",
        },
      ],
      flatMapping: [
        {
          id: "abc",
          from: 0,
          to: 4,
          displayName: "X",
          tag: "X",
          rendering: "fragment-left",
        },
        {
          id: "abc",
          from: 4,
          to: 9,
          displayName: "Y",
          tag: "Y",
          rendering: "fragment-left",
        },
        {
          id: "abc",
          from: 9,
          to: 15,
          displayName: "Z",
          tag: "Z",
          rendering: "normal",
        },
      ],
    },
    {
      name: "Full enclosure",
      inputAnnotations: [
        {
          id: "abc",
          from: 0,
          to: 10,
          displayName: "X",
          tag: "X",
        },
        {
          id: "abc",
          from: 4,
          to: 8,
          displayName: "Y",
          tag: "Y",
        },
        {
          id: "abc",
          from: 11,
          to: 15,
          displayName: "Z",
          tag: "Z",
        },
      ],
      flatMapping: [
        {
          id: "abc",
          from: 0,
          to: 4,
          displayName: "X",
          tag: "X",
          rendering: "fragment-left",
        },
        {
          id: "abc",
          from: 4,
          to: 8,
          displayName: "Y",
          tag: "Y",
          rendering: "normal",
        },
        {
          id: "abc",
          from: 8,
          to: 10,
          displayName: "X",
          tag: "X",
          rendering: "fragment-right",
        },
        {
          id: "abc",
          from: 11,
          to: 15,
          displayName: "Z",
          tag: "Z",
          rendering: "normal",
        },
      ],
    },
    {
      name: "Middle fragment",
      inputAnnotations: [
        {
          id: "abc",
          from: 0,
          to: 15,
          displayName: "X",
          tag: "X",
        },
        {
          id: "abc",
          from: 3,
          to: 6,
          displayName: "Y",
          tag: "Y",
        },
        {
          id: "abc",
          from: 10,
          to: 13,
          displayName: "Z",
          tag: "Z",
        },
      ],
      flatMapping: [
        {
          id: "abc",
          from: 0,
          to: 3,
          displayName: "X",
          tag: "X",
          rendering: "fragment-left",
        },
        {
          id: "abc",
          from: 3,
          to: 6,
          displayName: "Y",
          tag: "Y",
          rendering: "normal",
        },
        {
          id: "abc",
          from: 6,
          to: 10,
          displayName: "X",
          tag: "X",
          rendering: "fragment-middle",
        },
        {
          id: "abc",
          from: 10,
          to: 13,
          displayName: "Z",
          tag: "Z",
          rendering: "normal",
        },
        {
          id: "abc",
          from: 13,
          to: 15,
          displayName: "X",
          tag: "X",
          rendering: "fragment-right",
        },
      ],
    },
  ];
  testCases.forEach((testCase) => {
    test(
      "should perform simple mapping tasks correctly: " + testCase.name,
      () => {
        expect(createAnnotationRendering(testCase.inputAnnotations)).toEqual(
          testCase.flatMapping,
        );
      },
    );
  });
});
