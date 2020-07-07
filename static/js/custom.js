// Global Variables
MULTIFILES = [];
CURRENTFILEINDEX = 0; // current file load on the canvas
// For PEN Width And Fill Colour
LINE_WIDTH = 5;
FILL_COLOUR = "#BADA55";
PEN_TRIGGER = false;

let upload_image; // the 3d array for pic Data
let CANVAS1DATA;

let neural_network_value = "resnet50";
let modelMode = true; // True is 2D & False is 3D
let LeaderBoardResult = []; // For Leader Board
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
let CURRENT_CAM = 1;
let RESULT_LABEL;

let COLOUR_MAP_VALUE = "twilight";

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

// Drawing Function - For Drawing On The Image
let IS_DRAWING = false;
let LastX = 0;
let LastY = 0;

const Drawing_Panel = document.querySelector("#drawing-area");
const Drawing_panel_CTX = Drawing_Panel.getContext("2d");
Drawing_Panel.width = drawingPanelWidth;
Drawing_Panel.height = drawingPanelWidth;
Drawing_panel_CTX.strokeStyle = FILL_COLOUR;
Drawing_panel_CTX.lineJoin = "round";
Drawing_panel_CTX.lineCap = "round";
Drawing_panel_CTX.lineWidth = LINE_WIDTH;

Drawing_Panel.addEventListener("mousedown", (e) => {
  IS_DRAWING = true;
  [LastX, LastY] = [e.offsetX, e.offsetY];
  // TODO: Remove This Console.log After Label Function
  console.log(LastX, LastY);
});

Drawing_Panel.addEventListener("mousemove", drawing);
Drawing_Panel.addEventListener("mouseup", () => (IS_DRAWING = false));
Drawing_Panel.addEventListener("mouseout", () => (IS_DRAWING = false));
// Drawing Finished

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
  if (PEN_TRIGGER) {
    alert("Now you cannot draw");
  } else {
    alert("Now you cann draw");
  }
  PEN_TRIGGER = !PEN_TRIGGER;
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

let csvFile;
const csvUploadInput = document.querySelector("#CSV");
csvUploadInput.addEventListener("change", (e) => {
  csvFile = csvUploadInput.files[0];
});

document.getElementById("submitPic").addEventListener("click", () => {
  // console.log("READY >>>>>> " + Date.now());
  if (CSV_IMG_SWITCH == false) {
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
  } else {
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
        console.log(obj);
      }
    };
    xhr.send(fd);
  }
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

function sendCAMtoBackEnd(i) {
  CURRENT_CAM = i;
  let result_label = RESULT_LABEL;
  let tracking_index = CURRENTFILEINDEX;
  disCAM(result_label, tracking_index);
  console.log(i);
}
// CAM

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
