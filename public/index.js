console.log('welcome to gmeng.org');

let assets = {
    'logo-url': 'https://raw.githubusercontent.com/catriverr/gmeng-sdk/main/assets/readme-logo.png'
};

 let page_list = document.createElement('div');
    page_list.setAttribute("id", "page_list");
    page_list.innerHTML = `
<div class="pagebutton" id="home_go">
<img class="pageico" src="assets/home.svg"> Homepage
</div>

<div class="pagebutton" id="changelog_go">
<img class="pageico" src="assets/clock.svg"> Changelog
</div>

<div class="pagebutton" id="report_go">
<img class="pageico" src="assets/warning.svg"> File Report
</div>

<hr>

<div class="pagebutton" id="examples_go">
<img class="pageico" src="assets/book.svg"> Examples
</div>

<div class="pagebutton" id="goals_go">
<img class="pageico" src="assets/flag.svg"> Goals
</div>
    `;
document.body.appendChild(page_list);
let ovr = false;

document.getElementById("home_go").onclick = function() {
    window.history.replaceState({}, '', '/');
    window.location = "/";
};

document.getElementById("examples_go").onclick = function() {
    window.history.replaceState({}, '', '/examples');
    window.location = "/examples";
};

document.getElementById("report_go").onclick = function() {
    window.history.replaceState({}, '', '/report');
    window.location = "/report";
};

document.getElementById("goals_go").onclick = function() {
    window.history.replaceState({}, '', '/goals');
    window.location = "/goals";
};

document.getElementById("changelog_go").onclick = function() {
    window.history.replaceState({}, '', '/changelog');
    window.location = "/changelog";
};

document.getElementById('logo-clicks').onmouseover = function() {
    ovr = true;
    let d_pg = document.getElementById('page_list');
    d_pg.style.display = "block";
    d_pg.style.top = "65px";
    console.log('PAGES MENU OPEN');
};

let never_entered = true;

document.getElementById('page_list').onmouseover = () => {
    ovr = true;
    never_entered = false;
};


document.getElementById('page_list').onmouseleave = () => {
    ovr = false;
    never_entered = true;
    let d_pg = document.getElementById('page_list');
    d_pg.style.display = "none";
    d_pg.style.top = "-100px";
    console.log('PAGES MENU CLOSE');
};

document.getElementById('logo-clicks').onmouseleave = function() {
    if (ovr || !never_entered) return;
    let d_pg = document.getElementById('page_list');
    d_pg.style.display = "none";
    d_pg.style.top = "-100px";
    console.log('PAGES MENU CLOSE');
};


let sb = document.getElementById('search-button');
let rb = document.getElementById('radio-button');
let mbc = document.getElementById('menubutton-container');
let closebutton = document.getElementById('search-close');
let textarea = document.getElementById('search');

let sb_open = false;

sb.onclick = function() {
    sb_open = true;
    let widthTotal = window.visualViewport.width;
    let pTo = widthTotal - 300;
    textarea.style.width = (pTo-50).toString() + "px";
    sb.style.pointerEvents = "none";
    sb.style.width = pTo.toString() + "px";
    sb.style.border = "2px solid var(--blue)";
    sb.style.backgroundColor = "inherit";
    sb.style.objectPosition = "left";
    textarea.style.display = "inline";
    closebutton.style.display = "inline";
    textarea.select();
};

closebutton.onclick = function() {
    sb_open = false;
    textarea.style.display = "none";
    sb.style.pointerEvents = "all";
    sb.style.width = "20px";
    sb.style.objectPosition = "center";
    sb.style.border = "1.5px solid #6B6B68";
    sb.style.transition = "0.15s background-color opacity";
    closebutton.style.display = "none";
};

window.onresize = function() {
    sb.style.transition = "0s background-color opacity";
    let widthTotal = window.visualViewport.width;
    let pTo = widthTotal - 300;
    if (sb_open) textarea.style.width = (pTo-50).toString() + "px";
    if (sb_open) sb.style.width = pTo + "px";
    sb.style.transition = "0.15s background-color opacity";
};


let curtextarea = "____NULL_______$$$.#";

function set_current_doc(html) {
    let d = document.getElementById('docs-content');
    d.innerHTML = html;
    update_code_highlighting();
};

