console.log('welcome to gmeng.org');

let assets = {
    'logo-url': 'https://raw.githubusercontent.com/catriverr/gmeng-sdk/main/assets/readme-logo.png'
};

document.getElementById('logo-clicks').onclick = function() {
    window.location = '/';
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

document.onkeypress = function(ev) {
    if (ev.keyCode == 27 && sb_open) closebutton.click(); // close with escape
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
};

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
