let trigger = false;
let upload_image_flg = false;
let upload_image;
let new_a;

let multiFiles = [] // for multi files
let currentFileIndex = 0 // current file load on the canvas
let colour_map_value = 'twilight'

let resLabel;   // To save the label of temp result
let modelMode = true;   // True is 2D & False is 3D


function setup() {
    var info = document.getElementById('upload-image-area').getBoundingClientRect()
    var width = info.width;
    var height = info.height;
    var canvas = createCanvas(width, height);
    pixelDensity();
    // Move the canvas so it’s inside our <div id="sketch-holder">.
    canvas.parent('sketch-holder');

    // background(255, 255, 200);
}

// function setup_again(file) {
// 	var info = document.getElementById('upload-image-area').getBoundingClientRect()

// 	var width =info.width;
// 	var height = info.height;
// 	var canvas = createCanvas(width, height);
// 	// Move the canvas so it’s inside our <div id="sketch-holder">.
// 	loadImage(file.name, img => {
//     image(img, 0, 0);
//   });
// 	canvas.parent('sketch-holder');
// 	background(255, 255, 200);
// }

function draw() {
    // pixelDensity(1);
    var info = document.getElementById('sketch-holder').getBoundingClientRect()

    if (trigger) {
        if (mouseIsPressed) {
            fill(0);
            rect(mouseX, mouseY, 10, 10);
        }

    }
    if (upload_image_flg) {

        let img = createImage(upload_image.length, upload_image[0].length);
        img.loadPixels();
        for (let i = 0; i < img.width; i++) {
            for (let j = 0; j < img.height; j++) {
                img.set(i, j, color(upload_image[i][j][0], upload_image[i][j][1], upload_image[i][j][2]));
            }
        }
        // scale(img)
        // console.log(width)
        // if (img.width > width)  {
        // 	scale(width/img.width / 1.5)
        // } else if (img.height > height) {
        // 	scale(height/img.height / 1.5)
        // }

        scale(info.width / img.width, info.height / img.height);

        img.updatePixels();
        image(img, 0, 0,);


        //alert('sb mickey')
        // loadPixels();

        // for (var y = 0; y < height; y++) {
        // 	for (var x = 0; x < width; x++) {
        // 		var index = (x + y *width) * 4
        // 		pixels[index+0] = y;
        // 		pixels[index+1] = 0;
        // 		pixels[index+2] = y;
        // 		pixels[index+3] = 255;

        // 	}
        // }
        // console.log(upload_image[0])
        // var i;
        //       for (i = 0; i < upload_image.length; i += 4) {
        //           pixels[i] = upload_image[i];
        //           pixels[i + 1] = upload_image[i+1]
        //           pixels[i + 2] = upload_image[i + 2];
        //           pixels[i + 3] = 255;
        //       }

        // for(var x =0; x < upload_image.length; x++) {
        // 	for(var y = 0; y < upload_image[x]; y++) {
        // 		for(var z=0; z < upload_image[y]-1; z++) {
        // 			pixels[x][y] = upload_image[x][y][z]
        // 		}
        // 	}
        // }
        // updatePixels();
        upload_image_flg = false;
        // alert("???");
        // image(upload_image, 0,0);
    }
}

// function windowResized() {
// 	location.reload();
// 	var info = document.getElementById('upload-image-area').getBoundingClientRect()

// 	var width =info.width;
// 	var height = info.height;
// 	resizeCanvas(width, height);
// }


const colour_map = document.querySelector(('#dropdown2'));
console.log(colour_map);
colour_map.addEventListener('click', (e) => {
    colour_map_value = e.target.outerText;
    console.log(colour_map_value);

    const x = document.getElementById("snackbar");
    x.className = "show";
    x.innerHTML = "You have selected Colour map: " + colour_map_value;
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
    // alert(`You have selected Colour Map: ${colour_map_value}`)
});

document.getElementById("trigger-canvas").addEventListener("click", () => {
    if (trigger == false) {
        trigger = true;
        alert('Now you can draw')
    } else {
        trigger = false;
        alert('Now you cannot draw')
    }

});

function uploadImageToCanvas (e) {
    multiFiles = []
    files = e.target.files
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        multiFiles.push(files[fileIndex])
    } 

    //TODO: This console log needs to be deleted later
    console.log(multiFiles)
    loadFileToCanvas(multiFiles[0])
}

