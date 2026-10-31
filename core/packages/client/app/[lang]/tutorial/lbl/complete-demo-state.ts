import { Alg } from 'cubing/alg';
import { AllFaces, CubeData, Face, parseAlgorithm } from '@cuberoot/visualcube';
import { resolvePlayerSetup } from '@/components/AlgPlayer/player-setup';
import { CORNER_POSITION, EDGE_POSITION_LEFT, EDGE_POSITION_RIGHT, LEFT, LEFT_SUNE, LBL_STEPS, MIDDLE_LEFT, MIDDLE_RIGHT, RIGHT, RIGHT_SUNE } from './content';
import { LBL_LESSON_RUNS, lessonFrame, type LblLessonStageId } from './lesson-runs';
import { buildYellowCrossDemo, YELLOW_CROSS_DEMO_SETUPS, yellowCrossRecognitionStickers } from './yellow-cross-demo-state';
import { getLblAlgGroups } from './alg-cues';
import type { LblExample } from './content';

type Text = { zh: string; en: string };
const t = (zh: string, en: string): Text => ({ zh, en });
export type DemoContent = { text: Text; detail?: Text; alg?: string; caseIndex?: number; outlines?: string[] };
export type DemoView = 'home' | 'bottom' | 'left' | 'right' | 'back';
export type DemoPhase = { start: number; end: number; observe?: Text; recognize?: DemoContent; act: DemoContent; view?: DemoView; moveView?: DemoView; recognizeOnly?: boolean };
export type CompleteDemo = { setup: string; alg: string; phases: DemoPhase[]; done: Text };
export const COMPLETE_DEMO_STAGES = ['daisy', 'corners', 'middle', 'yellow-cross', 'yellow-face', 'corner-position', 'edge-position'] as const;
export type CompleteDemoStage = typeof COMPLETE_DEMO_STAGES[number];
const turns = ['', 'U', 'U2', "U'"];
const rotations = ['', 'y', 'y2', "y'"];
const lowerTurns = ['', 'd', 'd2', "d'"];
const sides = [Face.F, Face.R, Face.B, Face.L];
const edgeIndices = [1, 3, 5, 7];
const cornerIndices = [0, 2, 6, 8];
const expand = (alg: string) => new Alg(alg).expand().toString();
const movesOf = (alg: string) => expand(alg).split(/\s+/).filter(Boolean);
const join = (...algs: string[]) => algs.filter(Boolean).join(' ');

// Two bottom-corner cycles leave the cross untouched and all four white corners
// in the bottom layer, but in the wrong slots. This setup is never taught as a move.
const cornerCycle = "x R' U R' D2 R U' R' D2 R2 x'";
export const CORNER_DEMO_EXTREME_SETUP = `x2 ${cornerCycle} y ${cornerCycle} y' x2`;

// Sticker identities survive every move, so outlines follow the same pieces as the lesson.
function state(alg: string) {
  const cube = new CubeData(3, Object.fromEntries(AllFaces.map(face =>
    [face, Array.from({ length: 9 }, (_, index) => `${Face[face]}${index}`)])));
  for (const move of parseAlgorithm(expand(alg))) cube.turn(move);
  return cube;
}
type Cube = ReturnType<typeof state>;
const color = (cube: Cube, face: Face, i: number) => cube.faces[face][i][0];
const center = (cube: Cube, face: Face) => color(cube, face, 4);
const matches = (cube: Cube, face: Face, i: number) => color(cube, face, i) === center(cube, face);
const petals = (cube: Cube) => edgeIndices.map(i => cube.faces[Face.U][i]).filter(id => id[0] === 'D');
const firstLayer = (cube: Cube) => cube.faces[Face.D].every((_, i) => matches(cube, Face.D, i))
  && sides.every(face => [6, 7, 8].every(i => matches(cube, face, i)));
