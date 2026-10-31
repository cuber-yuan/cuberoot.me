'use client';

import { useRef, useState, type ReactNode } from 'react';
import { ArrowRight } from '@app-foundation/icons/lucide';
import AlgPlayer, { type AlgPlayerHandle } from '@/components/AlgPlayer/AlgPlayer';
import Link from '@/components/AppLink';
import { T, tr } from '@/i18n/tr';
import AlgSteps from './AlgSteps';
import type { AlgLesson as Lesson, LBL_COURSE_ENTRIES } from './alg-lessons';

const LEFT_VIEW = { x: Math.PI / 6, y: Math.PI / 6, z: 0 };
const RIGHT_VIEW = { x: Math.PI / 6, y: -Math.PI / 6, z: 0 };

export default function AlgLesson({ lesson, heading, next }: { lesson: Lesson; heading: ReactNode; next?: typeof LBL_COURSE_ENTRIES[number] }) {
  const [selected, setSelected] = useState(0);
  const choice = lesson.algs[selected];
  return <article className="lbl-lesson lbl-alg-learning">
    <aside className="lbl-visuals">
      <div className="lbl-intro">{heading}</div>
      <div className="lbl-case-layout"><div className="lbl-cases" role="group" aria-label={tr(lesson.title)}>
        {lesson.algs.map((item, i) => <button type="button" className="lbl-button lbl-case" key={item.alg} aria-pressed={selected === i} onClick={() => setSelected(i)}>
          <span>{tr(item.title)}</span>
        </button>)}
      </div></div>
    </aside>
    <section className="lbl-demonstration" aria-label={tr({ zh: '公式慢放与口诀', en: 'Slow algorithm playback and move cues' })}>
      <SlowAlg key={choice.alg} alg={choice.alg} left={choice.left} startSolved={lesson.id !== 'sune-learning'} />
      <div className="lbl-lesson-actions">
        <p className="lbl-muscle-memory"><T zh="先慢做、做准确，再反复练习，形成肌肉记忆。" en="Start slowly and accurately, then repeat until the moves feel natural." /></p>
        {next && <Link className="lbl-practice lbl-next-lesson" href={`/tutorial/lbl?step=${next.id}`} prefetch={false}>
          <span><T zh="下一节：" en="Next: " />{tr(next.title)}</span><ArrowRight size={16} />
        </Link>}
      </div>
    </section>
  </article>;
}

function SlowAlg({ alg, left, startSolved }: { alg: string; left: boolean; startSolved: boolean }) {
  const player = useRef<AlgPlayerHandle>(null);
  const [step, setStep] = useState(0);
  return <div className="lbl-demo lbl-demo-split lbl-alg-learning-demo">
    <div className="lbl-cube"><AlgPlayer ref={player} puzzle="3x3" set="" engine="sim"
      sceneRot={left ? LEFT_VIEW : RIGHT_VIEW} orientation="z2" alg={alg} startSolved={startSolved} fillPane autoPlay loop moveDurationMs={1800} onStepChange={setStep} /></div>
    <div className="lbl-alg-learning-cues"><AlgSteps step="alg-learning" alg={alg} activeMove={Math.max(0, step - 1)} onMoveClick={index => player.current?.playMove?.(index)} /></div>
  </div>;
}