function loadFileToCanvas (currentFile) {
    var canvas = document.getElementById("my-canvas");
    var ctx = canvas.getContext("2d");

    var reader = new FileReader();
    reader.onload = function (event) {
        var img_1 = new Image();
        img_1.onload = function () {
            canvas.width = img_1.width;
            canvas.height = img_1.height;
            ctx.drawImage(img_1, 0, 0);

            var pix = ctx.getImageData(0, 0, img_1.width / 2, img_1.height / 2)
            var array_data = new Array();
            var imagesdata = ctx.getImageData(0, 0, img_1.width, img_1.height).data

            for (var x = img_1.width - 1; x >= 0; x--) {
                array_data[x] = new Array(); // insert new vertical array
                for (var y = img_1.height - 1; y >= 0; y--) {
                    array_data[x][y] = new Array(0, 0, 0, 0);
                }
            }

            for (var i = 0; i < imagesdata.length - 3; i += 4) {
                var x = parseInt(parseInt(i / 4) % (img_1.width));
                var y = parseInt(parseInt(i / 4) / (img_1.width));

                array_data[x][y][0] = imagesdata[i];
                array_data[x][y][1] = imagesdata[i + 1];
                array_data[x][y][2] = imagesdata[i + 2];
                array_data[x][y][3] = imagesdata[i + 3];
            }

            upload_image = array_data
            upload_image_flg = true;
        }
        img_1.src = event.target.result;
    }
    // display
    reader.readAsDataURL(currentFile);
}

window.addEventListener('load', (e) => {
    // Single Picture Upload
    document.getElementById('single-upload').addEventListener('change', uploadImageToCanvas)

    // Multi Images Upload
    const multiUpload = document.querySelector('#multi-upload')
    multiUpload.addEventListener('change', uploadImageToCanvas)
})

// This method will control to display the next image
const nextButton = document.querySelector('#next-image')
nextButton.addEventListener('click', (e) => {
    if (currentFileIndex < multiFiles.length - 1) {
        currentFileIndex++
    } else {
        alert('This is the last image')
    }
    loadFileToCanvas(multiFiles[currentFileIndex])
})

const backButton = document.querySelector('#back-image')
backButton.addEventListener('click', () => {
    if (currentFileIndex > 0) {
        currentFileIndex--
    } else {
        alert('This is the first image')
    }
    loadFileToCanvas(multiFiles[currentFileIndex])
})
// This method will control to display the next image

    // document.getElementById('single-upload')
    // document.querySelector('input[type="file"]').addEventListener('change', function () {

document.getElementById("submitPic").addEventListener("click", () => {
    // console.log("READY >>>>>> " + Date.now());

    let fd = new FormData();        // 相当于是一个 Form 表单

    // console.log(upload_image.length);
    // console.log(upload_image[0].length);

    updateImage();  //Got the data from the canvas


    fd.append('width', upload_image.length);
    fd.append('height', upload_image[0].length);
    fd.append('imgData', JSON.stringify(upload_image));


    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload_file/', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            var obj = JSON.parse(xhr.responseText); // 将获取的源代码转化为JSON格式
            disResult(obj); // Display the current result
        }
    };
    xhr.send(fd);
});

document.getElementById("disButton").addEventListener("click", function () {
    // TODO: Display the Structure of resNet
    var fd = new FormData(); //Like a form data
    fd.append('name', 'resnet50');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/display/', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            var obj = JSON.parse(xhr.responseText); // 将获取的源代码转化为JSON格式
            // console.log(obj);
            // displayThreeD(obj); //暂时不需要渲染3D的区域
            if (false) {
                //暂时先用update的版本
                // displayJson(obj); // 做成2D的区域
            } else if (modelMode) {
                modelMode = false;
                updateDisplay(obj);
            } else {
                modelMode = true;
                displayThreeD(obj);
            }
        }
    };
    xhr.send(fd);      // 不能直接发文件对象到后台，但是发 fd 这个对象是可以的
});

document.getElementById("heatMapButton").addEventListener("click", function () {
    //If the resLabel is null, the function to submit will be implemented
    if (resLabel === "" || resLabel === null || resLabel === undefined) {
        alert("Please submit the Pic first!");
    } else {
        // console.log(resLabel);
        let fd = new FormData(); //Like a form data
        let xhr = new XMLHttpRequest();
        fd.append('label', resLabel);
        xhr.open('POST', '/heatMap/', true);

        updateImage();  //Got the data from the canvas

        fd.append('width', upload_image.length);
        fd.append('height', upload_image[0].length);
        fd.append('imgData', JSON.stringify(upload_image));

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                let obj = JSON.parse(xhr.responseText); // 将获取的源代码转化为JSON格式
                drawImage("tempResult", obj[0]);
                drawImage("heatMap", obj[1]);
            }
        };
        xhr.send(fd);
    }
});