const firstTwoLayers = (cube: Cube) => firstLayer(cube) && sides.every(face => [3, 5].every(i => matches(cube, face, i)));
const yellowCross = (cube: Cube) => edgeIndices.every(i => matches(cube, Face.U, i));
const yellowFace = (cube: Cube) => cube.faces[Face.U].every((_, i) => matches(cube, Face.U, i));
const topCorners = (cube: Cube) => sides.every(face => [0, 2].every(i => matches(cube, face, i)));
const solved = (cube: Cube) => AllFaces.every(face => cube.faces[face].every((_, i) => matches(cube, face, i)));
const bottomCornerCount = (cube: Cube) => sides.filter((face, i) =>
  matches(cube, face, 8) && matches(cube, sides[(i + 1) % 4], 6)
  && matches(cube, Face.D, [2, 8, 6, 0][i])).length;
const middleEdgeCount = (cube: Cube) => sides.filter((face, i) =>
  matches(cube, face, 5) && matches(cube, sides[(i + 1) % 4], 3)).length;
const grayCount = (cube: Cube) => cornerIndices.filter(i => !matches(cube, Face.U, i)).length;
const eyes = (cube: Cube) => sides.filter(face => color(cube, face, 0) === color(cube, face, 2));
const walls = (cube: Cube) => sides.filter(face => [0, 1, 2].every(i => matches(cube, face, i)));

export function demoGoalReached(stage: string, alg: string): boolean {
  const cube = state(alg);
  switch (stage) {
    case 'daisy': return petals(cube).length === 4;
    case 'cross': return sides.every(face => matches(cube, face, 7)) && edgeIndices.every(i => matches(cube, Face.D, i));
    case 'corners': return firstLayer(cube);
    case 'middle': return firstTwoLayers(cube);
    case 'yellow-cross': return firstTwoLayers(cube) && yellowCross(cube);
    case 'yellow-face': return firstTwoLayers(cube) && yellowFace(cube);
    case 'corner-position': return firstTwoLayers(cube) && yellowFace(cube) && topCorners(cube);
    case 'edge-position': return solved(cube);
    default: return false;
  }
}

const observe: Record<CompleteDemoStage, Text> = {
  daisy: t('先找还没成为花瓣的白棱。', 'Find a white edge that is not a petal yet.'),
  corners: t('找一个还没归位的白角。', 'Find an unsolved white corner.'),
  middle: t('先在顶层找不带黄色的棱。', 'Look on top for an edge without yellow.'),
  'yellow-cross': t('先看顶层四条棱。', 'Look at the four top edges.'),
  'yellow-face': t('数一数顶面的非黄角格。', 'Count the non-yellow top corner stickers.'),
  'corner-position': t('看侧面，找两端同色的“眼”。', 'Look for matching corner stickers: headlights.'),
  'edge-position': t('看侧面，找三个同色格组成的墙。', 'Look for a wall of three matching stickers.'),
};
const done: Record<CompleteDemoStage, Text> = {
  daisy: t('四片白花瓣，小花完成。', 'Four white petals: the daisy is complete.'),
  corners: t('四个白角归位，底层完成。', 'All four white corners are in place. First layer complete.'),
  middle: t('四条中层棱归位，前两层完成。', 'All four middle edges are in place. First two layers complete.'),
  'yellow-cross': t('四条棱朝黄，黄十字完成。', 'Four yellow edges: the cross is complete.'),
  'yellow-face': t('所有黄色朝上，黄面完成。', 'All yellow stickers face up. Yellow face complete.'),
  'corner-position': t('四个顶角与侧面中心对齐。', 'All four top corners match the side centers.'),
  'edge-position': t('六面同色，魔方复原。', 'Every face has one color. Cube solved.'),
};

/** Inspect actual side faces in order, stopping at a visible wall before outlining it. */
export function wallScanPhases(alg: string, start: number, caseIndex: number): DemoPhase[] {
  const cube = state(alg);
  const found = walls(cube);
  const views: DemoView[] = ['home', 'right', 'back', 'left'];
  const labels = [t('看前面，找三个同色格。', 'Check the front for three matching stickers.'), t('转视角，看右面有没有墙。', 'Turn the view to check the right side for a wall.'), t('继续转视角，看背面有没有墙。', 'Keep turning the view to check the back.'), t('再看左面有没有墙。', 'Check the left side as well.')];
  const phases: DemoPhase[] = [];
  let wall: Face | undefined;
  for (const [i, face] of sides.entries()) {
    phases.push({ start, end: start, view: views[i], act: { text: labels[i] } });
    if (found.includes(face)) { wall = face; break; }
  }
  const recognition = wall === undefined ? { text: t('四面都没有墙，先做公式造墙。', 'No wall on any side. Use an algorithm to create one.'), caseIndex }
    : { text: t('找到墙：这三个格颜色相同。', 'Found a wall: these three stickers match.'), caseIndex, outlines: [0, 1, 2].map(i => cube.faces[wall!][i]) };
  phases.push({ start, end: start, recognize: recognition, act: recognition, recognizeOnly: true });
  return phases;
}

