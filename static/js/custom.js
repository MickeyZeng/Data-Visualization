// This Object Is The Center Control All The Settings
/*
GLOBAL_SETTING:
1. User can select the number of rows for the leader board results
2. Refact the code, put some global var in it
*/
GLOBAL_SETTING = {
  userSelectedNetwork: "resnet50",
  NEURAL_NETWORK_OPTION: [
    "resnet18",
    "resnet34",
    "resnet50",
    "resnet101",
    "resnet152",
    "custom",
  ],
  // This object controls the cursor looking
  Scribble_Pen_Cursor: {
    red: "url(./static/css/image/cursors/scribble-red-pen-25*25.png), auto",
    green: "url(./static/css/image/cursors/scribble-green-pen-25*25.png), auto",
  },
};

// Global Variables
MULTIFILES = [];
CURRENTFILEINDEX = 0; // current file load on the canvas

let upload_image; // the 3d array for pic Data
let CANVAS1DATA; // Canvas Data

let GROUND_TRUTH; // Ground Truth Class Label
let CSV_IMAGE_FILE; // Image File Received From Backend By CSV

let modelMode = true; // True is 2D & False is 3D
let LeaderBoardResult = []; // For Leader Board
let originalImageHeight; // The Original Image Height
let originalImageWidth; // The Original Image Width

let CSVFILELISTLENGTH = 0; // the length of images that CSV file contains

//Different CAM picture options
let CAM_OPTION = {
  0: "Please Choose An Option",
  1: "Colored Vanilla Backpropagation",
  2: "Vanilla Backpropagation Saliency",
  3: "Colored Guided Backpropagation",
  4: "Guided Backpropagation Saliency",
  5: "Guided Backpropagation Negative Saliency",
  6: "Guided Backpropagation Positive Saliency",
  7: "Gradient-weighted Class Activation Map",
  8: "Gradient-weighted Class Activation Heatmap",
  9: "Gradient-weighted Class Activation Heatmap on Image",
  10: "Score-weighted Class Activation Map",
  11: "Score-weighted Class Activation Heatmap",
  12: "Score-weighted Class Activation Heatmap on Image",
  13: "Colored Guided Gradient-weighted Class Activation Map",
  14: "Guided Gradient-weighted Class Activation Map Saliency",
  15: "Integrated Gradients (without image multiplication)",
};

// Scribble Colour Option
let Scribble_Colour = {
  negative: "green",
  positive: "red",
};

//Different colour map options
let COLOUR_MAP_VALUE = "viridis";
let COLOUR_MAP_OPTION = [
  "viridis",
  "magma",
  "inferno",
  "plasma",
  "cividis",
  "twilight",
  "twilight_shifted",
  "turbo",
];

// To choose different neural network
let neural_network_value = "resnet50";

let CURRENT_CAM = 1; // CAM Starts From 1 To 15
/*
RESULT_LABEL is very important global variable
It can control the which scribble current is labeling, which label for cam.
*/
let RESULT_LABEL; // See above

// Drawing Function - For Drawing On The Image
class DrawingObject {
  constructor(panelID, pen_trigger = false) {
    this.drawing_panel = document.querySelector(`#${panelID}`);
    this.drawing_panel_ctx = this.drawing_panel.getContext("2d");
    this.drawing_panel.width = drawingPanelWidth;
    this.drawing_panel.height = drawingPanelWidth;
    (this.is_drawing = false), (this.LastX = 0), (this.LastY = 0);
    // this.drawing_panel_ctx.strokeStyle = "#BADA55";

    this.drawing_panel_ctx.lineJoin = "round";
    this.drawing_panel_ctx.lineCap = "round";
    this.drawing_panel_ctx.lineWidth = 5;
    this.pen_trigger = pen_trigger;
    this.keydown = false; // This key down is for negative scribble, Alt key is the key to activate
  }
  pointPositioin = [];

