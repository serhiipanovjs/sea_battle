(function () {
  // Constants for the game dimensions and ship types
  const WIDTH = 13;
  const HEIGHT = 13;
  const basicShips = [
    {name: "aircraftCarrier", length: 5, count: 1},
    {name: "battleship", length: 4, count: 2},
    {name: "cruiser", length: 3, count: 3},
    {name: "destroyer", length: 2, count: 4},
    {name: "submarine", length: 1, count: 5}
  ];

  // Constants for roles
  const COMPUTER_FIELD_ID = 'computerField';
  const PLAYER_FIELD_ID = 'playerField';
  const COMPUTER = 'computer';
  const PLAYER = 'player';

  // Constants for directions
  const HORIZONTAL = 'horizontal';
  const VERTICAL = 'vertical';
  const SINGLE = 'single';

  //application variables
  let computerShips = [];
  let playerShips = [];
  let isGameFinish = false;
  let isGameStart = false;

  // Function to create the game field in the DOM
  const createField = (width, height, role, fieldId) => {
    // Get the container element by its ID
    const container = document.getElementById(fieldId);

    // Iterate through each row
    for (let row = 0; row < height; row++) {
      // Create a new div element for the row
      const fieldRow = document.createElement("div");
      fieldRow.classList.add("fieldRow");

      // Iterate through each column in the current row
      for (let column = 0; column < width; column++) {

        // Create a new div element for the cell
        const block = document.createElement("div");
        block.classList.add("block");

        // Set a unique ID for the cell based on the role and its coordinates
        block.id = role + String(column) + "," + String(row);

        // If the role is 'COMPUTER', add a click event listener to the cell
        if (role === COMPUTER) {
          block.addEventListener("click", () => onComputerCellClick({x: column, y: row}));
        }

        // Append the cell to the current row
        fieldRow.append(block);
      }

      // Append the current row to the container
      container.append(fieldRow);
    }
  }

  // Event handler for computer's cell click
  function onComputerCellClick(position) {

  }

  // Generates a random number between 0 and n.
  function getRandom(n) {
    return Math.floor(Math.random() * (n + 1));
  }

  // Function to draw ships on the board based on their positions and roles
  const drawShips = (generatedShips, role) => {
    for (let shipNumber = 0; shipNumber < generatedShips.length; shipNumber++) {
      const generatedShip = generatedShips[shipNumber];
      for (let positionNumber = 0; positionNumber < generatedShip.positions.length; positionNumber++) {
        const position = generatedShip.positions[positionNumber];
        const block = document.getElementById(`${role}${position.x},${position.y}`);
        block.classList.add(generatedShip.name);
      }
    }
  }

  // Function to generate positions for all ships
  const generateShipsPositions = (basicShips, shipsPositions) => {
    for (let i = 0; i < basicShips.length; i++) {
      const basicShip = basicShips[i];
      for (let j = 0; j < basicShip.count; j++) {
        shipsPositions.push({
          positions: shipPositionsGenerator(shipsPositions, basicShip.length),
          name: basicShip.name,
          alive: true,
          shotPositions: [],
        });
      }
    }
    return shipsPositions;
  }

  // Recursive function to generate positions for a single ship
  const shipPositionsGenerator = (shipsPositions, shipLength, iteration = 0, position, verticalPositions = [position], horizontalPositions = [position]) => {
    // Initial position generation
    if (iteration === 0) {
      const x = getRandom(WIDTH - 1);
      const y = getRandom(HEIGHT - 1);
      const isAvailable = checkIsPositionAvailableForShip(shipsPositions, {x, y});
      if (!isAvailable) return shipPositionsGenerator(shipsPositions, shipLength);
      return shipPositionsGenerator(shipsPositions, shipLength, 1, {x, y});
    }

    // Recalculate if positions are not enough
    if (iteration > shipLength && verticalPositions.length < shipLength && horizontalPositions.length < shipLength) {
      return shipPositionsGenerator(shipsPositions, shipLength);
    }

    // If both positions are available, choose one direction randomly
    if (verticalPositions.length === shipLength && horizontalPositions.length === shipLength) {
      const direction = getRandom(1) ? VERTICAL : HORIZONTAL;
      return direction === VERTICAL ? verticalPositions : horizontalPositions;
    }

    // If only one direction is enough, return it
    if (verticalPositions.length === shipLength) return verticalPositions;
    if (horizontalPositions.length === shipLength) return horizontalPositions;

    // Check validity of adjacent positions
    const leftPosition = checkIsPositionValid({x: position.x - iteration, y: position.y}, shipsPositions);
    const rightPosition = checkIsPositionValid({x: position.x + iteration, y: position.y}, shipsPositions);
    const topPosition = checkIsPositionValid({x: position.x, y: position.y - iteration}, shipsPositions);
    const bottomPosition = checkIsPositionValid({x: position.x, y: position.y + iteration}, shipsPositions);

    // Update positions and iteration
    const updatedIteration = iteration + 1;
    let updatedHorizontalPositions = [...leftPosition, ...horizontalPositions, ...rightPosition];
    let updatedVerticalPositions = [...topPosition, ...verticalPositions, ...bottomPosition];

    // Trim positions if they exceed ship length
    if (updatedHorizontalPositions.length > shipLength) {
      const lastElement = getRandom(updatedHorizontalPositions.length - shipLength);
      updatedHorizontalPositions = updatedHorizontalPositions.slice(lastElement, lastElement + shipLength);
    }

    if (updatedVerticalPositions.length > shipLength) {
      const lastElement = getRandom(updatedVerticalPositions.length - shipLength);
      updatedVerticalPositions = updatedVerticalPositions.slice(lastElement, lastElement + shipLength);
    }

    // Recursively generate positions
    return shipPositionsGenerator(shipsPositions, shipLength, updatedIteration, position, updatedVerticalPositions, updatedHorizontalPositions);
  }

  // Function to check if a position is available for placing a ship
  const checkIsPositionAvailableForShip = (shipsPositions, position) => {
    return ![
      {x: position.x, y: position.y},
      ...findPositionsAroundPosition(position)
    ]
      .some(position => shipsPositions
        .some(ship => ship.positions.some(({x, y}) => x === position.x && y === position.y))
      );
  }

  // Function to check if a position is valid within the board and available
  const checkIsPositionValid = (position, shipsPositions) => {
    if (position.x < WIDTH && position.x >= 0 && position.y < HEIGHT && position.y >= 0) {
      return checkIsPositionAvailableForShip(shipsPositions, position) ? [position] : [];
    }
    return [];
  }

  // Function to filter out positions that are outside the board
  const filterImpossiblePositions = (positions) => {
    return positions.filter(position => !(position.y < 0 || position.x < 0 || position.y >= HEIGHT || position.x >= WIDTH));
  }

  // Function to find all positions around a given position
  const findPositionsAroundPosition = (position) => {
    const positionsAround = [
      {x: position.x - 1, y: position.y - 1},
      {x: position.x - 1, y: position.y},
      {x: position.x - 1, y: position.y + 1},
      {x: position.x, y: position.y - 1},
      {x: position.x, y: position.y + 1},
      {x: position.x + 1, y: position.y - 1},
      {x: position.x + 1, y: position.y},
      {x: position.x + 1, y: position.y + 1}
    ];
    return filterImpossiblePositions(positionsAround);
  }


  // Create player and computer fields
  createField(WIDTH, HEIGHT, PLAYER, PLAYER_FIELD_ID);
  createField(WIDTH, HEIGHT, COMPUTER, COMPUTER_FIELD_ID);

  // Generate and draw ships for player and computer
  drawShips(generateShipsPositions(basicShips, playerShips), PLAYER);
  generateShipsPositions(basicShips, computerShips);
})()