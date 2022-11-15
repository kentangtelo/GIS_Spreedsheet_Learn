const mappa = new Mappa("Leaflet");

const baseSheet =
  "https://sheets.googleapis.com/v4/spreadsheets/1HVxkG5Cl0RW_z4nscFZcEo48Ne1oyFLlofTWu7atu9Y/values";
const apiKey = "AIzaSyCFdDW8mrf9TJ7HEjzkXqFb42xlbqq8UAo";

const defaultColor = "#007bff";
const NUM_POSSIBLE_HUE = 360; // 6digit hexadecimal color

const TANPA_KATEGORI = "Tanpa Kategori";
const TANPA_WILAYAH = "Tanpa Wilayah";

let canvas;
let width;
let height;

let kategori;
let categoryCounter = {};
let wilayahCounter = {};
const showAllCategoryDefault = true;
let categoryToShow = [];
let poiAll = [];
let itemsToShow = [];
let colorCategory = {};

let isLoading = true;

let currentLat, currentLng;
let locatorSvg;

/** GPS */
function showCurrentLocation() {
  if (navigator.geolocation) {
    try {
      navigator.geolocation.watchPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          if (latitude == undefined || longitude == undefined) return;
          currentLat = latitude;
          currentLng = longitude;
          console.log("updated location");
        },
        (error) => {
          console.log("failed getting current position");
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } catch (error) {}
  }
}

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
    showCurrentLocation();
  } else {
    // Do nothing
  }
};

function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateCategoryColor(allCategory) {
  const diff = NUM_POSSIBLE_HUE / (allCategory.length + 2);
  for (let i = 0; i < allCategory.length; i++) {
    const it = allCategory[i];
    const colorNumber = Math.floor(diff * (i + 1));
    const color = hslToHex(colorNumber, 50, 50);
    colorCategory[it.Nama] = color;
  }
  colorCategory[TANPA_KATEGORI] = hslToHex(0, 50, 50);
}
/** End Color */

/** Action */
document.getElementById("btn-check").addEventListener("click", () => {
  let els = document.querySelectorAll(".categoryaja");
  for (it of els) {
    it.checked = true;
    if (it.classList.contains("jalanCb")) {
    } else {
      categoryToShow.push(it.id);
    }
  }
  refreshItemsToShow();
});

document.getElementById("btn-uncheck").addEventListener("click", () => {
  let els = document.querySelectorAll(".categoryaja");
  for (it of els) {
    it.checked = false;
    console.log({ id: it.id });
    if (categoryToShow.includes(it.id)) {
      categoryToShow.splice(categoryToShow.indexOf(it.id), 1);
    }
  }
  refreshItemsToShow();
});
/** End Action */

function refreshItemsToShow() {
  itemsToShow = [];
  itemsToShow = poiAll.filter((v) => {
    if (
      categoryToShow.includes(v.Kategori) &&
      categoryToShow.includes(v.Wilayah)
    ) {
      return true;
    }

    return false;
  });
}

function onclickCheckbox(params) {
  const checked = params.target.checked;
  if (checked) {
    // Become checked
    categoryToShow.push(params.target.id);
  } else {
    categoryToShow.splice(categoryToShow.indexOf(params.target.id), 1);
  }

  refreshItemsToShow();
}

