// Upload Image To Drawing Panel And Displaying Panel
// This Function Only Use When The User Chooses To Upload Image/ Images
function loadFileToCanvas(currentFile, clear = false, empty = false) {
  // Query Select Drawing Panel
  const canvas = document.querySelector("#drawing-area");
  const ctx = canvas.getContext("2d");
  // Query Select Displaying Panel
  const canvasDisplay = document.querySelector("#display-area");
  const ctxDisplay = canvasDisplay.getContext("2d");

  // Layer 2
  const layer2 = document.querySelector("#layer2");
  const layer2CTX = layer2.getContext("2d");
  layer2CTX.clearRect(0, 0, layer2.width, layer2.height);
  // Empty Global Var
  LeaderBoardResult = [];
  clearBothLeaderBoard();
  // Clean Up The Scribble For The New Image
  drawingPanel2.cleanUpPosition();

  // Second Tab
  const featureMapOriginal = document.querySelector("#feature-map-original");
  const featureMapOriginalCTX = featureMapOriginal.getContext("2d");

  // Clean Up Scribble When Comes A New Image
  drawingPanel2.drawing_panel_ctx.clearRect(
    0,
    0,
    drawingPanel2.drawing_panel.width,
    drawingPanel2.drawing_panel.height
  );

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
      console.log(image.width);
      console.log(image.height);
      originalImageWidth = image.width;
      originalImageHeight = image.height;
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
        featureMapOriginalCTX.clearRect(
          0,
          0,
          featureMapOriginal.width,
          featureMapOriginal.height
        );
        featureMapOriginalCTX.drawImage(
          image,
          0,
          0,
          featureMapOriginal.width,
          featureMapOriginal.height
        );
      }
    };
    image.src = event.target.result;
    // console.log(image.src);
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
    drawingPanel1.drawing_panel_ctx.lineWidth = e.target.value;
  } else {
    drawingPanel1.drawing_panel_ctx.strokeStyle = e.target.value;
  }
}

function handleOpacityChange(e) {
  let opacityValue = e.target.value / 100;
  const layer2 = document.querySelector("#layer2");
  layer2.style.opacity = opacityValue;
}

// Clean Drawing Panel-1 And Redraw
function cleanAllandReDraw() {
  loadFileToCanvas(MULTIFILES[CURRENTFILEINDEX], true);
}

//TODO: Update the upload_image data in 3D array
function updateImage() {
  let canvasPic = drawingPanel1.drawing_panel;
  let c = canvasPic.getContext("2d");
  let canvasWidth = Math.trunc(canvasPic.width);
  let canvasHeight = Math.trunc(canvasPic.height);
  upload_image = [];
  // console.log(upload_image[551][498] + "TEST!!!!!");

  let imagesData = c.getImageData(0, 0, canvasWidth, canvasHeight).data;
  CANVAS1DATA = c.getImageData(0, 0, canvasWidth, canvasHeight);
  for (let x = canvasWidth - 1; x >= 0; x--) {
    upload_image[x] = new Array(); // insert new vertical array
    for (let y = canvasHeight - 1; y >= 0; y--) {
      upload_image[x][y] = [0, 0, 0, 0];
    }
  }

  // console.log("WIDTH" + upload_image.length + "(((((" + upload_image[0].length);

  for (let i = 0; i < imagesData.length - 3; i += 4) {
    let x = parseInt(parseInt(i / 4) % canvasWidth);
    // let y = parseInt(parseInt(i / 4) / canvasWidth);
    let y = parseInt(parseInt(i / 4) / canvasHeight);

    upload_image[x][y][0] = imagesData[i];
    upload_image[x][y][1] = imagesData[i + 1];
    upload_image[x][y][2] = imagesData[i + 2];
    upload_image[x][y][3] = imagesData[i + 3];
  }

  // console.log("WIDTH" + canvasWidth + "***** HEIGHT" + canvasHeight);
}

