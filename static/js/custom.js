// Global Variables
MULTIFILES = [];
CURRENTFILEINDEX = 0; // current file load on the canvas

let upload_image; // the 3d array for pic Data
let CANVAS1DATA;

let modelMode = true; // True is 2D & False is 3D
let LeaderBoardResult = []; // For Leader Board

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
let NEURAL_NETWORK_OPTION = [
  "resnet50",
  "resnet18",
  "resnet34",
  "resnet101",
  "resnet152",
];

let CURRENT_CAM = 1; // CAM Starts From 1 To 15
let RESULT_LABEL;

// Drawing Function - For Drawing On The Image
class DrawingObject {
  constructor(panelID, pen_trigger = false) {
    this.drawing_panel = document.querySelector(`#${panelID}`);
    this.drawing_panel_ctx = this.drawing_panel.getContext("2d");
    this.drawing_panel.width = drawingPanelWidth;
    this.drawing_panel.height = drawingPanelWidth;
    (this.is_drawing = false), (this.LastX = 0), (this.LastY = 0);
    this.drawing_panel_ctx.strokeStyle = "#BADA55";
    this.drawing_panel_ctx.lineJoin = "round";
    this.drawing_panel_ctx.lineCap = "round";
    this.drawing_panel_ctx.lineWidth = 5;
    this.pen_trigger = pen_trigger;
  }
  init = () => {
    this.drawing_panel.addEventListener("mousedown", (e) => {
      this.is_drawing = true;
      [this.LastX, this.LastY] = [e.offsetX, e.offsetY];
      // TODO: Remove This Console.log After Label Function
      console.log(this.LastX, this.LastY);
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

    this.drawing_panel_ctx.beginPath();

    // Start From
    this.drawing_panel_ctx.moveTo(this.LastX, this.LastY);

    // Go To
    this.drawing_panel_ctx.lineTo(e.offsetX, e.offsetY);
    this.drawing_panel_ctx.stroke();

    // Update LastX, LastY Position
    [this.LastX, this.LastY] = [e.offsetX, e.offsetY];
  };
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
  });

  const backButton = document.querySelector("#back-image");
  backButton.addEventListener("click", () => {
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
// Scribble Panel - On The Right - #layer2
const drawingPanel2 = new DrawingObject("layer2");
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
console.log(overlayControls);
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
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/subCSV/", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      let obj = JSON.parse(xhr.responseText);
      // console.log(obj);
      // let testingImg = "file://" + ABSOLUTE_PATH + "/" + obj[1][0];
      // console.log(testingImg);
      // const testing_img_tag = document.querySelector('#testing-image')
      // document.querySelector("#testing-img").src = testingImg;
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
  fd.append("netName", neural_network_value);
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
  href_a.innerHTML = CAM_OPTION[i];
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
