// Global Variables
MULTIFILES = [];
CURRENTFILEINDEX = 0; // current file load on the canvas
// For PEN Width And Fill Colour
LINE_WIDTH = 5;
FILL_COLOUR = "#BADA55";
PEN_TRIGGER = false;

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
    loadFileToCanvas(MULTIFILES[CURRENTFILEINDEX]);
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
    loadFileToCanvas(MULTIFILES[CURRENTFILEINDEX]);
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

// Testing Select Table
const leaderBoardCurrent = document.querySelectorAll(
    "#leader-board-current td"
);
console.log(leaderBoardCurrent);
let first_row = [];
for (let index = 0; index < 15; index += 3) {
  first_row.push(leaderBoardCurrent[index]);
}
console.log(first_row);
let dog_breed = ["corgi", "husky", "golden", "bull", "berman"];
let control_index = 0;
first_row.forEach((item) => {
  item.innerHTML = dog_breed[control_index];
  control_index++;
});
