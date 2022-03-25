import { useState, useEffect, useReducer, useRef } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import errorMap from './error';
import consoles from './consoles';
import GameGrid from './components/GameGrid';
import { Oval, Triangle } from 'react-loader-spinner';
import Refresh from '../../assets/images/refresh.png';
import Settings from '../../assets/images/settings.png';
import PowerOff from '../../assets/images/power-off-new.svg';
import gamesReducer from './reducers';
import InputComponent from './components/inputComponent';
import SettingsModal from './components/SettingsModal';
import GiantBombModal from './components/GiantBombModal';
import EmuHubGamepad from './components/EmuHubGamepad';
import './App.css';

const Dashboard = () => {
  const [status, setStatus] = useState({ loading: true, message: '' });
  const [selectedConsole, setSelectedConsole] = useState('Wii');
  const [games, dispatch] = useReducer(gamesReducer, {});
  const [search, setSearch] = useState('');
  const [showEmuPrompt, setShowEmuPrompt] = useState(false);
  const [showGamePrompt, setShowGamePrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAPIModal, setShowAPIModal] = useState(false);
  const [emuPathString, setEmuPathString] = useState('');
  const [gamePathString, setGamePathString] = useState('');
  const [focusedGameID, setFocusedGameIDState] = useState('item-0-0');
  const [showControls, setShowControls] = useState(false);
  const [showCursor, setShowCursorState] = useState(true);
  const [gamepadsConnected, setGamepadsConnected] = useState({});
  const [enableGamepad, setEnableGamepad] = useState(true);

  const focusedGameIDRef = useRef(focusedGameID);
  const showCursorRef = useRef(showCursor);
  const setFocusedGameID = (data) => {
    focusedGameIDRef.current = data;
    setFocusedGameIDState(data);
  };
  const setShowCursor = (data) => {
    showCursorRef.current = data;
    setShowCursorState(data);
  };

  const setRunning = (name, gameConsole, value) => {
    if (!value) {
      let running_count = -1;
      Object.keys(games).forEach((gameConsoleKey) => {
        running_count += games[gameConsoleKey].filter(
          (game) => game.gameRunning == true
        ).length;
      });
      if (running_count === 0) {
        setEnableGamepad(true);
      }
    } else {
      setEnableGamepad(false);
    }
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

  const setRunningRef = useRef(setRunning);

  const removeControllerFocus = () => {
    if (
      !showCursorRef.current &&
      document.getElementById(focusedGameIDRef.current)
    ) {
      document
        .getElementById(focusedGameIDRef.current)
        .getElementsByClassName('game-card-container')[0]
        .blur();
      document
        .getElementById(focusedGameIDRef.current)
        ?.getElementsByClassName('game-card-not-running')[0]
        ?.classList.remove('game-card-not-running-highlighted');
    }
  };

  const getFrontGames = async () => {
    removeControllerFocus();
    setFocusedGameID('item-0-0');
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
    window.api.getGames(selectedConsole, (gamesResult) => {
      dispatch({
        type: 'SET_GAME_CONSOLE_GAMES',
        payload: {
          key: selectedConsole,
          value: [...gamesResult.results],
        },
      });
      if (gamesResult.emuPath && gamesResult.gameDirectory) {
        let gamesLength = gamesResult.results.length;
        setStatus({
          loading: false,
          message: `${gamesLength} ${selectedConsole} game${
            gamesLength === 1 ? '' : 's'
          } loaded.`,
        });
      } else {
        setStatus({
          loading: false,
          message: 'Set your emulator path and/or game directory',
        });
      }
      if (!gamesResult.emuPath) {
        setShowEmuPrompt(true);
      } else {
        setShowEmuPrompt(false);
        setEmuPathString('');
      }
      if (!gamesResult.gameDirectory) {
        setShowGamePrompt(true);
      } else {
        setShowGamePrompt(false);
        setGamePathString('');
      }
    });
  };

  const handleGamePathChange = async (val) => {
    if (gamePathString) {
      await window.api.setGameDirectory(selectedConsole, val);
      setShowGamePrompt(false);
      setGamePathString('');
      if (!showEmuPrompt) {
        getFrontGames();
      }
    } else {
      let fileDirectory = await window.api.ChooseDirectory();
      setGamePathString(fileDirectory);
    }
  };

  const handleEmuPathChange = async (val) => {
    if (emuPathString) {
      await window.api.setEmulatorPath(selectedConsole, val);
      setShowEmuPrompt(false);
      setEmuPathString('');
      if (!showGamePrompt) {
        getFrontGames();
      }
    } else {
      let filePath = await window.api.ChooseFile();
      setEmuPathString(filePath);
    }
  };

  useEffect(async () => {
    let firstTime = await window.api.getFirstTime();
    if (firstTime) {
      setShowAPIModal(true);
      await window.api.setSettings({ firstTime: false });
    }
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
      setRunningRef.current(arg.name, arg.gameConsole, false);
    });

    window.addEventListener('mousemove', (e) => {
      if (!showCursorRef.current) {
        removeControllerFocus();
        setShowCursor(true);
      }
    });
    // Clean the listener after the component is dismounted
    return () => {
      window.api.ipcRenderer.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (!(selectedConsole in games) || !(games[selectedConsole].length > 0)) {
      getFrontGames();
    } else {
      removeControllerFocus();
      setFocusedGameID('item-0-0');
      setShowEmuPrompt(false);
      setEmuPathString('');
      setShowGamePrompt(false);
      setGamePathString('');
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
    setRunningRef.current = setRunning;
  }, [setRunning]);

  useEffect(() => {
    console.log('Games Changed: ', games[selectedConsole]);
  }, [games]);

  const filterGames = (property) => {
    let val = search
      .replace(/ |-/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\.,-\/#!$%\^&\*;:{}=\-_`'~()@\+\?><\[\]\+]/g, '')
      .toLowerCase();
    if (
      property.name
        .replace(/ |-/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\.,-\/#!$%\^&\*;:{}=\-_`'~()@\+\?><\[\]\+]/g, '')
        .toLowerCase()
        .includes(val)
    ) {
      return true;
    } else {
      return false;
    }
  };

  useEffect(() => {
    if (Object.keys(gamepadsConnected).length === 0) {
      removeControllerFocus();
      setShowCursor(true);
    }
  }, [gamepadsConnected]);

  return (
    <div className={!showCursor ? 'no-cursor' : ''}>
      <div
        className={`main-container${!showCursor ? ' no-pointer-events' : ''}`}
      >
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
            {status.loading && (
              <div className="game-grid-loading-container">
                <Triangle
                  wrapperClass="game-grid-loading"
                  color="#ecf0f1d7"
                  height={175}
                  width={175}
                />
                <div className="game-grid-loading-text">LOADING</div>
              </div>
            )}
            {status.message ==
              'Set your emulator path and/or game directory' && (
              <div className="game-grid-path-container">
                {showEmuPrompt && (
                  <InputComponent
                    id="input-emu-path"
                    className="game-grid-path-input margin-bottom"
                    placeholder={`Enter your ${
                      consoles.find(
                        (console) => console.name === selectedConsole
                      ).emu
                    } emulator path`}
                    showButton={true}
                    buttonText={emuPathString ? 'Apply' : 'Browse'}
                    value={emuPathString ?? ''}
                    handlerInput={(val) => {
                      console.log(val);
                      setEmuPathString(val);
                    }}
                    handlerButton={handleEmuPathChange}
                  />
                )}
                {showGamePrompt && (
                  <InputComponent
                    id="input-game-directory"
                    className="game-grid-path-input"
                    placeholder={`Enter your ${selectedConsole} games directory`}
                    showButton={true}
                    buttonText={gamePathString ? 'Apply' : 'Browse'}
                    value={gamePathString ?? ''}
                    buttonType={gamePathString ? 'button' : 'file'}
                    handlerInput={(val) => {
                      console.log(val);
                      setGamePathString(val);
                    }}
                    handlerButton={handleGamePathChange}
                  />
                )}
              </div>
            )}
            {!showEmuPrompt &&
              !showGamePrompt &&
              (games &&
              games[selectedConsole] &&
              games[selectedConsole].length > 0 ? (
                <GameGrid
                  selectedGames={games[selectedConsole].filter(filterGames)}
                  setRunning={setRunning}
                />
              ) : (
                !status.loading && (
                  <div className="games-grid-no-games">No games found.</div>
                )
              ))}
          </div>
          <div className="info-bar">
            {status.message}
            {!status.loading && (
              <button
                tabIndex="-1"
                className="info-bar-button"
                onClick={getFrontGames}
              >
                <img className="info-bar-button-icon" src={Refresh} />
              </button>
            )}
            <button
              tabIndex="-1"
              className="info-bar-button"
              onClick={() => setShowSettings(true)}
            >
              <img className="info-bar-button-icon" src={Settings} />
            </button>
            <button
              tabIndex="-1"
              className="info-bar-button"
              onClick={() => window.api.closeProgram()}
            >
              <img className="info-bar-button-icon" src={PowerOff} />
            </button>
            <InputComponent
              id="search-games"
              className="info-bar-search"
              value={search}
              placeholder={`Search ${selectedConsole} games...`}
              handlerInput={(val) => setSearch(val)}
              showButton={false}
            />
          </div>
        </div>
        {showSettings && (
          <SettingsModal
            setShowSettings={setShowSettings}
            getFrontGames={getFrontGames}
          />
        )}
        {showAPIModal && <GiantBombModal setShowGiantBomb={setShowAPIModal} />}
        <EmuHubGamepad
          showEmuPrompt={showEmuPrompt}
          showGamePrompt={showGamePrompt}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          games={games}
          showControls={showControls}
          setShowControls={setShowControls}
          focusedGameID={focusedGameID}
          setFocusedGameID={setFocusedGameID}
          selectedConsole={selectedConsole}
          setSelectedConsole={setSelectedConsole}
          showCursor={showCursor}
          setShowCursor={setShowCursor}
          getFrontGames={getFrontGames}
          setSearch={setSearch}
          setGamepadsConnected={setGamepadsConnected}
          enableGamepad={enableGamepad}
        />
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