  init = () => {
    this.drawing_panel_ctx.strokeStyle = "#BADA55";
    this.drawing_panel.addEventListener("mousedown", (e) => {
      this.is_drawing = true;
      [this.LastX, this.LastY] = [e.offsetX, e.offsetY];
      // TODO: Remove This Console.log After Label Function
      // console.log(this.LastX, this.LastY);
    });
    this.drawing_panel.addEventListener("mousemove", this.drawing);
    this.drawing_panel.addEventListener(
      "mouseup",
      () => (this.is_drawing = false)
    );
    this.drawing_panel.addEventListener(
      "mouseout",
      () => (this.is_drawing = false)
    );
  };
  drawing = (e) => {
    if (!this.is_drawing || !this.pen_trigger) return; // Stop Drawing, Stop Function
    // document.addEventListener("keydown", (e) => console.log(e));

    this.drawing_panel_ctx.beginPath();

    // Start From
    this.drawing_panel_ctx.moveTo(this.LastX, this.LastY);

    // Go To
    this.drawing_panel_ctx.lineTo(e.offsetX, e.offsetY);
    this.drawing_panel_ctx.stroke();

    // Update LastX, LastY Position
    [this.LastX, this.LastY] = [e.offsetX, e.offsetY];

    // Store The Scribble Position
    this.pointPositioin.push({ x: this.LastX, y: this.LastY });
    // this.pointPositioin.yArray.push(this.LastY);
  };
  cleanUpPosition() {
    console.log(this.pointPositioin);
    this.pointPositioin = [];
    // this.pointPositioin.yArray = [];
  }
}

// Class For Scribble
class ScribbleObject extends DrawingObject {
  constructor(panelID, pen_trigger) {
    super(panelID, pen_trigger);
  }
  allInfo = {};
  init = () => {
    this.drawing_panel_ctx.strokeStyle = Scribble_Colour.positive; // Scribble Pen Colour
    this.drawing_panel.addEventListener("mousedown", (e) => {
      this.is_drawing = true;
      if (!this.pen_trigger) {
        alert("Please Submit The Image And Activate Scribble First");
        // Inform the User and then Terminate the function
        return;
      }
      [this.LastX, this.LastY] = [e.offsetX, e.offsetY];
      // TODO: Remove This Console.log After Label Function
      // console.log(this.LastX, this.LastY);
    });
    this.drawing_panel.addEventListener("mousemove", this.drawing);
    this.drawing_panel.addEventListener("mouseup", () => {
      this.is_drawing = false;
      try {
        if (this.keydown) {
          // Negative
          if (this.allInfo[RESULT_LABEL] != null) {
            this.allInfo[RESULT_LABEL].negative.push("break");
          }
        } else {
          // Positive
          if (this.allInfo[RESULT_LABEL] != null) {
            this.allInfo[RESULT_LABEL].positive.push("break");
          }
        }
      } catch (e) {
        console.log(e);
      }
    });
    this.drawing_panel.addEventListener("mouseout", () => {
      this.is_drawing = false;
      /*
        If This Is Another Stroke, Then Added A Seperator "break" To Indicate This Is Another Stroke,
        The Reason Is For Putting Back Scribble Onto The Canvas
      */
      try {
        if (this.keydown && this.allInfo[RESULT_LABEL] != null) {
          // Negative
          if (this.allInfo[RESULT_LABEL] != null) {
            this.allInfo[RESULT_LABEL].negative.push("break");
          }
        } else {
          // Positive
          if (this.allInfo[RESULT_LABEL] != null) {
            this.allInfo[RESULT_LABEL].positive.push("break");
          }
        }
      } catch (e) {
        console.log(e);
      }
    });
    // Keyboard Event For Negative Scribble
    document.addEventListener("keyup", (e) => {
      if (e.keyCode == 18) {
        this.keydown = false;

        // Change Cursor To Scribble Pen - Red
        displayPanel.style.cursor = GLOBAL_SETTING.Scribble_Pen_Cursor.red;
        // "url(./static/css/image/cursors/scribble-red-pen-25*25.png), auto";
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.keyCode == 18) {
        this.keydown = true;

        // Change Cursor To Scribble Pen - Green
        displayPanel.style.cursor = GLOBAL_SETTING.Scribble_Pen_Cursor.green;
        // "url(./static/css/image/cursors/scribble-green-pen-25*25.png), auto";
      }
    });
  };

