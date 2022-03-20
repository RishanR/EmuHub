import React from 'react';
import './inputComponent.css';

const InputComponent = (props) => {
  return (
    <div
      className={`input-container${
        props.className ? ` ${props.className}` : ''
      }`}
    >
      <input
        className="input-link"
        type="text"
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => {
          props.handlerInput(e.target.value);
        }}
      />
    </div>
  );
};

export default InputComponent;
