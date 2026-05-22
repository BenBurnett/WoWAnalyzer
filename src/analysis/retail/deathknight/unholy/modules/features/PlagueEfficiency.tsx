import { formatPercentage } from 'common/format';
import SPELLS from 'common/SPELLS';
import TALENTS from 'common/TALENTS/deathknight';
import { SpellLink } from 'interface';
import { explanationAndDataSubsection } from 'interface/guide/components/ExplanationRow';
import UptimeIcon from 'interface/icons/Uptime';
import Analyzer from 'parser/core/Analyzer';
import Enemies from 'parser/shared/modules/Enemies';
import BoringSpellValueText from 'parser/ui/BoringSpellValueText';
import { QualitativePerformance } from 'parser/ui/QualitativePerformance';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_ORDER from 'parser/ui/STATISTIC_ORDER';
import uptimeBarSubStatistic from 'parser/ui/UptimeBarSubStatistic';
import type { JSX } from 'react';

const PERFECT_DISEASE_UPTIME_THRESHOLD = 0.99;
const GOOD_DISEASE_UPTIME_THRESHOLD = 0.97;
const OK_DISEASE_UPTIME_THRESHOLD = 0.95;

class PlagueEfficiency extends Analyzer {
  static dependencies = {
    enemies: Enemies,
  };

  protected enemies!: Enemies;

  get virulentPlagueUptime() {
    return this.enemies.getBuffUptime(SPELLS.VIRULENT_PLAGUE.id) / this.owner.fightDuration;
  }

  get virulentPlagueHistory() {
    return this.enemies.getDebuffHistory(SPELLS.VIRULENT_PLAGUE.id);
  }

  get dreadPlagueUptime() {
    return this.enemies.getBuffUptime(SPELLS.DREAD_PLAGUE.id) / this.owner.fightDuration;
  }

  get dreadPlagueHistory() {
    return this.enemies.getDebuffHistory(SPELLS.DREAD_PLAGUE.id);
  }

  get dreadPlaguePerformance(): QualitativePerformance {
    if (this.dreadPlagueUptime >= PERFECT_DISEASE_UPTIME_THRESHOLD) {
      return QualitativePerformance.Perfect;
    }
    if (this.dreadPlagueUptime >= GOOD_DISEASE_UPTIME_THRESHOLD) {
      return QualitativePerformance.Good;
    }
    if (this.dreadPlagueUptime >= OK_DISEASE_UPTIME_THRESHOLD) {
      return QualitativePerformance.Ok;
    }
    return QualitativePerformance.Fail;
  }

  get virulentPlaguePerformance(): QualitativePerformance {
    if (this.virulentPlagueUptime >= PERFECT_DISEASE_UPTIME_THRESHOLD) {
      return QualitativePerformance.Perfect;
    }
    if (this.virulentPlagueUptime >= GOOD_DISEASE_UPTIME_THRESHOLD) {
      return QualitativePerformance.Good;
    }
    if (this.virulentPlagueUptime >= OK_DISEASE_UPTIME_THRESHOLD) {
      return QualitativePerformance.Ok;
    }
    return QualitativePerformance.Fail;
  }

  get guideSubsection(): JSX.Element {
    const explanation = (
      <>
        <p>
          Keep <SpellLink spell={SPELLS.VIRULENT_PLAGUE} /> and{' '}
          <SpellLink spell={SPELLS.DREAD_PLAGUE} /> active for as much of the fight as possible.
          Strong disease uptime is core to Unholy pressure and feeds several talent interactions.
        </p>
        <p>
          With <SpellLink spell={TALENTS.FORBIDDEN_KNOWLEDGE_3_UNHOLY_TALENT} />,{' '}
          <SpellLink spell={SPELLS.DREAD_PLAGUE} /> can rouse additional lesser ghouls to{' '}
          <SpellLink spell={TALENTS.PUTREFY_TALENT} />. With{' '}
          <SpellLink spell={TALENTS.SUDDEN_DOOM_TALENT} />, keeping{' '}
          <SpellLink spell={SPELLS.DREAD_PLAGUE} /> active also sustains that proc engine.
        </p>
      </>
    );

    const data = (
      <div>
        <div style={{ marginBottom: '6px' }}>
          <strong>Disease timeline</strong>
        </div>
        <p style={{ margin: '0 0 8px 0' }}>
          Keep both diseases rolling with minimal gaps. 99%+ uptime is the goal.
        </p>
        <div>
          {uptimeBarSubStatistic(
            this.owner.fight,
            {
              spells: [SPELLS.VIRULENT_PLAGUE],
              uptimes: this.virulentPlagueHistory,
              perf: this.virulentPlaguePerformance,
            },
            [],
            undefined,
            false,
            'uptime',
          )}
        </div>
        <div>
          {uptimeBarSubStatistic(
            this.owner.fight,
            {
              spells: [SPELLS.DREAD_PLAGUE],
              uptimes: this.dreadPlagueHistory,
              perf: this.dreadPlaguePerformance,
            },
            [],
            undefined,
            false,
            'uptime',
          )}
        </div>
      </div>
    );

    return explanationAndDataSubsection(explanation, data, 40);
  }

  statistic() {
    return (
      <Statistic position={STATISTIC_ORDER.CORE(7)} size="flexible">
        <BoringSpellValueText spell={SPELLS.VIRULENT_PLAGUE.id}>
          <>
            <UptimeIcon /> {formatPercentage(this.virulentPlagueUptime)}%{' '}
            <small>Disease Uptime</small>
          </>
        </BoringSpellValueText>
        <BoringSpellValueText spell={SPELLS.DREAD_PLAGUE.id}>
          <>
            <UptimeIcon /> {formatPercentage(this.dreadPlagueUptime)}% <small>Disease Uptime</small>
          </>
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default PlagueEfficiency;
