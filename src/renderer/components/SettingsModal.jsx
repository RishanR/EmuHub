import { useState, useEffect } from 'react';

const Settings = () => {
  useEffect(() => {
    const getSettings = async () => {
      return 'Test';
    };
  }, []);
  return <div>Settings</div>;
};

export default Settings;
