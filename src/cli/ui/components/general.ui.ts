// This class in only a intermediate for the refactor.

import { BaseUi } from '../base.ui.js';
import pc from 'picocolors';

export class GeneralUi extends BaseUi {
  render(): void {}

  printExitMessage(stats: { spaceReleased: string }): void {
    const { spaceReleased } = stats;
<<<<<<< HEAD
    let exitMessage = `Space released: ${spaceReleased}\n`;
    exitMessage += colors['gray'](
      'Thanks for using uvkill!\nLike it? Give us a star http://github.com/manascb1344/uvkill\n',
=======
    let exitMessage = `Space saved: ${spaceReleased}\n`;
    exitMessage += pc.dim(
      'Thanks for using npkill!\nLike it? Give us a star http://github.com/voidcosmos/npkill\n',
>>>>>>> upstream/main
    );
    this.print(exitMessage);
  }
}
