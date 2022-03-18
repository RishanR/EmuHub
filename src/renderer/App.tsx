import { useState, useEffect, useReducer } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import errorMap from './error';
import consoles from './consoles';
import GameCard from './components/GameCard';
import GameGrid from './components/GameGrid';
import { Oval } from 'react-loader-spinner';
import Refresh from '../../assets/images/refresh.png';
import gamesReducer from './reducers';
import './App.css';

const Dashboard = () => {
  const [status, setStatus] = useState({ loading: true, message: '' });
  const [selectedConsole, setSelectedConsole] = useState('Wii');
  const [games, dispatch] = useReducer(gamesReducer, { test: '' });
  const [showEmuPrompt, setShowEmuPrompt] = useState(false);
  const [showGamePrompt, setShowGamePrompt] = useState(false);

  const setRunning = (name, gameConsole, value) => {
    dispatch({
      type: 'SET_GAME_PROPERTY',
      payload: {
        keyConsole: gameConsole,
        keyGame: name,
        key: 'gameRunning',
        value,
      },
    });
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
    let gamesResult = await window.api.getGames(selectedConsole);
    if (gamesResult.emuPath && gamesResult.gameDirectory) {
      dispatch({
        type: 'SET_GAME_CONSOLE_GAMES',
        payload: {
          key: selectedConsole,
          value: [...gamesResult.results],
        },
      });
      let gamesLength = gamesResult.results.length;
      setStatus({
        loading: false,
        message: `${gamesLength} ${selectedConsole} game${
          gamesLength === 1 ? '' : 's'
        } loaded.`,
      });
    } else {
      if (!gamesResult.emuPath) {
        setShowEmuPrompt(true);
      }
      if (!gamesResult.gameDirectory) {
        setShowGamePrompt(true);
      }
      setStatus({
        loading: false,
        message: 'Set your emulator path and/or game directory',
      });
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
            console.log(`Solution:  ${mappedError.solution}`);
          }
        } else {
          // The error was not mapped. Do what you want with the whole error object.
          console.log(arg.output.error);
        }
      }
      console.log(arg.output.message);
      setRunning(arg.name, arg.gameConsole, false);
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
      let gamesLength = games[selectedConsole].length;
      setStatus({
        loading: false,
        message: `${gamesLength} ${selectedConsole} game${
          gamesLength === 1 ? '' : 's'
        } loaded.`,
      });
    }
  }, [selectedConsole]);

  useEffect(() => {
    console.log('Games Changed: ', games[selectedConsole]);
  }, [games]);

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
            <button className="info-bar-refresh" onClick={getFrontGames}>
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
