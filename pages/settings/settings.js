const { remote, ipcRenderer: ipc } = require("electron");
const settingsProvider = require("../../providers/settingsProvider");
const __ = require("../../providers/translateProvider");
const { isLinux } = require("../../utils/systemInfo");
const fs = require("fs");

const {
  companionUrl,
  companionWindowTitle,
  companionWindowSettings
} = require("../../server.config");

const elementSettingsCompanionApp = document.getElementById(
  "COMPANION_SERVER_INFO"
);
const elementRangeZoom = document.getElementById("range-zoom");
const elementBtnAppRelaunch = document.getElementById("btn-relaunch");
const elementBtnOpenEditor = document.getElementById("btn-editor-custom-theme");
const elementBtnLastFmLogin = document.getElementById("btn-last-fm-login");

if (isLinux()) {
  document
    .getElementById("i18n_LABEL_SETTINGS_TAB_GENERAL_SELECT_TITLEBAR_TYPE_NICE")
    .remove();
}

document.addEventListener("DOMContentLoaded", function() {
  initElement("settings-keep-background", "click");
  initElement("settings-show-notifications", "click");
  initElement("settings-start-on-boot", "click");
  initElement("settings-start-minimized", "click");
  initElement("settings-companion-server", "click");
  initElement("settings-continue-where-left-of", "click");
  initElement("settings-shiny-tray", "click", () => {
    ipc.send("update-tray");
  });
  initElement("settings-discord-rich-presence", "click");
  initElement("settings-app-language", "change", showRelaunchButton);
  initElement("settings-lyrics-provider", "change");
  initElement("settings-clipboard-read", "click", () => {
    ipc.send("switch-clipboard-watcher");
  });
  initElement("titlebar-type", "change", showRelaunchButton);
  initElement("settings-custom-theme", "click");
  initElement("settings-last-fm-scrobbler", "click", () => {
    var login = settingsProvider.get("last-fm-login");
    if (login.username == "") {
      ipc.send("show-last-fm-login");
    }
  });
  initElement("settings-rainmeter-web-now-playing", "click");
  initElement("settings-enable-double-tapping-show-hide", "click");

  initElement("settings-miniplayer-always-top", "click");
  initElement("settings-miniplayer-always-show-controls", "click");
  initElement("settings-miniplayer-paint-controls", "click");
  initElement("settings-miniplayer-size", "change");

  M.FormSelect.init(document.querySelectorAll("select"), {});
  M.Tabs.init(document.getElementsByClassName("tabs")[0], {});

  document.getElementById("content").classList.remove("hide");
});

if (elementSettingsCompanionApp) {
  elementSettingsCompanionApp.addEventListener("click", function() {
    window.open(companionUrl, companionWindowTitle, companionWindowSettings);
  });
}

if (elementRangeZoom) {
  elementRangeZoom.addEventListener("input", function() {
    document.getElementById("range-zoom-value").innerText = this.value;
    settingsProvider.set("settings-page-zoom", this.value);
    ipc.send("settings-changed-zoom", this.value);
  });
}

if (elementBtnOpenEditor) {
  elementBtnOpenEditor.addEventListener("click", function() {
    ipc.send("show-editor-theme");
  });
}

if (elementBtnLastFmLogin) {
  elementBtnLastFmLogin.addEventListener("click", function() {
    ipc.send("show-last-fm-login");
  });
}

if (elementBtnAppRelaunch) {
  elementBtnAppRelaunch.addEventListener("click", function() {
    relaunch();
  });
}

if (process.platform !== "darwin") {
  const macSpecificNodes = document.getElementsByClassName("macos-specific");
  for (let i = 0; i < macSpecificNodes.length; i++) {
    macSpecificNodes.item(i).classList.add("hide");
  }
}

loadSettings();
__.loadi18n();

function showRelaunchButton() {
  elementBtnAppRelaunch.classList.remove("hide");
}

/**
 * Initialize element and create listener for it
 * @param {*} elementName
 * @param {*} eventType
 * @param {*} fn
 */
function initElement(elementName, eventType, fn) {
  if (fn === undefined) {
    fn = () => {};
  }
  const element = document.getElementById(elementName);

  if (element) {
    loadValue(element, elementName, eventType);
    createListener(element, elementName, eventType, fn);
  }
}

/**
 *
 * @param {*} element
 * @param {*} settingsName
 * @param {*} eventType
 * @param {*} fn
 */
function createListener(element, settingsName, eventType, fn) {
  element.addEventListener(eventType, function() {
    switch (eventType) {
      case "click":
        settingsProvider.set(settingsName, this.checked);
        ipc.send("settings-value-changed", {
          key: settingsName,
          value: this.checked
        });
        break;

      case "change":
        settingsProvider.set(settingsName, this.value);
        ipc.send("settings-value-changed", {
          key: settingsName,
          value: this.value
        });
        break;
    }
    fn();
  });
}

function loadValue(element, settingsName, eventType) {
  switch (eventType) {
    case "click":
      element.checked = settingsProvider.get(settingsName, false);
      break;

    case "change":
      element.value = settingsProvider.get(settingsName);
      break;
  }
}

function loadSettings() {
  // readLocales();

  if (settingsProvider.get("settings-companion-server")) {
    // document.getElementById("COMPANION_SERVER_INFO").classList.remove("hide");
  }

  if (settingsProvider.get("settings-page-zoom")) {
    document.getElementById("range-zoom").value = settingsProvider.get(
      "settings-page-zoom"
    );
    document.getElementById(
      "range-zoom-value"
    ).innerText = settingsProvider.get("settings-page-zoom");
  }

  document.getElementById("app-version").innerText = remote.app.getVersion();

  // Disable unsupported platforms which may get an API later
  if (!["darwin", "win32"].includes(process.platform)) {
    const startOnBootEl = document.getElementById("settings-start-on-boot");
    startOnBootEl.checked = false;
    startOnBootEl.setAttribute("disabled", "disabled");
  }
}

function relaunch() {
  remote.app.relaunch();
  remote.app.exit(0);
}

function readLocales() {
  fs.readdir(__dirname, (err, files) => {
    console.log(files);
  });
}