//TODO: Get the length of data in JSON
function getJsonLength(jsonData) {
    var length = 0;
    for (var ever in jsonData) {
        length++;
    }
    return length;
}

//TODO: Update Version for 2D

let network;    //为network定义一个全局变量

//这个nodes 和 edges是为最上层的layers
let nodes = new vis.DataSet([]);
let edges = new vis.DataSet([]);

let nodeSet = [];   //这个是用来存点集的
let edgeSet = [];   //这个用来存线集的
let special = [];   //存放特殊的elements

let options = {
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

let container = document.getElementById("displayContainer");

let numLayer = 0; //这个是用来存放用户点击了哪一层的element

function updateDisplay(obj) {
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


    if (nodes.length === 0) {
        for (let i = 0; i < lengthJSON; i++) {
            if (obj[i].length > 10) {
                if (obj[i].search("Conv2d") === 1) {
                    nodes.add({id: numOfId, label: "Conv2d - " + numOfId,});
                } else if (obj[i].search("MaxPool") === 1) {
                    nodes.add({id: numOfId, label: "MaxPool - " + numOfId});
                } else if (obj[i].search("Adaptive") === 1) {
                    nodes.add({id: numOfId, label: "AdaptiveAvgPool2d - " + numOfId,});
                } else if (obj[i].search("Linear") === 1) {
                    nodes.add({id: numOfId, label: "Linear - " + numOfId,});
                } else if (obj[i].search("ReLu") === 1) {
                    nodes.add({id: numOfId, label: "ReLu - " + numOfId,});
                }
                if (i > 0) {
                    if (layersID > 0) {
                        edges.add({from: (numOfId - 1).toString(), to: numOfId, arrows: 'to'});
                    } else {
                        edges.add({from: (layersID).toString(), to: numOfId, arrows: 'to'});
                        layersID = layersID * (-1);
                    }
                }
                numOfId = numOfId + 1;
            } else {
                if (layersID > 0) {
                    layersID = layersID * (-1);
                }

                layersID = layersID - 1;
                nodes.add({id: layersID, label: "Layers - " + (layersID * -1),});

                if (layersID === -1) {
                    edges.add({from: (numOfId - 1).toString(), to: layersID, arrows: 'to'});
                } else {
                    edges.add({from: (layersID + 1).toString(), to: layersID, arrows: 'to',});
                }

                let tempNode = {};
                tempNode['layersID'] = layersID;
                tempNode['id'] = layersID;
                tempNode['label'] = "Layers - " + (layersID * -1).toString();
                nodeSet.push(tempNode);

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
                                nodeSet.push(tempNodes);
                                special.push(numOfId);

                            } else if (obj[i][j][k][0].search("MaxPool") === 1) {

                                let tempNodes = {};
                                tempNodes['layersID'] = layersID;
                                tempNodes['id'] = numOfId;
                                tempNodes['label'] = "MaxPool -  neck " + numOfId;
                                nodeSet.push(tempNodes);

                            }
                            if (i > 0) {

                                let tempEdges = {};
                                tempEdges['layersID'] = layersID;
                                tempEdges['from'] = layersID.toString();
                                tempEdges['to'] = numOfId;
                                tempEdges['type'] = "";
                                edgeSet.push(tempEdges);

                                if (bottleFlag) {
                                    numOfId = numOfId + 1;

                                    let tempNodes = {};
                                    tempNodes['layersID'] = layersID;
                                    tempNodes['id'] = numOfId;
                                    tempNodes['label'] = "ReLu - " + numOfId;
                                    nodeSet.push(tempNodes);

                                    //这里的两条线是为了完成一个Bottleneck with downsample

                                    let tempEdges1 = {};
                                    tempEdges1['layersID'] = layersID;
                                    tempEdges1['from'] = (numOfId - 1).toString();
                                    tempEdges1['to'] = numOfId;
                                    tempEdges1['type'] = "";

                                    edgeSet.push(tempEdges1);

                                    let tempEdges = {};
                                    tempEdges['layersID'] = layersID;
                                    tempEdges['from'] = (numOfId - 2).toString();
                                    tempEdges['to'] = numOfId;
                                    tempEdges['type'] = "";
                                    edgeSet.push(tempEdges);

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
                                nodeSet.push(tempNodes);

                            } else if (obj[i][j][k].search("MaxPool") === 1) {

                                let tempNodes = {};
                                tempNodes['layersID'] = layersID;
                                tempNodes['id'] = numOfId;
                                tempNodes['label'] = "MaxPool - " + numOfId;
                                nodeSet.push(tempNodes);

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
                                    edgeSet.push(tempEdges);

                                } else {

                                    let tempEdges = {};
                                    tempEdges['layersID'] = layersID;
                                    tempEdges['from'] = (numOfId - 1).toString();
                                    tempEdges['to'] = numOfId;
                                    tempEdges['type'] = "";
                                    edgeSet.push(tempEdges);
                                }
                                connectFlag = false;
                                if (k === (obj[i][j].length - 1) && bottleFlag) {

                                    numOfId = numOfId + 1;

                                    let tempNodes = {};
                                    tempNodes['layersID'] = layersID;
                                    tempNodes['id'] = numOfId;
                                    tempNodes['label'] = "ReLu - " + numOfId;
                                    nodeSet.push(tempNodes);

                                    //所有的ReLu必须邀有两条线

                                    let tempEdges = {};
                                    tempEdges['layersID'] = layersID;
                                    tempEdges['from'] = (numOfId - k - 1).toString();
                                    tempEdges['to'] = numOfId;
                                    tempEdges['type'] = "curvedCW";
                                    edgeSet.push(tempEdges);

                                    let tempEdges1 = {};
                                    tempEdges1['layersID'] = layersID;
                                    tempEdges1['from'] = (numOfId - 1).toString();
                                    tempEdges1['to'] = numOfId;
                                    tempEdges1['type'] = "";
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

    createFirst();

}

function createFirst() {

    let data = {
        nodes: nodes,
        edges: edges
    };

    network = new vis.Network(container, data, options);

    network.on('click', function (params) {
        params.event = "[original event]";
        numLayer = this.getNodeAt(params.pointer.DOM).toString();
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
        if (nodeSet[i].layersID.toString() === num) {
            if (firstFlag) {
                tempNodes.add({id: "previous", label: "Exit"});
                tempEdges.add({from: "previous", to: nodeSet[i].id, arrows: 'to'});
                firstFlag = false;
            }

            tempNodes.add({id: nodeSet[i].id, label: nodeSet[i].label});
            lastValue = i;
        }
    }

    for (let i = 0; i < edgeSet.length; i++) {
        if (edgeSet[i].layersID.toString() === num) {
            tempEdges.add({
                from: edgeSet[i].from,
                to: edgeSet[i].to,
                arrows: 'to',
                smooth: {
                    enabled: true,
                    type: edgeSet[i].type,
                    roundness: edgeSet[i].type.length > 0 ? 0.3 : 0,
                }
            });
        }
    }

    tempNodes.add({id: "next", label: "Go back"});
    tempEdges.add({from: nodeSet[lastValue].id, to: "next", arrows: 'to'});

    let data = {
        nodes: tempNodes,
        edges: tempEdges,
    };

    network = new vis.Network(container, data, options);

    //Change the position for special elements
    let i = num * (-1) - 1;
    network.moveNode(special[i], network.getPosition(special[i] - 2)['x'] - 600, network.getPosition(special[i] - 2)['y']);

    network.on('click', function (params) {
        params.event = "[original event]";
        numLayer = this.getNodeAt(params.pointer.DOM).toString();
        if (numLayer > 0) {
            sendRequest(numLayer, 0 );
        } else {
            updateDisplay();
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

// TODO: To display the result from the Resnet50 in front-end
function disResult(obj) {
    var i = 0;
    console.log(obj);
    //Get the table
    var disTbody = document.getElementById("disTbody");

    //To save the the image label as global instance & it only get the best result
    resLabel = obj[0].label[0];

    // document.getElementById("nonRecord").remove();
    disTbody.innerHTML = "";

    //Get the data from obj and create a table to display them
    for (i = -1; i < obj[0].label.length; i++) {
        var newLine = document.createElement("tr");
        var newCellForResult = document.createElement("th");
        var newCellForRate = document.createElement("th");

        if (i === -1) {
            newCellForResult.innerText = 'Name';
        } else {
            newCellForResult.innerText = obj[0].label[i];
        }
        newCellForResult.setAttribute("height", "10%");
        newCellForResult.setAttribute("width", "15%");

        if (i === -1) {
            newCellForRate.innerText = 'Probability';
        } else {
            newCellForRate.innerText = ((obj[0].rate[i] + "") * 100).toFixed(2) + "%";
        }
        newCellForRate.setAttribute("width", "10%");
        newCellForRate.setAttribute("height", "10%");

        newLine.appendChild(newCellForResult);
        newLine.appendChild(newCellForRate);

        disTbody.appendChild(newLine);

    }
}

function getBase64(file) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        // console.log(reader.result);
        return reader.result;
    };
    reader.onerror = function (error) {
        // console.log('Error: ', error);
    };
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
        href_a.setAttribute("onclick", "sendRequest(" + numLayer + "," + i + ")");
        href_a.innerText = i;

        href_a.appendChild(icon);
        li.appendChild(href_a);
        list.appendChild(li);

    }

}

//TODO: Update the upload_image data
function updateImage() {
    let canvasPic = document.getElementById("defaultCanvas0");
    let c = canvasPic.getContext('2d');
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
        let x = parseInt(parseInt(i / 4) % (canvasWidth));
        let y = parseInt(parseInt(i / 4) / (canvasWidth));

        upload_image[x][y][0] = imagesData[i];
        upload_image[x][y][1] = imagesData[i + 1];
        upload_image[x][y][2] = imagesData[i + 2];
        upload_image[x][y][3] = imagesData[i + 3];
    }

    // console.log("WIDTH" + canvasWidth + "***** HEIGHT" + canvasHeight);
}

//TODO: The function to draw a pic by array || param: id (DOM element)
function drawImage(elementID, tempObj) {

    // tempObj = JSON.parse(tempObj);
    let tempResult = document.getElementById(elementID);
    tempResult.innerHTML = "";

    // cv.imshow(tempObj, "imgElement");
    let c = document.createElement("canvas");
    c.setAttribute("style", "margin: auto ");

    //The size of CANVAS
    let widthTemp = tempObj.length;
    let heightTemp = tempObj[0].length;

    //The size of DIV
    let tempRect = tempResult.getBoundingClientRect();
    let widthDiv = tempRect.width;
    let heightDiv = tempRect.height;

    var widthTemp_ratio = widthTemp / widthDiv;
    var heightTemp_ratio = heightTemp / heightDiv;

    c.width = widthTemp;
    c.height = heightTemp;

    if (widthTemp_ratio >= heightTemp_ratio && widthTemp > widthDiv) {
        widthTemp = widthDiv;
        // console.log("变过？？width" + widthTemp + widthDiv);
    } else if (heightTemp_ratio > widthTemp_ratio && heightTemp > heightDiv) {
        heightTemp = heightDiv;
        // console.log("变过？？");
    }

    c.setAttribute("width", widthTemp.toString());
    c.setAttribute("height", heightTemp.toString());

    tempResult.appendChild(c);

    // console.log(widthTemp + " >>>>>>>>> " + heightTemp + " <<<<<<<<<< ");

    let ctx = c.getContext("2d");

    let r, g, b;

    // console.log(tempObj.length + ">>>>>>" + tempObj[0].length + ">>>>>" + tempObj[0][0]);

    for (let i = 0; i < tempObj.length; i++) {
        for (let j = 0; j < tempObj[i].length; j++) {
            r = tempObj[i][j][0];
            g = tempObj[i][j][1];
            b = tempObj[i][j][2];
            ctx.fillStyle = "rgba(" + r + "," + g + "," + b + ", 1)";
            ctx.fillRect(j, i, 1, 1);
            // console.log(`R>>${r}>>G>>${g}>>>B>>${b}>>`);
        }
    }

    if (widthTemp < (widthDiv - 10) && heightTemp < (heightDiv - 10)) {
        tempResult.innerHTML = "";
        let imageData = ctx.getImageData(0, 0, widthTemp, heightTemp);
        c.setAttribute("height", heightDiv.toString());
        c.setAttribute("width", widthDiv.toString());

        ctx.putImageData(imageData, (widthDiv - widthTemp) / 2, (heightDiv - heightTemp) / 2);

        tempResult.appendChild(c);
    }

}

/**
 *
 * Future work
 * 1. Display each elements in structure
 * 2. Display 3D structure
 *
 * */

// This is for future work (this function can display each elements in specific colour)
// TODO: Display the structure of resNet, according to the JSON file (This is for 2D)
function displayJson(obj) {
    let lengthJSON = getJsonLength(obj);
    let numOfId = 0;
    let bottleFlag = false;
    let doubleLink = true;

    // To save the number of the layer
    let numLayer = 0;
    let color;
    let layerColor = {};

    // To save the ID of downsample points
    let special = [];

    let nodes = new vis.DataSet([]);

    let edges = new vis.DataSet([]);

    for (let i = 0; i < lengthJSON; i++) {

        if (obj[i].length > 10) {
            if (obj[i].search("Conv2d") === 1) {
                nodes.add({id: numOfId, label: "Conv2d - " + numOfId, shape: 'box'});
            } else if (obj[i].search("MaxPool") === 1) {
                nodes.add({id: numOfId, label: "MaxPool - " + numOfId, shape: 'box'});
            } else if (obj[i].search("Adaptive") === 1) {
                nodes.add({id: numOfId, label: "AdaptiveAvgPool2d - " + numOfId, shape: 'box'});
            } else if (obj[i].search("Linear") === 1) {
                nodes.add({id: numOfId, label: "Linear - " + numOfId, shape: 'box'});
            }
            if (i > 0) {
                edges.add({from: (numOfId - 1).toString(), to: numOfId, arrows: 'to'});
            }
            numOfId = numOfId + 1;
        } else {

            // Calculate the number of the layer and set different colors for different layers
            numLayer = numLayer + 1;
            color = generateColor();

            for (let j = 0; j < obj[i].length; j++) {
                for (let k = 0; k < obj[i][j].length; k++) {
                    if (obj[i][j][k].length < 10) {
                        //这一个条件里面的是为了给Downsample用的
                        if (obj[i][j][k][0].search("Conv2d") === 1) {
                            nodes.add({
                                id: numOfId,
                                label: "Conv2d -  neck " + numOfId,
                                shape: 'box',
                                color: {
                                    background: color,
                                    border: color,
                                }
                            });
                            special.push(numOfId);
                        } else if (obj[i][j][k][0].search("MaxPool") === 1) {
                            nodes.add({
                                id: numOfId,
                                label: "MaxPool -  neck " + numOfId,
                                shape: 'box',
                                color: {
                                    background: color,
                                    border: color,
                                }
                            });
                            special.push(numOfId);
                        }
                        if (i > 0) {
                            edges.add({
                                from: (numOfId - obj[i][j].length + 1).toString(),
                                to: numOfId,
                                arrows: 'to',
                                smooth: {enabled: true, type: "curvedCW", roundness: 0.1}
                            });
                            if (bottleFlag) {

                                numOfId = numOfId + 1;
                                nodes.add({
                                    id: numOfId,
                                    label: "ReLu - " + numOfId,
                                    color: {
                                        background: color,
                                        border: color,
                                    }
                                });

                                //这里的两条线是为了完成一个Bottleneck with downsample
                                edges.add({
                                    from: (numOfId - 1).toString(),
                                    to: numOfId,
                                    arrows: 'to',
                                    smooth: {enabled: true, type: "curvedCW", roundness: 0.1}
                                });
                                edges.add({from: (numOfId - 2).toString(), to: numOfId, arrows: 'to'});

                                bottleFlag = false;
                            }
                        }
                        numOfId = numOfId + 1;

                    } else {

                        //这个条件里面是为了给没有DownSample的排列用的
                        if (obj[i][j][k].search("Conv2d") === 1) {
                            nodes.add({
                                id: numOfId,
                                label: "Conv2d - " + numOfId,
                                shape: 'box',
                                color: {
                                    background: color,
                                    border: color,
                                }
                            });
                        } else if (obj[i][j][k].search("MaxPool") === 1) {
                            nodes.add({
                                id: numOfId,
                                label: "MaxPool - " + numOfId,
                                shape: 'box',
                                color: {
                                    background: color,
                                    border: color,
                                }
                            });
                        } else if (obj[i][j][k] === "Bottleneck") {
                            bottleFlag = true;
                            numOfId = numOfId - 1;
                            doubleLink = false;
                        }

                        if (i > 0 && doubleLink) {
                            edges.add({from: (numOfId - 1).toString(), to: numOfId, arrows: 'to'});
                            if (k === (obj[i][j].length - 1) && bottleFlag) {
                                //console.log("长度是： " + obj[i][j].length + "   K is " + k + " numOfId is " + numOfId);

                                numOfId = numOfId + 1;
                                nodes.add({
                                    id: numOfId,
                                    label: "ReLu - " + numOfId,
                                    color: {
                                        background: color,
                                        border: color,
                                    }
                                });

                                //所有的ReLu必须邀有两条线
                                edges.add({
                                    from: (numOfId - k - 1).toString(),
                                    to: numOfId,
                                    smooth: {enabled: true, type: "curvedCW", roundness: 0.5},
                                    arrows: 'to'
                                });
                                edges.add({from: (numOfId - 1).toString(), to: numOfId, arrows: 'to'});
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

    let container = document.getElementById("displayContainer");

    let data = {
        nodes: nodes,
        edges: edges
    };

    let options = {
        manipulation: false,
        height: '90%',
        layout: {
            hierarchical: {
                enabled: true,
                levelSeparation: 400,
                nodeSpacing: 400,
                blockShifting: true,
                direction: 'UD'
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

    let network = new vis.Network(container, data, options);

    //Change the position for special elements
    for (let i = 0; i < special.length; i++) {
        network.moveNode(special[i], network.getPosition(special[i] - 2)['x'], network.getPosition(special[i] - 2)['y']);
    }

    // console.log(numLayer);

    //For position of each elements
    /**
     let valueOfX = 0;
     let valueOfY = 0;
     let flag = true;

     for (let i = 0; i < numOfId; i++) {
            for (let j = 0; j < special.length; j++) {
                if(special[j] === numOfId){
                    flag = false;
                }
            }

            if(flag){
                network.moveNode(i, valueOfX, valueOfY);
                valueOfX = valueOfX + 100;
            }
            flag = true;
        }**/

    network.on('click', function (params) {
        params.event = "[original event]";
        let num = this.getNodeAt(params.pointer.DOM).toString();
        // console.log(this.getNodeAt(params.pointer.DOM));
    });

}

//TODO: Generate Color in random
function generateColor() {
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += (Math.random() * 16 | 0).toString(16);
    }
    return color;
}

// This is for future work, this function can display 3D structure
// TODO: This is to display 3D
function displayThreeD(obj) {
    let lengthJSON = getJsonLength(obj)
    // let container = document.getElementById("diagramContainer");
    container.innerHTML = "";
    let model = new TSP.models.Sequential(container);
    let input = new TSP.layers.GreyscaleInput({
        shape: [28, 28, 1]
    });

    model.add(input);

    for (let i = 0; i < lengthJSON; i++) {
        if (obj[i].length > 10) {
            if (obj[i].search("Conv2d") === 1) {
                model.add(new TSP.layers.Conv2d({
                    kernelSize: 5,
                    filters: 6,
                    strides: 1,
                    initStatus: "close"
                }));
            } else if (obj[i].search("MaxPool") === 1) {
                model.add(new TSP.layers.Padding2d({
                    padding: [2, 2],
                }));
            } else if (obj[i].search("Adaptive") === 1) {


            } else if (obj[i].search("Linear") === 1) {


            }
        } else {
            for (let j = 0; j < obj[i].length; j++) {
                for (let k = 0; k < obj[i][j].length; k++) {
                    if (obj[i][j][k].length < 10) {
                        if (obj[i][j][k][0].search("Conv2d") === 1) {
                            model.add(new TSP.layers.Conv2d({
                                kernelSize: 5,
                                filters: 6,
                                strides: 1,
                                initStatus: "close"
                            }));
                        } else if (obj[i][j][k][0].search("MaxPool") === 1) {
                            model.add(new TSP.layers.Padding2d({
                                padding: [2, 2],
                            }));
                        }
                    } else {
                        if (obj[i][j][k].search("Conv2d") === 1) {
                            model.add(new TSP.layers.Conv2d({
                                kernelSize: 5,
                                filters: 6,
                                strides: 1,
                                initStatus: "close"
                            }));
                        } else if (obj[i][j][k].search("MaxPool") === 1) {
                            model.add(new TSP.layers.Padding2d({
                                padding: [2, 2],
                            }));
                        }
                    }
                }
            }
        }
    }

    model.add(new TSP.layers.Output1d({
        units: 1000,
    }));
    model.init();
}
