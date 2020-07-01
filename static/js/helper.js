// Upload Image To Drawing Panel And Displaying Panel
// This Function Only Use When The User Chooses To Upload Image/ Images
function loadFileToCanvas(currentFile, clear = false, empty = false) {
  // Query Select Drawing Panel
  const canvas = document.querySelector("#drawing-area");
  const ctx = canvas.getContext("2d");
  // Query Select Displaying Panel
  const canvasDisplay = document.querySelector("#display-area");
  const ctxDisplay = canvasDisplay.getContext("2d");

  if (empty) {
    // Empty Global Var
    LeaderBoardResult = [];
    clearBothLeaderBoard();
    const layer2 = document.querySelector("#layer2");
    const layer2CTX = layer2.getContext("2d");
    layer2CTX.clearRect(0, 0, layer2.width, layer2.height);
  }

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

function handleOpacityChange(e) {
  let opacityValue = e.target.value / 100;
  layerPanel.style.opacity = opacityValue;
}

// Clean Drawing Panel-1 And Redraw
function cleanAllandReDraw() {
  loadFileToCanvas(MULTIFILES[CURRENTFILEINDEX], true);
}

//TODO: Update the upload_image data in 3D array
function updateImage() {
  let canvasPic = Drawing_Panel;
  let c = canvasPic.getContext("2d");
  let canvasWidth = Math.trunc(canvasPic.width);
  let canvasHeight = Math.trunc(canvasPic.height);
  upload_image = [];
  // console.log(upload_image[551][498] + "TEST!!!!!");

  let imagesData = c.getImageData(0, 0, canvasWidth, canvasHeight).data;
  for (let x = canvasWidth - 1; x >= 0; x--) {
    upload_image[x] = new Array(); // insert new vertical array
    for (let y = canvasHeight - 1; y >= 0; y--) {
      upload_image[x][y] = [0, 0, 0, 0];
    }
  }

  // console.log("WIDTH" + upload_image.length + "(((((" + upload_image[0].length);

  for (let i = 0; i < imagesData.length - 3; i += 4) {
    let x = parseInt(parseInt(i / 4) % canvasWidth);
    let y = parseInt(parseInt(i / 4) / canvasWidth);

    upload_image[x][y][0] = imagesData[i];
    upload_image[x][y][1] = imagesData[i + 1];
    upload_image[x][y][2] = imagesData[i + 2];
    upload_image[x][y][3] = imagesData[i + 3];
  }

  // console.log("WIDTH" + canvasWidth + "***** HEIGHT" + canvasHeight);
}

//TODO: Get the heatmap
function disCAM(resLabel, tracking_index) {
  let fd = new FormData(); //Like a form data
  let xhr = new XMLHttpRequest();
  fd.append("label", resLabel);
  xhr.open("POST", "/heatMap/", true);

  updateImage(); //Got the data from the canvas

  fd.append("width", upload_image.length);
  fd.append("height", upload_image[0].length);
  fd.append("imgData", JSON.stringify(upload_image));
  fd.append("type", "15");

  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      let obj = JSON.parse(xhr.responseText); // 将获取的源代码转化为JSON格式
      if (tracking_index == CURRENTFILEINDEX) {
        drawImage("layer2", obj[0]);
      } else {
        console.log("No Drawing, Because Tracking Index is different now");
      }
      // drawImage("heatMap", obj[1]);
    }
  };
  xhr.send(fd);
}