// CAM display MiddleWare for each result
function disCAM_MiddleWare(label, current_index) {
  snackBarDisplay("Fetching result for " + label);
  // Change The Scribble Label To Current Chosen Label
  RESULT_LABEL = label;
  // Clean Up Scribble Canvas
  drawingPanel2.cleanUpScribbleFromCanvas();
  setTimeout(() => {
    disCAM(label, current_index);
  }, 1000);
}

//TODO: Get the heatmap
function disCAM(resLabel, tracking_index) {
  console.log(resLabel, tracking_index);
  let fd = new FormData(); //Like a form data
  let xhr = new XMLHttpRequest();
  fd.append("label", resLabel);
  xhr.open("POST", "/heatMap/", true);

  updateImage(); //Got the data from the canvas

  fd.append("width", upload_image.length);
  fd.append("height", upload_image[0].length);
  fd.append("imgData", JSON.stringify(upload_image));
  fd.append("type", CURRENT_CAM);

  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      let obj = JSON.parse(xhr.responseText); // 将获取的源代码转化为JSON格式
      if (tracking_index == CURRENTFILEINDEX) {
        // Update Canvas 2 First
        // Uncomment this method if needed
        // updateDisplayArea();

        // Update Layer 2
        drawImage("layer2", obj[0]);
        setTimeout(() => {
          snackBarDisplay("Fetched Result", 3000);
        }, 1000);
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
  let ctx = c.getContext("2d");
  c.width = tempObj.length;
  c.height = tempObj[0].length;

  let r, g, b;

  console.log(tempObj.length + ">>>>>>" + tempObj[0].length);

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
    newRow.innerHTML = `<td><a onclick="disCAM_MiddleWare('${
      LeaderBoardResult[index].label
    }', CURRENTFILEINDEX)">${LeaderBoardResult[index].label}</a></td> 
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

function updateDisplayArea() {
  let c = document.getElementById("display-area"); // DisplayPanel
  let ctx = c.getContext("2d");
  c.width = CANVAS1DATA.width;
  c.height = CANVAS1DATA.height;
  ctx.putImageData(CANVAS1DATA, 0, 0);
}

//This is to read the data and display the visualization
//TODO: Update Version for 2D

let network; //为network定义一个全局变量

//这个nodes 和 edges是为最上层的layers
let nodes = new vis.DataSet([]);
let edges = new vis.DataSet([]);

let nodeSet = []; //这个是用来存点集的
let edgeSet = []; //这个用来存线集的
let special = []; //存放特殊的elements

let options = {
  height: "90%",
  layout: {
    hierarchical: {
      enabled: true,
      levelSeparation: 400,
      nodeSpacing: 300,
    },
  },
  physics: {
    hierarchicalRepulsion: {
      nodeDistance: 400,
    },
  },
  nodes: {
    font: {
      size: 40,
    },
    margin: 10,
    widthConstraint: {
      minimum: 200,
    },
    heightConstraint: {
      minimum: 70,
    },
  },
};

let container = document.getElementById("displayContainer");

let numLayer = 0; //这个是用来存放用户点击了哪一层的element

function updateDisplay(obj) {
  console.log(obj);

  nodes = new vis.DataSet([]);
  edges = new vis.DataSet([]);

  nodeSet = [];
  edgeSet = [];
  special = [];

  container.innerHTML = "";
  try {
    network.destroy();
  } catch {
    console.log("No netWork now !!!");
  }

  let lengthJSON = getJsonLength(obj);
  let numOfId = 0;
  let layersID = 0;

  //这个标记是为了记住 这个元素是不是应该连接上一层的layers
  let connectFlag = true;

  let bottleFlag = false;
  let doubleLink = true;

  if (nodes.length === 0) {
    for (let i = 0; i < lengthJSON; i++) {
      if (obj[i].length > 10) {
        if (obj[i].search("Conv2d") === 1) {
          nodes.add({ id: numOfId, label: "Conv2d - " + numOfId });
        } else if (obj[i].search("MaxPool") === 1) {
          nodes.add({ id: numOfId, label: "MaxPool - " + numOfId });
        } else if (obj[i].search("Adaptive") === 1) {
          nodes.add({ id: numOfId, label: "AdaptiveAvgPool2d - " + numOfId });
        } else if (obj[i].search("Linear") === 1) {
          nodes.add({ id: numOfId, label: "Linear - " + numOfId });
        } else if (obj[i].search("ReLu") === 1) {
          nodes.add({ id: numOfId, label: "ReLu - " + numOfId });
        }
        if (i > 0) {
          if (layersID > 0) {
            edges.add({
              from: (numOfId - 1).toString(),
              to: numOfId,
              arrows: "to",
            });
          } else {
            edges.add({ from: layersID.toString(), to: numOfId, arrows: "to" });
            layersID = layersID * -1;
          }
        }
        numOfId = numOfId + 1;
      } else {
        if (layersID > 0) {
          layersID = layersID * -1;
        }

        layersID = layersID - 1;
        nodes.add({ id: layersID, label: "Layers - " + layersID * -1 });

        if (layersID === -1) {
          edges.add({
            from: (numOfId - 1).toString(),
            to: layersID,
            arrows: "to",
          });
        } else {
          edges.add({
            from: (layersID + 1).toString(),
            to: layersID,
            arrows: "to",
          });
        }

        let tempNode = {};
        tempNode["layersID"] = layersID;
        tempNode["id"] = layersID;
        tempNode["label"] = "Layers - " + (layersID * -1).toString();
        nodeSet.push(tempNode);

        //告诉后面的连接这个是必须和上一层的layer连接的
        connectFlag = true;

        for (let j = 0; j < obj[i].length; j++) {
          for (let k = 0; k < obj[i][j].length; k++) {
            if (obj[i][j][k].length < 10) {
              //这一个条件里面的是为了给Downsample用的
              if (obj[i][j][k][0].search("Conv2d") === 1) {
                let tempNodes = {};
                tempNodes["layersID"] = layersID;
                tempNodes["id"] = numOfId;
                tempNodes["label"] = "Conv2d -  neck " + numOfId;
                nodeSet.push(tempNodes);
                special.push(numOfId);
              } else if (obj[i][j][k][0].search("MaxPool") === 1) {
                let tempNodes = {};
                tempNodes["layersID"] = layersID;
                tempNodes["id"] = numOfId;
                tempNodes["label"] = "MaxPool -  neck " + numOfId;
                nodeSet.push(tempNodes);
              }
              if (i > 0) {
                let tempEdges = {};
                tempEdges["layersID"] = layersID;
                tempEdges["from"] = layersID.toString();
                tempEdges["to"] = numOfId;
                tempEdges["type"] = "";
                edgeSet.push(tempEdges);

                if (bottleFlag) {
                  numOfId = numOfId + 1;

                  let tempNodes = {};
                  tempNodes["layersID"] = layersID;
                  tempNodes["id"] = numOfId;
                  tempNodes["label"] = "ReLu - " + numOfId;
                  nodeSet.push(tempNodes);

                  //这里的两条线是为了完成一个Bottleneck with downsample

                  let tempEdges1 = {};
                  tempEdges1["layersID"] = layersID;
                  tempEdges1["from"] = (numOfId - 1).toString();
                  tempEdges1["to"] = numOfId;
                  tempEdges1["type"] = "";

                  edgeSet.push(tempEdges1);

                  let tempEdges = {};
                  tempEdges["layersID"] = layersID;
                  tempEdges["from"] = (numOfId - 2).toString();
                  tempEdges["to"] = numOfId;
                  tempEdges["type"] = "";
                  edgeSet.push(tempEdges);

                  bottleFlag = false;
                }
              }
              numOfId = numOfId + 1;
            } else {
              //这个条件里面是为了给没有DownSample的排列用的
              if (obj[i][j][k].search("Conv2d") === 1) {
                let tempNodes = {};
                tempNodes["layersID"] = layersID;
                tempNodes["id"] = numOfId;
                tempNodes["label"] = "Conv2d - " + numOfId;
                nodeSet.push(tempNodes);
              } else if (obj[i][j][k].search("MaxPool") === 1) {
                let tempNodes = {};
                tempNodes["layersID"] = layersID;
                tempNodes["id"] = numOfId;
                tempNodes["label"] = "MaxPool - " + numOfId;
                nodeSet.push(tempNodes);
              } else if (obj[i][j][k] === "Bottleneck") {
                bottleFlag = true;
                numOfId = numOfId - 1;
                doubleLink = false;
              }

              if (i > 0 && doubleLink) {
                if (connectFlag) {
                  let tempEdges = {};
                  tempEdges["layersID"] = layersID;
                  tempEdges["from"] = layersID.toString();
                  tempEdges["to"] = numOfId;
                  tempEdges["type"] = "";
                  edgeSet.push(tempEdges);
                } else {
                  let tempEdges = {};
                  tempEdges["layersID"] = layersID;
                  tempEdges["from"] = (numOfId - 1).toString();
                  tempEdges["to"] = numOfId;
                  tempEdges["type"] = "";
                  edgeSet.push(tempEdges);
                }
                connectFlag = false;
                if (k === obj[i][j].length - 1 && bottleFlag) {
                  numOfId = numOfId + 1;

                  let tempNodes = {};
                  tempNodes["layersID"] = layersID;
                  tempNodes["id"] = numOfId;
                  tempNodes["label"] = "ReLu - " + numOfId;
                  nodeSet.push(tempNodes);

                  //所有的ReLu必须邀有两条线

                  let tempEdges = {};
                  tempEdges["layersID"] = layersID;
                  tempEdges["from"] = (numOfId - k - 1).toString();
                  tempEdges["to"] = numOfId;
                  tempEdges["type"] = "curvedCW";
                  edgeSet.push(tempEdges);

                  let tempEdges1 = {};
                  tempEdges1["layersID"] = layersID;
                  tempEdges1["from"] = (numOfId - 1).toString();
                  tempEdges1["to"] = numOfId;
                  tempEdges1["type"] = "";
                  edgeSet.push(tempEdges1);

                  bottleFlag = false;
                }
              }
              doubleLink = true;
              numOfId = numOfId + 1;
            }
          }
        }
      }
    }
  }

  console.log(nodeSet);
  console.log("<<<<<");
  console.log(edgeSet);

  createFirst();
}

function createFirst() {
  let data = {
    nodes: nodes,
    edges: edges,
  };

  network = new vis.Network(container, data, options);

  network.on("click", function (params) {
    params.event = "[original event]";
    numLayer = this.getNodeAt(params.pointer.DOM).toString();
    console.log(numLayer);
    if (numLayer < 0) {
      this.destroy();
      createSecond(numLayer);
    } else {
      // 当这个是Elements的时候 默认弹出第一张
      sendRequest(numLayer, 0);
    }
  });
}

function createSecond(num) {
  let tempNodes = new vis.DataSet([]);
  let tempEdges = new vis.DataSet([]);
  let firstFlag = true;
  let lastValue = 0;

  for (let i = 0; i < nodeSet.length; i++) {
    //这个是为了让第二层显示的时候 有一个Exit元素连接Layer元素 为美观
    if (nodeSet[i].layersID.toString() === num) {
      if (firstFlag) {
        tempNodes.add({ id: "previous", label: "Exit" });
        tempEdges.add({ from: "previous", to: nodeSet[i].id, arrows: "to" });
        firstFlag = false;
      }

      tempNodes.add({ id: nodeSet[i].id, label: nodeSet[i].label });
      lastValue = i;
    }
  }

  for (let i = 0; i < edgeSet.length; i++) {
    if (edgeSet[i].layersID.toString() === num) {
      tempEdges.add({
        from: edgeSet[i].from,
        to: edgeSet[i].to,
        arrows: "to",
        smooth: {
          enabled: true,
          type: edgeSet[i].type,
          roundness: edgeSet[i].type.length > 0 ? 0.3 : 0,
        },
      });
    }
  }

  tempNodes.add({ id: "next", label: "Go back" });
  tempEdges.add({ from: nodeSet[lastValue].id, to: "next", arrows: "to" });

  let data = {
    nodes: tempNodes,
    edges: tempEdges,
  };

  network = new vis.Network(container, data, options);

  //Change the position for special elements
  let i = num * -1 - 1;
  network.moveNode(
    special[i],
    network.getPosition(special[i] - 2)["x"] - 600,
    network.getPosition(special[i] - 2)["y"]
  );

  network.on("click", function (params) {
    params.event = "[original event]";
    numLayer = this.getNodeAt(params.pointer.DOM).toString();
    if (numLayer > 0) {
      sendRequest(numLayer, 0);
    } else {
      // updateDisplay();
      displayNet();
    }
  });
}

//TODO: Send the num of element to the back-end and get the feature map displaying front-end
function sendRequest(num, index) {
  updateImage(); //Update the canvas data

  //TODO:通过打印出来的数字 去返回相关层的输出 与后台服务器交流
  let fd = new FormData(); //Like a form data

  //需要传送两个参数 一个是点击的层数 还有一个是这张图片的三位数组
  fd.append("number", num); //上传点击的层数的数字
  fd.append("index", index); //确认应该显示哪一张照片

  fd.append("width", upload_image.length);
  fd.append("height", upload_image[0].length);
  fd.append("imgData", JSON.stringify(upload_image));
  fd.append("netName", neural_network_value);
  fd.append("colorMap", COLOUR_MAP_VALUE);

  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/outputTest/", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      let obj = JSON.parse(xhr.responseText); // 将获取的源代码转化为JSON格式
      // console.log("后面返回了 >>>>> " + obj.sum);   //检查返回是否成功
      disNumResult(obj.sum);
      disTemResult(obj.picData);
    }
  };
  xhr.send(fd);
}

// TODO: Display the temp Result
function disTemResult(obj) {
  // let tempObj = obj;
  let tempObj = JSON.parse(obj);

  drawImage("feature-map-canvas", tempObj);
}

//TODO: Create a choices list
function disNumResult(num) {
  // console.log(num);
  //1. Delete the previous elements first
  let list = document.getElementById("dropdown1");
  list.innerHTML = "";

  //2. Put the num choices for the user
  // Example:<li><a href="#!"><i class="material-icons">view_module</i>four</a></li>
  //<li class="divider" tabindex="-1"></li>
  for (let i = 0; i < num; i++) {
    let li = document.createElement("li");
    let href_a = document.createElement("a");
    let icon = document.createElement("i");

    icon.setAttribute("class", "material-icons");
    icon.innerHTML = "view_module";
    href_a.setAttribute("onclick", "sendRequest(" + numLayer + "," + i + ")");
    href_a.innerText = i;

    href_a.appendChild(icon);
    li.appendChild(href_a);
    list.appendChild(li);
  }
}

//TODO: Get the length of data in JSON
//TODO: This Function Can Be Rewritten In A Better JS Way
function getJsonLength(jsonData) {
  var length = 0;
  for (var ever in jsonData) {
    length++;
  }
  return length;
}

function displayNet() {
  // TODO: Display the Structure of resNet
  var fd = new FormData(); //Like a form data
  // fd.append('name', 'resnet50');
  fd.append("name", neural_network_value);

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/display/", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      var obj = JSON.parse(xhr.responseText); // 将获取的源代码转化为JSON格式
      // console.log(obj);
      // displayThreeD(obj); //暂时不需要渲染3D的区域
      if (false) {
        //暂时先用update的版本
        // displayJson(obj); // 做成2D的区域
      } else if (modelMode) {
        // modelMode = false;
        updateDisplay(obj);
      } else {
        modelMode = true;
        displayThreeD(obj);
      }
    }
  };
  xhr.send(fd); // 不能直接发文件对象到后台，但是发 fd 这个对象是可以的
}