  drawing = (e) => {
    if (!this.is_drawing || !this.pen_trigger) return;
    // Stop Drawing, Stop Function
    // document.addEventListener("keydown", (e) => console.log(e));

    if (this.keydown) {
      // negative scribble

      this.drawing_panel_ctx.beginPath();
      this.drawing_panel_ctx.strokeStyle = Scribble_Colour.negative; // Scribble Pen Colour

      // Start From
      this.drawing_panel_ctx.moveTo(this.LastX, this.LastY);

      // Go To
      this.drawing_panel_ctx.lineTo(e.offsetX, e.offsetY);
      this.drawing_panel_ctx.stroke();

      // Update LastX, LastY Position
      [this.LastX, this.LastY] = [e.offsetX, e.offsetY];
      if (this.allInfo[RESULT_LABEL] == null) {
        // First Time
        this.allInfo[RESULT_LABEL] = {
          positive: [],
          negative: [],
        };
      } else {
        this.allInfo[RESULT_LABEL].negative.push({
          x: this.LastX,
          y: this.LastY,
        });
      }
      return;
    }

    this.drawing_panel_ctx.beginPath();
    this.drawing_panel_ctx.strokeStyle = Scribble_Colour.positive; // Scribble Pen Colour

    // Start From
    this.drawing_panel_ctx.moveTo(this.LastX, this.LastY);

    // Go To
    this.drawing_panel_ctx.lineTo(e.offsetX, e.offsetY);
    this.drawing_panel_ctx.stroke();

    // Update LastX, LastY Position
    [this.LastX, this.LastY] = [e.offsetX, e.offsetY];

    // Store The Scribble Position
    if (this.allInfo[RESULT_LABEL] == null) {
      // First Time
      this.allInfo[RESULT_LABEL] = {
        positive: [],
        negative: [],
      };
    } else {
      this.allInfo[RESULT_LABEL].positive.push({
        x: this.LastX,
        y: this.LastY,
      });
    }
    // this.pointPositioin.push({ x: this.LastX, y: this.LastY });
    // this.allInfo.RESULT_LABEL.positive.push({ x: this.LastX, y: this.LastY });
    // this.pointPositioin.yArray.push(this.LastY);
  };
  // This Method Will Restore The Previous Scribble Onto The Canvas
  putBackScribble(arr, colour) {
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] == "break") continue;
      this.drawing_panel_ctx.beginPath();
      this.drawing_panel_ctx.moveTo(arr[i].x, arr[i].y);
      this.drawing_panel_ctx.lineTo(arr[i + 1].x, arr[i + 1].y);
      this.drawing_panel_ctx.strokeStyle = colour;
      this.drawing_panel_ctx.stroke();
    }
  }

  cleanUpScribbleFromCanvas() {
    this.drawing_panel_ctx.clearRect(
      0,
      0,
      this.drawing_panel.width,
      this.drawing_panel.height
    );
  }
  cleanUpScribbleForTheCurrentImage() {
    this.allInfo[RESULT_LABEL].positive = [];
    this.allInfo[RESULT_LABEL].negative = [];
    this.cleanUpScribbleFromCanvas();
  }
  cleanUpALL() {
    this.allInfo = {};
    this.cleanUpScribbleFromCanvas();
  }
}

// Select The Tab Elements
(() => {
  const MyTabs = {
    tabs: document.querySelectorAll("[data-tab-target]"),
    tabContents: document.querySelectorAll("[data-tab-content]"),
    init: function () {
      this.bindEvent(); // Change Tabs
    },
    bindEvent: function () {
      // Add Event Listener To Each Tab
      this.tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const target = document.querySelector(tab.dataset.tabTarget);
          this.tabContents.forEach((tabContent) => {
            tabContent.classList.remove("active");
          });
          this.tabs.forEach((tab) => {
            tab.classList.remove("active");
          });
          tab.classList.add("active");
          target.classList.add("active");
        });
      });
    },
  };

  MyTabs.init();
})();

// *** The Order In This AREA CANNOT CHANGE ***
// Inorder to have a sqaure, we need the width and then change the height
// First We Make Work-Space-1 Which Is The Drawing Area Square
const drawingPanel = document.querySelector(".work-place-1");
const drawingPanelWidth = drawingPanel.clientWidth;
drawingPanel.style.width = drawingPanelWidth + "px";
drawingPanel.style.height = drawingPanelWidth + "px";

