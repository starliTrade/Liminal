import { useMemo, useState } from 'react';
import { FROM_ARCHIVE } from '../lib/foundation';
import { oklch, shiftL, type Oklch } from '../lib/color';
import { evidenceCard, flipVerdict, sideFor } from '../lib/blind';

/**
 * The comparator — the instrument the eye protocol cannot run without.
 *
 * Three of its six rules are impossible with a bare eye:
 *
 *   blind     - if you laid the two options out yourself, you are not blind
 *   reversal  - if swapping is manual, you know which is which
 *   degrade   - if the degradation is manual, it is different every time
 *
 * So the comparator owns all three. It decides the sides from a seed, it
 * swaps them itself, and it applies the degradations as fixed filters.
 *
 * It also refuses to start until a prediction has been written. That is the
 * protocol's first rule, and a rule the instrument does not enforce is a
 * claim, not a rule.
 */

const CANVAS: Oklch = { L: FROM_ARCHIVE.canvasL, C: FROM_ARCHIVE.neutralC, H: 0 };
const q = FROM_ARCHIVE.q;

type Variant = { readonly id: string; readonly name: string; readonly steps: number };

/** Border treatments. The claim under test: a border is 1 step. */
const VARIANTS: readonly Variant[] = [
  { id: 'b05', name: '۰.۵ پله', steps: 0.5 },
  { id: 'b10', name: '۱ پله', steps: 1 },
  { id: 'b15', name: '۱.۵ پله', steps: 1.5 },
];

type Degradation = 'blur' | 'gray' | 'small' | 'rtl';

const DEGRADATIONS: ReadonlyArray<{ id: Degradation; label: string; hint: string }> = [
  { id: 'blur', label: 'تاری', hint: 'ساختار — اگر فقط از نزدیک کار کند، شکننده است' },
  { id: 'gray', label: 'خاکستری', hint: 'اگر بدون رنگ فرو بریزد، رنگ دارد کار می‌کند نه فرم' },
  { id: 'small', label: 'کوچک', hint: 'سلسله‌مراتب — اگر به هم بریزد، سلسله‌مراتب نداری' },
  { id: 'rtl', label: 'RTL', hint: 'آینه — اگر در آینه بشکند، به جهت وابسته است' },
];

function Panel({ variant, degraded }: { variant: Variant; degraded: ReadonlySet<Degradation> }) {
  const host = shiftL(CANVAS, 3 * q);
  const card = shiftL(host, q);
  const border = shiftL(card, variant.steps * q);

  const filter = [
    degraded.has('blur') ? 'blur(2.5px)' : '',
    degraded.has('gray') ? 'grayscale(1)' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="cmp-panel" style={{ background: oklch(host) }}>
      <div
        className="cmp-stage"
        style={{
          filter: filter || undefined,
          transform: degraded.has('small') ? 'scale(0.55)' : undefined,
          direction: degraded.has('rtl') ? 'rtl' : undefined,
        }}
      >
        <div
          className="cmp-card"
          style={{ background: oklch(card), border: `1px solid ${oklch(border)}` }}
        >
          <div className="cmp-line" />
          <div className="cmp-line short" />
        </div>
      </div>
    </div>
  );
}

type Phase = 'setup' | 'first' | 'second' | 'verdict';

