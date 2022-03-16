import { useState, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import errorMap from './error';
import consoles from './consoles';
import GameCard from './components/GameCard';
import GameGrid from './components/GameGrid';
import { Oval } from 'react-loader-spinner';
import Refresh from '../../assets/images/refresh.png';
import './App.css';

const Dashboard = () => {
  const [status, setStatus] = useState({ loading: true, message: '' });
  const [selectedConsole, setSelectedConsole] = useState('Wii');
  const [games, setGames] = useState({});
  const [showEmuPrompt, setShowEmuPrompt] = useState(false);
  const [showGamePrompt, setShowGamePrompt] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const setRunning = (index, gameConsole, value) => {
    let gamesList = games;
    gamesList[gameConsole][index].gameRunning = value;
    console.log(gamesList);
    setGames({ ...gamesList });
  };

  const getFrontGames = async () => {
    setStatus({
      loading: true,
      message: (
        <div className="loading-status-indicator">
          <Oval
            color="#ecf0f1"
            secondaryColor="#ecf0f1d7"
            height={12}
            width={12}
            strokeWidth={6}
          />
          <div className="loading-status-text-margin">{`Loading ${selectedConsole} games`}</div>
        </div>
      ),
    });
    let gamesList = games;
    console.log(gamesList);
    let gamesResult = await window.api.getGames(selectedConsole);
    if (gamesResult.emuPath && gamesResult.gameDirectory) {
      gamesList[selectedConsole] = gamesResult.results;

      // Modify this so that it checks if the games list on the console is available. And if it is, then
      // look for the game in the pre-existing list. If it already exists then set the pre-existing game
      // running to the current game object running
      gamesList[selectedConsole].forEach((game) => (game.gameRunning = false));
      setGames(gamesList);

      setStatus({
        loading: false,
        message: `${gamesList[selectedConsole].length} ${selectedConsole} games loaded.`,
      });
    } else {
      if (!gamesResult.emuPath) {
        setShowEmuPrompt(true);
      }
      if (!gamesResult.gameDirectory) {
        setShowGamePrompt(true);
      }
      setStatus('Set your emulator path and/or game directory');
    }
  };

  useEffect(() => {
    // Listen for the event
    window.api.ipcRenderer.on('game-ended', (arg) => {
      if (arg.output.error) {
        const mappedError = errorMap(arg.output.error);
        if (mappedError) {
          // We have mapped the error. Do what you want to do with Issue and Solution here
          console.log(`Issue: ${mappedError.issue}`);
          if (mappedError.solution) {
            console.log(`Solution: ${mappedError.solution}`);
          }
        } else {
          // The error was not mapped. Do what you want with the whole error object.
          console.log(arg.output.error);
        }
      }
      console.log(arg.output.message);
      setRunning(arg.index, arg.gameConsole, false);
    });
    // Clean the listener after the component is dismounted
    return () => {
      window.api.ipcRenderer.removeAllListeners();
    };
  }, []);

  useEffect(async () => {
    if (!(selectedConsole in games)) {
      await getFrontGames();
    } else {
      setStatus({
        loading: false,
        message: `${games[selectedConsole].length} ${selectedConsole} games loaded.`,
      });
    }
  }, [selectedConsole, refresh]);

  return (
    <div className="main-container">
      <div className="navigation-menu">
        {consoles.map((gameConsole) => (
          <div className="navigation-item-container">
            <img
              className={`navigation-item${
                gameConsole.name === selectedConsole
                  ? ' navigation-item-selected'
                  : ''
              }`}
              src={gameConsole.icon}
              alt={gameConsole.name}
              onClick={() => {
                setSelectedConsole(gameConsole.name);
              }}
            />
          </div>
        ))}
      </div>
      <div className="content">
        <div className="game-grid">
          {games && games[selectedConsole] && (
            <GameGrid
              selectedGames={games[selectedConsole]}
              setRunning={setRunning}
            />
          )}
        </div>
        <div className="info-bar">
          {status.message}
          {!status.loading && (
            <button
              className="info-bar-refresh"
              onClick={() => getFrontGames()}
            >
              <img className="info-bar-refresh-icon" src={Refresh} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
