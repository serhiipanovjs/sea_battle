(function () {
  // Constants for the game dimensions and ship types
  const WIDTH = 13;
  const HEIGHT = 13;
  const basicShips = [
    { name: "aircraft-carrier", length: 5, count: 1 },
    { name: "battleship", length: 4, count: 2 },
    { name: "cruiser", length: 3, count: 3 },
    { name: "destroyer", length: 2, count: 4 },
    { name: "submarine", length: 1, count: 5 },
  ];

  // Constants for roles
  const COMPUTER_FIELD_ID = "computerField";
  const PLAYER_FIELD_ID = "playerField";
  const COMPUTER = "computer";
  const PLAYER = "player";
  const MILLISECONDS_BETWEEN_SHOTS = 500;

  // Constants for directions
  const HORIZONTAL = "horizontal";
  const VERTICAL = "vertical";
  const SINGLE = "single";

  //application variables
  let computerShips = [];
  let computerShots = [];
  let playerShips = [];
  let playerShots = [];
  let isGameFinish = false;
  let isGameStart = false;
  let activeTurnRole = PLAYER;
  let maxVertical = HEIGHT;
  let maxHorizontal = WIDTH;

  // Function to create the game field in the DOM
  const createField = (width, height, role, fieldId) => {
    // Get the container element by its ID
    const container = document.getElementById(fieldId);

    // Iterate through each row
    for (let row = 0; row < height; row++) {
      // Create a new div element for the row
      const fieldRow = document.createElement("div");
      fieldRow.classList.add("field-row");

      // Iterate through each column in the current row
      for (let column = 0; column < width; column++) {
        // Create a new div element for the cell
        const block = document.createElement("div");
        block.classList.add("block");

        // Set a unique ID for the cell based on the role and its coordinates
        block.id = role + String(column) + "," + String(row);

        // If the role is 'COMPUTER', add a click event listener to the cell
        if (role === COMPUTER) {
          block.addEventListener("click", () => onComputerCellClick({ x: column, y: row }));
        }

        // Append the cell to the current row
        fieldRow.append(block);
      }

      // Append the current row to the container
      container.append(fieldRow);
    }
  };

  // Event handler for computer's cell click
  function onComputerCellClick(position) {
    if (activeTurnRole !== PLAYER || !isGameStart || isGameFinish) return;
    makeShotAtField(position, playerShots, computerShips, COMPUTER);
  }

  const makeShotAtField = (position, doneShots, shipsPositions, opponentRole) => {
    // Check if the game is already finished or not started
    if (isGameFinish || !isGameStart) return;

    // Check if the position has already been shot
    const isPositionAlreadyShot = doneShots.some(
      ({ x, y }) => position.x === x && position.y === y,
    );
    if (isPositionAlreadyShot && activeTurnRole === COMPUTER) computerShot();
    if (isPositionAlreadyShot) return;

    // Add the current position to the done shots
    doneShots.push(position);

    // Find if the shot hits any ship
    const shotShipIndex = shipsPositions.findIndex((ship) =>
      ship.positions.some(({ x, y }) => position.x === x && position.y === y),
    );
    const block = document.getElementById(`${opponentRole}${position.x},${position.y}`);

    // If no ship is hit
    if (shotShipIndex < 0) {
      block.classList.add("miss"); // Mark the block as missed
      activeTurnRole = opponentRole; // Change the active turn role on miss
      if (opponentRole === COMPUTER) {
        // Set player field to active
        setActiveField(PLAYER);
        // If it's the computer's turn, let it take a shot
        computerShot();
        return;
      }

      // Set computer field to active
      setActiveField(COMPUTER);
      return;
    }

    // If a ship is hit
    const shotShip = shipsPositions[shotShipIndex];
    shotShip.shotPositions.push(position);

    // Check if the entire ship is killed
    const isShipKilled = shotShip.shotPositions.length === shotShip.positions.length;

    // If the ship is hit but not killed
    if (!isShipKilled) {
      block.classList.add("shot"); // Mark the block as shot
      if (opponentRole === PLAYER) {
        // If it's the player's turn, let the computer take a shot
        computerShot();
      }
      return;
    }

    // If the ship is killed
    for (let i = 0; shotShip.positions.length > i; i++) {
      const position = shotShip.positions[i];
      const block = document.getElementById(`${opponentRole}${position.x},${position.y}`);
      block.classList.remove("shot"); // Remove the shot class
      block.classList.add("sunk"); // Add the sunk class
    }

    // Find positions around the sunk ship to mark as miss
    const positionsToMarkMiss = findPositionsAroundShip(shotShip.positions);
    const validPositionsToMarkMiss = positionsToMarkMiss.filter(
      (position) => !doneShots.some((shot) => position.x === shot.x && position.y === shot.y),
    );

    // Add these positions to the done shots
    doneShots.push(...validPositionsToMarkMiss);
    shotShip.alive = false; // Mark the ship as sunk

    // Mark the surrounding positions as missed
    for (let i = 0; validPositionsToMarkMiss.length > i; i++) {
      const position = validPositionsToMarkMiss[i];
      const block = document.getElementById(`${opponentRole}${position.x},${position.y}`);
      setTimeout(() => block.classList.add("miss-around"), i * 50); // Delay the marking for a better visual effect
    }

    // Check if there are any ships still alive
    const isEvenOneShipStillAlive = shipsPositions.some(({ alive }) => alive);

    // If no ships are alive, finish the game
    if (!isEvenOneShipStillAlive) {
      finishGame(activeTurnRole);
      return;
    }

    // If it's the player's turn, let the computer take a shot
    if (opponentRole === PLAYER) {
      computerShot();
    }
  };

  // Function to find positions around a ship based on its current positions
  const findPositionsAroundShip = (shipPositions) => {
    // Determine the direction of the ship
    const direction = findDirectionByPositions(shipPositions);

    // Switch based on the direction of the ship
    switch (direction) {
      case SINGLE: {
        // If the ship is a single cell, return positions around that cell
        return findPositionsAroundPosition(shipPositions[0]);
      }
      case HORIZONTAL: {
        // If the ship is horizontal
        const positionsAroundShip = shipPositions.reduce(
          (acc, { x, y }, index, { length: shipLength }) => {
            // Add positions to the left and right of the ship
            acc = [...acc, { x, y: y + 1 }, { x, y: y - 1 }];
            // Add positions at the ends of the ship
            if (index === 0) {
              return [...acc, { x: x - 1, y: y + 1 }, { x: x - 1, y }, { x: x - 1, y: y - 1 }];
            }
            if (index === shipLength - 1) {
              return [...acc, { x: x + 1, y: y + 1 }, { x: x + 1, y }, { x: x + 1, y: y - 1 }];
            }
            return acc;
          },
          [],
        );

        // Filter out impossible positions (e.g., positions outside the grid)
        return filterImpossiblePositions(positionsAroundShip);
      }
      case VERTICAL: {
        // If the ship is vertical
        const positionsAroundShip = shipPositions.reduce(
          (acc, { x, y }, index, { length: shipLength }) => {
            // Add positions above and below the ship
            acc = [...acc, { x: x + 1, y }, { x: x - 1, y }];
            // Add positions at the ends of the ship
            if (index === 0) {
              return [...acc, { x: x - 1, y: y - 1 }, { x, y: y - 1 }, { x: x + 1, y: y - 1 }];
            }
            if (index === shipLength - 1) {
              return [...acc, { x: x - 1, y: y + 1 }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }];
            }
            return acc;
          },
          [],
        );

        // Filter out impossible positions (e.g., positions outside the grid)
        return filterImpossiblePositions(positionsAroundShip);
      }
      default:
        return [];
    }
  };

  const findDirectionByPositions = (shipPositions) => {
    // Check if there is only one position
    // If yes, return "SINGLE" indicating a single position ship
    if (shipPositions.length === 1) {
      return SINGLE;
    } else {
      // Check if all shipPositions have the same y coordinate
      const isHorizontal = shipPositions.every(
        ({ y }, _, [firstPosition]) => firstPosition.y === y,
      );
      if (isHorizontal) {
        // If yes, return "HORIZONTAL" indicating a horizontally positioned ship
        return HORIZONTAL;
      } else {
        // Check if all shipPositions have the same x coordinate
        const isVertical = shipPositions.every(
          ({ x }, _, [firstPosition]) => firstPosition.x === x,
        );
        if (isVertical) {
          // If yes, return "VERTICAL" indicating a vertically positioned ship
          return VERTICAL;
        } else {
          // If neither condition is met, return an empty string
          return "";
        }
      }
    }
  };

  // Generates a random number between 0 and n.
  function getRandom(n) {
    return Math.floor(Math.random() * (n + 1));
  }

  // Function to draw ships on the board based on their positions and roles
  const drawShips = (generatedShips, role) => {
    for (let shipNumber = 0; shipNumber < generatedShips.length; shipNumber++) {
      const generatedShip = generatedShips[shipNumber];
      for (
        let positionNumber = 0;
        positionNumber < generatedShip.positions.length;
        positionNumber++
      ) {
        const position = generatedShip.positions[positionNumber];
        const block = document.getElementById(`${role}${position.x},${position.y}`);
        block.classList.add(generatedShip.name);
      }
    }
  };

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
  };

  // Recursive function to generate positions for a single ship
  const shipPositionsGenerator = (
    shipsPositions,
    shipLength,
    iteration = 0,
    position,
    verticalPositions = [position],
    horizontalPositions = [position],
  ) => {
    // Initial position generation
    if (iteration === 0) {
      const x = getRandom(WIDTH - 1);
      const y = getRandom(HEIGHT - 1);
      const isAvailable = checkIsPositionAvailableForShip(shipsPositions, { x, y });
      if (!isAvailable) return shipPositionsGenerator(shipsPositions, shipLength);
      return shipPositionsGenerator(shipsPositions, shipLength, 1, { x, y });
    }

    // Recalculate if positions are not enough
    if (
      iteration > shipLength &&
      verticalPositions.length < shipLength &&
      horizontalPositions.length < shipLength
    ) {
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
    const leftPosition = checkIsPositionValid(
      { x: position.x - iteration, y: position.y },
      shipsPositions,
    );
    const rightPosition = checkIsPositionValid(
      { x: position.x + iteration, y: position.y },
      shipsPositions,
    );
    const topPosition = checkIsPositionValid(
      { x: position.x, y: position.y - iteration },
      shipsPositions,
    );
    const bottomPosition = checkIsPositionValid(
      { x: position.x, y: position.y + iteration },
      shipsPositions,
    );

    // Update positions and iteration
    const updatedIteration = iteration + 1;
    let updatedHorizontalPositions = [...leftPosition, ...horizontalPositions, ...rightPosition];
    let updatedVerticalPositions = [...topPosition, ...verticalPositions, ...bottomPosition];

    // Trim positions if they exceed ship length
    if (updatedHorizontalPositions.length > shipLength) {
      const lastElement = getRandom(updatedHorizontalPositions.length - shipLength);
      updatedHorizontalPositions = updatedHorizontalPositions.slice(
        lastElement,
        lastElement + shipLength,
      );
    }

    if (updatedVerticalPositions.length > shipLength) {
      const lastElement = getRandom(updatedVerticalPositions.length - shipLength);
      updatedVerticalPositions = updatedVerticalPositions.slice(
        lastElement,
        lastElement + shipLength,
      );
    }

    // Recursively generate positions
    return shipPositionsGenerator(
      shipsPositions,
      shipLength,
      updatedIteration,
      position,
      updatedVerticalPositions,
      updatedHorizontalPositions,
    );
  };

  // Function to check if a position is available for placing a ship
  const checkIsPositionAvailableForShip = (shipsPositions, position) => {
    return ![{ x: position.x, y: position.y }, ...findPositionsAroundPosition(position)].some(
      (position) =>
        shipsPositions.some((ship) =>
          ship.positions.some(({ x, y }) => x === position.x && y === position.y),
        ),
    );
  };

  // Function to check if a position is valid within the board and available
  const checkIsPositionValid = (position, shipsPositions) => {
    if (position.x < WIDTH && position.x >= 0 && position.y < HEIGHT && position.y >= 0) {
      return checkIsPositionAvailableForShip(shipsPositions, position) ? [position] : [];
    }
    return [];
  };

  // Function to filter out positions that are outside the board
  const filterImpossiblePositions = (positions) => {
    return positions.filter(
      (position) =>
        !(position.y < 0 || position.x < 0 || position.y >= HEIGHT || position.x >= WIDTH),
    );
  };

  // Function to find all positions around a given position
  const findPositionsAroundPosition = (position) => {
    const positionsAround = [
      { x: position.x - 1, y: position.y - 1 },
      { x: position.x - 1, y: position.y },
      { x: position.x - 1, y: position.y + 1 },
      { x: position.x, y: position.y - 1 },
      { x: position.x, y: position.y + 1 },
      { x: position.x + 1, y: position.y - 1 },
      { x: position.x + 1, y: position.y },
      { x: position.x + 1, y: position.y + 1 },
    ];
    return filterImpossiblePositions(positionsAround);
  };

  // Create player and computer fields
  createField(WIDTH, HEIGHT, PLAYER, PLAYER_FIELD_ID);
  createField(WIDTH, HEIGHT, COMPUTER, COMPUTER_FIELD_ID);

  // Generate and draw ships for player and computer
  drawShips(generateShipsPositions(basicShips, playerShips), PLAYER);
  generateShipsPositions(basicShips, computerShips);

  // Function to find the optimal position for a ship placement
  const findOptimalPosition = (doneShots, size, oppositeDirectionSize, maxLength, direction) => {
    // Create an array from 0 to oppositeDirectionSize - 1 and shuffle it
    const string = Array.from(Array(oppositeDirectionSize), (_, index) => index);
    shuffleArray(string);

    // Initialize an empty object to store the resulting position
    const resultPosition = {};

    // Loop through the shuffled array to find a valid position
    for (let i = 0; i < string.length; i++) {
      const stringIndex = string[i];
      let doneShotsInThisString = [];

      // Filter done shots based on the direction and map to the respective coordinate
      if (direction === VERTICAL) {
        doneShotsInThisString = doneShots.filter(({ x }) => x === stringIndex).map(({ y }) => y);
      }

      if (direction === HORIZONTAL) {
        doneShotsInThisString = doneShots.filter(({ y }) => y === stringIndex).map(({ x }) => x);
      }

      // Find all possible ship positions given the size and max length
      const allPossibleVariants = findAllPossibleShotPositions(size, maxLength);

      // Filter out the positions that overlap with already taken shots
      const validVariants = allPossibleVariants.filter(
        (variants) => !variants.some((variant) => doneShotsInThisString.includes(variant)),
      );

      // If there are valid positions available
      if (validVariants.length) {
        // Select a random valid position from the filtered variants
        const randomValidResult = validVariants[getRandom(validVariants.length - 1)];

        // Assign the coordinates to resultPosition based on the direction
        if (direction === VERTICAL) {
          resultPosition.x = stringIndex;
          resultPosition.y = randomValidResult[getRandom(randomValidResult.length - 1)];
        }
        if (direction === HORIZONTAL) {
          resultPosition.y = stringIndex;
          resultPosition.x = randomValidResult[getRandom(randomValidResult.length - 1)];
        }
        // Exit the loop once a valid position is found
        break;
      }
    }

    // Return the resulting position
    return resultPosition;
  };

  // Function to shuffle the elements of an array in place
  function shuffleArray(array) {
    let currentIndex = array.length; // Initialize currentIndex to the length of the array

    // Loop while there are elements left to shuffle
    while (currentIndex !== 0) {
      // Pick a random index from the remaining elements
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--; // Decrease the current index

      // Swap the element at currentIndex with the element at randomIndex
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
  }

  // Function to find all possible positions for a ship of given length on a grid
  const findAllPossibleShotPositions = (maxLength, currentLength, from = 0, result = []) => {
    // Create an array of consecutive integers starting from 'from' with length 'currentLength'
    const column = Array.from(Array(currentLength), (_, index) => index + from);
    const lastElement = column[column.length - 1]; // Get the last element of the array

    // Base case: if the last element reaches maxLength, return the result with the current column added
    if (maxLength === lastElement + 1) return [...result, column];

    // Recursive case: move the starting point by 1 and call the function recursively
    return findAllPossibleShotPositions(maxLength, currentLength, from + 1, [...result, column]);
  };

  // Function to find valid shot
  const findValidShot = (doneShots) => {
    // Check if maxVertical is greater than maxHorizontal
    if (maxVertical > maxHorizontal) {
      // Attempt to find an optimal vertical position for the shot
      const verticalPosition = findOptimalPosition(doneShots, HEIGHT, WIDTH, maxVertical, VERTICAL);
      // If a valid position is found, return it
      if (Object.keys(verticalPosition).length) return verticalPosition;
      // Decrement maxVertical if no valid position was found
      maxVertical--;
    }

    // Check if maxHorizontal is greater than maxVertical
    if (maxHorizontal > maxVertical) {
      // Attempt to find an optimal horizontal position for the shot
      const horizontalPosition = findOptimalPosition(
        doneShots,
        WIDTH,
        HEIGHT,
        maxHorizontal,
        HORIZONTAL,
      );
      // If a valid position is found, return it
      if (Object.keys(horizontalPosition).length) return horizontalPosition;
      // Decrement maxHorizontal if no valid position was found
      maxHorizontal--;
    }

    // Check if maxHorizontal is equal to maxVertical
    if (maxHorizontal === maxVertical) {
      // Randomly choose a direction (VERTICAL or HORIZONTAL)
      const direction = getRandom(1) ? VERTICAL : HORIZONTAL;

      // If the chosen direction is VERTICAL
      if (direction === VERTICAL) {
        // Attempt to find an optimal vertical position for the shot
        const verticalPosition = findOptimalPosition(
          doneShots,
          HEIGHT,
          WIDTH,
          maxVertical,
          VERTICAL,
        );
        // If a valid position is found, return it
        if (Object.keys(verticalPosition).length) return verticalPosition;
        // Decrement maxVertical if no valid position was found
        maxVertical--;
        // Attempt to find an optimal horizontal position for the shot
        const horizontalPosition = findOptimalPosition(
          doneShots,
          WIDTH,
          HEIGHT,
          maxHorizontal,
          HORIZONTAL,
        );
        // If a valid position is found, return it
        if (Object.keys(horizontalPosition).length) return horizontalPosition;
        // Decrement maxHorizontal if no valid position was found
        maxHorizontal--;
      }

      // If the chosen direction is HORIZONTAL
      if (direction === HORIZONTAL) {
        // Attempt to find an optimal horizontal position for the shot
        const horizontalPosition = findOptimalPosition(
          doneShots,
          WIDTH,
          HEIGHT,
          maxHorizontal,
          HORIZONTAL,
        );
        // If a valid position is found, return it
        if (Object.keys(horizontalPosition).length) return horizontalPosition;
        // Decrement maxHorizontal if no valid position was found
        maxHorizontal--;
        // Attempt to find an optimal vertical position for the shot
        const verticalPosition = findOptimalPosition(
          doneShots,
          HEIGHT,
          WIDTH,
          maxVertical,
          VERTICAL,
        );
        // If a valid position is found, return it
        if (Object.keys(verticalPosition).length) return verticalPosition;
        // Decrement maxVertical if no valid position was found
        maxVertical--;
      }
    }

    // Recursive call if no valid shot was found in any of the above checks
    return findValidShot(doneShots);
  };

  // Function to find positions around a shot ship
  const findPositionsAroundShotShip = (shipPositions) => {
    // Determine the direction of the ship based on its positions
    const direction = findDirectionByPositions(shipPositions);

    // Switch statement to handle different ship directions
    switch (direction) {
      case SINGLE: {
        // If the ship is a single position ship
        const { x, y } = shipPositions[0];
        // Calculate positions around the ship
        const positionsAroundShip = [
          { x, y: y + 1 },
          { x, y: y - 1 },
          { x: x + 1, y },
          { x: x - 1, y },
        ];
        // Filter out any impossible positions
        return filterImpossiblePositions(positionsAroundShip);
      }
      case HORIZONTAL: {
        // If the ship is horizontal
        // Sort ship positions by x-coordinate
        shipPositions.sort((a, b) => a.x - b.x);
        const leftPosition = shipPositions[0];
        const rightPosition = shipPositions[shipPositions.length - 1];
        // Calculate positions around the ship
        const positionsAroundShip = [
          { x: leftPosition.x - 1, y: leftPosition.y },
          { x: rightPosition.x + 1, y: rightPosition.y },
        ];
        // Filter out any impossible positions
        return filterImpossiblePositions(positionsAroundShip);
      }
      case VERTICAL: {
        // If the ship is vertical
        // Sort ship positions by y-coordinate
        shipPositions.sort((a, b) => a.y - b.y);
        const topPosition = shipPositions[0];
        const bottomPosition = shipPositions[shipPositions.length - 1];
        // Calculate positions around the ship
        const positionsAroundShip = [
          { x: topPosition.x, y: topPosition.y - 1 },
          { x: bottomPosition.x, y: bottomPosition.y + 1 },
        ];
        // Filter out any impossible positions
        return filterImpossiblePositions(positionsAroundShip);
      }
      default:
        return [];
    }
  };

  // Function to handle computer's shot
  const computerShot = () => {
    // Find a ship that is still alive and has been shot at least once
    const shotShip = playerShips.find((ship) => ship.alive && ship.shotPositions.length);

    // Object to hold the position for the next shot
    const positionForShoot = {};

    if (shotShip) {
      // Find positions around the shot ship
      const positionsShotNext = findPositionsAroundShotShip(shotShip.shotPositions);

      // Filter out positions that have already been shot by the computer
      const validPositionsShotNext = positionsShotNext.filter(
        (position) => !computerShots.some((shot) => position.x === shot.x && position.y === shot.y),
      );

      // Randomly select a valid position to shoot
      const position = validPositionsShotNext[getRandom(validPositionsShotNext.length - 1)];
      positionForShoot.x = position.x;
      positionForShoot.y = position.y;
    } else {
      // If no ship has been shot yet, shoot at a valid position on the field
      const position = findValidShot(computerShots);
      positionForShoot.x = position.x;
      positionForShoot.y = position.y;
    }

    // Schedule the shot after a certain delay
    setTimeout(
      () => makeShotAtField(positionForShoot, computerShots, playerShips, PLAYER),
      MILLISECONDS_BETWEEN_SHOTS,
    );
  };

  // Get the button element that will trigger the ships positions generation
  const shipsPositionsGeneratorButton = document.getElementById("shipsPositionsGeneratorButton");
  // Get the button element that will trigger the game start
  const startGameButton = document.getElementById("startGameButton");
  // Get the button element that will trigger the game reset
  const resetGameFieldsButton = document.getElementById("resetGameFields");

  // Get the information blocks
  const informationComputerBlock = document.getElementById("informationComputerBlock");
  const informationPlayerBlock = document.getElementById("informationPlayerBlock");
  const gameResultText = document.getElementById("gameResultText");

  // Add an event listener to the button to handle click events
  shipsPositionsGeneratorButton.addEventListener("click", () => {
    // If the game has already started, do nothing
    if (isGameStart) return;

    // Reset the player's field (clear ships and regenerate positions)
    resetPlayerField();
  });

  // Add an event listener to the button to handle click events
  startGameButton.addEventListener("click", function () {
    // If the game has already started, do nothing
    if (isGameStart) return;

    // Set computer field to active
    setActiveField(COMPUTER);

    // Hide the "Start Game" button
    this.style.display = "none";
    // Hide the "Generate Ships Positions" button
    shipsPositionsGeneratorButton.style.display = "none";
    // Hide the computer's information block
    informationComputerBlock.style.display = "none";
    // Hide the player's information block
    informationPlayerBlock.style.display = "none";
    // Set the flag to indicate that the game has started
    isGameStart = true;
  });

  // Function to finish the game and display the winner
  const finishGame = (winner) => {
    // Hide field active state
    setActiveField("");

    // Check if the winner is the player
    if (winner === PLAYER) {
      // If the player won, display "You won!"
      gameResultText.innerText = "You won!";
    }

    // Check if the winner is the computer
    if (winner === COMPUTER) {
      // If the computer won, display "Luck next time!"
      gameResultText.innerText = "Luck next time!";
    }

    // Set the flag indicating that the game has finished to true
    isGameFinish = true;

    // Display the computer information block
    informationComputerBlock.style.display = "flex";

    // Display the player information block
    informationPlayerBlock.style.display = "flex";

    // Display the reset button to allow restarting the game
    resetGameFieldsButton.style.display = "block";
  };

  // Function to reset the player's field by clearing it and drawing new ships positions
  const resetPlayerField = () => {
    // Clear the player's ships array
    playerShips = [];

    // Clear the field on the player's side
    clearField(WIDTH, HEIGHT, PLAYER);

    // Generate new ships positions and draw them on the player's field
    drawShips(generateShipsPositions(basicShips, playerShips), PLAYER);
  };

  // Event listener for the reset game fields button
  resetGameFieldsButton.addEventListener("click", () => {
    // Check if the game has not started, if true, exit the function
    if (!isGameStart) return;

    // Hide the reset game fields button
    resetGameFieldsButton.style.display = "none";

    // Display the information blocks for the computer and player
    informationComputerBlock.style.display = "flex";
    informationPlayerBlock.style.display = "flex";

    // Display the start game button and ships positions generator button
    startGameButton.style.display = "block";
    shipsPositionsGeneratorButton.style.display = "block";

    // Clear the game result text
    gameResultText.innerText = "";

    // Call the function to reset the game field
    resetGameField();
  });

  // Function to reset the game field
  const resetGameField = () => {
    // Reset player and computer ship and shot arrays
    playerShips = [];
    playerShots = [];
    computerShips = [];
    computerShots = [];

    // Set the active turn role to player and game start and finish flags to false
    activeTurnRole = PLAYER;
    isGameStart = false;
    isGameFinish = false;

    maxVertical = HEIGHT;
    maxHorizontal = WIDTH;

    // Clear the player field and draw player ships
    clearField(WIDTH, HEIGHT, PLAYER);
    drawShips(generateShipsPositions(basicShips, playerShips), PLAYER);

    // Clear the computer field and generate computer ships positions (but not drawn)
    clearField(WIDTH, HEIGHT, COMPUTER);
    generateShipsPositions(basicShips, computerShips);
  };

  // Function to clear the field by resetting each block to its default state
  const clearField = (width, height, role) => {
    // Loop through each row
    for (let row = 0; row < width; row++) {
      // Loop through each column
      for (let column = 0; column < height; column++) {
        // Get the block element by its role, row, and column
        const block = document.getElementById(`${role}${row},${column}`);

        // Reset the block's class to "block" (default state)
        block.className = "block";
      }
    }
  };

  // Function to set the active field based on the role
  const setActiveField = (role) => {
    // Get the DOM elements for the computer and player fields by their IDs
    const computerField = document.getElementById(COMPUTER_FIELD_ID);
    const playerField = document.getElementById(PLAYER_FIELD_ID);

    // Switch statement to handle different roles
    switch (role) {
      case PLAYER: {
        // If the role is PLAYER, remove "active" class from computer field
        // and add "active" class to player field
        computerField.classList.remove("active");
        playerField.classList.add("active");
        break;
      }
      case COMPUTER: {
        // If the role is COMPUTER, remove "active" class from player field
        // and add "active" class to computer field
        playerField.classList.remove("active");
        computerField.classList.add("active");
        break;
      }
      default: {
        // If the role is neither PLAYER nor COMPUTER, remove "active" class from both fields
        computerField.classList.remove("active");
        playerField.classList.remove("active");
      }
    }
  };
})();