export function Comparator() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [prediction, setPrediction] = useState('');
  const [pair, setPair] = useState<[string, string]>(['b05', 'b10']);
  const [degraded, setDegraded] = useState<ReadonlySet<Degradation>>(new Set());
  const [seed, setSeed] = useState(0);
  const [first, setFirst] = useState<string | null>(null);
  const [second, setSecond] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const variants = useMemo(
    () => pair.map((id) => VARIANTS.find((v) => v.id === id)!) as [Variant, Variant],
    [pair],
  );

  /** Which variant sits on the left. Decided by the seed, not by us. */
  const leftFirst = sideFor(seed) === 'left';

  const order: [Variant, Variant] = leftFirst
    ? [variants[0], variants[1]]
    : [variants[1], variants[0]];
  const swapped: [Variant, Variant] = [order[1], order[0]];

  function start() {
    setSeed(Math.floor(Math.random() * 1e9));
    setFirst(null);
    setSecond(null);
    setPhase('first');
  }

  function reset() {
    setPhase('setup');
    setFirst(null);
    setSecond(null);
    setPrediction('');
    setDegraded(new Set());
    setCopied(false);
  }

  const flip = flipVerdict(first, second);
  const flipped = flip === 'flipped';
  const stable = flip === 'stable';

  return (
    <div className="cmp">
      <h2>مقایسه‌کننده — تست چشمی</h2>
      <p className="cmp-lede">
        ادعای زیر آزمون: <b>مرز، یک پله است.</b> اگر مرز ۰.۵ پله و ۱ پله از هم قابل تشخیص نباشند،
        ادعا کشته شده. اگر ۱ پله از ۱.۵ پله جدا شود ولی ۰.۵ پله نه، ادعا زنده است.
      </p>

      {phase === 'setup' && (
        <>
          <label className="cmp-field">
            <span>
              پیش‌بینی — <b>قبل</b> از نگاه کردن بنویس چه انتظار داری ببینی
            </span>
            <textarea
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              placeholder="مثلاً: فکر می‌کنم ۰.۵ پله را نتوانم ببینم و ۱ پله را بتوانم."
              rows={3}
            />
          </label>

          <div className="cmp-field">
            <span>کدام دو گزینه؟</span>
            <div className="cmp-row">
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={pair.includes(v.id) ? 'chip on' : 'chip'}
                  onClick={() =>
                    setPair((p) =>
                      p.includes(v.id)
                        ? p
                        : ([p[1], v.id] as [string, string]),
                    )
                  }
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          <div className="cmp-field">
            <span>تخریب</span>
            <div className="cmp-row">
              {DEGRADATIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  title={d.hint}
                  className={degraded.has(d.id) ? 'chip on' : 'chip'}
                  onClick={() =>
                    setDegraded((s) => {
                      const n = new Set(s);
                      if (n.has(d.id)) n.delete(d.id);
                      else n.add(d.id);
                      return n;
                    })
                  }
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="cmp-go"
            disabled={prediction.trim().length < 4}
            onClick={start}
          >
            {prediction.trim().length < 4 ? 'اول پیش‌بینی را بنویس' : 'شروع'}
          </button>
        </>
      )}

      {(phase === 'first' || phase === 'second') && (
        <>
          <div className="cmp-question">
            {phase === 'first' ? 'کدام درست‌تر است؟' : 'حالا کدام درست‌تر است؟'}
            {phase === 'second' && <span className="cmp-hint"> (جای دو گزینه عوض شد)</span>}
          </div>
          <div className="cmp-grid">
            {(phase === 'first' ? order : swapped).map((v, i) => (
              <div key={v.id} className="cmp-cell">
                <Panel variant={v} degraded={degraded} />
                <button
                  type="button"
                  className="cmp-pick"
                  onClick={() => {
                    if (phase === 'first') {
                      setFirst(v.id);
                      setPhase('second');
                    } else {
                      setSecond(v.id);
                      setPhase('verdict');
                    }
                  }}
                >
                  {i === 0 ? 'این' : 'این'}
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="cmp-skip" onClick={reset}>
            نمی‌توانم تشخیص بدهم — این هم یک نتیجه است
          </button>
        </>
      )}

      {phase === 'verdict' && (
        <div className="cmp-verdict">
          <h3>حکم</h3>
          <dl>
            <dt>پیش‌بینی</dt>
            <dd>{prediction}</dd>
            <dt>انتخاب اول</dt>
            <dd>{variants.find((v) => v.id === first)?.name}</dd>
            <dt>انتخاب دوم — بعد از عوض شدن جا</dt>
            <dd>{variants.find((v) => v.id === second)?.name}</dd>
            <dt>برگشت</dt>
            <dd>
              {flipped
                ? 'بله — جواب برگشت. تفاوت واقعی نیست؛ نویز است یا سوگیریِ سمت.'
                : stable
                  ? 'نه — جواب ثابت ماند. تفاوت واقعی است.'
                  : '—'}
            </dd>
            <dt>تخریب‌های فعال</dt>
            <dd>{degraded.size === 0 ? 'هیچ' : [...degraded].join(' · ')}</dd>
            <dt>بذر</dt>
            <dd>
              <code>{seed}</code>
            </dd>
          </dl>
          <p className="cmp-note">
            این حکم تا وقتی معتبر است که <b>پیش‌بینی</b>، <b>انتخاب‌ها</b> و <b>شرط شکست</b> نوشته
            شده باشند. بدون این سه، یک خاطره است — و خاطره ابدی نیست.
          </p>
          <button
            type="button"
            className="cmp-copy"
            onClick={() => {
              const text = evidenceCard({
                claim: 'مرز، یک پله است.',
                prediction,
                first: variants.find((v) => v.id === first)?.name ?? '—',
                second: variants.find((v) => v.id === second)?.name ?? '—',
                flip,
                degraded: [...degraded],
                seed,
              });
              const done = () => setCopied(true);
              if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(text).then(done).catch(done);
              } else {
                done();
              }
            }}
          >
            {copied ? 'کارت شواهد ساخته شد' : 'ساختن کارت شواهد' }
          </button>
          <button type="button" className="cmp-go" onClick={reset}>
            تست بعدی
          </button>
        </div>
      )}
    </div>
  );
}