// Second We Make Work-Space-2 Which Is The Displaying Area Square
const displayPanel = document.querySelector(".work-place-2");
displayPanel.style.width = drawingPanelWidth + "px";
displayPanel.style.height = drawingPanelWidth + "px";

// Layer 2
const layerPanel = document.querySelector("#layer2");
layerPanel.style.width = drawingPanelWidth + "px";
layerPanel.style.height = drawingPanelWidth + "px";

// *** The Order In This AREA CANNOT CHANGE ***

// Upload Image Then Display On The Canvas And DisPlaying Area
window.addEventListener("load", (e) => {
  // Single Picture Upload
  const singleFileUploadElement = document.querySelector("#single-upload");
  singleFileUploadElement.addEventListener("change", uploadImageToCanvas);

  // Multi Images Upload
  const multiUpload = document.querySelector("#multi-upload");
  multiUpload.addEventListener("change", uploadImageToCanvas);

  // This method will control to display the next image
  const nextButton = document.querySelector("#next-image");

  nextButton.addEventListener("click", (e) => {
    if (CSV_IMG_SWITCH) {
      // CSV
      CURRENTFILEINDEX++;
      // ABSOLUTE_PATH
      switchPic(CURRENTFILEINDEX, ABSOLUTE_PATH);
    } else {
      // Normal Image
      if (CURRENTFILEINDEX < MULTIFILES.length - 1) {
        CURRENTFILEINDEX++;
      } else {
        // No, No, No
        if (MULTIFILES.length == 1) {
          alert("You only have one image uploaded");
        } else if (MULTIFILES.length == 0) {
          alert("Please upload image first");
        } else {
          alert("This is the last Image");
        }
        return;
      }
      loadFileToCanvas(
        MULTIFILES[CURRENTFILEINDEX],
        (clear = false),
        (empty = true)
      );
    }
  });

  const backButton = document.querySelector("#back-image");
  backButton.addEventListener("click", () => {
    if (CSV_IMG_SWITCH) {
      // CSV
      // Hand The First image Case
      if (CURRENTFILEINDEX == 0) {
        alert("This is the first Image");
        return;
      }
      if (CURRENTFILEINDEX > 0) {
        CURRENTFILEINDEX--;
        // ABSOLUTE_PATH
        switchPic(CURRENTFILEINDEX, ABSOLUTE_PATH);
      }
    } else {
      // Normal Image
      if (CURRENTFILEINDEX > 0) {
        CURRENTFILEINDEX--;
      } else {
        // No, No, No
        if (MULTIFILES.length == 1) {
          alert("You only have one image uploaded");
        } else if (MULTIFILES.length == 0) {
          alert("Please upload image first");
        } else {
          alert("This is the first image");
        }
        return;
      }
      loadFileToCanvas(
        MULTIFILES[CURRENTFILEINDEX],
        (clear = false),
        (empty = true)
      );
    }
  });
});

// Original Image Above Feature Map
const aboveFeatureMap = document.querySelector("#feature-map-original");
aboveFeatureMap.height = aboveFeatureMap.width;

// Feature Map Size
let FEATUREMAP_HEIGHT;
const featureMapArea = document.querySelector("#feature-map-canvas");
FEATUREMAP_HEIGHT = featureMapArea.width;
featureMapArea.height = featureMapArea.width;

// Drawing Panel - On The Left
const drawingPanel1 = new DrawingObject("drawing-area");
drawingPanel1.init();
// Scribble Panel - On The Right - #layer3
const drawingPanel2 = new ScribbleObject("layer3");
drawingPanel2.init();

// Drwing pen config
const penControls = document.querySelectorAll(".drawing-pens-control input");
penControls.forEach((control) =>
  control.addEventListener("change", handleUpdate)
);
// Drawing Pen Config Finished

// Drawing Pen Trigger
const drawingPenTrigger = document.querySelector("#trigger-canvas");
drawingPenTrigger.addEventListener("click", () => {
  // TODO: Maybe Change Cursor To A Pen
  if (drawingPanel1.pen_trigger) {
    alert("Now you cannot draw");
  } else {
    alert("Now you cann draw");
  }
  drawingPanel1.pen_trigger = !drawingPanel1.pen_trigger;
});
// Scribble Trigger
const scribbleTrigger = document.querySelector("#sribble-trigger");
scribbleTrigger.addEventListener("click", () => {
  if (RESULT_LABEL == undefined) {
    alert("Please Submit The Image First");
    return;
  }
  if (drawingPanel2.pen_trigger) {
    alert("Now you cannot scribble");
  } else {
    alert("Now you can scribble");
  }
  drawingPanel2.pen_trigger = !drawingPanel2.pen_trigger;
});