function mouseClicked() {
  ellipse(mouseX, mouseY, 300, 300);

  for (let i = 0; i < itemsToShow.length; i++) {
    const it = itemsToShow[i];
    if (!it.drawn || !it.drawn.x || !it.drawn.y) {
      continue;
    }

    const _d = dist(mouseX, mouseY, it.drawn.x, it.drawn.y);

    if (_d <= it.drawn.hb) {
      var modal = document.getElementById("myModal");
      var span = document.getElementsByClassName("close")[0];

      modal.style.display = "block";

      span.onclick = function () {
        modal.style.display = "none";
      };

      window.onclick = function (event) {
        if (event.target == modal) {
          modal.style.display = "none";
        }
      };

      const modalDetail = document.getElementById("modal-detail");
      if (it.Deskripsi && it.Deskripsi.length > 0) {
        var md = window.markdownit();
        fullContent = md.render(it.Deskripsi);
        // modalDetail.innerHTML = "";
        modalDetail.innerHTML = fullContent;

        var hrEl = document.createElement("hr");
        modalDetail.prepend(hrEl);
      } else {
        modalDetail.innerHTML = "";
      }

      var titleEl = document.createElement("h3");
      titleEl.innerText = it.Nama ?? "Tanpa Nama";

      var kategoriEl = document.createElement("h6");
      if (it.Kategori) {
        kategoriEl.innerHTML = "<span>Kategori:</span> " + it.Kategori;
      } else {
        kategoriEl.innerHTML = "<span>Kategori:</span> Tanpa Kategori";
      }

      var wilayahEl = document.createElement("h6");
      if (it.Wilayah) {
        wilayahEl.innerHTML = "<span>Wilayah:</span> " + it.Wilayah;
      } else {
        wilayahEl.innerHTML = "<span>Wilayah:</span> -";
      }

      var latlngEl = document.createElement("h6");
      let directionEl = document.createElement("a");
      if (it.Lat && it.Lon) {
        latlngEl.innerHTML = "<span>Lat Lon:</span> " + it.Lat + ", " + it.Lon;
        directionEl.text = "Direction";
        directionEl.href =
          "https://www.google.com/maps/dir/?api=1&destination=" +
          it.Lat +
          "," +
          it.Lon;
      } else {
        latlngEl.innerHTML = "<span>Lat Lon:</span> Belum ditambahkan";
      }

      modalDetail.prepend(directionEl);
      modalDetail.prepend(latlngEl);
      modalDetail.prepend(wilayahEl);
      modalDetail.prepend(kategoriEl);
      modalDetail.prepend(titleEl);

      // prevent default
      return true;
    }
  }
}

function TambahCheckBox(id, text, containerId, color) {
  var _cb = document.createElement("INPUT");
  _cb.setAttribute("type", "checkbox");
  _cb.setAttribute("id", id);
  _cb.classList.add("categoryandwilayah");
  if (showAllCategoryDefault) _cb.defaultChecked = true;
  _cb.addEventListener("click", onclickCheckbox);

  if (containerId == "kategori") {
    _cb.classList.add("categoryaja");
  }

  var _label = document.createElement("label");
  _label.setAttribute("for", id);
  _label.innerText = text;

  var _cont = document.createElement("div");
  _cont.appendChild(_cb);
  _cont.appendChild(_label);

  var _count = document.createElement("span");
  if (id == TANPA_KATEGORI && categoryCounter[TANPA_KATEGORI] == null) {
    _count.innerText = " (0)";
  } else if (id == TANPA_KATEGORI) {
    _count.innerText = " (" + wilayahCounter[TANPA_KATEGORI] + ")";
  } else if (id == TANPA_WILAYAH) {
    _count.innerText = " (" + wilayahCounter[TANPA_WILAYAH] + ")";
  } else if (Object.keys(categoryCounter).includes(id)) {
    _count.innerText = " (" + categoryCounter[id] + ")";
  } else if (Object.keys(wilayahCounter).includes(id)) {
    _count.innerText = " (" + wilayahCounter[id] + ")";
  } else {
    _cont.classList.add("line-through");
    _label.classList.add("line-through");
  }
  _cont.appendChild(_count);

  var _colorInd = document.createElement("div");
  _colorInd.classList.add(`colorIndicator`);
  if (color) {
    _colorInd.style["background-color"] = color;
  } else {
    _colorInd.style["background-color"] = defaultColor;
  }
  if (containerId != "wilayah") {
    _cont.appendChild(_colorInd);
  }

  document.getElementById(containerId).appendChild(_cont);
}

function buatCheckbox(category, containerId, uncategorized) {
  if (uncategorized) {
    TambahCheckBox(
      uncategorized.No,
      uncategorized.Nama,
      containerId,
      colorCategory[uncategorized.Nama]
    );

    if (showAllCategoryDefault) {
      categoryToShow.push(uncategorized.Nama);
    }
  }
  for (const item of category) {
    let _color = "#ff0000";

    if (containerId == "kategori") {
      _color = colorCategory[item.Nama];
    }

    TambahCheckBox(item.Nama, item.Nama, containerId, _color);
    if (showAllCategoryDefault) {
      categoryToShow.push(item.Nama);
    }
  }

  refreshItemsToShow();
}

function transformToObject(data) {
  const [header, ...rest] = data;

  const output = [];
  for (let i = 0; i < rest.length; i++) {
    const d = {};
    for (let keyI = 0; keyI < header.length; keyI++) {
      const key = header[keyI];
      d[key] = rest[i][keyI];
    }
    output.push(d);
  }
  return output;
}

