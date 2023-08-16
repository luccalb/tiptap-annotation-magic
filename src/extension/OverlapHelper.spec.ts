import {
  createAnnotationRendering,
  isConflicting,
  sortAnnotationsByStart,
} from './OverlapHelper';
import { RenderedTerm, Term } from '../contracts/term.model';

const conflictTestCases = [
  { a: { from: 1, to: 2 }, b: { from: 2, to: 3 }, overlapping: true },
  { b: { from: 1, to: 2 }, a: { from: 2, to: 3 }, overlapping: true },
  { a: { from: 1, to: 3 }, b: { from: 2, to: 3 }, overlapping: true },
  { b: { from: 1, to: 3 }, a: { from: 2, to: 3 }, overlapping: true },
  { a: { from: 1, to: 2 }, b: { from: 3, to: 4 }, overlapping: false },
  { b: { from: 1, to: 2 }, a: { from: 3, to: 4 }, overlapping: false },
];

describe('Test conflicting annotation', () => {
  test('Should declare non conflicting test cases as such', () => {
    for (let testCase of conflictTestCases) {
      expect(
        isConflicting(
          testCase.a.from,
          testCase.a.to,
          testCase.b.from,
          testCase.b.to
        )
      ).toBe(testCase.overlapping);
    }
  });
});

describe('Test sorting of annotaiton list', () => {
  const testList: Term[] = [
    {
      from: 5,
      to: 6,
      displayName: 'X',
      tag: 'X',
    },
    {
      from: 3,
      to: 9,
      displayName: 'X',
      tag: 'X',
    },
    {
      from: 0,
      to: 5,
      displayName: 'X',
      tag: 'X',
    },
  ];

  const resultList: Term[] = [
    {
      from: 0,
      to: 5,
      displayName: 'X',
      tag: 'X',
    },
    {
      from: 3,
      to: 9,
      displayName: 'X',
      tag: 'X',
    },
    {
      from: 5,
      to: 6,
      displayName: 'X',
      tag: 'X',
    },
  ];

  test('should sort the annotation list by starting point of the annotation', () => {
    expect(sortAnnotationsByStart(testList)).toEqual(resultList);
  });
});

describe('Mapping the annotation list to a flat representation', () => {
  const testCases: {
    inputAnnotations: Term[];
    flatMapping: RenderedTerm[];
    name?: string;
  }[] = [
    {
      name: 'Simple overlap',
      inputAnnotations: [
        {
          from: 0,
          to: 5,
          displayName: 'X',
          tag: 'X',
        },
        {
          from: 4,
          to: 8,
          displayName: 'Y',
          tag: 'Y',
        },
        {
          from: 10,
          to: 15,
          displayName: 'Z',
          tag: 'Z',
        },
      ],
      flatMapping: [
        {
          from: 0,
          to: 4,
          displayName: 'X',
          tag: 'X',
          rendering: 'fragment-left',
        },
        {
          from: 4,
          to: 8,
          displayName: 'Y',
          tag: 'Y',
          rendering: 'normal',
        },
        {
          from: 10,
          to: 15,
          displayName: 'Z',
          tag: 'Z',
          rendering: 'normal',
        },
      ],
    },
    {
      name: 'No overlap',
      inputAnnotations: [
        {
          from: 11,
          to: 15,
          displayName: 'Z',
          tag: 'Z',
        },
        {
          from: 0,
          to: 5,
          displayName: 'X',
          tag: 'X',
        },
        {
          from: 6,
          to: 10,
          displayName: 'Y',
          tag: 'Y',
        },
      ],
      flatMapping: [
        {
          from: 0,
          to: 5,
          displayName: 'X',
          tag: 'X',
          rendering: 'normal',
        },
        {
          from: 6,
          to: 10,
          displayName: 'Y',
          tag: 'Y',
          rendering: 'normal',
        },
        {
          from: 11,
          to: 15,
          displayName: 'Z',
          tag: 'Z',
          rendering: 'normal',
        },
      ],
    },
    {
      name: 'Simple overlap 2',
      inputAnnotations: [
        {
          from: 0,
          to: 5,
          displayName: 'X',
          tag: 'X',
        },
        {
          from: 4,
          to: 10,
          displayName: 'Y',
          tag: 'Y',
        },
        {
          from: 9,
          to: 15,
          displayName: 'Z',
          tag: 'Z',
        },
      ],
      flatMapping: [
        {
          from: 0,
          to: 4,
          displayName: 'X',
          tag: 'X',
          rendering: 'fragment-left',
        },
        {
          from: 4,
          to: 9,
          displayName: 'Y',
          tag: 'Y',
          rendering: 'fragment-left',
        },
        {
          from: 9,
          to: 15,
          displayName: 'Z',
          tag: 'Z',
          rendering: 'normal',
        },
      ],
    },
    {
      name: 'Full enclosure',
      inputAnnotations: [
        {
          from: 0,
          to: 10,
          displayName: 'X',
          tag: 'X',
        },
        {
          from: 4,
          to: 8,
          displayName: 'Y',
          tag: 'Y',
        },
        {
          from: 11,
          to: 15,
          displayName: 'Z',
          tag: 'Z',
        },
      ],
      flatMapping: [
        {
          from: 0,
          to: 4,
          displayName: 'X',
          tag: 'X',
          rendering: 'fragment-left',
        },
        {
          from: 4,
          to: 8,
          displayName: 'Y',
          tag: 'Y',
          rendering: 'normal',
        },
        {
          from: 8,
          to: 10,
          displayName: 'X',
          tag: 'X',
          rendering: 'fragment-right',
        },
        {
          from: 11,
          to: 15,
          displayName: 'Z',
          tag: 'Z',
          rendering: 'normal',
        },
      ],
    },
    {
      name: 'Middle fragment',
      inputAnnotations: [
        {
          from: 0,
          to: 15,
          displayName: 'X',
          tag: 'X',
        },
        {
          from: 3,
          to: 6,
          displayName: 'Y',
          tag: 'Y',
        },
        {
          from: 10,
          to: 13,
          displayName: 'Z',
          tag: 'Z',
        },
      ],
      flatMapping: [
        {
          from: 0,
          to: 3,
          displayName: 'X',
          tag: 'X',
          rendering: 'fragment-left',
        },
        {
          from: 3,
          to: 6,
          displayName: 'Y',
          tag: 'Y',
          rendering: 'normal',
        },
        {
          from: 6,
          to: 10,
          displayName: 'X',
          tag: 'X',
          rendering: 'fragment-middle',
        },
        {
          from: 10,
          to: 13,
          displayName: 'Z',
          tag: 'Z',
          rendering: 'normal',
        },
        {
          from: 13,
          to: 15,
          displayName: 'X',
          tag: 'X',
          rendering: 'fragment-right',
        },
      ],
    },
  ];
  testCases.forEach((testCase) => {
    test(
      'should perform simple mapping tasks correctly: ' + testCase.name,
      () => {
        expect(createAnnotationRendering(testCase.inputAnnotations)).toEqual(
          testCase.flatMapping
        );
      }
    );
  });
});
