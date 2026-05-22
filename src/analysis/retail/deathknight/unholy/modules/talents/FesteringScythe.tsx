import { formatPercentage } from 'common/format';
import DK_SPELLS from 'common/SPELLS/deathknight';
import TALENTS from 'common/TALENTS/deathknight';
import { BoxRowEntry, PerformanceBoxRow } from 'interface/guide/components/PerformanceBoxRow';
import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import Events, { ApplyBuffEvent, RefreshBuffEvent, RemoveBuffEvent } from 'parser/core/Events';
import { QualitativePerformance } from 'parser/ui/QualitativePerformance';
import BoringSpellValueText from 'parser/ui/BoringSpellValueText';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';
import STATISTIC_ORDER from 'parser/ui/STATISTIC_ORDER';
import type { CSSProperties, ReactNode } from 'react';

const FESTERING_SCYTHE_BUFF_DURATION = 25_000;
const PERFECT_REFRESH_WINDOW = 3_000;
const GOOD_REFRESH_WINDOW = 5_000;
const LEGEND_DOT_BASE_STYLE: CSSProperties = {
  display: 'inline-block',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  marginRight: '6px',
};
const LEGEND_ENTRIES: ReadonlyArray<{ dotStyle: CSSProperties; text: string }> = [
  {
    dotStyle: { ...LEGEND_DOT_BASE_STYLE, backgroundColor: '#2ea8ff' },
    text: 'Refreshed with <3s left or <=1 Lesser Ghoul stack.',
  },
  {
    dotStyle: { ...LEGEND_DOT_BASE_STYLE, backgroundColor: '#4caf50' },
    text: 'Refreshed with <5s left.',
  },
  {
    dotStyle: { ...LEGEND_DOT_BASE_STYLE, backgroundColor: '#ffca28' },
    text: 'Refreshed with 5s or more left.',
  },
  {
    dotStyle: { ...LEGEND_DOT_BASE_STYLE, backgroundColor: '#ef5350' },
    text: 'Buff fell off before reapplying.',
  },
];

class FesteringScythe extends Analyzer {
  private lastBuffRemovedAt: number | null = null;

  private refreshCount = 0;
  private perfectRefreshes = 0;
  private goodRefreshes = 0;
  private droppedApplications = 0;

  private readonly entries: BoxRowEntry[] = [];

  private get buffSpellId() {
    return DK_SPELLS.FESTERING_SCYTHE_BUFF.id;
  }

  constructor(options: Options) {
    super(options);

    this.active = this.selectedCombatant.hasTalent(TALENTS.FESTERING_SCYTHE_TALENT);
    if (!this.active) {
      return;
    }

    this.addEventListener(
      Events.applybuff.by(SELECTED_PLAYER).spell(DK_SPELLS.FESTERING_SCYTHE_BUFF),
      this.onApplyBuff,
    );
    this.addEventListener(
      Events.refreshbuff.by(SELECTED_PLAYER).spell(DK_SPELLS.FESTERING_SCYTHE_BUFF),
      this.onRefreshBuff,
    );
    this.addEventListener(
      Events.removebuff.by(SELECTED_PLAYER).spell(DK_SPELLS.FESTERING_SCYTHE_BUFF),
      this.onRemoveBuff,
    );
  }

  private onApplyBuff(event: ApplyBuffEvent) {
    if (this.lastBuffRemovedAt === null) {
      return;
    }

    const missingMs = Math.max(event.timestamp - this.lastBuffRemovedAt, 0);
    const lesserGhoulStacks = this.getLesserGhoulStacksBeforeScythe(event.timestamp);
    this.droppedApplications += 1;
    this.addEntry(
      QualitativePerformance.Fail,
      <>
        Applied @ {this.owner.formatTimestamp(event.timestamp)} after the buff fell off (
        {this.formatSeconds(missingMs)}s missing). Lesser Ghoul stacks before Scythe:{' '}
        {lesserGhoulStacks}.
      </>,
    );
  }

