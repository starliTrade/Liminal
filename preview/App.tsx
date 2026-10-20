/**
 * THE EYE TEST — STAGE ONE: THE LADDER.
 *
 * Nine surfaces nested inside one another, built from nothing but the canvas and
 * the step. No borders, no rims, no shadows. If a boundary reads as a line, or
 * vanishes, or the ladder feels uneven, that is the finding — and it is a finding
 * about the FORMULA, not about a treatment.
 *
 * Three views, because they answer three different questions:
 *
 *   NESTED      does the recursion read as depth?      (the system's actual shape)
 *   STAIRCASE   is every step the same size?           (evenness, full width)
 *   BOUNDARY    is THIS one boundary visible?          (one at a time, no context)
 *
 * Everything comes from the engine. Nothing here is a copy.
 */

import { useState } from 'react';
import { LADDER, SIZE, STEP, CANVAS_L, CHROMA, HUE, ladderExact, liminalCss } from '../engine/index';
import { Q, R, EDGE_THRESHOLD } from '../engine/perception';

const NAMES = [
  'بوم',
  'سرفیس ۱',
  'سرفیس ۲',
  'سرفیس ۳',
  'سرفیس ۴',
  'سرفیس ۵',
  'سرفیس ۶',
  'سرفیس ۷',
  'سقف',
];

export function App() {
  const [inset, setInset] = useState(34);
  const [labels, setLabels] = useState(true);
  const [values, setValues] = useState(false);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: liminalCss() }} />
      <div className="pv">
        <header className="pv-head">
          <div className="pv-title">
            LIMINAL <span>· تست چشمی · مرحلهٔ ۱ — لایه‌ها</span>
          </div>
          <div className="pv-note">
            بدون مرز · بدون ریم · بدون سایه — فقط پُر
          </div>
        </header>

        {/* ── controls ─────────────────────────────────────────────── */}
        <div className="ctl">
          <label className="ctl-item">
            <span>فاصلهٔ تودرتو</span>
            <input
              type="range"
              min={16}
              max={72}
              value={inset}
              onChange={(e) => setInset(Number(e.target.value))}
            />
            <code>{inset}px</code>
          </label>
          <button type="button" className={labels ? 'sw on' : 'sw'} onClick={() => setLabels(!labels)}>
            برچسب
          </button>
          <button type="button" className={values ? 'sw on' : 'sw'} onClick={() => setValues(!values)}>
            عدد L
          </button>
          <div className="ctl-hint">
            در زوم ۱۰۰٪ ببین — مقیاس صفحه را عوض نکن
          </div>
        </div>

        {/* ── 1. NESTED ────────────────────────────────────────────── */}
        <section className="pv-sec">
          <h2>۱ · تودرتو</h2>
          <p className="pv-sub">
            هر سطح دقیقاً یک گام روی سطحی که در آن نشسته. این شکل واقعی سیستم است —
            عمق باید <b>حس</b> شود، نه اینکه به‌صورت خط <b>دیده</b> شود.
          </p>
          <div className="nest" style={{ background: LADDER[0] }}>
            {Array.from({ length: SIZE }, (_, n) => n).map((n) => (
              <div
                key={n}
                className="nest-layer"
                style={{ background: LADDER[n], padding: n === SIZE - 1 ? 0 : inset }}
              >
                {labels && (
                  <span className={n === SIZE - 1 ? 'nest-tag last' : 'nest-tag'}>
                    S{n}
                    {values && <code> L={ladderExact(n).replace(/oklch\(0\./, '0.')}</code>}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── 2. STAIRCASE ─────────────────────────────────────────── */}
        <section className="pv-sec">
          <h2>۲ · پله‌ای</h2>
          <p className="pv-sub">
            نُه نوار تمام‌عرض، چسبیده. مرزها خطوط افقی سراسری‌اند — بهترین آزمون
            برای <b>یکنواختی</b>. اگر جایی گام کوتاه یا بلند به نظر می‌رسد، فرمول
            مشکل دارد.
          </p>
          <div className="stairs">
            {Array.from({ length: SIZE }, (_, n) => (
              <div key={n} className="stair" style={{ background: LADDER[n] }}>
                {labels && <span className="stair-tag">S{n}</span>}
                {labels && <span className="stair-name">{NAMES[n]}</span>}
              </div>
            ))}
          </div>
          <div className="stairs-side">
            {Array.from({ length: SIZE - 1 }, (_, i) => i).map((n) => (
              <div key={n} className="stairs-pair">
                <div className="sp-a" style={{ background: LADDER[n] }} />
                <div className="sp-b" style={{ background: LADDER[n + 1] }} />
              </div>
            ))}
          </div>
          <p className="pv-sub small">
            ردیف پایین: هر جفت مجاور تنها دو رنگ دارد. اگر یکی از این هشت مرز از
            بقیه واضح‌تر یا محوتر است، بگو کدام.
          </p>
        </section>

        {/* ── 3. ONE BOUNDARY AT A TIME ────────────────────────────── */}
        <section className="pv-sec">
          <h2>۳ · هر مرز، جداگانه</h2>
          <p className="pv-sub">
            هر بلوک یک مرز است: نیمهٔ راست سطح پایین، نیمهٔ چپ سطح بالایی. بدون
            بافت، بدون بستر، بدون مقایسه — فقط همان یک مرز.
          </p>
          <div className="bounds">
            {Array.from({ length: SIZE - 1 }, (_, i) => i).map((n) => (
              <div key={n} className="bound">
                <div className="bound-fields">
                  <div className="bf-lo" style={{ background: LADDER[n] }}>
                    {labels && <span className="bf-tag">S{n}</span>}
                  </div>
                  <div className="bf-hi" style={{ background: LADDER[n + 1] }}>
                    {labels && <span className="bf-tag">S{n + 1}</span>}
                  </div>
                </div>
                <div className="bound-meta">
                  <b>S{n} → S{n + 1}</b>
                  <code>{(STEP / Q).toFixed(4)}q</code>
                  {values && <code>{(STEP / EDGE_THRESHOLD).toFixed(2)}× لبه</code>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. THE NUMBERS ───────────────────────────────────────── */}
        <section className="pv-sec">
          <h2>۴ · عددها</h2>
          <p className="pv-sub">
            <code>L(Sn) = {CANVAS_L} + n × {STEP}</code> · C = <code>{CHROMA}</code> · H = <code>{HUE}</code>
          </p>
          <table className="pv-table">
            <thead>
              <tr>
                <th>سطح</th>
                <th>L</th>
                <th>هگز</th>
                <th>در q</th>
                <th>در لبه</th>
                <th>نقش</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: SIZE }, (_, n) => (
                <tr key={n}>
                  <td>
                    <b>S{n}</b>
                  </td>
                  <td>
                    <code>{(CANVAS_L + n * STEP).toFixed(6)}</code>
                  </td>
                  <td>
                    <code>{LADDER[n]}</code>
                  </td>
                  <td>
                    <code>{((n * STEP) / Q).toFixed(4)}q</code>
                  </td>
                  <td>
                    <code>{((n * STEP) / EDGE_THRESHOLD).toFixed(2)}×</code>
                  </td>
                  <td>{NAMES[n]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pv-sub small">
            آستانه‌ها: لبه <code>{EDGE_THRESHOLD.toFixed(6)}</code> · q <code>{Q}</code> · r{' '}
            <code>{R}</code>
          </p>
        </section>
      </div>
    </>
  );
}
