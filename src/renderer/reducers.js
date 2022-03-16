const gamesReducer = (state, action) => {
  let newState = JSON.parse(JSON.stringify(state));
  switch (action.type) {
    // dispatch({type: 'SET_GAME_CONSOLE_GAMES', key: gameConsole, value: games})
    case 'SET_GAME_CONSOLE_GAMES':
      return {
        ...newState,
        [action.payload.key]: action.payload.value.map((game) => {
          if (action.payload.key in newState) {
            let existingGame = newState[action.payload.key].find(
              (o) => o.name == game.name
            );

            if (existingGame) {
              return { ...game, gameRunning: existingGame.gameRunning };
            }
          }
          return { ...game, gameRunning: false };
        }),
      };
    // dispatch({type: 'SET_GAME_PROPERTY', keyConsole: gameConsole, keyGame: gameName, key: 'gameRunning', value: true})
    case 'SET_GAME_PROPERTY':
      return {
        ...newState,
        [action.payload.keyConsole]: newState[action.payload.keyConsole].map(
          (game) => {
            if (action.payload.keyGame == game.name) {
              return { ...game, [action.payload.key]: action.payload.value };
            } else {
              return { ...game };
            }
          }
        ),
      };
      return {};
    default:
      return newState;
  }
};

export default gamesReducer;
