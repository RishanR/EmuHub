import { useState, useEffect } from 'react';
import InputComponent from './inputComponent';
import consoles from '../consoles';
import './SettingsModal.css';

const SettingsModal = ({ setShowSettings }) => {
  const [settings, setSettings] = useState({});

  useEffect(async () => {
    let allSettings = await window.api.getSettings();
    console.log(allSettings);
    setSettings({ ...allSettings });
  }, []);

  const handleInputChange = (console, key, path) => {
    setSettings((prevState) => ({
      ...prevState,
      [console]: { ...prevState[console], [key]: path },
    }));
  };

  const onSubmit = async () => {
    let result = await window.api.setSettings(settings);
    if (result) {
      setShowSettings(false);
    } else {
      console.log('Error modifying configuration.');
    }
  };

  const onBack = async () => {
    setShowSettings(false);
  };

  return (
    <>
      <div
        className="settings-modal-outer-container-backdrop"
        onClick={onBack}
      ></div>
      <div className="settings-modal-inner-cover-scrollbar">
        <div className="settings-modal-inner-container">
          <h1 className="settings-modal-title">Settings</h1>
          {consoles.map((console) => {
            return (
              <div className="settings-modal-console-group">
                <div className="settings-modal-input">
                  <label className="settings-modal-label">{console.emu}</label>
                  <InputComponent
                    placeholder="Enter emulator path here..."
                    value={settings[console.name]?.emuPath ?? ''}
                    handlerInput={(val) =>
                      handleInputChange(console.name, 'emuPath', val)
                    }
                  />
                </div>
                <div className="settings-modal-input">
                  <label className="settings-modal-label">{`${console.name} Games`}</label>
                  <InputComponent
                    placeholder="Enter directory path here..."
                    value={settings[console.name]?.gameDirectory ?? ''}
                    handlerInput={(val) =>
                      handleInputChange(console.name, 'gameDirectory', val)
                    }
                  />
                </div>
              </div>
            );
          })}
          <div className="settings-modal-button-group">
            <label
              className="settings-modal-button"
              onClick={onBack}
              style={{ flex: 1, marginRight: 10 }}
            >
              Back
            </label>
            <label
              className="settings-modal-button"
              onClick={onSubmit}
              style={{ flex: 3 }}
            >
              Apply
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsModal;
