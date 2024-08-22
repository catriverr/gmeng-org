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
};

closebutton.onclick = function() {
    sb_open = false;
    textarea.value = "";
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


let code_highlights = document.getElementsByTagName('pre');


let language_keywords = [
    {
        check: (str) => str.endsWith(':'),
        color: 'yellow'
    },
    {
        check: (str) => str == 'make',
        color: 'blue'
    },
    {
        check: (str) => str == "#define",
        color: 'cyan'
    },
    {
        check: (str) => str.startsWith('__') || str.toLowerCase().includes('gmeng'),
        color: 'orange'
    },
    {
        check: (str) => str.startsWith('-D'),
        color: 'yellow'
    },
    {
        check: (str) => str.startsWith('--'),
        color: 'blue'
    },
    {
        check: (str) => str.toLowerCase().includes('error'),
        color: 'red'
    },
    {
        check: (str) => !str.includes('no') && (str.includes('homebrew') || str.includes('ncurses')),
        color: 'orange'
    },
    {
        check: (str) => ['gcc','stdcpp20','gnupp20','gnu-make', 'node.js', 'nodejs', 'npm', 'pkg-config', 'libcurl', 'applicationservices'].includes(str.toLowerCase()),
        color: 'orange'
    },
    {
        check: (str) => str == 'false' || str == 'true',
        color: 'magenta'
    }
];

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

let do_done_words = [];

function update_code_highlighting() {
    console.log(code_highlights.length, 0);
    for (let i = 0; i < code_highlights.length; i++) {
        console.log('highlighting_check:', i)
        let dat = code_highlights.item(i);
        language_keywords.forEach((checker, id) => {
            code_highlights = document.getElementsByClassName('code-highlight');
            let str = replaceAll(dat.innerText, '\n', ' ').split(' ');
            str.forEach((val_,indx) => {
                let val = replaceAll(val_.split('//')[0], ';', '');
                if (checker.check(val)) {
                    console.log('clrcheck hit ' + val, i, id);
                    dat.innerHTML = replaceAll(dat.innerHTML, val, '<coloradd style="color: ' + (colors[checker.color] ?? checker.color) + '">' + val + '</coloradd>')
                };
            });
        });
        let ln = dat.innerHTML.split('\n');
        ln.forEach((line,i) => {
            if (line.includes('//')) {
                let dline = line.replace('//', '<coloradd style="color:'+ colors.gray + '">//') + '</coloradd>';
                ln[i] = dline;
            };
        });
        dat.innerHTML = ln.join('\n');
        console.log(ln[1]);
    };
};
