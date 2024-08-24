import chalk from 'chalk';
import express from 'express';
import {readdirSync, writeFileSync} from 'fs';
import {existsSync, readFileSync, statSync, statfsSync} from 'fs';
import { URL } from 'node:url'; // in Browser, the URL in native accessible on window
import markdown, { getCodeString } from '@wcj/markdown-to-html';
import { createProxyMiddleware } from 'http-proxy-middleware';
import hljs from 'highlight.js';
import cpp from 'highlight.js/lib/languages/cpp';

hljs.registerLanguage('cpp', cpp);


const __filename = new URL('', import.meta.url).pathname;
// Will contain trailing slash
const __dirname = new URL('.', import.meta.url).pathname;


function datetxt() {
    let dt = new Date();
    return `[${dt.getMonth()+1}.${dt.getDate()} / ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}]`;
};

class Server {
    logger = new class __internal_logger__ {
        logs = ['-- start session --'];
        log(...str) { this.logs += datetxt() + str.join(' '); console.log(datetxt(), ...str); };
    };
    settings = new class __internal_settings__ {
        devmode = false; disabled_endpoints = []; blocked_ips = []; admin_pass = Math.floor(Math.random() * 1000000000000).toString();
        whitelisted_ips = []; whitelist = false; admin_ip = '192.168.1.1';
    };
    statistics = new class __internal_statistics__ {
        blocked_ips = 0; requests_checked = 0;
        requests_dropped = 0; requests_handled = 0;
        admin_requests = 0; user_requests = 0;
        requests_to_unknown_paths = 0;
        requests_to_known_paths = 0;
        requests_while_in_devmode = 0;
        requester_stats = [
            {ip: '__SERVER_INTERNAL__', count: 0, requests_list: [
                {pathname: '__internal_firststart__', date: Date.now()},
            ]}
        ]
        find_requester(ip) {
            return this.requester_stats.find(usr=>usr.ip==ip);
        };
        add_request_to_user(ip, path) {
            if (!this.find_requester(ip)) {
                this.requester_stats.push({
                    ip: ip, count: 1, requests_list: [
                        {pathname:path,date:Date.now()}
                    ]
                });
                return; /// create user if it does not exist
            };
            this.find_requester(ip).requests_list.push({pathname:path,date:Date.now()});
        };
    };
    /**
        * @type {express.Express}
        * */ app;
    /**
        * @type {number}
        * */ port;
    /**
        * @type {{GET: Array<{path: string, handler: (req: express.Request, res: express.Response) => any}>, POST: Array<{path: string, handler: (req: express.Request, res: express.Response) => any}>}}
    * */ routes = {GET: [], POST: []}; routes_all = [];

    create_stats_json() {
        return {
            blocked_ips: this.statistics.blocked_ips, requests_checked: this.statistics.requests_checked,
            requests_dropped: this.statistics.requests_dropped, requests_handled: this.statistics.requests_handled,
            admin_requests: this.statistics.admin_requests, user_requests: this.statistics.user_requests,
            requests_to_unknown_paths: this.statistics.requests_to_unknown_paths,
            requests_to_known_paths: this.statistics.requests_to_known_paths,
            requests_while_in_devmode: this.statistics.requests_while_in_devmode,
            requester_stats: this.statistics.requester_stats
        };
    };

    load_stats_json(val) {
        this.statistics.blocked_ips = val.blocked_ips;
        this.statistics.requests_checked = val.requests_checked;
        this.statistics.requests_dropped = val.requests_dropped;
        this.statistics.requests_handled = val.requests_handled;
        this.statistics.admin_requests = val.admin_requests;
        this.statistics.user_requests = val.user_requests;
        this.statistics.requests_to_unknown_paths = val.requests_to_unknown_paths;
        this.statistics.requests_to_known_paths = val.requests_to_known_paths;
        this.statistics.requests_while_in_devmode = val.requests_while_in_devmode;
        this.statistics.requester_stats = val.requester_stats;
    };

    write_stats_json() {
        let dat = this.create_stats_json();
        let dat_str = JSON.stringify(dat);
        writeFileSync(process.cwd() + '/lmfstat', dat_str);
    };

