import { formatPercentage } from 'common/format';
import SPELLS from 'common/SPELLS';
import { SpellLink } from 'interface';
import { explanationAndDataSubsection } from 'interface/guide/components/ExplanationRow';
import UptimeIcon from 'interface/icons/Uptime';
import Analyzer from 'parser/core/Analyzer';
import Enemies from 'parser/shared/modules/Enemies';
import BoringSpellValueText from 'parser/ui/BoringSpellValueText';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_ORDER from 'parser/ui/STATISTIC_ORDER';
import type { JSX } from 'react';

class PlagueEfficiency extends Analyzer {
  static dependencies = {
    enemies: Enemies,
  };

  protected enemies!: Enemies;

  get virulentPlagueUptime() {
    return this.enemies.getBuffUptime(SPELLS.VIRULENT_PLAGUE.id) / this.owner.fightDuration;
  }

  get dreadPlagueUptime() {
    return this.enemies.getBuffUptime(SPELLS.DREAD_PLAGUE.id) / this.owner.fightDuration;
  }

  get guideSubsection(): JSX.Element {
    const explanation = (
      <p>
        Keep <SpellLink spell={SPELLS.VIRULENT_PLAGUE} /> and{' '}
        <SpellLink spell={SPELLS.DREAD_PLAGUE} /> active for as much of the fight as possible. High
        disease uptime is a core part of Unholy pressure and smooth target maintenance.
      </p>
    );

    const data = (
      <div>
        <div style={{ marginBottom: '6px' }}>
          <strong>Disease uptime</strong>
        </div>
        <p style={{ margin: '0 0 8px 0' }}>Keep both diseases rolling with minimal gaps.</p>
        <div style={{ marginBottom: '8px' }}>
          <div>
            <UptimeIcon /> <strong>{formatPercentage(this.virulentPlagueUptime)}%</strong>{' '}
            <small>
              <SpellLink spell={SPELLS.VIRULENT_PLAGUE} />
            </small>
          </div>
          <div>
            <UptimeIcon /> <strong>{formatPercentage(this.dreadPlagueUptime)}%</strong>{' '}
            <small>
              <SpellLink spell={SPELLS.DREAD_PLAGUE} />
            </small>
          </div>
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