// Clean Drawing
const eraseAll = document.querySelector("#clean-panel-1");
eraseAll.addEventListener("click", cleanAllandReDraw);

// Change OverLay Opacity
const overlayControls = document.querySelector(".overlay-control input");
overlayControls.addEventListener("change", handleOpacityChange);
overlayControls.addEventListener("mousemove", handleOpacityChange);
// overlay-control

// CSV Section
let csvFile; // User Uploaded CSV File
let ABSOLUTE_PATH; // The Absolute Path To The Folder, Provided By The User
const csvUploadInput = document.querySelector("#CSV");
csvUploadInput.addEventListener("change", (e) => {
  csvFile = csvUploadInput.files[0];
});
const fileUploadButton = document.querySelector("#file-upload-button");
fileUploadButton.addEventListener("click", () => {
  // Store The Absolute Path To Global Variable
  CURRENTFILEINDEX = 0; // Reset CURRENTFILEINDEX
  ABSOLUTE_PATH = document.querySelector("#path-to-folder").value;
  console.log(ABSOLUTE_PATH);
  // Error Handling First
  if (!csvFile) {
    console.log("no file");
    alert("Please Upload CSV File First");
    return;
  }
  if (!ABSOLUTE_PATH.length) {
    alert("Please Enter The Absolute Path To The Dataset Folder");
    return;
  }

  // Submit For CSV File
  let fd = new FormData();
  console.log(csvFile.type);
  console.log(csvFile);

  fd.append("csvFile", csvFile);
  fd.append("current_index", CURRENTFILEINDEX);
  fd.append("abs_path", ABSOLUTE_PATH);
  let xhr = new XMLHttpRequest();
  xhr.responseType = "blob";
  xhr.open("POST", "/subCSV/", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      /**
       * BJ为BLOB类型 result是String 的label 后面交给你去拿了！！！
       *
       * */
      let obj = new Blob([xhr.response]);
      // Convert Obj to Blob
      console.log(obj);
      obj.lastModifiedDate = new Date();
      let blobFileName = xhr.getResponseHeader("fileName");
      obj.name = blobFileName;
      // TODO: Remove The Uncessary Comments Later
      console.log("obj >>>");
      console.log(obj);
      // console.log(result);
      // Assign File Obj To Global Variable CSV_IMAGE_FILE
      CSV_IMAGE_FILE = obj;
      // Upload File To All The Canvas
      let result = xhr.getResponseHeader("labelName");
      GROUND_TRUTH = result;
      loadFileToCanvas(obj);
    }
  };
  xhr.send(fd);
});

document.getElementById("submitPic").addEventListener("click", () => {
  // console.log("READY >>>>>> " + Date.now());
  // if (CSV_IMG_SWITCH == false) {
  snackBarDisplay("Fetching Results, Please Wait");
  let fd = new FormData(); // 相当于是一个 Form 表单
  updateImage(); //Got the data from the canvas

  fd.append("width", upload_image.length);
  fd.append("height", upload_image[0].length);
  fd.append("imgData", JSON.stringify(upload_image));
  fd.append("netName", GLOBAL_SETTING.userSelectedNetwork);
  console.log("hello -----> current index is: " + CURRENTFILEINDEX);
  let tracking_index = CURRENTFILEINDEX;

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/upload_file/", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      var obj = JSON.parse(xhr.responseText); // 将获取的源代码转化为JSON格式
      console.table(obj);
      RESULT_LABEL = obj[0].label[0];
      // Update Leader Board
      updateLeaderBoard(obj);

      console.log("hello again -----> current index is: " + CURRENTFILEINDEX);
      disCAM(RESULT_LABEL, tracking_index);
      // disResult(obj); // Display the current result
    }
  };
  xhr.send(fd);
});

