import { useState } from 'react';
import Modal from './Modal';
import InputComponent from './inputComponent';

const GiantBombModal = ({ setShowGiantBomb }) => {
  const [key, setKey] = useState('');

  const onSubmit = async () => {
    await window.api.setSettings({ key });
    setShowGiantBomb(false);
  };
  return (
    <Modal>
      <h1 className="modal-title">Giant Bomb API</h1>
      <div className="modal-general-group">
        <p className="modal-description">
          For the best experience, EmuHub will automatically fetch box/cover
          arts for all your games. To do this, EmuHub needs a Giant Bomb API
          key. You can get an API key{' '}
          <a
            className="modal-link"
            href="https://www.giantbomb.com/api/"
            target="_blank"
          >
            here
          </a>{' '}
          for free by creating a Giant Bomb account. You can also add or change
          your API key later.
        </p>
        <div className="modal-input">
          <label className="modal-label">Giant Bomb API Key</label>
          <InputComponent
            placeholder="Enter API Key here..."
            value={key}
            handlerInput={setKey}
          />
        </div>
      </div>
      <div className="modal-button-group">
        <label
          className="modal-button-outline"
          onClick={() => setShowGiantBomb(false)}
          style={{ flex: 1, marginRight: 10 }}
        >
          Skip
        </label>
        <label className="modal-button" onClick={onSubmit} style={{ flex: 3 }}>
          Apply
        </label>
      </div>
    </Modal>
  );
};

export default GiantBombModal;