function edgeAlgorithmPhases(alg: string, start: number, caseIndex: number): DemoPhase[] {
  return getLblAlgGroups('edge-position', alg).map(group => {
    const first = group[0];
    const body = group.map(move => move.notation).join(' ');
    const text = /^y/.test(first.notation) ? caseIndex === 2 ? t('沿当前朝向起手，先造墙。', 'Start from this orientation and create a wall.') : t('把墙直接放到后面。', 'Move the wall directly to the back.')
      : group.length === 7 ? (first.notation.startsWith('R') ? t('做右鱼公式。', 'Do right Sune.') : t('做左鱼公式。', 'Do left Sune.'))
        : group[group.length - 1].index === movesOf(alg).length - 1 ? t('转顶层对齐。', 'Align the top layer.') : t('转顶层调整。', 'Adjust the top layer.');
    return { start: start + first.index, end: start + group[group.length - 1].index + 1,
      act: { text, alg: /^y/.test(first.notation) ? undefined : body, caseIndex }, moveView: /^y/.test(first.notation) ? 'home' : undefined };
  });
}

export function buildEdgePositionExample(example: LblExample, index: number): CompleteDemo {
  const setup = expand(resolvePlayerSetup('3x3', example.alg, example.setup, example.startSolved ?? false));
  const alg = expand(example.alg);
  const phases = [...wallScanPhases(setup, 0, index), ...edgeAlgorithmPhases(alg, 0, index)];
  const finished = demoGoalReached('edge-position', join(setup, alg));
  if (!finished) phases.push(...wallScanPhases(join(setup, alg), movesOf(alg).length, index));
  return { setup, alg, phases, done: finished ? done['edge-position']
    : t('已造出墙，选择对应情况继续。', 'A wall is ready. Choose the matching case to continue.') };
}

function yellowCrossDemo(setup: string): CompleteDemo {
  const demo = buildYellowCrossDemo(setup);
  return { setup, alg: demo.alg, done: done['yellow-cross'], phases: demo.phases.map((phase, index) => {
    const caseIndex = { line: 0, elbow: 1, dot: 2 }[phase.kind];
    const recognition = phase.kind === 'dot' ? t('没有黄棱朝上。', 'No yellow edges face up.')
      : phase.kind === 'line' ? t('两条黄棱成直线。', 'Two yellow edges form a line.')
        : t('两条黄棱相邻。', 'Two adjacent yellow edges face up.');
    const next = phase.alignment ? t('需要调整顶面朝向。', 'The top layer needs to be reoriented.')
      : [t('做横线公式。', 'Do the line algorithm.'), t('做三点半公式。', 'Do the L-shape algorithm.'), t('做点公式。', 'Do the dot algorithm.')][caseIndex];
    return {
      start: phase.start, end: phase.end,
      observe: !demo.phases[index - 1]?.alignment ? (index === 0 ? observe['yellow-cross'] : t('还没完成，再观察四条棱。', 'Not finished. Check the four edges again.')) : undefined,
      recognize: !demo.phases[index - 1]?.alignment ? { text: recognition, detail: next, caseIndex,
        outlines: yellowCrossRecognitionStickers(join(setup, demo.alg.split(' ').slice(0, phase.start).join(' '))) } : undefined,
      act: phase.alignment ? {
        text: phase.kind === 'line' ? t('转顶层，把线横着放。', 'Turn the top to make the line horizontal.') : t('转顶层，黄棱放前和右。', 'Turn the top: yellow edges at front and right.'),
        detail: phase.kind === 'line' ? t('形成横线。', 'Form a horizontal line.') : t('形成“三点半”。', 'Form the L-shape.'), caseIndex,
      } : { text: phase.kind === 'line' ? t('做“压、右公式、提”。', 'Do F, the right trigger, then F′.') : t('做“双压、右公式、双提”。', 'Do f, the right trigger, then f′.'), alg: phase.alg, caseIndex },
    };
  }) };
}

