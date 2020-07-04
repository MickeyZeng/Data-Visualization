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
let LeaderBoardResult = []; // For Leader Board

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

document.getElementById("submitPic").addEventListener("click", () => {
  // console.log("READY >>>>>> " + Date.now());

  let fd = new FormData(); // 相当于是一个 Form 表单

  // console.log(upload_image.length);
  // console.log(upload_image[0].length);

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
      let resLabel = obj[0].label[0];
      console.log(resLabel);
      // Update Leader Board
      updateLeaderBoard(obj);

      console.log("hello again -----> current index is: " + CURRENTFILEINDEX);
      disCAM(resLabel, tracking_index);
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
