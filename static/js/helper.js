// Upload Image To Drawing Panel And Displaying Panel
// This Function Only Use When The User Chooses To Upload Image/ Images
function loadFileToCanvas(currentFile, clear = false) {
  // Query Select Drawing Panel
  const canvas = document.querySelector("#drawing-area");
  const ctx = canvas.getContext("2d");
  // Query Select Displaying Panel
  const canvasDisplay = document.querySelector("#display-area");
  const ctxDisplay = canvasDisplay.getContext("2d");

  // Render Images
  var reader = new FileReader();
  reader.onload = function (event) {
    var image = new Image();
    image.onload = () => {
      // if (image.height > drawingPanelWidth) {
      // }

      // TODO: Keep Aspect Ratio Option
      // Right Now Can Only Fit In
      image.width *= drawingPanelWidth / image.width;
      console.log(drawingPanelWidth);
      image.height *= drawingPanelWidth / image.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      console.log(canvas.width);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (!clear) {
        ctxDisplay.clearRect(0, 0, canvasDisplay.width, canvasDisplay.height);
        ctxDisplay.drawImage(
          image,
          0,
          0,
          canvasDisplay.width,
          canvasDisplay.height
        );
      }
    };
    image.src = event.target.result;
  };
  // display
  reader.readAsDataURL(currentFile);
}

function uploadImageToCanvas(e) {
  MULTIFILES = []; // Clear The Previous Images
  files = e.target.files;
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    MULTIFILES.push(files[fileIndex]);
  }

  loadFileToCanvas(MULTIFILES[0]);
}

function drawing(e) {
  if (!IS_DRAWING || !PEN_TRIGGER) return; // Stop Drawing, Stop Function

  Drawing_panel_CTX.beginPath();

  // Start From
  Drawing_panel_CTX.moveTo(LastX, LastY);

  // Go To
  Drawing_panel_CTX.lineTo(e.offsetX, e.offsetY);
  Drawing_panel_CTX.stroke();

  // Update LastX, LastY Position
  [LastX, LastY] = [e.offsetX, e.offsetY];
}

// Update The Pen
function handleUpdate(e) {
  if (e.target.value.length < 3) {
    LINE_WIDTH = e.target.value;
    Drawing_panel_CTX.lineWidth = LINE_WIDTH;
  } else {
    FILL_COLOUR = e.target.value;
    Drawing_panel_CTX.strokeStyle = FILL_COLOUR;
  }
}

// Clean Drawing Panel-1 And Redraw
function cleanAllandReDraw() {
  loadFileToCanvas(MULTIFILES[CURRENTFILEINDEX], true);
}
