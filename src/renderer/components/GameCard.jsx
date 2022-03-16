import { useEffect } from 'react';
import './GameCard.css';
import SwitchCover from '../../../assets/images/switch-cover.png';
import WiiCover from '../../../assets/images/wii-cover-new.png';
import GCCover from '../../../assets/images/gc-cover.png';

const GameCard = ({
  image,
  name,
  gameConsole,
  gamePath,
  gameRunning,
  setRunning,
}) => {
  const getCover = (gameConsole) => {
    if (gameConsole == 'Wii') {
      return WiiCover;
    } else if (gameConsole == 'Switch') {
      return SwitchCover;
    } else if (gameConsole == 'GC') {
      return GCCover;
    }
    return WiiCover;
  };
  const launchGame = async () => {
    if (!gameRunning) {
      setRunning(name, gameConsole, true);
      const result = await window.api[`exec${gameConsole}`]({
        gamePath,
        gameConsole,
        name,
      });
      console.log(result);
    }
  };
  return (
    <div className="game-card-container" onClick={launchGame}>
      <img className="game-card-image" alt={name} src={image} />
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
