import { useState, useEffect } from 'react';
import InputComponent from './inputComponent';
import consoles from '../consoles';
import './Modal.css';

const Modal = ({ setShowModal, children }) => {
  return (
    <>
      <div
        className="modal-outer-container-backdrop"
        onClick={() => setShowModal && setShowModal(false)}
      ></div>
      <div className="modal-inner-cover-scrollbar">
        <div className="modal-inner-container">{children}</div>
      </div>
    </>
  );
};

export default Modal;