class LeaderBoardObj {
  constructor(label, rate, rank) {
    this.label = label;
    this.rate = rate;
    this.rank = rank;
  }
}

// CAM
const camDropDown = document.querySelector("#cam-option");
const camDropDownList = document.querySelector("#dropdown3");
for (let i = 0; i < Object.keys(CAM_OPTION).length; i++) {
  if (i == 0) continue; // The 0th Is Not An Option
  console.log(CAM_OPTION[i]);
  let li = document.createElement("li");
  let href_a = document.createElement("a");
  href_a.innerHTML = `${i}. ${CAM_OPTION[i]}`;
  // TODO: Finish Callback Function Instead Of Alert
  href_a.setAttribute("onclick", `sendCAMtoBackEnd(${i})`);
  li.appendChild(href_a);
  camDropDownList.appendChild(li);
}
// Colour Map Option
const colourMapDropDown = document.querySelector("#color-dropdown");
for (let i = 0; i < COLOUR_MAP_OPTION.length; i++) {
  let li = document.createElement("li");
  let href_a = document.createElement("a");
  href_a.innerHTML = COLOUR_MAP_OPTION[i];
  // TODO: Finish Callback Function Instead Of Alert
  href_a.setAttribute(
    "onclick",
    'userSelectedColourMapOption("' + `${COLOUR_MAP_OPTION[i]}` + '")'
  );
  li.appendChild(href_a);
  colourMapDropDown.appendChild(li);
}

function sendCAMtoBackEnd(i) {
  CURRENT_CAM = i;
  let result_label = RESULT_LABEL;
  let tracking_index = CURRENTFILEINDEX;
  const msg = "Fetching Option: " + CAM_OPTION[i];
  snackBarDisplay(msg);
  setTimeout(() => {
    disCAM(result_label, tracking_index);
  }, 1000);
  console.log(i);
}

function userSelectedColourMapOption(option) {
  console.log(option);
  console.log(">>>>>>");
  COLOUR_MAP_VALUE = option;
  const msg = "You have selected Colour map: " + COLOUR_MAP_VALUE;
  snackBarDisplay(msg);
}
// CAM

// Snack Bar Display Msg
function snackBarDisplay(msg, duration = 3000) {
  // Default display duration is 3s
  const x = document.getElementById("snackbar");
  x.className = "show";
  x.innerHTML = msg;
  setTimeout(function () {
    x.className = x.className.replace("show", "");
  }, duration);
}

// Switch Image Upload - CSV
let CSV_IMG_SWITCH = false;
const upload_image_section = document.querySelector(".upload-image-section");
const upload_csv_section = document.querySelector(".upload-csv-section");
const csv_image_switch = document.querySelector(".switch input");
csv_image_switch.addEventListener("change", (e) => {
  CSV_IMG_SWITCH = !CSV_IMG_SWITCH;
  if (CSV_IMG_SWITCH) {
    // display CSV
    upload_image_section.style.display = "none";
    upload_csv_section.style.display = "block";
  } else {
    // display img upload
    upload_image_section.style.display = "block";
    upload_csv_section.style.display = "none";
  }
});
// Switch Image Upload - CSV

// TODO: This is to display the network visualization
document.getElementById("disNetwork").addEventListener("click", () => {
  let fd = new FormData(); //Like a form data

  fd.append("name", neural_network_value);

  let xhr = new XMLHttpRequest();

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
});

