import React, { useState, useEffect } from 'react';
import SwipeableViews from 'react-swipeable-views';
import GameCard from './GameCard';
import './GameGrid.css';
import Pagination from './PaginationFiles/Pagination';

const GameGrid = ({
  selectedGames,
  setRunning,
  setStatus,
  playNavigate,
  playSelect,
  playError,
}) => {
  const [numElementsPerRow, setNumElementsPerRow] = useState(5);
  useEffect(() => {
    if (window.innerWidth < 1500) {
      numElementsPerRow !== 4 && setNumElementsPerRow(4);
    } else {
      numElementsPerRow !== 5 && setNumElementsPerRow(5);
    }
  }, []);

  const handleResize = (event) => {
    if (window.innerWidth < 1500) {
      numElementsPerRow !== 4 && setNumElementsPerRow(4);
    } else {
      numElementsPerRow !== 5 && setNumElementsPerRow(5);
    }
  };
  window.addEventListener('resize', handleResize);
  return (
    <React.Fragment>
      <div className="game-grid-swipable-container">
        {selectedGames.map((game, index) => {
          return (
            <div
              id={`item-${index % numElementsPerRow}-${Math.floor(
                index / numElementsPerRow
              )}`}
              className="game-grid-card-padding"
            >
              <GameCard
                image={game.image}
                name={game.name}
                gameConsole={game.gameConsole}
                gamePath={game.gamePath}
                gameRunning={game.gameRunning}
                index={index}
                setRunning={setRunning}
                setStatus={setStatus}
                playNavigate={playNavigate}
                playSelect={playSelect}
                playError={playError}
              />
            </div>
          );
        })}
      </div>
    </React.Fragment>
  );
};

export default GameGrid;