async function authenticatedGet(endpoint) {
  return fetch(`${endpoint}?key=${apiKey}`);
}

async function preload() {
  posisiSaya = loadImage("./img/pointermerah.svg");

  async function loadWilayah() {
    const getWilayah = await authenticatedGet(
      baseSheet + "/Wilayah Bagian!A:B"
    );
    wilayahAll = transformToObject((await getWilayah.json()).values);
    wilayahAll = wilayahAll.filter((v) => v.Nama != "-");
  }

  async function loadCategory() {
    const getCategories = await authenticatedGet(baseSheet + "/Kategori!A:B");
    categoryAll = transformToObject((await getCategories.json()).values);
    categoryAll = categoryAll.filter((v) => v.Nama != "-");
    generateCategoryColor(categoryAll);

    const getPoi = await authenticatedGet(baseSheet + "/POI!A:G");
    poiAll = transformToObject((await getPoi.json()).values);
    poiAll = poiAll.filter((v) => {
      return v.Nama && v.Lat && v.Lon;
    });
    for (let i = 0; i < poiAll.length; i++) {
      const it = poiAll[i];
      if (it.Kategori == "" || it.Kategori == "-" || !it.Kategori) {
        poiAll[i].Kategori = TANPA_KATEGORI;
      }
      if (it.Wilayah == "" || it.Wilayah == "-" || !it.Wilayah) {
        poiAll[i].Wilayah = TANPA_WILAYAH;
      }
    }

    // kategori
    kategori = categoryAll;
  }

  document
    .getElementById("hamburgerMenu")
    .addEventListener("click", onHamburgerClicked);

  isLoading = true;
  await loadWilayah();
  await loadCategory();

  /** Category counts */
  for (const poi of poiAll) {
    // getHierarchy
    if (Object.keys(categoryCounter).includes(poi["Kategori"])) {
      categoryCounter[poi["Kategori"]]++;
    } else {
      categoryCounter[poi["Kategori"]] = 1;
    }

    if (Object.keys(wilayahCounter).includes(poi["Wilayah"])) {
      wilayahCounter[poi["Wilayah"]]++;
    } else {
      wilayahCounter[poi["Wilayah"]] = 1;
    }
  }

  buatCheckbox(wilayahAll, "wilayah", {
    No: TANPA_WILAYAH,
    Nama: "Tanpa Wilayah",
  });
  buatCheckbox(kategori, "kategori", {
    No: TANPA_KATEGORI,
    Nama: "Tanpa Kategori",
  });

  isLoading = false;
  // document.getElementById("loadingIndicator").classList.add("hideLoading");
}

function setup() {
  canvas = createCanvas(window.innerWidth, window.innerHeight);
  canvas.position(0, 0);
  canvas.class("p5canvas");

  trainMap = mappa.tileMap(options);
  trainMap.overlay(canvas);
}

function draw() {
  clear();
  fill(0, 125, 255);
  noStroke();

  if (itemsToShow && itemsToShow.length > 0) drawItems();

  if (currentLat && currentLng) {
    try {
      push();
      const pix = trainMap.latLngToPixel(currentLat, currentLng);
      imageMode(CENTER);
      image(posisiSaya, pix.x, pix.y, 30, 30);
      pop();
    } catch (error) {}
  }
}

window.onresize = function () {
  var w = window.innerWidth;
  var h = window.innerHeight;
  canvas.size(w, h);
  width = w;
  height = h;
};
const options = {
  lat: -7.7948314502893865,
  lng: 110.36651923811553,
  zoom: 13,
  style: "http://{s}.tile.osm.org/{z}/{x}/{y}.png",
};
function drawItems() {
  stroke(0, 0, 0);
  for (let i = 0; i < itemsToShow.length; i++) {
    const item = itemsToShow[i];
    if (!item.Lat || !item.Lon) {
      continue;
    }

    const pix = trainMap.latLngToPixel(item.Lat, item.Lon);
    push();

    if (item.Kategori) {
      fill(colorCategory[item.Kategori]);
    } else {
      // Default category color
      fill(defaultColor);
    }

    ellipse(pix.x, pix.y, 10, 10);
    item.drawn = {
      x: pix.x,
      y: pix.y,
      hb: 15,
    };
    pop();
  }
}

/* For collapsible tile*/
var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function () {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "none") {
      content.style.display = "block";
    } else {
      content.style.display = "none";
    }
  });
}
