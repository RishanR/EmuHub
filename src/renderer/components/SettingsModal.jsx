import { useState, useEffect } from 'react';
import Modal from './Modal';
import InputComponent from './inputComponent';
import consoles from '../consoles';
import BrowseFile from '../../../assets/images/browseFile.png';
import BrowseFolder from '../../../assets/images/browseFolder.png';

const SettingsModal = ({ setShowSettings, getFrontGames }) => {
  const [settings, setSettings] = useState({});

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
      setShowSettings(false);
    } else {
      console.log('Error modifying configuration.');
    }
  };

  const onBack = async () => {
    setShowSettings(false);
  };

  return (
    <Modal setShowModal={setShowSettings}>
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
          onClick={onBack}
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