    constructor(app, port = 3000) {
        this.port = port; this.app = app;
        if (!existsSync(process.cwd() + '/webconfig')) {
            this.logger.log('no webconfig found, create a file called webconfig and set up a configuration');
            process.exit(0);
        };
        if (!existsSync(process.cwd() + '/lmfstat')) {
            let dat = this.create_stats_json();
            this.load_stats_json(dat);
            this.write_stats_json();
        } else {
            let dat = readFileSync(process.cwd() + '/lmfstat', 'utf-8');
            this.load_stats_json(JSON.parse(dat));
        };
        let dat = readFileSync(process.cwd() + '/webconfig', 'utf-8').split(';').join('\n').split('\n');
        let keyword_prefix = '';
        let in_setting_block = false;
        let in_ipblocks_block = false;
        dat.forEach((v,i) => {
            if (v.startsWith('#') || v.replace(/ /g, '').length < 1) return; // comment line
            if (process.argv.includes('-extensive-log')) console.log(i+1,v,in_setting_block,in_ipblocks_block);
            if (!in_ipblocks_block && !in_setting_block && v.replace(/ /g, '').toLowerCase() == 'server{') return in_setting_block = true;
            if (!in_ipblocks_block && in_setting_block && v.toLowerCase() == '}') return in_setting_block = false;
            if (!in_setting_block && !in_ipblocks_block && v.replace(/ /g, '').toLowerCase() == 'ips{') return in_ipblocks_block = true;
            if (!in_setting_block && in_ipblocks_block && v.toLowerCase() == '}') return in_ipblocks_block = false;
            if (in_setting_block) {
                let keyword = v.substring(keyword_prefix).split(' ')[0];
                while (keyword.includes('\t')) keyword.replace('\t');
                let params = v.substring(keyword_prefix).split(' ').slice(1);
                switch (keyword) {
                    case 'passkey': case 'password': case 'passphrase':
                        if (!params[0]) return this.logger.log('[f_webconfig]', 'webconfig:'+(i+1)+' passkey/password/passphrase keyword must have a parameter');
                        this.settings.admin_pass = params[0];
                        break;
                    case 'whitelist':
                        if (isNaN(parseInt(params[0])) || parseInt(params[0]) > 1 || parseInt(params[0]) < 0) return this.logger.log('[f_webconfig]', 'whitelist parameter requires 1 or 0');
                        this.settings.whitelist = parseInt(params[0]) == 1;
                        break;
                    case 'static':
                        let f = params.join(' ');
                        if (existsSync(process.cwd() + '/' + f)) {
                            if (statSync(process.cwd() + '/' + f).isDirectory()) {
                                this.app.use(express.static(process.cwd() + '/' + f));
                            } else { this.logger.log('[f_webconfig]', 'webconfig:'+(i+1)+' static parameter requires a directory name, recieved filename'); };
                        } else { this.logger.log('[f_webconfig]', 'webconfig:'+(i+1)+'static parameter requires a directory name, could not find: ' + process.cwd() + '/' + params.join(' ')); };
                        break;
                    case 'port':
                        if (isNaN(parseInt(params[0])) || parseInt(params[0]) < 0) return this.logger.log('[f_webconfig]', 'port argument requires a number greater than 0');
                        this.port = parseInt(params[0]);
                        break;
                    case 'devmode':
                        if (isNaN(parseInt(params[0])) || parseInt(params[0]) > 1 || parseInt(params[0]) < 0) return this.logger.log('[f_webconfig]', 'devmode parameter requires 1 or 0');
                        this.settings.devmode = parseInt(params[0]) == 1;
                };
            };
            if (in_ipblocks_block) {
                let keyword = v.substring(keyword_prefix).split(' ')[0].toLowerCase();
                while (keyword.includes('\t')) keyword.replace('\t');
                let params = v.substring(keyword_prefix).split(' ').slice(1);
                switch(keyword) {
                    case 'admin':
                        if (!params[0]) return this.logger.log('[f_webconfig]', 'webconfig:'+(i+1)+' ADMIN keyword requires a parameter (ipaddr)');
                        this.settings.admin_ip = params[0];
                    case 'whitelist': case 'allow':
                        if (!params[0]) return this.logger.log('[f_webconfig]', 'webconfig:'+(i+1)+' ALLOW/WHITELIST keyword requires a parameter (ipaddr)');
                        this.settings.whitelisted_ips.push(params[0]);
                        break;
                    case 'block': case 'blacklist': case 'ban':
                        if (!params[0]) return this.logger.log('[f_webconfig]', 'webconfig:'+(i+1)+' BLOCK/BLACKLIST/BAN keyword requires a parameter (ipaddr)')
                        this.settings.blocked_ips.push(params[0]);
                        break;
                };
            };
        });
    };

    route_check(handle, res) {
        this.statistics.requests_checked++;
        this.statistics.add_request_to_user(handle.ip, handle.path);
        if (this.settings.devmode && this.settings.admin_ip != handle.ip) {
            res.status(401).send('unauthorized');
            this.statistics.requests_while_in_devmode++;
            this.statistics.requests_dropped++;
            return 1;
        }; if (this.settings.whitelist && !this.settings.whitelisted_ips.includes(handle.ip)) {
            res.status(403).send('not whitelisted');
            this.statistics.requests_dropped++;
            return 2;
        }; if (!this.settings.whitelist && this.settings.blocked_ips.includes(handle.ip)) {
            this.logger.log('[f_gateway]', '[f_routechk]', 'attempt to request ' + handle.path + ' from ' + handle.ip + ' disallowed due to being in blocked_ips');
            res.redirect('https://mayfe.net/banned.html');
            this.statistics.blocked_ips++;
            this.statistics.requests_dropped++;
            return 3;
        };
        return 0;
    };

    create_handle(req) {
        return {
            path: req.url,
            ip: req.headers['x-real-ip'] ?? 'NONE',
            createdAt: Date.now(),
            type: req.method,
            req: req
        };
    };

