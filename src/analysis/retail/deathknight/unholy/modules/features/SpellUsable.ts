import SPELLS from 'common/SPELLS';
import TALENTS from 'common/TALENTS/deathknight';

import { AbilityEvent, EventType } from 'parser/core/Events';
import CoreSpellUsable from 'parser/shared/modules/SpellUsable';

/**
 * Dark Transformation resets Soul Reaper's cooldown and allows it to be cast
 * once on any target regardless of execute range.
 *
 * Rather than resetting the CD when DT is cast (which would pollute normal CD
 * tracking if the player delays using the DT window), we intercept the SR cast
 * itself: if SR is on cooldown at cast-time and the DT buff is present on the
 * player, we reset the cooldown first so the cast is not treated as an error.
 */
class SpellUsable extends CoreSpellUsable {
  static dependencies = {
    ...CoreSpellUsable.dependencies,
  };

  // oxlint-disable-next-line typescript-eslint/no-explicit-any -- matches base class signature
  beginCooldown(
    cooldownTriggerEvent: AbilityEvent<EventType>,
    spellId: number = cooldownTriggerEvent.ability.guid,
  ) {
    if (
      spellId === TALENTS.SOUL_REAPER_TALENT.id &&
      this.isOnCooldown(spellId) &&
      this.selectedCombatant.hasBuff(SPELLS.DARK_TRANSFORMATION_BUFF.id)
    ) {
      this.endCooldown(spellId, cooldownTriggerEvent.timestamp);
    }
    super.beginCooldown(cooldownTriggerEvent, spellId);
  }
}

export default SpellUsable;
