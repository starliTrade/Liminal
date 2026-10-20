import { useState } from 'react';
import { oklch, shiftL, type Oklch } from '../lib/color';
import { FROM_ARCHIVE } from '../lib/foundation';

/**
 * The psychology rig.
 *
 * A named phenomenon is not an argument until you have watched it happen on
 * your own screen, at your own size, with your own eyes. Every perceptual
 * claim in the policy has to be demonstrable here first — otherwise it is a
 * citation, not a reason.
 */

const NEUTRAL = (L: number): Oklch => ({ L, C: FROM_ARCHIVE.neutralC, H: 0 });
const CANVAS = FROM_ARCHIVE.canvasL;

export function Phenomenon() {
  const [edge, setEdge] = useState(0.012);
  const [band, setBand] = useState(0.03);

  const low = NEUTRAL(CANVAS + 0.02);

  return (
    <div className="panel wide">
      <h2>پدیده‌ها — آیا واقعاً اینجا رخ می‌دهند؟</h2>

      <section className="phen">
        <h3>۱. نوارهای ماخ — چرا زیرآستانه، سایه‌بان می‌شود نه مرز</h3>
        <p>
          در یک لبهٔ سخت، دستگاه بینایی خودش یک نوار روشن و یک نوار تیره در دو طرف مرز
          می‌سازد. آن نوارها <b>وجود ندارند</b> — ساختهٔ خودِ چشم‌اند. این یعنی یک اختلاف
          کوچک می‌تواند «خط» خوانده شود، درحالی‌که هیچ خطی رسم نشده.
        </p>
        <div className="strip">
          <div style={{ background: oklch(low) }} />
          <div style={{ background: oklch(shiftL(low, edge)) }} />
        </div>
        <label className="field">
          <span>اختلاف دو نیمه: <code>{edge.toFixed(4)}</code></span>
          <input type="range" min="0.001" max="0.06" step="0.0005" value={edge}
            onChange={(e) => setEdge(Number(e.target.value))} />
          <small>تا کجا نوار را می‌بینی، و از کجا فقط یک اختلاف صاف می‌بینی؟</small>
        </label>
      </section>

      <section className="phen">
        <h3>۲. تباین همزمان — چرا آلفای سایه به میزبان وابسته است</h3>
        <p>
          یک وصلهٔ <b>کاملاً یکسان</b> روی دو زمینهٔ متفاوت، دو روشنایی متفاوت خوانده می‌شود.
          پس «سایه» یک عدد ثابت نیست: برای اینکه اوجش همیشه یک کوانتوم <i>خوانده شود</i>،
          آلفایش باید با میزبان عوض شود.
        </p>
        <div className="contrast">
          <div className="cell" style={{ background: oklch(NEUTRAL(CANVAS + 0.02)) }}>
            <div className="chip" style={{ background: oklch(shiftL(NEUTRAL(CANVAS + 0.02), band)) }} />
          </div>
          <div className="cell" style={{ background: oklch(NEUTRAL(CANVAS + 0.09)) }}>
            <div className="chip" style={{ background: oklch(shiftL(NEUTRAL(CANVAS + 0.02), band)) }} />
          </div>
        </div>
        <p className="caveat">
          هر دو وصله عدد یکسانی دارند. اگر متفاوت خوانده می‌شوند، پدیده تأیید شد.
        </p>
        <label className="field">
          <span>اختلاف وصله از زمینه: <code>{band.toFixed(4)}</code></span>
          <input type="range" min="0" max="0.08" step="0.0005" value={band}
            onChange={(e) => setBand(Number(e.target.value))} />
        </label>
      </section>

      <section className="phen">
        <h3>۳. خطای شورول — چرا نردبان پله‌ای، شیب خوانده می‌شود</h3>
        <p>
          پله‌های یکنواخت، وقتی فاصله‌شان زیر آستانهٔ اطمینان باشد، به‌صورت یک شیب صاف خوانده
          می‌شوند. این همان چیزی است که نردبان را «پیوسته» می‌کند بدون اینکه واقعاً پیوسته باشد.
        </p>
        <div className="ladder">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} style={{ background: oklch(NEUTRAL(CANVAS + i * 0.0083)) }} />
          ))}
        </div>
        <p className="caveat">۹ پله، هر پله <code>0.0083</code> — عدد قدیمی، هنوز تأییدنشده.</p>
      </section>
    </div>
  );
}
