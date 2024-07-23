#!/usr/bin/env node

import './polyfills';

import colors from 'colors';
import { program } from 'commander';
import fs from 'fs';
import https from 'https';
import fetch from 'node-fetch';
import SandboxedModule from 'sandboxed-module';
import { generateCertificates } from './generate-certificates';
import {
    __certificateCertPath,
    __certificateKeyPath,
    __manifestOutputPath,
    __manifestOutputTempPath,
    __manifestPlaceholder,
    __manifestTemplatePath,
    __tempManifestPath
} from './utils/constants';

const fetchManifest = async (port) => {
    const url = `https://localhost:${port}/temp/manifests.js`;
    try {
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        const res = await fetch(url, { agent });
        const data = res.text();
        return data;
    } catch (error) {
        console.error(colors.red('There was an issue with fetching the manifest from port:' + port));
        return null;
    }
};

const retriveExports = async (module) => {
    const moduleExports = [];

    await saveToFile(__tempManifestPath, module);

    try {
        const spfxModule = SandboxedModule.load(__tempManifestPath, {
            globals: {
                globalThis: {
                    importScripts: '1'
                },
                importScripts: '1',
                window: {
                    location: {
                        search: ''
                    }
                },
                document: {
                    getElementsByTagName: (...args) => []
                },
                self: {},
                define: (...args) => {
                    if ('function' === typeof args[1]) {
                        moduleExports.push(args[1].call());
                        return;
                    }

                    if ('function' === typeof args[2]) {
                        moduleExports.push(args[2].call());
                        return;
                    }
                }
            },
            requires: {}
        });

        if (!spfxModule.exports) {
            return moduleExports;
        }

        if (Array.isArray(spfxModule.exports.getManifests)) {
            moduleExports.push({
                getManifests: () => spfxModule.exports.getManifests
            });
            return moduleExports;
        }

        if ('function' === typeof spfxModule.exports.getManifests) {
            moduleExports.push({
                getManifests: spfxModule.exports.getManifests
            });
            return moduleExports;
        }

        return moduleExports;
    } catch (e) {
        console.error(colors.red('Failed to execute untrusted module:'), e);
        return moduleExports;
    } finally {
        unlinkFile(__tempManifestPath);
    }
};

const prepareManifest = (servePort, compontents) => {
    return compontents.map((compontent) => {
        let internalModuleBaseUrls = compontent.loaderConfig.internalModuleBaseUrls.map((x) => {
            try {
                const url = new URL(x);
                url.port = servePort;
                return url.toString();
            } catch (error) {
                return x;
            }
        });
        internalModuleBaseUrls = [...new Set(internalModuleBaseUrls)];

        const scriptResources = Object.entries(compontent.loaderConfig.scriptResources).map(([p, props]) => {
            const name = p + '_';
            const s = '.js';
            if (props.paths) {
                const l = Object.entries(props.paths).map(([key, value]) => {
                    if (!value.path) {
                        return [key, value.replace(name, '').replace(s, '')];
                    }
                    return [key, [value.path.replace(name, '').replace(s, ''), value.integrity]];
                });

                return [
                    p,
                    {
                        ...props,
                        paths: {
                            p: name,
                            l: Object.fromEntries(l),
                            s
                        }
                    }
                ];
            }

            return [p, props];
        });

        return {
            ...compontent,
            loaderConfig: {
                ...compontent.loaderConfig,
                internalModuleBaseUrls,
                scriptResources: Object.fromEntries(scriptResources)
            }
        };
    });
};

const retriveUniqueCompontents = (compontents) => {
    return compontents.reduce(
        (acc, current) => {
            const key = `${current.id}${current.version}`;
            if (!acc.ids.has(key)) {
                acc.ids.add(key);
                acc.result.push(current);
            }
            return acc;
        },
        { ids: new Set(), result: [] }
    ).result;
};

const readFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(null);
            } else {
                resolve(data);
            }
        });
    });
};