export function buildCompleteDemo(stage: CompleteDemoStage, setup: string): CompleteDemo {
  if (stage === 'yellow-cross') return yellowCrossDemo(setup);
  const moves: string[] = [];
  const phases: DemoPhase[] = [];
  const currentAlg = () => join(setup, moves.join(' '));
  const current = () => state(currentAlg());
  const add = (alg: string, act: DemoContent, recognize?: DemoContent, view?: DemoView) => {
    const start = moves.length;
    moves.push(...movesOf(alg));
    phases.push({ start, end: moves.length, act, recognize, observe: recognize ? observe[stage] : undefined, view });
  };
  const action = (alg: string, text: Text, caseIndex: number, recognize?: DemoContent, showAlg = true) =>
    add(alg, { text, alg: showAlg ? alg : undefined, caseIndex }, recognize);
  const recognize = (text: Text, caseIndex: number, outlines: string[] = []): DemoContent => ({ text, caseIndex, outlines });
  const prepare = (alg: string, text: Text, caseIndex: number, recognition?: DemoContent) => {
    if (alg) action(alg, text, caseIndex, recognition, false);
    return alg ? undefined : recognition;
  };
  const inspectPiece = (ids: string[], caseIndex: number, recognition: DemoContent): DemoContent | undefined => {
    const cube = current();
    const white = ids.find(id => id[0] === 'D');
    const face = white === undefined ? undefined : AllFaces.find(face => cube.faces[face].includes(white));
    const view: DemoView | undefined = face === Face.D ? 'bottom' : face === Face.L ? 'left' : face === Face.B ? 'back' : undefined;
    if (!view) return recognition;
    let text: Text;
    if (stage === 'daisy') {
      const sideWhite = sides.some(face => cube.faces[face].some(id => id[0] === 'D' && edgeIndices.includes(Number(id.slice(1)))));
      text = view === 'bottom'
        ? sideWhite ? t('换个角度，看看底面的白棱。', 'Change the view to inspect the white edge underneath.') : t('上面和侧面没有待处理的白棱，看看底面。', 'No white edges remain to handle on top or on the sides. Look underneath.')
        : view === 'left' ? t('换个角度，看看左侧的白棱。', 'Change the view to inspect the white edge on the left.') : t('换个角度，看看背面的白棱。', 'Change the view to inspect the white edge at the back.');
    } else {
      const allBelow = cornerIndices.every(i => color(cube, Face.D, i) === 'D');
      text = view === 'bottom' ? allBelow ? t('顶层没有白角，看看底层：位置对吗？', 'There are no white corners on top. Look underneath: are they in the right slots?') : t('换个角度，看看底层的白角。', 'Change the view to inspect the bottom white corner.')
        : view === 'left' ? t('换个角度，看看左侧的白角。', 'Change the view to inspect the white corner on the left.') : t('换个角度，看看背面的白角。', 'Change the view to inspect the white corner at the back.');
    }
    add('', { text, caseIndex }, undefined, view);
    add('', { text: t('转回观察视角，再来操作。', 'Return to the working view before turning any layers.'), caseIndex }, recognition, 'home');
    return undefined;
  };

  for (let round = 0; round < 16 && !demoGoalReached(stage, currentAlg()); round++) {
    const cube = current();
    const base = currentAlg();
    if (stage === 'daisy') {
      const existing = petals(cube);
      const candidates: { y: string; u: string; alg: string; id: string; index: number; rank: number }[] = [];
      const lifts = ['R', "L'", ...turns.flatMap(u => [join('F', u, 'R'), join('F', u, "L'")]), 'R2'];
      for (const y of rotations) for (const u of turns) for (const alg of lifts) {
        const after = state(join(base, y, u, alg));
        const next = petals(after);
        if (next.length <= existing.length || !existing.every(id => next.includes(id))) continue;
        const id = next.find(id => !existing.includes(id))!;
        let sourceFace = Face.U, sourceIndex = 0;
        for (const face of AllFaces) {
          const i = cube.faces[face].indexOf(id);
          if (i >= 0) { sourceFace = face; sourceIndex = i; }
        }
        const floor = Math.floor(sourceIndex / 3);
        if (sourceFace === Face.U) continue;
        const index = sourceFace === Face.D ? 5 : floor === 1 ? (u ? 1 : alg === "L'" ? 2 : 0) : floor === 0 ? 3 : 4;
        if ((index === 5 && alg !== 'R2') || (index < 3 && !['R', "L'"].includes(alg))
          || ((index === 3 || index === 4) && !alg.startsWith('F '))) continue;
        candidates.push({ y, u, alg, id, index, rank: (index < 3 ? 0 : index === 5 ? 20 : 10) + movesOf(join(y, u, alg)).length });
      }
      const choice = candidates.sort((a, b) => a.rank - b.rank)[0];
      if (!choice) throw new Error('No taught daisy move found');
      const labels = [t('白棱在二楼，可以右手上。', 'A white edge is in the middle: lift right.'), t('白棱在二楼，顶面的花瓣挡住了。', 'A middle white edge has a petal in its way.'), t('白棱在二楼，可以左手上。', 'A white edge is in the middle: lift left.'), t('白棱在三楼，先送到二楼。', 'A white edge is on the top floor: bring it to the middle.'), t('白棱在一楼，先送到二楼。', 'A white edge is on the bottom floor: bring it to the middle.'), t('白格朝下，在“地下室”。', 'The white sticker faces down, in the basement.')];
      let rec: DemoContent | undefined = recognize(labels[choice.index], choice.index, [choice.id, cube.faces[Face.U][4]]);
      rec = inspectPiece([choice.id], choice.index, rec);
      rec = prepare(choice.y, t('转体，把这条白棱放到前面。', 'Rotate the cube to bring this white edge to the front.'), choice.index, rec);
      rec = prepare(choice.u, t('转顶层，让开要放花瓣的位置。', 'Turn the top to clear a space for the petal.'), choice.index, rec);
      if (choice.alg.startsWith('F ')) {
        action('F', t('压前层，把白棱送到二楼。', 'Lower the front to bring the edge to the middle.'), choice.index, rec, false);
        const rest = movesOf(choice.alg).slice(1);
        if (rest.length > 1) action(rest[0], t('转顶层，给白棱让出位置。', 'Turn the top to clear a space for the white edge.'), choice.index, undefined, false);
        action(rest[rest.length - 1], choice.alg.endsWith('R') ? t('右手上，送到黄心旁。', 'Lift right to bring it beside the yellow center.') : t('左手上，送到黄心旁。', 'Lift left to bring it beside the yellow center.'), choice.index, undefined, false);
      } else action(choice.alg, choice.alg === 'R2' ? t('做“上上”，送到黄心旁。', 'Turn the right face twice to make a petal.') : choice.alg === 'R' ? t('右手上，送到黄心旁。', 'Lift right to make a petal.') : t('左手上，送到黄心旁。', 'Lift left to make a petal.'), choice.index, rec, false);
    } else if (stage === 'corners' || stage === 'middle') {
      const isCorner = stage === 'corners';
      const count = isCorner ? bottomCornerCount : middleEdgeCount;
      const actions = isCorner ? [RIGHT, LEFT, `${RIGHT} ${RIGHT} ${RIGHT}`]
        : [MIDDLE_RIGHT, MIDDLE_LEFT];
      let choice: { u: string; d: string; alg: string; index: number; outlines: string[] } | undefined;
      for (const u of turns) for (const d of lowerTurns) for (let index = 0; index < actions.length; index++) {
        const prepared = state(join(base, u, d));
        const valid = isCorner ? index === 0 ? color(prepared, Face.R, 0) === 'D' && matches(prepared, Face.F, 2)
          : index === 1 ? color(prepared, Face.L, 2) === 'D' && matches(prepared, Face.F, 0)
            : color(prepared, Face.U, 8) === 'D' && color(prepared, Face.F, 2) === center(prepared, Face.R) && color(prepared, Face.R, 0) === center(prepared, Face.F)
          : matches(prepared, Face.F, 1) && color(prepared, Face.U, 7) === center(prepared, index === 0 ? Face.R : Face.L) && !['U', 'D'].includes(color(prepared, Face.U, 7));
        if (!valid) continue;
        const result = state(join(base, u, d, actions[index]));
        if (count(result) <= count(cube) || (isCorner ? !demoGoalReached('cross', join(base, u, d, actions[index])) : !firstLayer(result))) continue;
        choice ??= { u, d, alg: actions[index], index: isCorner ? [0, 2, 3][index] : index,
          outlines: isCorner ? index === 1 ? [prepared.faces[Face.L][2], prepared.faces[Face.F][0], prepared.faces[Face.U][6]] : [prepared.faces[Face.R][0], prepared.faces[Face.F][2], prepared.faces[Face.U][8]] : [prepared.faces[Face.U][7], prepared.faces[Face.F][1]] };
      }
      if (choice) {
        const text = isCorner ? choice.index === 3 ? t('白格朝上，用三遍右公式。', 'White faces up: use the right trigger three times.') : t('找到顶层侧面的白格，先对齐白角。', 'Found white on the side of a top corner. Match the corner first.')
          : choice.index === 0 ? t('这条非黄棱要去右边。', 'This non-yellow edge belongs on the right.') : t('这条非黄棱要去左边。', 'This non-yellow edge belongs on the left.');
        let rec: DemoContent | undefined = recognize(text, choice.index, choice.outlines);
        if (isCorner) rec = inspectPiece(choice.outlines, choice.index, rec);
        rec = prepare(choice.u, isCorner ? t('转顶层，把白角放到操作位置。', 'Turn the top to position the white corner.') : t('转顶层，把这条棱放前。', 'Turn the top to bring the edge to the front.'), choice.index, rec);
        rec = prepare(choice.d, isCorner ? (choice.index === 3 ? t('转下面两层，让角心交叉对齐。', 'Turn the lower two layers to cross-match the corner and centers.') : t('转下面两层，让角的侧色对齐中心。', 'Turn the lower two layers to match the side sticker with its center.')) : t('转下面两层，侧色对齐中心，形成倒 T。', 'Turn the lower two layers to match the side color and form an upside-down T.'), choice.index, rec);
        action(choice.alg, isCorner ? choice.index === 3 ? t('做三遍右公式。', 'Do the right trigger three times.') : choice.index === 2 ? t('做左公式。', 'Do the left trigger.') : t('做右公式。', 'Do the right trigger.')
          : choice.index === 0 ? t('右手拨、右公式、左转体、左公式。', 'U, right trigger, rotate left, left trigger.') : t('左手拨、左公式、右转体、右公式。', 'U′, left trigger, rotate right, right trigger.'), choice.index, rec);
      } else {
        // No insertable top piece: eject a misplaced piece with the taught action, then reassess.
        const y = rotations.find(y => {
          const c = state(join(base, y));
          return isCorner ? !(matches(c, Face.D, 2) && matches(c, Face.F, 8) && matches(c, Face.R, 6))
            : !(matches(c, Face.F, 5) && matches(c, Face.R, 3));
        });
        if (y === undefined) throw new Error('No misplaced piece to eject');
        const c = state(join(base, y));
        const flipped = color(c, Face.F, 5) === center(c, Face.R) && color(c, Face.R, 3) === center(c, Face.F);
        const index = isCorner ? 1 : flipped ? 2 : 3;
        const outlines = isCorner ? [c.faces[Face.D][2], c.faces[Face.F][8], c.faces[Face.R][6]] : [c.faces[Face.F][5], c.faces[Face.R][3]];
        let rec: DemoContent | undefined = recognize(isCorner ? t('底层有白角放错，先把它拿出来。', 'A bottom white corner is misplaced. Eject it first.') : flipped ? t('棱在原来的槽里，但朝向反了。', 'The edge is in the right slot, but flipped.') : t('棱放进了别的槽，先把它拿出来。', 'The edge is in the wrong slot. Eject it first.'), index, outlines);
        if (isCorner && cornerIndices.every(i => color(cube, Face.D, i) === 'D')) {
          rec.detail = t('白面虽同色，角的侧色还没对齐中心。', 'The white face is one color, but the corner side stickers do not match the centers.');
        }
        if (isCorner) rec = inspectPiece(outlines, index, rec);
        rec = prepare(y, t('转体，把放错的块放右前方。', 'Rotate the cube to put the misplaced piece at front-right.'), index, rec);
        action(actions[0], isCorner ? t('做右公式，把白角拿到顶层。', 'Use the right trigger to eject the corner to the top.') : t('假想放入一条顶层棱，原来的棱就会出来。', 'Imagine inserting a top edge. The original edge comes out.'), index, rec);
      }
    } else if (stage === 'yellow-face') {
      const gray = grayCount(cube);
      const signature = (c: Cube) => [Face.U, ...sides].flatMap(face => (face === Face.U ? cornerIndices : [0, 2]).map(i => color(c, face, i) === 'U' ? '1' : '0')).join('');
      let choice: { u: string; alg: string; index: number } | undefined;
      for (const u of turns) for (const [index, alg] of [RIGHT_SUNE, LEFT_SUNE].entries()) {
        const c = state(join(base, u));
        if (gray === 3 ? signature(c) !== signature(state(new Alg(alg).invert().toString()))
          : index !== 0 || (gray === 2 ? color(c, Face.F, 0) !== 'U' : color(c, Face.F, 0) === 'U') || grayCount(state(join(base, u, alg))) !== 3) continue;
        choice ??= { u, alg, index: gray === 3 ? index : gray === 2 ? 2 : 3 };
      }
      if (!choice) throw new Error('No taught yellow-face action found');
      let rec: DemoContent | undefined = recognize(gray === 3 ? (choice.index === 0 ? t('3 灰，三个鱼鳍朝右。', 'Three gray corners; three fins point right.') : t('3 灰，三个鱼鳍朝左。', 'Three gray corners; three fins point left.')) : gray === 2 ? t('2 灰，用“二碰”。', 'Two gray corners: touch yellow.') : t('4 灰，用“四不碰”。', 'Four gray corners: avoid yellow.'), choice.index,
        cornerIndices.filter(i => color(cube, Face.U, i) !== 'U').map(i => cube.faces[Face.U][i]));
      const alignment = choice.index === 0 ? t('转顶层，把鱼头放左前。', 'Turn the top to put the head at front-left.') : choice.index === 1 ? t('转顶层，把鱼头放右前。', 'Turn the top to put the head at front-right.') : choice.index === 2 ? t('转顶层，让左拇指位置碰黄。', 'Turn the top so yellow reaches the left thumb position.') : t('转顶层，让左拇指位置不碰黄。', 'Turn the top so the left thumb position does not touch yellow.');
      rec = prepare(choice.u, alignment, choice.index, rec);
      action(choice.alg, choice.index === 1 ? t('做左鱼公式。', 'Do left Sune.') : t('做右鱼公式。', 'Do right Sune.'), choice.index, rec);
    } else if (stage === 'corner-position') {
      const align = turns.find(u => topCorners(state(join(base, u))));
      if (align !== undefined) {
        action(align, t('转顶层，让四个角对齐侧面中心。', 'Turn the top to match all four corners with the side centers.'), 0,
          recognize(t('顶角相对位置已对，只需对齐中心。', 'The corners are in the right relative positions. Match the centers.'), 0), false);
      } else {
        const eyeFaces = eyes(cube);
        const index = eyeFaces.length ? 0 : 1;
        const outlines = eyeFaces.flatMap(face => [cube.faces[face][0], cube.faces[face][2]]);
        let rec: DemoContent | undefined = recognize(index === 0 ? t('找到一对眼，把眼放左。', 'Found headlights. Hold them on the left.') : t('没有眼，先做一遍公式造眼。', 'No headlights. Use the algorithm once to create a pair.'), index, outlines);
        const y = index === 0 ? rotations.find(y => eyes(state(join(base, y))).includes(Face.L))! : '';
        rec = prepare(y, t('转体，把眼放左。', 'Rotate the cube to hold the headlights on the left.'), index, rec);
        action(CORNER_POSITION, t('做角位置公式。', 'Do the corner-position algorithm.'), index, rec);
      }
    } else if (stage === 'edge-position') {
      const align = turns.find(u => topCorners(state(join(base, u))));
      if (align) {
        add(align, { text: t('转顶层，让顶角先对齐侧面中心。', 'Turn the top to match the corners with the side centers.') });
        continue;
      }
      const wallFaces = walls(cube);
      const index = wallFaces.length ? 0 : 2;
      const y = wallFaces.length ? rotations.find(y => walls(state(join(base, y))).includes(Face.B))! : "y'";
      const prepared = state(join(base, y));
      const left = color(prepared, Face.F, 1) === center(prepared, Face.L);
      const caseIndex = index === 2 ? 2 : left ? 0 : 1;
      phases.push(...wallScanPhases(base, moves.length, caseIndex));
      if (y) {
        action(y, index === 2 ? t('沿当前朝向起手，先造墙。', 'Start from this orientation and create a wall.') : t('把墙直接放到后面。', 'Move the wall directly to the back.'), caseIndex, undefined, false);
        phases[phases.length - 1].moveView = 'home';
      } else add('', { text: t('把墙直接放到后面。', 'Move the wall directly to the back.'), caseIndex }, undefined, 'home');
      if (index !== 2) {
        // A separate observation explains the direction only after the wall is actually at the back.
        add('', { text: left ? t('前棱颜色对齐左侧，先右鱼再左鱼。', 'The front edge matches the left: right Sune first.') : t('前棱颜色对齐右侧，先左鱼再右鱼。', 'The front edge matches the right: left Sune first.'), caseIndex });
      }
      const alg = caseIndex === 1 ? EDGE_POSITION_RIGHT : EDGE_POSITION_LEFT;
      phases.push(...edgeAlgorithmPhases(alg, moves.length, caseIndex));
      moves.push(...movesOf(alg));
    }
  }
  if (!demoGoalReached(stage, currentAlg())) throw new Error(`${stage} demonstration did not reach its goal`);
  return { setup, alg: moves.join(' '), phases, done: done[stage] };
}