// Save Scribble
const saveScribbleBtn = document.querySelector("#save-scribble");
saveScribbleBtn.addEventListener("click", () => {
  // let fileName = MULTIFILES[CURRENTFILEINDEX].name;
  let fileName;
  if (CSV_IMG_SWITCH) {
    fileName = CSV_IMAGE_FILE.name;
  } else {
    fileName = MULTIFILES[CURRENTFILEINDEX].name;
  }
  /*
    originalImageHeight, originalImageWidth --> 原图的Height/ Width

    drawingPanel2.pointPositioin --> 这个Array里面有所有点的位置 都是以object的形式存在的

    fileName --> 当前文件的名字，后台存的时候可以用file名字，这里提供的是带后缀的文件名
  */

  updateImage(); //Got the data from the canvas

  $.ajax({
    url: "/saveScribble/",
    type: "POST",
    data: {
      /* Send original Image Height and Width */
      originalImageHeight: originalImageHeight,
      originalImageWidth: originalImageWidth,
      /* Send the drawing Panel Width*/
      drawingPanelWidth: drawingPanelWidth.toString(),
      /* Send File Name */
      fileName: fileName,
      /* Send this all Information including class label and negative and positive point position   */
      allInfo: JSON.stringify(drawingPanel2.allInfo),
      /* Send the pic data (pic in panel) */
      imgData: JSON.stringify(upload_image),
    },
    xhrFields: {
      //确定后端返回的一定是文件类型
      //To make sure the return style is BLOB('file)
      responseType: "blob",
    },
    success: function (data) {
      //这里需要先创建一个<a>标签 然后使用js把它激活 响应Chrome的下载模块
      //Firstly, <a> has to be implemented to active the download function in browser.
      console.log(data);
      let a = document.createElement("a");
      let url = window.URL.createObjectURL(data);
      a.href = url;
      a.download = fileName + ".json";
      document.body.append(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // TODO: Edit Msg
      // Snack Bar Msg Goes Here
      //  这里可以加一些用户的提示 让用户知道是否成功下载文件
      snackBarDisplay("Downloading...");
    },
  });
});

// Clean Up Scribble If Draw Wrong
const cleanUpScribbleBtn = document.querySelector("#clean-up-scribble");
cleanUpScribbleBtn.addEventListener("click", () => {
  drawingPanel2.cleanUpScribbleForTheCurrentImage();
});

// Customize Network
const uploadCustomizeNetworkFileBtn = document.querySelector(
  "#custom-network-file-upload"
);
uploadCustomizeNetworkFileBtn.addEventListener("click", () => {
  const allFilesObj = document.querySelectorAll(
    // Select all the files
    "#upload-arch-file, #upload-weights-file, #upload-label-file"
  );
  // Clean up allFiles to prevent bugs
  const allFiles = [];
  /*
    0 is arch
    1 is weights
    2 is class label
  */
  allFilesObj.forEach((item) => {
    /* 
      Some error handling here to prevent user did not submit enough file
    */
    if (item.files[0] == undefined) {
      snackBarDisplay(
        "Error! Missing Fatal Files, Please Check All Files",
        5000
      );
      return;
    }
    // Get each file
    console.log(item.files[0]);
    allFiles.push(item.files[0]);
  });

  // Send to back end to process
  /* 
  Docs:
    allFiles is an array which has all the files
    allFiles[0] - arch 网络结构
    allFiles[1] - weights 
    allFiles[2] - class label
  */
  console.log(allFiles);

  //Sending the request to back-end
  let fd = new FormData(); //Like a form data

  fd.append("arch", allFiles[0]);
  fd.append("weights", allFiles[1]);
  fd.append("label", allFiles[2]);

  let xhr = new XMLHttpRequest();

  xhr.open("POST", "/processFile/", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      let obj = xhr.responseText; // 将获取的源代码转化为JSON格式
      console.log(obj);
    }
  };
  xhr.send(fd); // 不能直接发文件对象到后台，但是发 fd 这个对象是可以的
});

// Custom Network Dropdown For User To Select
let networkSelectionDropDown = document.querySelector("#dropdown2");
GLOBAL_SETTING.NEURAL_NETWORK_OPTION.forEach((item) => {
  let li = document.createElement("li");
  let href_a = document.createElement("a");
  href_a.innerHTML = `${item}`;
  // TODO: Finish Callback Function Instead Of Alert
  href_a.addEventListener("click", (e) => {
    e.preventDefault();
    userSelectedNetworkOption(item);
  });
  li.appendChild(href_a);
  networkSelectionDropDown.appendChild(li);
});

function userSelectedNetworkOption(networkName) {
  GLOBAL_SETTING.userSelectedNetwork = networkName;
  let fileUploadArea = document.querySelector("#files-upload-area");
  if (GLOBAL_SETTING.userSelectedNetwork == "custom") {
    fileUploadArea.style.display = "block";
    snackBarDisplay(
      "You Selected Custom Network Option, Please Uplaod All The Files"
    );
  } else {
    fileUploadArea.style.display = "none";
    snackBarDisplay(`You Have Selected ${networkName}`);
  }
}
