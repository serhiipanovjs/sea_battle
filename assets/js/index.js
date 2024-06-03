(function () {
  // Constants for the game dimensions and ship types
  const WIDTH = 13;
  const HEIGHT = 13;
  const basicShips = [
    { name: "aircraftCarrier", length: 5, count: 1 },
    { name: "battleship", length: 4, count: 2 },
    { name: "cruiser", length: 3, count: 3 },
    { name: "destroyer", length: 2, count: 4 },
    { name: "submarine", length: 1, count: 5 }
  ];

// Constants for roles
  const COMPUTER_FIELD_ID = 'computerField';
  const PLAYER_FIELD_ID = 'playerField';
  const COMPUTER = 'computer';
  const PLAYER = 'player';
})()