//TODO: The function to draw a pic by array || param: id (DOM element)
function drawImage(elementID, tempObj) {
  console.log("hello hello hello -----> current index is: " + CURRENTFILEINDEX);
  let c = document.getElementById(elementID);
  // tempObj = JSON.parse(tempObj);
  // let tempResult = document.getElementById(elementID);
  // tempResult.innerHTML = "";

  // cv.imshow(tempObj, "imgElement");
  // let c = document.createElement("canvas");
  // c.setAttribute("style", "margin: auto ");

  // //The size of CANVAS
  // let widthTemp = tempObj.length;
  // let heightTemp = tempObj[0].length;
  //
  // //The size of DIV
  // let tempRect = tempResult.getBoundingClientRect();
  // let widthDiv = tempRect.width;
  // let heightDiv = tempRect.height;
  //
  // var widthTemp_ratio = widthTemp / widthDiv;
  // var heightTemp_ratio = heightTemp / heightDiv;
  //
  // c.width = widthTemp;
  // c.height = heightTemp;

  // if (widthTemp_ratio >= heightTemp_ratio && widthTemp > widthDiv) {
  //     widthTemp = widthDiv;
  //     // console.log("变过？？width" + widthTemp + widthDiv);
  // } else if (heightTemp_ratio > widthTemp_ratio && heightTemp > heightDiv) {
  //     heightTemp = heightDiv;
  //     // console.log("变过？？");
  // }

  // c.setAttribute("width", widthTemp.toString());
  // c.setAttribute("height", heightTemp.toString());
  //
  // tempResult.appendChild(c);

  // console.log(widthTemp + " >>>>>>>>> " + heightTemp + " <<<<<<<<<< ");

  let ctx = c.getContext("2d");
  c.width = tempObj.length;
  c.height = tempObj[0].length;

  let r, g, b;

  console.log(tempObj.length + ">>>>>>" + tempObj[0].length);

  // console.log(tempObj.length + ">>>>>>" + tempObj[0].length + ">>>>>" + tempObj[0][0]);

  for (let i = 0; i < tempObj.length; i++) {
    for (let j = 0; j < tempObj[0].length; j++) {
      r = tempObj[i][j][0];
      g = tempObj[i][j][1];
      b = tempObj[i][j][2];
      ctx.fillStyle = "rgba(" + r + "," + g + "," + b + ", 1)";
      ctx.fillRect(j, i, 1, 1);
      // console.log(`R>>${r}>>G>>${g}>>>B>>${b}>>`);
    }
  }

  // if (widthTemp < (widthDiv - 10) && heightTemp < (heightDiv - 10)) {
  //     tempResult.innerHTML = "";
  //     let imageData = ctx.getImageData(0, 0, widthTemp, heightTemp);
  //     c.setAttribute("height", heightDiv.toString());
  //     c.setAttribute("width", widthDiv.toString());
  //
  //     ctx.putImageData(imageData, (widthDiv - widthTemp) / 2, (heightDiv - heightTemp) / 2);
  //
  //     tempResult.appendChild(c);
  // }
}

function updateLeaderBoard(result) {
  console.log(result);

  if (LeaderBoardResult.length !== 0) {
    updateTheLeaderBoard("leader-board-previous");
    calculateRankChange(result[0]);
    updateTheLeaderBoard("leader-board-current");
  } else {
    // LeaderBoardResult = []; // Clear The Current Leader Board
    fillLeaderBoardArray(result[0]);
    updateTheLeaderBoard("leader-board-current");
  }

  // Check Previous Leader Board, If It Is Empty, It Means The First Time
  // If It Is Not Empty, Then Put The Current To Previous And Update Current

  // console.log(LeaderBoardResult);
}

function updateTheLeaderBoard(table_id) {
  const leaderBoardCurrent = document
    .querySelector(`#${table_id}`)
    .getElementsByTagName("tbody")[0];
  leaderBoardCurrent.innerHTML = "";

  for (let index = 0; index < 5; index++) {
    let newRow = leaderBoardCurrent.insertRow(index);
    newRow.innerHTML = `<td>${LeaderBoardResult[index].label}</td> 
    <td>${LeaderBoardResult[index].rate}</td>
    <td>${
      table_id == "leader-board-previous" ? "#" : LeaderBoardResult[index].rank
      //  == "+"
      // ? "<i class=fa-caret-up>" + "</i>" + LeaderBoardResult[index].rank
      // : LeaderBoardResult[index].rank[0] == "-"
      // ? "<i class=fa-caret-up>" + "</i>" + LeaderBoardResult[index].rank
      // : LeaderBoardResult[index].rank
    }</td> 
    `;
  }
}

function fillLeaderBoardArray(resultObj) {
  for (let i = 0; i < 5; i++) {
    let label = resultObj["label"][i];
    let rate = `${resultObj["rate"][i] * 100}`;
    rate = parseFloat(rate).toFixed(2) + "%";
    let rank = `${i + 1}`;
    let leaderObj = new LeaderBoardObj(label, rate, rank);
    LeaderBoardResult.push(leaderObj);
  }
}

function calculateRankChange(newResult) {
  LeaderBoardResult = [];
  for (let i = 0; i < 5; i++) {
    let label = newResult["label"][i];
    let rate = `${newResult["rate"][i] * 100}`;
    rate = parseFloat(rate).toFixed(2) + "%";
    let leaderObj = new LeaderBoardObj(label, rate, i + 1);
    LeaderBoardResult.push(leaderObj);
  }
}

function clearBothLeaderBoard() {
  const leaderBoardCurrent = document
    .querySelector("#leader-board-current")
    .getElementsByTagName("tbody")[0];
  leaderBoardCurrent.innerHTML = "";
  const leaderBoardPrevious = document
    .querySelector("#leader-board-previous")
    .getElementsByTagName("tbody")[0];
  leaderBoardPrevious.innerHTML = "";
}
