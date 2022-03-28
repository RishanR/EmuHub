import { useState, useEffect, useReducer, useRef } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import useSound from 'use-sound';
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
import DownArrow from '../../assets/images/down-arrow.png';
import UpArrow from '../../assets/images/up-arrow.png';
import XboxLB from '../../assets/images/xbox_lb.png';
import XboxRB from '../../assets/images/xbox_rb.png';
import XboxA from '../../assets/images/xbox_a.png';
import XboxB from '../../assets/images/xbox_b.png';
import XboxY from '../../assets/images/xbox_y.png';
import XboxStart from '../../assets/images/xbox_start.png';
import XboxDpad from '../../assets/images/xbox_dpad.png';
import XboxLeftJoystick from '../../assets/images/xbox_left_joystick.png';
import backgroundMusic from '../../assets/sounds/background.wav';
import selectFX from '../../assets/sounds/select-fx.wav';
import navigateFX from '../../assets/sounds/navigate-fx.wav';
import errorFX from '../../assets/sounds/error-fx.wav';
import changeConsoleFX from '../../assets/sounds/change-console-fx.wav';
import closeMenuFX from '../../assets/sounds/close-menu-fx.wav';
import openMenuFX from '../../assets/sounds/open-menu-fx.wav';
import applyMenuFX from '../../assets/sounds/apply-menu-fx.wav';
import './App.css';

