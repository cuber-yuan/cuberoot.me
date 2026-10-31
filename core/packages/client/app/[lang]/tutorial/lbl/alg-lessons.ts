import { LBL_STEPS, LEFT, RIGHT, LEFT_SUNE, RIGHT_SUNE } from './content';

type Text = { zh: string; en: string };
export type AlgLesson = { id: string; after: string; title: Text; algs: { title: Text; alg: string; left: boolean }[] };
export const ALG_LESSONS: AlgLesson[] = [
  { id: 'trigger-learning', after: 'cross', title: { zh: '公式学习：左公式和右公式', en: 'Learn the left and right triggers' }, algs: [
    { title: { zh: '左公式', en: 'Left trigger' }, alg: LEFT, left: true },
    { title: { zh: '右公式', en: 'Right trigger' }, alg: RIGHT, left: false },
  ] },
  { id: 'sune-learning', after: 'yellow-cross', title: { zh: '公式学习：左鱼和右鱼', en: 'Learn left and right Sune' }, algs: [
    { title: { zh: '左鱼公式', en: 'Left Sune' }, alg: LEFT_SUNE, left: true },
    { title: { zh: '右鱼公式', en: 'Right Sune' }, alg: RIGHT_SUNE, left: false },
  ] },
];

// Learning interludes are navigation entries; the nine numbered stages stay intact.
export const LBL_COURSE_ENTRIES = LBL_STEPS.flatMap((step, index) => [
  { id: step.id, title: step.title, number: index + 1 },
  ...ALG_LESSONS.filter(lesson => lesson.after === step.id).map(lesson => ({ id: lesson.id, title: lesson.title, number: null })),
]);
