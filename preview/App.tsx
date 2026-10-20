/**
 * THE EYE TEST.
 *
 * The policy says a number that has not been seen is not a number. This page is
 * where the engine's numbers are seen — on real surfaces, in a real layout, with
 * each treatment switchable so the eye can compare against its absence.
 *
 * The page reads the ENGINE, not a copy of it. Every colour, every distance and
 * every alpha comes from `engine/`, and the stylesheet is generated from the same
 * source. If the engine and this page ever disagree, the page is wrong.
 */

import { useMemo, useState } from 'react';
import {
  LADDER,
  SIZE,
  WELLS,
  borderColor,
  ladderExact,
  liminalCss,
  rimStops,
  separatorColor,
  shadowFor,
  TREATMENTS_IN_Q,
  TREATMENTS_OVER_EDGE,
  Q,
} from '../engine/index';

type Toggles = {
  border: boolean;
  separator: boolean;
  rim: boolean;
  shadow: boolean;
};

const f = (n: number, d = 4) => n.toFixed(d);

/**
 * A RIM IS AN EDGE, NOT A WASH.
 *
 * The first attempt at this was a full-bleed gradient over the whole surface,
 * which tints the surface instead of lighting its edge — a different thing
 * entirely, and it looked like fog. A rim is four inset hairlines, one per
 * direction, each at its own distance above the host.
 */
function rimStyle(hostLevel: number): React.CSSProperties {
  const s = rimStops(hostLevel);
  const top = ladderExact(hostLevel + s.top);
  const side = ladderExact(hostLevel + s.side);
  const bottom = ladderExact(hostLevel + s.bottom);
  return {
    boxShadow: [
      `inset 0 1px 0 0 ${top}`,
      `inset 1px 0 0 0 ${side}`,
      `inset -1px 0 0 0 ${side}`,
      `inset 0 -1px 0 0 ${bottom}`,
    ].join(', '),
  };
}