  private onRemoveBuff(event: RemoveBuffEvent) {
    this.lastBuffRemovedAt = event.timestamp;
  }

  private onRefreshBuff(event: RefreshBuffEvent) {
    const remainingMs = this.getRemainingTimeBeforeRefresh(event.timestamp);
    const lesserGhoulStacks = this.getLesserGhoulStacksBeforeScythe(event.timestamp);
    const value = this.getRefreshPerformance(remainingMs, lesserGhoulStacks);

    this.refreshCount += 1;
    this.addEntry(
      value,
      <>
        Refreshed @ {this.owner.formatTimestamp(event.timestamp)} with{' '}
        {this.formatSeconds(remainingMs)}s remaining. Lesser Ghoul stacks before Scythe:{' '}
        {lesserGhoulStacks}.
      </>,
    );
  }

  private formatSeconds(durationMs: number) {
    return (durationMs / 1000).toFixed(1);
  }

  private getRefreshPerformance(remainingMs: number, lesserGhoulStacks: number) {
    if (remainingMs < PERFECT_REFRESH_WINDOW || lesserGhoulStacks <= 1) {
      this.perfectRefreshes += 1;
      return QualitativePerformance.Perfect;
    }

    if (remainingMs < GOOD_REFRESH_WINDOW) {
      this.goodRefreshes += 1;
      return QualitativePerformance.Good;
    }

    return QualitativePerformance.Ok;
  }

  private getLesserGhoulStacksBeforeScythe(timestamp: number): number {
    return this.selectedCombatant.getBuffStacks(DK_SPELLS.LESSER_GHOUL_BUFF.id);
  }

  private getRemainingTimeBeforeRefresh(timestamp: number): number {
    const currentBuff = this.selectedCombatant.getBuff(this.buffSpellId);

    if (!currentBuff) {
      return 0;
    }

    let previousApplicationTimestamp = currentBuff.start;
    for (let i = currentBuff.refreshHistory.length - 1; i >= 0; i -= 1) {
      const refreshTimestamp = currentBuff.refreshHistory[i];
      if (refreshTimestamp < timestamp) {
        previousApplicationTimestamp = refreshTimestamp;
        break;
      }
    }

    return Math.max(FESTERING_SCYTHE_BUFF_DURATION - (timestamp - previousApplicationTimestamp), 0);
  }

  private addEntry(value: QualitativePerformance, tooltip: ReactNode) {
    this.entries.push({ value, tooltip });
  }

  private get goodOrPerfectRefreshRate() {
    const trackedRefreshOutcomes = this.refreshCount + this.droppedApplications;
    if (trackedRefreshOutcomes === 0) {
      return 1;
    }

    return (this.perfectRefreshes + this.goodRefreshes) / trackedRefreshOutcomes;
  }

  private get uptime() {
    return this.selectedCombatant.getBuffUptime(this.buffSpellId) / this.owner.fightDuration;
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL(14)}
        size="flexible"
        category={STATISTIC_CATEGORY.TALENTS}
      >
        <BoringSpellValueText spell={DK_SPELLS.FESTERING_SCYTHE_BUFF}>
          <div>
            {formatPercentage(this.uptime, 1)}% <small>uptime</small>
          </div>
          <div>
            {formatPercentage(this.goodOrPerfectRefreshRate, 0)}%{' '}
            <small>good+perfect refreshes</small>
          </div>
          <div>
            {this.droppedApplications} <small>buff drops</small>
          </div>
        </BoringSpellValueText>

        <div style={{ padding: '8px' }}>
          <small style={{ display: 'grid', gap: '2px', marginBottom: '6px' }}>
            {LEGEND_ENTRIES.map((entry) => (
              <span key={entry.text}>
                <span style={entry.dotStyle} />
                {entry.text}
              </span>
            ))}
          </small>
          <PerformanceBoxRow values={this.entries} />
        </div>
      </Statistic>
    );
  }
}

export default FesteringScythe;
