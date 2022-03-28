import { useState, useEffect } from 'react';
import Modal from './Modal';
import InputComponent from './inputComponent';
import consoles from '../consoles';
import BrowseFile from '../../../assets/images/browseFile.png';
import BrowseFolder from '../../../assets/images/browseFolder.png';
import Slider from '@mui/material/Slider';

const SettingsModal = ({
  setShowSettings,
  getFrontGames,
  playClose,
  playApply,
  musicVolume,
  fxVolume,
  setMusicVolume,
  setFXVolume,
}) => {
  const [settings, setSettings] = useState({});
  const [prevVolume, setPrevVolume] = useState({ musicVolume, fxVolume });

  useEffect(async () => {
    let allSettings = await window.api.getSettings();
    setSettings({ ...allSettings });
  }, []);

  const handleConsoleInputChange = (console, key, path) => {
    setSettings((prevState) => ({
      ...prevState,
      [console]: { ...prevState[console], [key]: path },
    }));
  };

  const handleAPIKeyInputChange = (value) => {
    setSettings((prevState) => ({
      ...prevState,
      key: value,
    }));
  };

  const handleVolumeChange = (type, volume) => {
    setSettings((prevState) => ({
      ...prevState,
      [`${type}Volume`]: volume,
    }));
    switch (type) {
      case 'music':
        setMusicVolume(volume);
        break;
      case 'fx':
        setFXVolume(volume);
        break;
    }
  };

  const handleChooseFile = async (console, key) => {
    let filePath = await window.api.ChooseFile();
    handleConsoleInputChange(console, key, filePath);
  };

  const handleChooseDirectory = async (console, key) => {
    let directoryPath = await window.api.ChooseDirectory();
    handleConsoleInputChange(console, key, directoryPath);
  };

  const onSubmit = async () => {
    let result = await window.api.setSettings(settings);
    if (result) {
      getFrontGames();
      playApply();
      setShowSettings(false);
    } else {
      console.log('Error modifying configuration.');
    }
  };

  const onBack = (data = false) => {
    playClose();
    setShowSettings(data);
  };

  return (
    <Modal setShowModal={onBack}>
      <h1 className="modal-title">Settings</h1>
      {consoles.map((console) => {
        return (
          <div className="modal-general-group">
            <div className="modal-subheading">{console.name}</div>
            <div className="modal-input">
              <label className="modal-label">{console.emu}</label>
              <InputComponent
                id={`${console.name}-emuPath`}
                placeholder="Enter emulator path here..."
                value={settings[console.name]?.emuPath ?? ''}
                showButton={true}
                buttonText={
                  <img
                    style={{ width: '100%', height: '100%' }}
                    src={BrowseFile}
                  />
                }
                handlerInput={(val) =>
                  handleConsoleInputChange(console.name, 'emuPath', val)
                }
                handlerButton={(val) =>
                  handleChooseFile(console.name, 'emuPath')
                }
              />
            </div>
            <div className="modal-input">
              <label className="modal-label">{'Games'}</label>
              <InputComponent
                id={`${console.name}-gameDirectory`}
                placeholder="Enter directory path here..."
                value={settings[console.name]?.gameDirectory ?? ''}
                showButton={true}
                buttonText={
                  <img
                    style={{ width: '100%', height: '100%' }}
                    src={BrowseFolder}
                  />
                }
                handlerInput={(val) =>
                  handleConsoleInputChange(console.name, 'gameDirectory', val)
                }
                handlerButton={(val) =>
                  handleChooseDirectory(console.name, 'gameDirectory')
                }
              />
            </div>
          </div>
        );
      })}
      <div className="modal-general-group">
        <div className="modal-subheading">Audio</div>
        <div className="modal-input">
          <label className="modal-label">Music Volume</label>
          <Slider
            value={musicVolume}
            onChange={(event, val) => handleVolumeChange('music', val)}
            aria-label="Music Volume"
            valueLabelDisplay="auto"
            sx={{ color: '#fff' }}
          />
        </div>
        <div className="modal-input">
          <label className="modal-label">Sound FX Volume</label>
          <Slider
            value={fxVolume}
            onChange={(event, val) => handleVolumeChange('fx', val)}
            aria-label="Sound FX Volume"
            valueLabelDisplay="auto"
            sx={{ color: '#fff' }}
          />
        </div>
      </div>
      <div className="modal-general-group">
        <div className="modal-subheading">Miscellaneous</div>
        <div className="modal-input">
          <label className="modal-label">Giant Bomb API Key</label>
          <InputComponent
            type="password"
            placeholder="Enter API Key here..."
            value={settings.key ?? ''}
            handlerInput={(val) => handleAPIKeyInputChange(val)}
          />
        </div>
      </div>
      <div className="modal-button-group">
        <label
          className="modal-button-outline"
          onClick={() => onBack()}
          style={{ flex: 1, marginRight: 10 }}
        >
          Back
        </label>
        <label className="modal-button" onClick={onSubmit} style={{ flex: 3 }}>
          Apply
        </label>
      </div>
    </Modal>
  );
};

export default SettingsModal;