export function App() {
  const [t, setT] = useState<Toggles>({ border: true, separator: true, rim: true, shadow: true });
  const css = useMemo(() => liminalCss(), []);
  const flip = (k: keyof Toggles) => setT((p) => ({ ...p, [k]: !p[k] }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="pv">
        <header className="pv-head">
          <div className="pv-title">
            LIMINAL <span>· موتور</span>
          </div>
          <div className="pv-switches">
            {(['border', 'separator', 'rim', 'shadow'] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={t[k] ? 'sw on' : 'sw'}
                onClick={() => flip(k)}
              >
                {k === 'border' ? 'مرز' : k === 'separator' ? 'جداکننده' : k === 'rim' ? 'ریم' : 'سایه'}
              </button>
            ))}
          </div>
          <div className="pv-note">
            q = <code>{Q}</code> · هر عدد از <code>engine/</code> می‌آید
          </div>
        </header>

        {/* ── the ladder, all nine levels ─────────────────────────────── */}
        <section className="pv-sec">
          <h2>نردبان</h2>
          <p className="pv-sub">
            گام <code>1.1416q</code> ثابت · هگز <code>1.07q–1.21q</code> (کوانتیزه) ·
            <code>oklch()</code> دقیق
          </p>
          <div className="pv-ladder">
            {Array.from({ length: SIZE }, (_, n) => (
              <div key={n} className="pv-step">
                <div className="pv-chip" style={{ background: ladderExact(n) }} />
                <div className="pv-step-meta">
                  <b>S{n}</b>
                  <code>{LADDER[n]}</code>
                </div>
              </div>
            ))}
          </div>
          <div className="pv-wells">
            چاه‌ها (زیر بوم، سطح نیستند):
            <span className="pv-chip sm" style={{ background: WELLS.penumbra }} />
            <code>{WELLS.penumbra}</code>
            <span className="pv-chip sm" style={{ background: WELLS.umbra }} />
            <code>{WELLS.umbra}</code>
          </div>
        </section>

        {/* ── a real surface stack ────────────────────────────────────── */}
        <section className="pv-sec">
          <h2>سطح‌گذاری — یک رابط واقعی</h2>
          <p className="pv-sub">
            بوم → کروم → سطح کار → پنل تودرتو → شناور. هر سطح روی سطحی یک پله زیرِ خودش.
          </p>

          <div className="pv-app" style={{ background: LADDER[0] }}>
            {/* chrome — S1 */}
            <aside
              className="pv-side"
              style={{ background: LADDER[1], ...(t.rim ? rimStyle(1) : {}) }}
            >
              <div className="pv-side-in">
                <div className="pv-side-title">LIMINAL</div>
                <nav>
                  {['نردبان', 'سطح', 'مرز', 'سایه', 'ریم'].map((x, i) => (
                    <div key={x} className={i === 0 ? 'pv-nav on' : 'pv-nav'}>
                      {x}
                    </div>
                  ))}
                </nav>
              </div>
            </aside>

            {/* work surface — S2 */}
            <main
              className="pv-main"
              style={{
                background: LADDER[2],
                border: t.border ? `1px solid ${borderColor(2)}` : '1px solid transparent',
                ...(t.rim ? rimStyle(2) : {}),
              }}
            >
              <div className="pv-main-head">
                <h3>سطح کار</h3>
                <span className="pv-badge">S2</span>
              </div>

              {t.separator && <div className="pv-sep" style={{ background: separatorColor(2) }} />}

              <p className="pv-p">
                این متن روی سطح کار نشسته. جداکنندهٔ بالای این پاراگراف{' '}
                <code>0.5708q</code> است — روی آستانهٔ لبه، پیدا می‌شود بدون اینکه
                خطی باشد که متوجهش شوی.
              </p>

              {/* nested panel — S3 */}
              <div
                className="pv-panel"
                style={{
                  background: LADDER[3],
                  border: t.border ? `1px solid ${borderColor(3)}` : '1px solid transparent',
                  ...(t.rim ? rimStyle(3) : {}),
                }}
              >
                <div className="pv-panel-head">
                  <span>پنل تودرتو</span>
                  <span className="pv-badge">S3</span>
                </div>
                <p className="pv-p sm">
                  مرز این پنل <code>1.1416q</code> است — <code>2.38×</code> آستانهٔ لبه.
                  حاشیه‌اش همان چیزی است که از یک نمایشگر ضعیف جان به‌در می‌برد.
                </p>

                {/* a control — S4 */}
                <div className="pv-row">
                  <button
                    type="button"
                    className="pv-btn"
                    style={{
                      background: LADDER[4],
                      border: t.border ? `1px solid ${borderColor(4)}` : '1px solid transparent',
                    }}
                  >
                    کنترل
                  </button>
                  <span className="pv-badge">S4</span>
                </div>
              </div>
            </main>

            {/* floating — S5, with the solved shadow */}
            <div
              className="pv-float"
              style={{
                background: LADDER[5],
                border: t.border ? `1px solid ${borderColor(5)}` : '1px solid transparent',
                ...(t.shadow ? { boxShadow: shadowFor(5, 2) } : {}),
                ...(t.rim ? rimStyle(5) : {}),
              }}
            >
              <div className="pv-float-head">
                <span>شناور</span>
                <span className="pv-badge">S5</span>
              </div>
              <p className="pv-p sm">
                سایه روی S2 حل شده: آلفا <code>0.1883</code> تا قله دقیقاً{' '}
                <code>1q</code> پایین‌تر بیفتد.
              </p>
            </div>
          </div>
        </section>

        {/* ── the eye test proper: the same host, three distances ─────── */}
        <section className="pv-sec">
          <h2>مقایسه — همان سطح، فاصله‌های مختلف</h2>
          <p className="pv-sub">
            چشم باید بتواند قضاوت کند، پس هر سه کنار هم‌اند. اگر فرق ۰.۵ و ۱.۰ پله را
            نمی‌بینی، عدد غلط است — نه چشم.
          </p>

          <div className="pv-cmp">
            {[
              { steps: 0.5, label: 'جداکننده', q: '0.5708q', note: 'روی آستانه' },
              { steps: 1.0, label: 'مرز', q: '1.1416q', note: '۲.۳۸× آستانه' },
              { steps: 1.5, label: 'ریم (بالا)', q: '1.7123q', note: '۳.۵۷× آستانه' },
            ].map((c) => (
              <div key={c.steps} className="pv-cmp-cell">
                <div
                  className="pv-cmp-box"
                  style={{
                    background: LADDER[3],
                    border: `1px solid ${ladderExact(3 + c.steps)}`,
                  }}
                />
                <div className="pv-cmp-meta">
                  <b>{c.label}</b>
                  <code>{c.steps.toFixed(1)} پله · {c.q}</code>
                  <span>{c.note}</span>
                </div>
              </div>
            ))}
            <div className="pv-cmp-cell">
              <div
                className="pv-cmp-box"
                style={{ background: LADDER[3], border: '1px solid transparent' }}
              />
              <div className="pv-cmp-meta">
                <b>بدون مرز</b>
                <code>—</code>
                <span>شاهد</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── the shadow, on every surface it can fall on ─────────────── */}
        <section className="pv-sec">
          <h2>سایه — روی هر سطحی که می‌تواند بیفتد</h2>
          <p className="pv-sub">
            هر خانه یک سطح میزبان است و سایه‌ای که رویش حل شده. آلفا عوض می‌شود تا
            قله روی همه دقیقاً <code>1q</code> بیفتد — اگر یک عدد را همه‌جا بگذاری،
            روی سقف ۲.۸ برابر تیره‌تر می‌شود.
          </p>
          <div className="pv-shadows">
            {Array.from({ length: SIZE }, (_, n) => (
              <div key={n} className="pv-shadow-cell">
                <div
                  className="pv-shadow-host"
                  style={{ background: LADDER[n] }}
                >
                  <div
                    className="pv-shadow-cast"
                    style={{
                      background: LADDER[n],
                      boxShadow: shadowFor(4, n),
                    }}
                  />
                </div>
                <code>S{n}</code>
              </div>
            ))}
          </div>
        </section>

        {/* ── the numbers, as a table ─────────────────────────────────── */}
        <section className="pv-sec">
          <h2>عددها</h2>
          <table className="pv-table">
            <thead>
              <tr>
                <th>درمان</th>
                <th>پله</th>
                <th>کوانتوم</th>
                <th>× آستانهٔ لبه</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>جداکننده</td>
                <td>0.5</td>
                <td>{f(TREATMENTS_IN_Q.separator)}q</td>
                <td>{f(TREATMENTS_OVER_EDGE.separator, 2)}×</td>
              </tr>
              <tr>
                <td>مرز</td>
                <td>1.0</td>
                <td>{f(TREATMENTS_IN_Q.border)}q</td>
                <td>{f(TREATMENTS_OVER_EDGE.border, 2)}×</td>
              </tr>
              <tr>
                <td>ریم (بالا)</td>
                <td>1.5</td>
                <td>{f(TREATMENTS_IN_Q.rim)}q</td>
                <td>{f(TREATMENTS_OVER_EDGE.rim, 2)}×</td>
              </tr>
              <tr>
                <td>سایه (قله)</td>
                <td>—</td>
                <td>{f(TREATMENTS_IN_Q.shadow)}q</td>
                <td>{f(TREATMENTS_OVER_EDGE.shadow, 2)}×</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