const pools = new Map<CompleteDemoStage, CompleteDemo[]>();
/** Small, prepared legal states; solve with the algorithms taught in this chapter. */
export function completeDemoPool(stage: CompleteDemoStage): CompleteDemo[] {
  const cached = pools.get(stage);
  if (cached) return cached;
  const chapter = LBL_STEPS.find(step => step.id === stage)!;
  const setups = stage === 'yellow-cross' ? YELLOW_CROSS_DEMO_SETUPS
    : stage === 'corners' ? [...LBL_LESSON_RUNS.map(run => lessonFrame(run, 'corners').setup), CORNER_DEMO_EXTREME_SETUP]
      .flatMap(setup => turns.map(turn => join(setup, turn)))
    : [...chapter.examples.flatMap(example => turns.map(turn => join(resolvePlayerSetup('3x3', example.alg, example.setup, example.startSolved ?? false), turn))),
      ...LBL_LESSON_RUNS.map(run => stage === 'daisy' ? run.scramble : lessonFrame(run, stage as LblLessonStageId).setup)];
  const demos = [...new Set(setups)].filter(setup => !demoGoalReached(stage, setup)).map(setup => buildCompleteDemo(stage, setup));
  if (!demos.length) throw new Error(`No unfinished ${stage} examples`);
  pools.set(stage, demos);
  return demos;
}

/** Equal probability per initial case, then uniform choice within that case. */
export function pickCompleteDemo(stage: CompleteDemoStage, random: () => number = Math.random): number {
  const pool = completeDemoPool(stage);
  const kinds = [...new Set(pool.map(demo => demo.phases.find(phase => phase.recognize)?.recognize?.caseIndex))];
  const kind = kinds[Math.floor(random() * kinds.length)];
  const choices = pool.flatMap((demo, index) => demo.phases.find(phase => phase.recognize)?.recognize?.caseIndex === kind ? [index] : []);
  return choices[Math.floor(random() * choices.length)];
}
