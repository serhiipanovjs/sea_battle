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

  // Create player and computer fields
  createField(WIDTH, HEIGHT, PLAYER, PLAYER_FIELD_ID);
  createField(WIDTH, HEIGHT, COMPUTER, COMPUTER_FIELD_ID);

})()