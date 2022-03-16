const errorMap = (error) => {
  if (error.code == 'EACCES') {
    return {
      issue: `You do not have the permissions to run ${error.filename}.`,
      solution: `Disable 'Run as administrator' on ${error.filename}`,
    };
  } else if (error.code == 'ENOENT') {
    return {
      issue: `The path of your game is incorrect (${error.gamepath})`,
      solution: 'Try refetching your games list.',
    };
  }
  return null;
};

export default errorMap;
