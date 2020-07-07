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
  fd.append("type", "1");

  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      let obj = JSON.parse(xhr.responseText); // 将获取的源代码转化为JSON格式
      if (tracking_index == CURRENTFILEINDEX) {
        // Update Canvas 2 First
        // Uncomment this method if needed
        // updateDisplayArea();

        // Update Layer 2
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

  let c = document.getElementById(elementID);
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

function updateDisplayArea() {
    let c = document.getElementById("display-area"); // DisplayPanel
    let ctx = c.getContext("2d");
    c.width = CANVAS1DATA.width;
    c.height = CANVAS1DATA.height;
    ctx.putImageData(CANVAS1DATA, 0, 0);
}

//This is to read the data and display the visualization
//TODO: Update Version for 2D
let NETWORK;    //为NETWORK定义一个全局变量

//这个nodes 和 edges是为最上层的layers
let NODES = new vis.DataSet([]);
let EDGES = new vis.DataSet([]);

let NODESET = [];   //这个是用来存点集的
let EDGESET = [];   //这个用来存线集的
let SPECIAL = [];   //存放特殊的elements

let OPTIONS = {
    height: '90%',
    layout: {
        hierarchical: {
            enabled: true,
            levelSeparation: 400,
            nodeSpacing: 300,
        },
    },
    physics: {
        hierarchicalRepulsion: {
            nodeDistance: 400
        }
    },
    nodes: {
        font: {
            size: 40
        },
        margin: 10,
        widthConstraint: {
            minimum: 200
        },
        heightConstraint: {
            minimum: 70
        }
    }
};

let CONTAINER = document.getElementById("displayContainer");

let NUMLAYER = 0; //这个是用来存放用户点击了哪一层的element

function updateDisplay(obj) {
    console.log(obj);

    NODES = new vis.DataSet([]);
    EDGES = new vis.DataSet([]);

    NODESET = [];
    EDGESET = [];
    SPECIAL = [];

    CONTAINER.innerHTML = "";
    try {
        NETWORK.destroy();
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

    if (NODES.length === 0) {
        for (let i = 0; i < lengthJSON; i++) {
            if (obj[i].length > 10) {
                if (obj[i].search("Conv2d") === 1) {
                    NODES.add({id: numOfId, label: "Conv2d - " + numOfId,});
                } else if (obj[i].search("MaxPool") === 1) {
                    NODES.add({id: numOfId, label: "MaxPool - " + numOfId});
                } else if (obj[i].search("Adaptive") === 1) {
                    NODES.add({id: numOfId, label: "AdaptiveAvgPool2d - " + numOfId,});
                } else if (obj[i].search("Linear") === 1) {
                    NODES.add({id: numOfId, label: "Linear - " + numOfId,});
                } else if (obj[i].search("ReLu") === 1) {
                    NODES.add({id: numOfId, label: "ReLu - " + numOfId,});
                }
                if (i > 0) {
                    if (layersID > 0) {
                        EDGES.add({from: (numOfId - 1).toString(), to: numOfId, arrows: 'to'});
                    } else {
                        EDGES.add({from: (layersID).toString(), to: numOfId, arrows: 'to'});
                        layersID = layersID * (-1);
                    }
                }
                numOfId = numOfId + 1;
            } else {
                if (layersID > 0) {
                    layersID = layersID * (-1);
                }

                layersID = layersID - 1;
                NODES.add({id: layersID, label: "Layers - " + (layersID * -1),});

                if (layersID === -1) {
                    EDGES.add({from: (numOfId - 1).toString(), to: layersID, arrows: 'to'});
                } else {
                    EDGES.add({from: (layersID + 1).toString(), to: layersID, arrows: 'to',});
                }

                let tempNode = {};
                tempNode['layersID'] = layersID;
                tempNode['id'] = layersID;
                tempNode['label'] = "Layers - " + (layersID * -1).toString();
                NODESET.push(tempNode);

                //告诉后面的连接这个是必须和上一层的layer连接的
                connectFlag = true;

                for (let j = 0; j < obj[i].length; j++) {
                    for (let k = 0; k < obj[i][j].length; k++) {

                        if (obj[i][j][k].length < 10) {

                            //这一个条件里面的是为了给Downsample用的
                            if (obj[i][j][k][0].search("Conv2d") === 1) {

                                let tempNodes = {};
                                tempNodes['layersID'] = layersID;
                                tempNodes['id'] = numOfId;
                                tempNodes['label'] = "Conv2d -  neck " + numOfId;
                                NODESET.push(tempNodes);
                                SPECIAL.push(numOfId);

                            } else if (obj[i][j][k][0].search("MaxPool") === 1) {

                                let tempNodes = {};
                                tempNodes['layersID'] = layersID;
                                tempNodes['id'] = numOfId;
                                tempNodes['label'] = "MaxPool -  neck " + numOfId;
                                NODESET.push(tempNodes);

                            }
                            if (i > 0) {

                                let tempEdges = {};
                                tempEdges['layersID'] = layersID;
                                tempEdges['from'] = layersID.toString();
                                tempEdges['to'] = numOfId;
                                tempEdges['type'] = "";
                                EDGESET.push(tempEdges);

                                if (bottleFlag) {
                                    numOfId = numOfId + 1;

                                    let tempNodes = {};
                                    tempNodes['layersID'] = layersID;
                                    tempNodes['id'] = numOfId;
                                    tempNodes['label'] = "ReLu - " + numOfId;
                                    NODESET.push(tempNodes);

                                    //这里的两条线是为了完成一个Bottleneck with downsample

                                    let tempEdges1 = {};
                                    tempEdges1['layersID'] = layersID;
                                    tempEdges1['from'] = (numOfId - 1).toString();
                                    tempEdges1['to'] = numOfId;
                                    tempEdges1['type'] = "";

                                    EDGESET.push(tempEdges1);

                                    let tempEdges = {};
                                    tempEdges['layersID'] = layersID;
                                    tempEdges['from'] = (numOfId - 2).toString();
                                    tempEdges['to'] = numOfId;
                                    tempEdges['type'] = "";
                                    EDGESET.push(tempEdges);

                                    bottleFlag = false;
                                }
                            }
                            numOfId = numOfId + 1;

                        } else {

                            //这个条件里面是为了给没有DownSample的排列用的
                            if (obj[i][j][k].search("Conv2d") === 1) {

                                let tempNodes = {};
                                tempNodes['layersID'] = layersID;
                                tempNodes['id'] = numOfId;
                                tempNodes['label'] = "Conv2d - " + numOfId;
                                NODESET.push(tempNodes);

                            } else if (obj[i][j][k].search("MaxPool") === 1) {

                                let tempNodes = {};
                                tempNodes['layersID'] = layersID;
                                tempNodes['id'] = numOfId;
                                tempNodes['label'] = "MaxPool - " + numOfId;
                                NODESET.push(tempNodes);

                            } else if (obj[i][j][k] === "Bottleneck") {
                                bottleFlag = true;
                                numOfId = numOfId - 1;
                                doubleLink = false;
                            }

                            if (i > 0 && doubleLink) {
                                if (connectFlag) {

                                    let tempEdges = {};
                                    tempEdges['layersID'] = layersID;
                                    tempEdges['from'] = layersID.toString();
                                    tempEdges['to'] = numOfId;
                                    tempEdges['type'] = "";
                                    EDGESET.push(tempEdges);

                                } else {

                                    let tempEdges = {};
                                    tempEdges['layersID'] = layersID;
                                    tempEdges['from'] = (numOfId - 1).toString();
                                    tempEdges['to'] = numOfId;
                                    tempEdges['type'] = "";
                                    EDGESET.push(tempEdges);
                                }
                                connectFlag = false;
                                if (k === (obj[i][j].length - 1) && bottleFlag) {

                                    numOfId = numOfId + 1;

                                    let tempNodes = {};
                                    tempNodes['layersID'] = layersID;
                                    tempNodes['id'] = numOfId;
                                    tempNodes['label'] = "ReLu - " + numOfId;
                                    NODESET.push(tempNodes);

                                    //所有的ReLu必须邀有两条线

                                    let tempEdges = {};
                                    tempEdges['layersID'] = layersID;
                                    tempEdges['from'] = (numOfId - k - 1).toString();
                                    tempEdges['to'] = numOfId;
                                    tempEdges['type'] = "curvedCW";
                                    EDGESET.push(tempEdges);

                                    let tempEdges1 = {};
                                    tempEdges1['layersID'] = layersID;
                                    tempEdges1['from'] = (numOfId - 1).toString();
                                    tempEdges1['to'] = numOfId;
                                    tempEdges1['type'] = "";
                                    EDGESET.push(tempEdges1);

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

    console.log(NODESET);
    console.log("<<<<<");
    console.log(EDGESET);

    createFirst();

}

function createFirst() {

    let data = {
        nodes: NODES,
        edges: EDGES
    };

    NETWORK = new vis.Network(CONTAINER, data, OPTIONS);

    NETWORK.on('click', function (params) {
        params.event = "[original event]";
        NUMLAYER = this.getNodeAt(params.pointer.DOM).toString();
        console.log(NUMLAYER);
        if (NUMLAYER < 0) {
            this.destroy();
            createSecond(NUMLAYER);
        } else {
            // 当这个是Elements的时候 默认弹出第一张
            sendRequest(NUMLAYER, 0);
        }
    });

}

function createSecond(num) {
    let tempNodes = new vis.DataSet([]);
    let tempEdges = new vis.DataSet([]);
    let firstFlag = true;
    let lastValue = 0;

    for (let i = 0; i < NODESET.length; i++) {
        //这个是为了让第二层显示的时候 有一个Exit元素连接Layer元素 为美观
        if (NODESET[i].layersID.toString() === num) {
            if (firstFlag) {
                tempNodes.add({id: "previous", label: "Exit"});
                tempEdges.add({from: "previous", to: NODESET[i].id, arrows: 'to'});
                firstFlag = false;
            }

            tempNodes.add({id: NODESET[i].id, label: NODESET[i].label});
            lastValue = i;
        }
    }

    for (let i = 0; i < EDGESET.length; i++) {
        if (EDGESET[i].layersID.toString() === num) {
            tempEdges.add({
                from: EDGESET[i].from,
                to: EDGESET[i].to,
                arrows: 'to',
                smooth: {
                    enabled: true,
                    type: EDGESET[i].type,
                    roundness: EDGESET[i].type.length > 0 ? 0.3 : 0,
                }
            });
        }
    }

    tempNodes.add({id: "next", label: "Go back"});
    tempEdges.add({from: NODESET[lastValue].id, to: "next", arrows: 'to'});

    let data = {
        nodes: tempNodes,
        edges: tempEdges,
    };

    NETWORK = new vis.Network(CONTAINER, data, OPTIONS);

    //Change the position for special elements
    let i = num * (-1) - 1;
    NETWORK.moveNode(SPECIAL[i], NETWORK.getPosition(SPECIAL[i] - 2)['x'] - 600, NETWORK.getPosition(SPECIAL[i] - 2)['y']);

    NETWORK.on('click', function (params) {
        params.event = "[original event]";
        NUMLAYER = this.getNodeAt(params.pointer.DOM).toString();
        if (NUMLAYER > 0) {
            sendRequest(NUMLAYER, 0);
        } else {
            // updateDisplay();
            displayNet();
        }
    });

}

//TODO: Send the num of element to the back-end and get the feature map displaying front-end
function sendRequest(num, index) {

    updateImage();  //Update the canvas data

    //TODO:通过打印出来的数字 去返回相关层的输出 与后台服务器交流
    let fd = new FormData(); //Like a form data

    //需要传送两个参数 一个是点击的层数 还有一个是这张图片的三位数组
    fd.append('number', num);   //上传点击的层数的数字
    fd.append('index', index);   //确认应该显示哪一张照片

    fd.append('width', upload_image.length);
    fd.append('height', upload_image[0].length);
    fd.append('imgData', JSON.stringify(upload_image));
    fd.append('netName', neural_network_value);
    fd.append('colorMap', colour_map_value);

    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/outputTest/', true);
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

    drawImage("diagramContainer", tempObj);
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
        href_a.setAttribute("onclick", "sendRequest(" + NUMLAYER + "," + i + ")");
        href_a.innerText = i;

        href_a.appendChild(icon);
        li.appendChild(href_a);
        list.appendChild(li);

    }
}

//TODO: Get the length of data in JSON
function getJsonLength(jsonData) {
    var length = 0;
    for (var ever in jsonData) {
        length++;
    }
    return length;
}