const Dashboard = () => {
  const [status, setStatus] = useState({ loading: true, message: '' });
  const [selectedConsole, setSelectedConsole] = useState(consoles[0].name);
  const [games, dispatch] = useReducer(gamesReducer, {});
  const [search, setSearch] = useState('');
  const [showEmuPrompt, setShowEmuPrompt] = useState(false);
  const [showGamePrompt, setShowGamePrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAPIModal, setShowAPIModal] = useState(false);
  const [emuPathString, setEmuPathString] = useState('');
  const [gamePathString, setGamePathString] = useState('');
  const [focusedGameID, setFocusedGameIDState] = useState('item-0-0');
  const [showCursor, setShowCursorState] = useState(true);
  const [gamepadsConnected, setGamepadsConnected] = useState({});
  const [enableGamepad, setEnableGamepad] = useState(true);

  const [musicVolume, setMusicVolume] = useState(-1);
  const [fxVolume, setFXVolume] = useState(-1);

  const [play, { pause, sound }] = useSound(backgroundMusic, {
    loop: true,
    volume: 0,
    autoplay: true,
  });
  const [playNavigate, { stop: stopNavigate, sound: soundNavigate }] = useSound(
    navigateFX,
    {
      interrupt: true,
    }
  );
  const [playSelect, { stop: stopSelect, sound: soundSelect }] = useSound(
    selectFX,
    {
      interrupt: true,
    }
  );
  const [playError, { stop: stopError, sound: soundError }] = useSound(
    errorFX,
    {
      interrupt: true,
    }
  );

  const [playChange, { stop: stopChange, sound: soundChange }] = useSound(
    changeConsoleFX,
    {
      interrupt: true,
    }
  );
  const [playOpen, { stop: stopOpen, sound: soundOpen }] = useSound(
    openMenuFX,
    {
      interrupt: true,
    }
  );
  const [playClose, { stop: stopClose, sound: soundClose }] = useSound(
    closeMenuFX,
    {
      interrupt: true,
    }
  );
  const [playApply, { stop: stopApply, sound: soundApply }] = useSound(
    applyMenuFX,
    {
      interrupt: true,
    }
  );

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
        sound.fade(sound.volume(), musicVolume / 100, 500);
        setEnableGamepad(true);
      }
    } else {
      sound.fade(sound.volume(), 0, 2000);
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

  const isShowingGames = () => {
    return (
      !showEmuPrompt &&
      !showGamePrompt &&
      !showSettings &&
      games &&
      games[selectedConsole] &&
      games[selectedConsole].length > 0
    );
  };

  const focusTheFocusedGameID = (gameID = focusedGameID) => {
    if (isShowingGames() && document.getElementById(gameID) && !showCursor) {
      document
        .getElementById(gameID)
        ?.getElementsByClassName('game-card-container')[0]
        ?.focus();
      let not_running_element_new = document
        .getElementById(gameID)
        ?.getElementsByClassName('game-card-not-running')[0];
      if (not_running_element_new) {
        not_running_element_new.classList.add(
          'game-card-not-running-highlighted'
        );
      }
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
    // if (!playing) {
    //   toggle();
    // }
    // Listen for the event
    window.api.ipcRenderer.on('game-ended', (arg) => {
      setTimeout(() => {
        if (arg.output.error) {
          const mappedError = errorMap(arg.output.error);
          if (mappedError) {
            // We have mapped the error. Do what you want to do with Issue and Solution here
            let errorMessage = mappedError.issue;
            if (mappedError.solution) {
              errorMessage += ` ${mappedError.solution}`;
            }
            setStatus((prevState) => {
              return { ...prevState, message: errorMessage };
            });
          } else {
            // The error was not mapped. Do what you want with the whole error object.
            setStatus((prevState) => {
              return { ...prevState, message: arg.output.message };
            });
          }
        }
        setRunningRef.current(arg.name, arg.gameConsole, false);
      }, 500);
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
    if (sound) {
      sound.fade(sound.volume(), musicVolume / 100, 500);
    }
  }, [musicVolume]);

  useEffect(() => {
    console.log('test2');
    console.log(fxVolume);
    console.log();
    if (soundNavigate) {
      console.log('changing navigate');
      soundNavigate.volume(fxVolume / 100);
    }
    if (soundApply) soundApply.volume(fxVolume / 100);
    if (soundChange) soundChange.volume(fxVolume / 100);
    if (soundClose) soundClose.volume(fxVolume / 100);
    if (soundError) soundError.volume(fxVolume / 100);
    if (soundOpen) soundOpen.volume(fxVolume / 100);
    if (soundSelect) soundSelect.volume(fxVolume / 100);
  }, [fxVolume]);

  useEffect(async () => {
    if (
      !showSettings &&
      sound &&
      soundNavigate &&
      soundApply &&
      soundChange &&
      soundClose &&
      soundError &&
      soundOpen &&
      soundSelect
    ) {
      console.log('test');
      let settings = await window.api.getSettings();
      setMusicVolume(settings.musicVolume);
      setFXVolume(settings.fxVolume);
    }
  }, [
    showSettings,
    sound,
    soundNavigate,
    soundApply,
    soundChange,
    soundClose,
    soundError,
    soundOpen,
    soundSelect,
  ]);

  useEffect(() => {
    if (!(selectedConsole in games) || !(games[selectedConsole].length > 0)) {
      getFrontGames();
    } else {
      removeControllerFocus();
      focusTheFocusedGameID('item-0-0');
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
    playChange();
  }, [selectedConsole]);

  useEffect(() => {
    setRunningRef.current = setRunning;
  }, [setRunning]);

  useEffect(() => {
    if (!showCursor) {
      focusTheFocusedGameID();
    }
  }, [games, showCursor]);

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
          {!showCursor && (
            <>
              <div className="controls-bumper-left-container">
                <img className="controls-bumper-arrow" src={UpArrow} />
                <img className="controls-bumper-icon" src={XboxLB} />
              </div>
              <div className="controls-bumper-right-container">
                <img className="controls-bumper-arrow" src={DownArrow} />
                <img className="controls-bumper-icon" src={XboxRB} />
              </div>
            </>
          )}
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
                  setStatus={setStatus}
                  playNavigate={playNavigate}
                  playSelect={playSelect}
                  playError={playError}
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
              <>
                {!showCursor && (
                  <img className="controls-bar-icon" src={XboxY} />
                )}
                <button
                  tabIndex="-1"
                  className="info-bar-button"
                  onClick={getFrontGames}
                >
                  <img className="info-bar-button-icon" src={Refresh} />
                </button>
              </>
            )}
            {!showCursor && (
              <img className="controls-bar-icon" src={XboxStart} />
            )}
            <button
              tabIndex="-1"
              className="info-bar-button"
              onClick={() => {
                playOpen();
                setShowSettings(true);
              }}
            >
              <img className="info-bar-button-icon" src={Settings} />
            </button>
            {!showCursor && <img className="controls-bar-icon" src={XboxB} />}
            <button
              tabIndex="-1"
              className="info-bar-button"
              onClick={() => window.api.closeProgram()}
            >
              <img className="info-bar-button-icon" src={PowerOff} />
            </button>
            <div
              style={{ width: showCursor ? '30%' : '40%' }}
              className="info-bar-search-controls-container"
            >
              <InputComponent
                id="search-games"
                className="info-bar-search"
                value={search}
                placeholder={`Search ${selectedConsole} games...`}
                handlerInput={(val) => setSearch(val)}
                showButton={false}
              />
              {!showCursor && (
                <>
                  <img className="controls-bar-icon" src={XboxA} />
                  <div style={{ marginLeft: 5 }}>Select Game</div>
                  <img className="controls-bar-icon" src={XboxLeftJoystick} />
                  <span className="controls-slash">/</span>
                  <img
                    style={{ marginLeft: 0 }}
                    className="controls-bar-icon"
                    src={XboxDpad}
                  />
                  <div style={{ marginLeft: 5 }}>Navigate Games</div>
                </>
              )}
            </div>
          </div>
        </div>
        {showSettings && (
          <SettingsModal
            setShowSettings={setShowSettings}
            getFrontGames={getFrontGames}
            musicVolume={musicVolume}
            fxVolume={fxVolume}
            setMusicVolume={setMusicVolume}
            setFXVolume={setFXVolume}
            playApply={playApply}
            playClose={playClose}
          />
        )}
        {showAPIModal && <GiantBombModal setShowGiantBomb={setShowAPIModal} />}
        <EmuHubGamepad
          showSettings={showSettings}
          setShowSettings={setShowSettings}
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
          isShowingGames={isShowingGames}
          focusTheFocusedGameID={focusTheFocusedGameID}
          playNavigate={playNavigate}
          playOpen={playOpen}
          playClose={playClose}
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
