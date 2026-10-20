import { useState } from 'react';
import { TwoAFC } from './instruments/TwoAFC';
import { Phenomenon } from './instruments/Phenomenon';
import { FROM_ARCHIVE } from './lib/foundation';

type Instrument = 'twoafc' | 'phenomenon';

const TABS: ReadonlyArray<{ id: Instrument; label: string; hint: string }> = [
  { id: 'twoafc', label: 'آستانه', hint: 'دو گزینه، انتخاب اجباری، پله‌ای' },
  { id: 'phenomenon', label: 'پدیده', hint: 'آیا این پدیده واقعاً اینجا رخ می‌دهد؟' },
];

export function App() {
  const [tab, setTab] = useState<Instrument>('twoafc');

  return (
    <div className="rig">
      <header className="rig-head">
        <div className="rig-title">
          LIMINAL <span>· میز آزمایش</span>
        </div>
        <nav className="rig-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === tab ? 'tab on' : 'tab'}
              onClick={() => setTab(t.id)}
              title={t.hint}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="rig-note">
          بوم از آرشیو: <code>L = {FROM_ARCHIVE.canvasL}</code> — <b>تأییدنشده</b>
        </div>
      </header>
      <main className="rig-body">
        {tab === 'twoafc' ? <TwoAFC /> : <Phenomenon />}
      </main>
    </div>
  );
}
