import React, { useState, useEffect } from 'react';
import SwipeableViews from 'react-swipeable-views';
import GameCard from './GameCard';
import './GameGrid.css';
import Pagination from './PaginationFiles/Pagination';

const GameGrid = ({ selectedGames, setRunning }) => {
  return (
    <React.Fragment>
      <div className="game-grid-swipable-container">
        {selectedGames.map((game, index) => {
          return (
            <div className="game-grid-card-padding">
              <GameCard
                image={game.image}
                name={game.name}
                gameConsole={game.gameConsole}
                gamePath={game.gamePath}
                gameRunning={game.gameRunning}
                index={index}
                setRunning={setRunning}
              />
            </div>
          );
        })}
      </div>
    </React.Fragment>
  );
};

export default GameGrid;
