import { useCallback, useMemo, useState } from 'react';
import { oklch, shiftL } from '../lib/color';
import { FROM_ARCHIVE } from '../lib/foundation';
import { mulberry32, newSeed } from '../lib/shuffle';
import {
  SHAPE,
  answer,
  begin,
  calibrate,
  corrected,
  plan,
  threshold,
  validity,
  type StaircaseState,
} from '../lib/staircase';

/**
 * The human session.
 *
 * Three things this UI must never do, because each one would destroy the
 * measurement:
 *
 *   1. Show which side is which. The side is drawn from a seeded generator
 *      and never displayed.
 *   2. Give feedback. Feedback lets the observer learn the step size and
 *      stabilise a criterion the staircase is supposed to be measuring.
 *   3. Let the two patches touch. A shared edge produces a Mach band at the
 *      boundary, which is a second signal the observer could use instead of
 *      the one under test. There is a strip of canvas between them.
 */

type Session = {
  readonly stair: StaircaseState;
  readonly brighterOn: 'left' | 'right';
};

const REFERENCE = FROM_ARCHIVE.canvasL;
/** Both patches sit this far above the canvas, so both are visible and neither leaks. */
const BASE = 0.03;

export function TwoAFC() {
  const [expected, setExpected] = useState(0.008);
  const [seed] = useState(newSeed);
  const [rand] = useState(() => mulberry32(seed));
  const [session, setSession] = useState<Session | null>(null);

  const config = useMemo(() => plan(SHAPE, expected), [expected]);
  const calibration = useMemo(() => calibrate(SHAPE, 400, 1), []);

  const start = useCallback(() => {
    setSession({ stair: begin(config), brighterOn: rand() < 0.5 ? 'left' : 'right' });
  }, [config, rand]);

  const choose = useCallback(
    (side: 'left' | 'right') => {
      setSession((s) => {
        if (s === null) return s;
        const next = answer(s.stair, config, side === s.brighterOn);
        return { stair: next, brighterOn: rand() < 0.5 ? 'left' : 'right' };
      });
    },
    [config, rand],
  );

  if (session === null) {
    return (
      <div className="panel">
        <h2>آستانهٔ تشخیص — دو گزینه، انتخاب اجباری</h2>
        <p className="lead">
          دو وصله روی بوم. یکی به‌اندازهٔ یک مقدار ناشناخته روشن‌تر است. باید بگویی کدام.
          اگر نتوانی تشخیص بدهی، حدس می‌زنی — و حدس، ۵۰٪ است. همین چیزی است که این را
          «اندازه‌گیری» می‌کند و نه «نظر».
        </p>
        <dl className="facts">
          <div><dt>آزمایش</dt><dd>~{calibration.trialsPerRun}، حدود دو دقیقه</dd></div>
          <div><dt>بایاس ابزار</dt><dd>×{calibration.bias.toFixed(3)} — تصحیح می‌شود</dd></div>
          <div><dt>خطای یک نشست</dt><dd>±{(calibration.sd * 100).toFixed(0)}٪</dd></div>
          <div><dt>نرخ اعتبار</dt><dd>{((calibration.valid / calibration.runs) * 100).toFixed(0)}٪</dd></div>
        </dl>
        <label className="field">
          <span>حدس اولیه — اندازهٔ یک پلهٔ ادراکی</span>
          <input
            type="number"
            step="0.0005"
            min="0.001"
            max="0.05"
            value={expected}
            onChange={(e) => setExpected(Number(e.target.value))}
          />
          <small>
            فقط برای اندازه‌گذاری دامنه. جواب را عوض نمی‌کند — ابزار نسبت به مقیاس بی‌تفاوت است.
          </small>
        </label>
        <button type="button" className="go" onClick={start}>
          شروع
        </button>
      </div>
    );
  }

  const { stair } = session;
  const done = stair.done;
  const raw = threshold(stair, config);
  const report = validity(stair, config);

  if (done) {
    return (
      <div className="panel">
        <h2>نتیجه</h2>
        {report.ok && raw !== null ? (
          <>
            <div className="reading">
              <span className="big">{corrected(raw, calibration).toFixed(5)}</span>
              <span className="unit">ΔL — یک پلهٔ ادراکی</span>
            </div>
            <dl className="facts">
              <div><dt>خوانش خام</dt><dd>{raw.toFixed(5)}</dd></div>
              <div><dt>بایاس ابزار</dt><dd>÷ {calibration.bias.toFixed(3)}</dd></div>
              <div><dt>آزمایش‌ها</dt><dd>{stair.history.length}</dd></div>
              <div><dt>بازگشت‌ها</dt><dd>{stair.reversals.length}</dd></div>
              <div><dt>بذر</dt><dd><code>{seed}</code></dd></div>
            </dl>
            <p className="caveat">
              یک نشست ±{(calibration.sd * 100).toFixed(0)}٪ خطا دارد. برای عدد نهایی، چند نشست
              لازم است — یا این عدد باید در کارت شاهد با همین خطا نوشته شود.
            </p>
          </>
        ) : (
          <div className="refused">
            <b>ابزار عدد نداد.</b>
            <p>{report.ok ? 'خوانش خالی' : report.reason}</p>
            <p>
              این امتناع است، نه خرابی: نشستی که از کف ابزار بیرون زده باشد، عددی تولید نکرده.
            </p>
          </div>
        )}
        <button type="button" className="go" onClick={start}>نشست بعدی</button>
      </div>
    );
  }

  const value = stair.value;
  const near = shiftL({ L: REFERENCE, C: FROM_ARCHIVE.neutralC, H: 0 }, BASE);
  const far = shiftL(near, value);
  const patch = (which: 'left' | 'right') => {
    const isBrighter = session.brighterOn === which;
    return (
      <button
        type="button"
        className="patch"
        style={{ background: oklch(isBrighter ? far : near) }}
        onClick={() => choose(which)}
        aria-label={which === 'left' ? 'چپ' : 'راست'}
      />
    );
  };

  return (
    <div className="session">
      <div className="ask">کدام روشن‌تر است؟</div>
      <div className="stage">
        {patch('left')}
        <div className="gap" />
        {patch('right')}
      </div>
      <div className="progress">
        آزمایش {stair.history.length} · بازگشت {stair.reversals.length}/{SHAPE.reversals}
      </div>
    </div>
  );
}
