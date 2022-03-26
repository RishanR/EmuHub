import { useEffect } from 'react';
import './GameCard.css';
import SwitchCover from '../../../assets/images/switch-cover.png';
import WiiCover from '../../../assets/images/wii-cover-new-new.png';
import GCCover from '../../../assets/images/gc-cover.png';
import ThreeDSCover from '../../../assets/images/threeds-cover.png';
import PSPCover from '../../../assets/images/psp-cover.png';
import WiiUCover from '../../../assets/images/wii-u-cover.png';
import GBACover from '../../../assets/images/gba-cover-new.png';
import DSCover from '../../../assets/images/ds-cover.png';

const GameCard = ({
  image,
  name,
  gameConsole,
  gamePath,
  gameRunning,
  setRunning,
  setStatus,
}) => {
  const getCover = (gameConsole) => {
    if (gameConsole == 'Wii') {
      return WiiCover;
    } else if (gameConsole == 'Switch') {
      return SwitchCover;
    } else if (gameConsole == 'GC') {
      return GCCover;
    } else if (gameConsole == '3DS') {
      return ThreeDSCover;
    } else if (gameConsole == 'PSP') {
      return PSPCover;
    } else if (gameConsole == 'WiiU') {
      return WiiUCover;
    } else if (gameConsole == 'GBA') {
      return GBACover;
    } else if (gameConsole == 'DS') {
      return DSCover;
    }
    return WiiCover;
  };
  const launchGame = async () => {
    if (!gameRunning) {
      const result = await window.api[`exec${gameConsole}`]({
        gamePath,
        gameConsole,
        name,
      });
      if (result.error) {
        console.log(result.error);
        setStatus((prevState) => {
          return { ...prevState, message: result.message };
        });
      } else {
        setRunning(name, gameConsole, true);
      }
    }
  };
  return (
    <div tabIndex={-1} className="game-card-container" onClick={launchGame}>
      {image ? (
        <img
          className={`game-card-image aspect-ratio-${gameConsole}`}
          alt={name}
          src={image}
        />
      ) : (
        <div className={`game-card-no-image aspect-ratio-${gameConsole}`}>
          {name}
        </div>
      )}
      <img className="game-card-cover" src={getCover(gameConsole)} />
      <div
        className={gameRunning ? 'game-card-running' : 'game-card-not-running'}
      >
        {gameRunning ? (
          <div>
            {name}
            <br />
            <br />
            <span className="game-card-running-indicator">Running</span>
          </div>
        ) : (
          name
        )}
      </div>
    </div>
  );
};

export default GameCard;
