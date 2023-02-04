"use strict";

addEventListener("load", main);

function main() {
  const GCStorage = chrome.storage.local
  GCStorage.get(location.href, (res) => {
    const markBarHTML = '<div id="extension_markBar"></div></div>'
    document.body.insertAdjacentHTML("beforeend", markBarHTML);
    const markBar = document.getElementById("extension_markBar")
    markBar.style.height = innerHeight + "px"
    let marks

    let markData = res[location.href] ? res[location.href] : []
    console.table(markData);
    loadMarkData(markData);

    let holdTime = 0
    let checkHoldIntvl
    chrome.runtime.onMessage.addListener((request) => { if (request.message == "addMark") addMark(); });
    addEventListener("mousemove", toggleUiVis);

    let prePageHeight = document.documentElement.clientHeight
    setInterval(reloadMark, 100);
    let preUrl = location.href
    setInterval(changeMarkData, 100);

    function reloadMark() {
      if (prePageHeight !== document.documentElement.scrollHeight) {
        markBar.innerHTML = ""
        loadMarkData(markData);
        prePageHeight = document.documentElement.scrollHeight
      }
    }

    function changeMarkData() {
      if (preUrl !== location.href) {
        GCStorage.get(location.href, (res) => {
          markData = res[location.href] ? res[location.href] : []
          markBar.innerHTML = ""
          loadMarkData(markData);
        });
        preUrl = location.href
      }
    }

    function loadMarkData(data) {
      for (let count = 0; count < data.length; count++) {
        addMarkElem(data[count][0], data[count][1], false);
      }
      recfgEventListeners();
    }

    function addMark() {
      let label = prompt("ラベルを入力してください", "Mark")
      if (label == null) return;
      if (label == "") label = "Mark"
      addMarkElem(scrollY, label, true);

      markData.push([scrollY, label]);
      GCStorage.set(JSON.parse(`{"${location.href}":${JSON.stringify(markData)}}`));

      recfgEventListeners();
    }

    function addMarkElem(scrollY, label, firstState) {
      const markY = scrollY / (document.documentElement.scrollHeight - innerHeight) * (innerHeight - 36)
      if (isNaN(markY)) markY = 0
      const opacity = firstState ? 1 : 0
      const visibility = firstState ? "visible" : "hidden"
      markBar.insertAdjacentHTML("afterbegin", `<div class="extension_mark" style="top: ${markY}px; opacity: ${opacity}; visibility: ${visibility};" data-scroll="${scrollY}" data-id="${markData.length - 1}">${label}</div>`);
    }

    function recfgEventListeners() {
      marks = document.getElementsByClassName("extension_mark");
      removeEventListenerAll(marks, "mousedown");
      removeEventListenerAll(marks, "mouseout");
      removeEventListenerAll(marks, "mouseup");
      addEventListenerAll(marks, "mousedown", checkHold);
      addEventListenerAll(marks, "mouseout", cancelCheckHold);
      addEventListenerAll(marks, "mouseup", jumpMark);
    }

    function checkHold() {
      holdTime = 0;
      checkHoldIntvl = setInterval(checkHoldAndDeleteMark, 100, this.elem);
    }

    function cancelCheckHold() {
      clearInterval(checkHoldIntvl);
    }

    function checkHoldAndDeleteMark(elem) {
      holdTime += 0.1
      if (holdTime > 1) {
        clearInterval(checkHoldIntvl);
        let willDelete = confirm("このマークを削除しますか？")
        if (willDelete) {
          elem.remove();
          markData.splice(elem.dataset.id, 1);
          GCStorage.set(JSON.parse(`{"${location.href}":${JSON.stringify(markData)}}`));
        }
      }
    }

    function jumpMark() {
      if (holdTime <= 1) {
        clearInterval(checkHoldIntvl);
        scroll(0, Number(this.elem.dataset.scroll));
      }
    }

    function toggleUiVis(event) {
      const marksArr = Array.prototype.slice.call(marks)
      marksArr.forEach(elem => {
        if (event.clientX > document.documentElement.clientWidth - 10 && elem.style.opacity == "0") {
          elem.style.opacity = "1"
          elem.style.visibility = "visible"
        }
        if (event.clientX <= document.documentElement.clientWidth - 200 && elem.style.opacity == "1") {
          elem.style.opacity = "0"
          elem.style.visibility = "hidden"
        }
      });
    }


    //ユーティリティ
    function addEventListenerAll(elems, event, func) {
      const elemsArr = Array.prototype.slice.call(elems)
      elemsArr.forEach(elem => {
        elem.addEventListener(event, { elem: elem, handleEvent: func });
      });
    }

    function removeEventListenerAll(elems, event) {
      const elemsArr = Array.prototype.slice.call(elems);
      elemsArr.forEach(elem => {
        elem.removeEventListener(event, main);
      });
    }
  });
}