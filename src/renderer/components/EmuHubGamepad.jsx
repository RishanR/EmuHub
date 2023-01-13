import { useState, useEffect, useRef } from 'react';
import consoles from '../consoles';
import Gamepad from 'react-gamepad';
import useInterval from '../useInterval';

const EmuHubGamepad = (props) => {
  // Gamepads and Navigation

  const [axisDirection, setAxisDirectionState] = useState('none');
  const axisDirectionRef = useRef(axisDirection);
  const setAxisDirection = (data) => {
    axisDirectionRef.current = data;
    setAxisDirectionState(data);
  };

  useEffect(() => {
    props.focusTheFocusedGameID();
  }, [props.focusedGameID]);

  const navigateGameGrid = (direction) => {
    let itemArr = props.focusedGameID.split('-');
    let x = parseInt(itemArr[1]);
    let y = parseInt(itemArr[2]);
    switch (direction) {
      case 'up':
        y = y - 1;
        break;
      case 'down':
        y = y + 1;
        break;
      case 'left':
        x = x - 1;
        break;
      case 'right':
        x = x + 1;
        break;
      default:
        break;
    }
    itemArr[1] = x.toString();
    itemArr[2] = y.toString();
    let newID = itemArr.join('-');
    if (document.getElementById(newID)) {
      let not_running_element_old = document
        ?.getElementById(props.focusedGameID)
        ?.getElementsByClassName('game-card-not-running')[0];
      if (not_running_element_old) {
        not_running_element_old.classList.remove(
          'game-card-not-running-highlighted'
        );
      }

      props.playNavigate();
      props.setFocusedGameID(newID);
    }
  };
  const navigateGameGridRef = useRef(navigateGameGrid);
  useInterval(() => {
    if (axisDirection !== 'none') {
      if (props.enableGamepad && props.isShowingGames()) {
        navigateGameGrid(axisDirection);
      }
    }
  }, 100);
  const handleConnect = (gamepadIndex) => {
    props.setGamepadsConnected((prevState) => {
      return { ...prevState, [gamepadIndex]: true };
    });
  };

  const handleDisconnect = (gamepadIndex) => {
    props.setGamepadsConnected((prevState) => {
      let newObj = { ...prevState };
      delete newObj[gamepadIndex];
      if (Object.keys(newObj).length === 0);
      return newObj;
    });
    setAxisDirection('none');
  };

  const handleButtonUp = (buttonName) => {
    if (props.enableGamepad) {
      if (props.showCursor) {
        props.setShowCursor(false);
        return;
      }
      switch (buttonName) {
        case 'A':
          // Perform a mouse click
          document.activeElement.click();
          break;
        case 'B':
          // Invoke closeProgram
          if (props.showSettings) {
            props.playClose();
            props.setShowSettings(false);
          } else {
            window.api.closeProgram();
          }
          break;
        case 'X':
          // TBD
          break;
        case 'Y':
          // Refresh games list
          props.getFrontGames();
          break;
        case 'Start':
          // Open settings
          if (props.showSettings) {
            props.playClose();
          } else {
            props.playOpen();
          }
          props.setShowSettings(!props.showSettings);
          break;
        case 'LB':
          // Go up in console list
          const console_index_lb = consoles.findIndex(
            (console) => console.name === props.selectedConsole
          );
          if (console_index_lb !== -1) {
            let new_index = console_index_lb - 1;
            if (new_index < 0) {
              new_index = consoles.length - 1;
            }
            props.setSelectedConsole(consoles[new_index].name);
          }
          break;
        case 'RB':
          // Go down in console list
          const console_index_rb = consoles.findIndex(
            (console) => console.name === props.selectedConsole
          );
          if (console_index_rb !== -1) {
            let new_index = console_index_rb + 1;
            if (new_index >= consoles.length) {
              new_index = 0;
            }
            props.setSelectedConsole(consoles[new_index].name);
          }
          break;
        case 'DPadUp':
          // Navigate game grid up (make this a function)
          if (props.isShowingGames()) {
            navigateGameGrid('up');
          }
          break;
        case 'DPadDown':
          // Navigate game grid down
          if (props.isShowingGames()) {
            navigateGameGrid('down');
          }
          break;
        case 'DPadLeft':
          // Navigate game grid left
          if (props.isShowingGames()) {
            navigateGameGrid('left');
          }
          break;
        case 'DPadRight':
          // Navigate game grid right
          if (props.isShowingGames()) {
            navigateGameGrid('right');
          }
          break;
        default:
          break;
      }
    }
  };

  const handleAxisChange = (axisName, value, previousValue) => {
    if (props.enableGamepad) {
      if (props.showCursor) {
        props.setShowCursor(false);
        return;
      }
      switch (axisName) {
        case 'LeftStickX':
          // Navigate game grid right and left (left negative, right positive?)
          if (value < 0) {
            axisDirection !== 'left' && setAxisDirection('left');
          } else if (value > 0) {
            axisDirection !== 'right' && setAxisDirection('right');
          } else {
            axisDirection !== 'none' && setAxisDirection('none');
          }
          break;
        case 'LeftStickY':
          // Navigate game grid up and down (down negative, up positive?)
          if (value < 0) {
            axisDirection !== 'down' && setAxisDirection('down');
          } else if (value > 0) {
            axisDirection !== 'up' && setAxisDirection('up');
          } else {
            axisDirection !== 'none' && setAxisDirection('none');
          }
          break;
        default:
          break;
      }
    }
  };

  return (
    <Gamepad
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
      onButtonUp={handleButtonUp}
      onAxisChange={handleAxisChange}
      deadZone={0.25}
    >
      <div></div>
    </Gamepad>
  );
};

export default EmuHubGamepad;