function http_get(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then(text => {
            return text;
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
};

function load() {
    let db = document.getElementById('docs-content');
    let i = 0;
    let data = curtextarea == "" ? [
        "loading main menu.",
        "loading main menu..",
        "loading main menu..."
    ] : [
        'searching for documents.',
        'searching for documents..',
        'searching for documents...'
    ];
    let intvl = setInterval(() => {
        if (i == data.length) i =0 ;
        let vals = data[i];
        db.innerHTML = vals;
        i++;
    }, 100);
    return intvl;
};

let curintvl = null;

function chng(path) {
    let d = 'https://gmeng.org/docs/' + path;
    let intvl = load();
    curintvl = intvl;
    http_get(d).then(data => {
        clearInterval(intvl);
        console.log(data);
        set_current_doc(data);
    });
    if (![
        "https://gmeng.org/changelog",
        "https://gmeng.org/report",
        "https://gmeng.org/goals",
        "https://gmeng.org/examples"
    ].includes(window.location.href))
        window.history.replaceState( {}, '', '/?doc=' + encodeURI(path));
};

let site_url = new URL(window.location.href);
let search = new URLSearchParams(site_url.search);

let requested_doc = search.get('doc');

if (requested_doc != null && requested_doc.length > 0) {
    textarea.value = curtextarea = requested_doc;
    chng(requested_doc);
};


function chng_raw(path) {
    let d = path;
    let intvl = load();
    curintvl = intvl;
    http_get(d).then(data => {
        clearInterval(intvl);
        console.log(data);
        set_current_doc(data);
    });
    window.history.replaceState( {}, '', '/?doc=' + encodeURI(path));
};

setInterval(() => {
    textarea.value = textarea.value.replace('\n', '');
    if (curtextarea == '____NULL_______$$$.#') {
        curtextarea = "";
        chng('menu');
    };
    if (textarea.value != curtextarea) {
        if (curintvl != null) clearInterval(curintvl);
        curtextarea = textarea.value;
        chng(curtextarea == "" ? 'menu' : curtextarea);
    };
}, 150);

function replaceAll(str, find, replace) {
console.log(find, replace);
  return str.replace(new RegExp(find, 'g'), replace);
}

let colors = {
    red: `red;`,
    green: `#B8BB26;`,
    magenta: '#D3869B;',
    orange: '#F68019;',
    cyan: 'rgb(134, 180, 117);',
    red2: `rgb(204, 36, 29);`,
    yellow: `#FFD230;`,
    black2: `rgb(60,60,60);`,
    black: `rgb(40, 40, 40);`,
    white: `rgb(224,209,170);`,
    blue: `rgb(131, 165, 152);`,
    gray: `#4E4E47;`,
};

function update_code_highlighting() {
    /// switched to server-side
    hljs.highlightAll();
};

let RADIOMENU_OPEN = false;

let crm = document.getElementById('close-radio');

crm.onclick = function() {
    console.log('radio mama oh oh radio mama');
    let rm = document.getElementById('radiomenu');
    let cnt = document.getElementById('docs-content');
    rm.classList.remove('active');
    cnt.style.zIndex = '0';
    cnt.style.overflow = 'scroll';
    cnt.style.opacity = '1';
    cnt.style.backgroundColor = 'var(--black2)';
    RADIOMENU_OPEN = false;
};

document.onkeypress = function(ev) {
    if (ev.keyCode == 27 && sb_open) closebutton.click(); // close with escape
    else if (ev.keyCode == 27 && RADIOMENU_OPEN) crm.click();
};

function setinput(str) {
    textarea.value = str ?? '';
};


rb.onclick = function() {
    closebutton.onclick();
    let rm = document.getElementById('radiomenu');
    let cnt = document.getElementById('docs-content');
    rm.classList.toggle('active');
    cnt.style.zIndex = '-1';
    cnt.style.overflow = 'hidden';
    cnt.style.opacity = '0.1';
    cnt.style.backgroundColor = 'rgba(0,0,0,0.1)';
    RADIOMENU_OPEN = true;
};




let all_docs = [];

function setinput_d(data) {
    textarea.value = data;
    crm.onclick();
};


http_get('https://gmeng.org/docs').then(value => {
    all_docs = value.split(',');
    let rm = document.getElementById('radiomenu');
    rm.insertAdjacentHTML('beforeend', '<br>≫ <gdoc onclick="setinput_d(`menu`)">Homepage</gdoc>');
    all_docs.forEach(j => {
        if (j == 'menu') return;
        rm.insertAdjacentHTML('beforeend', "<br>≫ <gdoc onclick=\"setinput_d('" + j + "')\">" + j + "</gdoc>");
    });
});
