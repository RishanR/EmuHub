import React from 'react';
import './inputComponent.css';

const InputComponent = (props) => {
  let inputProps = {
    className: `input-link${props.showButton ? ' input-link-with-button' : ''}`,
    type: 'text',
  };
  if (props.id) inputProps.id = props.id;
  if (props.value) inputProps.value = props.value;
  if (props.placeholder) inputProps.placeholder = props.placeholder;
  if (props.handlerInput)
    inputProps.onChange = (e) => {
      props.handlerInput(e.target.value);
    };

  return (
    <div
      className={`input-container${
        props.className ? ` ${props.className}` : ''
      }`}
    >
      <input {...inputProps} />
      {props.showButton && (
        <label
          className="choose-file-button-light"
          onClick={() =>
            props.handlerButton(document.getElementById(props.id).value)
          }
        >
          {props.buttonText}
        </label>
      )}
    </div>
  );
};

export default InputComponent;