    start() {
        this.app.use((req, res, next) => {
            // If the route is not defined, increment the counter
            let handle = this.create_handle(req);
            if (handle.ip == this.settings.admin_ip) this.statistics.admin_requests++;
            else this.statistics.user_requests++;
            if (process.argv.includes('-extensive-log')) this.logger.log(handle);
            let v_path = '/' + handle.path.split('/')[1];
            if (!this.routes.GET.find(p=>p.path.startsWith(v_path)) && !this.routes.POST.find(p=>p.path.startsWith(v_path))) this.statistics.requests_to_unknown_paths++;
            else this.requests_handled++;
            next();
        });

        this.app.listen(this.port, () => {
            this.logger.log('[internal]', 'server active');
        }).on('request', (req, res) => {
            this.write_stats_json(); // reload statistics
            let handle = this.create_handle(req);
            this.logger.log('[f_request]', handle.ip + ' ' + handle.type + ' ' + handle.path + ' ' + req.httpVersion);
        });
    };

    proxy(path,target) {
        this.logger.log('[f_warning]', chalk.bold.yellow('WARN!'), 'proxy() methods are not handled by this server, no options will be added ')
        this.app.use(path,createProxyMiddleware({target: target,changeOrigin:false}));
    };

    /**
     * @param path {string}
     * @param func {(req: express.Request, res: express.Response) => any}
     */
    get(path,func) {
        this.routes.GET.push({path,func});
        this.app.get(path,(req, res) => {
            let handle = this.create_handle(req);
            this.statistics.requests_to_known_paths++;
            if (this.route_check(handle, res) != 0) return; /// request already handled
            else func(req, res);
        });
    };
    /**
     * @param path {string}
     * @param func {(req: express.Request, res: express.Response) => any}
     */
    post(path,func) {
        this.routes.POST.push({path,func});
        this.app.post(path,(req, res) => {
            let handle = this.create_handle(req);
            this.statistics.requests_to_known_paths++;
            if (this.route_check(handle, res) != 0) return; /// request already handled
            else func(req, res);
        });
    };
};

/** @type {Server} */ let global_server;

let SAY = (str) => global_server.logger.log(str);
let REM = (who,str) => global_server.logger.log(chalk.bold.red('['+who+']'),str);


function main(argv = ['']) {
    let server = new Server(express());
    global_server = server;
    REM('server', 'starting ' + chalk.bold.blue('gmeng.org') + '...');
    server.start();
    REM('server', 'server_active 1');
    server.get('/stats/:adminpassword', (req, res) => {
        if (req.params.adminpassword != server.settings.admin_pass) return res.status(401).send('unauthorized');
        res.status(200).send(JSON.stringify(server.create_stats_json()));
    });

    let styles_md = `
pre, code {
    display: inline-block;
    width: fit-content;
    padding-top: 20px;
    padding-bottom: 20px;
    padding-left: 20px;
    padding-right: 100px;
    border-radius: 6px;
    background-color: rgb(40, 40, 40);
    max-width: 100%;
}

code {
    display: inline;
    padding: 0px 0px 0px 0px;
    padding-left: 5px;
    padding-right: 5px;
}`;

let script_md = `
`;

server.get('/docs', (req, res) => {
    let docs_all = readdirSync(process.cwd() + '/docs', 'utf-8');
    res.status(200).send((docs_all.map(d=>d.slice(0,-3))).join(','));
});

    server.get('/docs/:docid', (req, res) => {
        let docid = req.params?.docid ?? 'menu';
        let file = process.cwd() + '/docs/' + docid + '.md';
        let docs_all = readdirSync(process.cwd() + '/docs', 'utf-8');
        console.log(docs_all, docid);
        let p = (docs_all.filter(j=>j.replace('.md','').toLowerCase().includes(docid.toLowerCase())));
        if (p.length < 1 && !existsSync(file)) return res.status(200).send(`
<div style="text-align:center;font-weight: bold;"> No Content Found </div>
            `);
        if (!existsSync(file)) {
            let fdata = p;
            let html = `
<docentrylist>
    <docentrytitle>${p.length} Document${p.length > 1 ? 's' : ''} Found</docentrytitle><br>
    ${fdata.map(f=>`≫ <gmdocentry onclick="setinput('${f.replace('.md','')}')">${ f.replace('.md', '') }</gmdocentry>`).join('<br>')}
</docentrylist>
`;
            res.status(200).send(html);
        } else return res.status(200).send(markdown(readFileSync(file,'utf-8')) + '\n!END-OF-FILE-MARKDOWN\n<style>a { color: var(--red2); }\na:visited { color: var(--yellow); }\n' + styles_md + '\n</style>\n' + script_md + '');
    });
    server.get('/git', (req, res) => {
        res.redirect('https://github.com/catriverr/gmeng-sdk');
    });
    server.get('/site-git', (req, res) => {
        res.redirect('https://github.com/catriverr/gmeng-org');
    });
};

main(process.argv.slice(2));
