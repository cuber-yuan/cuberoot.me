'use client';

import { useMemo } from 'react';
import { Axis, buildSimpleOptions, renderCubeSVG } from '@cuberoot/visualcube';
import { stickeringMaskFn } from '@cuberoot/puzzle-render-core/engine/nxn/stickering';
import { stageStickerColors } from '@/lib/sim-stage-thumbnail';
import { orientedCubeFaceColors } from '@/lib/cube-orientation';
import { T, tr } from '@/i18n/tr';
import { MIDDLE_LEFT_SETUP, MIDDLE_RIGHT_SETUP } from './content';

/** Use the existing cube renderer's sticker-to-sticker arrows, including camera projection. */
export function MiddleCaseDiagram({ left = false, size = 200 }: { left?: boolean; size?: number }) {
  const svg = useMemo(() => renderCubeSVG({
    ...buildSimpleOptions({ view: 'iso', size, sch: 'yogwrb', setup: left ? MIDDLE_LEFT_SETUP : MIDDLE_RIGHT_SETUP }),
    stickerColors: stageStickerColors(3, stickeringMaskFn(3, 'F2L'), orientedCubeFaceColors('z2')),
    viewportRotations: [[Axis.Y, left ? -30 : 30], [Axis.X, -30]],
    arrows: left ? 'U7U6U3-i3' : 'U7U8U5-i3',
    defaultArrowColor: 'white',
  }), [left, size]);
  return <span className="puzzle-art" role="img" aria-label={left
    ? tr({ zh: '顶层棱进入左侧槽', en: 'The top edge goes into the left slot' })
    : tr({ zh: '顶层棱进入右侧槽', en: 'The top edge goes into the right slot' })}
    style={{ display: 'inline-block', width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export default function MiddleCases() {
  return <div className="lbl-middle-core">
    <p><T zh="棱心对齐后，看顶面颜色。" en="Match the side color first, then look at the top sticker." /></p>
    <div className="lbl-middle-core-cases">
      {[false, true].map(left => <figure key={String(left)}>
        <MiddleCaseDiagram left={left} />
        <figcaption><strong>{left ? tr({ zh: '去左', en: 'Insert left' }) : tr({ zh: '去右', en: 'Insert right' })}</strong>
          <span>{left ? tr({ zh: '顶面颜色与左侧中心相同，棱就去左边的槽。', en: 'The top sticker matches the left center, so the edge goes into the left slot.' })
            : tr({ zh: '顶面颜色与右侧中心相同，棱就去右边的槽。', en: 'The top sticker matches the right center, so the edge goes into the right slot.' })}</span>
        </figcaption>
      </figure>)}
    </div>
  </div>;
}