const saveToFile = (filePath, content, compress = false) => {
    return new Promise((resolve, reject) => {
        if (compress) {
            content = content
                .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
                .replace(/\s{2,}/g, ' ')
                .replace(/\n\s*/g, '');
        }

        fs.writeFile(filePath, content, 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
};

const fileExists = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
};

const unlinkFile = async (filePath) => {
    if (!(await fileExists(filePath))) {
        return true;
    }

    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
};

const prepareManifestToServce = async (ports) => {
    const manifests = [];
    const moduleExports = [];
    for (let i = 0; i < ports.length; i++) {
        const port = ports[i];
        const manifest = await fetchManifest(port);
        if (null === manifest) {
            continue;
        }
        const compontents = await retriveExports(manifest);
        moduleExports.push({
            port,
            compontents
        });
    }

    for (let i = 0; i < moduleExports.length; i++) {
        const module = moduleExports[i];
        for (let j = 0; j < module.compontents.length; j++) {
            const compontent = module.compontents[j];
            if ('function' !== typeof compontent.getManifests) {
                continue;
            }

            const m = compontent.getManifests();
            const prepared = prepareManifest(module.port, m);
            manifests.push(...prepared);
        }
    }

    if (0 === manifests.length) {
        return;
    }

    const uniqueCompontents = retriveUniqueCompontents(manifests);
    if (0 === uniqueCompontents.length) {
        return;
    }

    let templateContent = await readFile(__manifestTemplatePath);
    templateContent = templateContent.replace(__manifestPlaceholder, JSON.stringify(uniqueCompontents));

    fs.mkdirSync(__manifestOutputTempPath, { recursive: true });
    await saveToFile(__manifestOutputPath, templateContent, true);
};

const serveMultiple = async (servePort, targetPorst) => {
    const certExists = await fileExists(__certificateCertPath);
    const keyExists = await fileExists(__certificateKeyPath);
    if (!certExists || !keyExists) {
        console.log(colors.red('No certificates! Run Generate Certificates command!'));
        return;
    }

    await unlinkFile(__manifestOutputPath);

    await prepareManifestToServce(targetPorst);
    const exists = await fileExists(__manifestOutputPath);

    if (!exists) {
        console.log(colors.red('The combined manifest will not be created!'));
        return;
    }

    const options = {
        key: await readFile(__certificateKeyPath),
        cert: await readFile(__certificateCertPath)
    };
    const server = https.createServer(options, async (req, res) => {
        const content = await readFile(__manifestOutputPath);

        if (!content) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        res.writeHead(200, {
            'Content-Type': 'application/javascript'
        });
        res.end(content);
    });

    server.listen(servePort, () => {
        const manifestUrl = `https://localhost:${servePort}/temp/manifests.js`;
        console.log(
            `To load your scripts, use this query string: ${colors.yellow(
                `?debug=true&noredir=true&debugManifestsFile=${manifestUrl}`
            )}`
        );
        console.log(
            `If you receive a message that the URL is incorrect, please open the ${colors.yellow(
                manifestUrl
            )} and trust the page in your browser, and then refresh the SharePoint site.`
        );
        console.log(
            `This is because SharePoint requires the HTTPS protocol for the manifest file, and your computer doesn't trust the certificate used. The first version of the script is just PoC. That's why there is no script to automatically trust it yet.`
        );
    });
};

const targetParse = (value) => {
    let separatorChar = ' ';
    if (value.indexOf(',') > -1) {
        separatorChar = ',';
    }

    return value.split(separatorChar).map(Number);
};

const portParse = (value) => Number(value);

const validateServeOptions = (options) => {
    if (Number.isNaN(options.port)) {
        return {
            result: false,
            message: 'Port must be a valid port'
        };
    }

    if (
        !Array.isArray(options.targets) ||
        0 === options.targets.length ||
        options.targets.some((x) => Number.isNaN(x))
    ) {
        return {
            result: false,
            message: 'Target ports must be a valid port'
        };
    }

    return {
        result: true,
        message: ''
    };
};

program.name('multiple-serve').description('SPFx Multiple Serve Tool').version('0.0.1').helpOption('-h, --help');

program.command('certificates').description('Generate certificates').action(generateCertificates);

const serveCommand = program
    .command('serve')
    .option('-p, --port <port>', 'HTTPS port to use for serving the manifest', portParse, 4321)
    .option(
        '-t, --targets <targets>',
        'Separate the original HTTP SPFx ports with a comma. For example: -t 1234,2345,3456',
        targetParse,
        []
    )
    .action((options) => {
        const validation = validateServeOptions(options);
        if (!validation.result) {
            console.error(colors.red(validation.message));
            serveCommand.help();
            return;
        }

        serveMultiple(options.port, options.targets);

        console.log(`Combine the manifests of the following ports: ${colors.yellow(options.targets.join(', '))}\n`);
    });

program.parse(process.argv);
