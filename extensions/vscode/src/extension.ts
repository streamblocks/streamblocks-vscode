'use strict';

import * as fs from "fs"
import * as net from 'net';
import * as path from 'path';
import * as os from 'os';

import { Trace } from 'vscode-jsonrpc';
import { workspace, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, StreamInfo } from 'vscode-languageclient';

import { activateCALDebug } from './activateCALDebug';

export function activate(context: ExtensionContext) {
    let connectionType: String = workspace.getConfiguration().get('streamblocks-cal.language server.connection type');
    let name = 'CAL (Xtext) - ' + connectionType.charAt(0).toUpperCase() + connectionType.substr(1);
    let serverOptions = getServerOptions(connectionType, context);
    let clientOptions: LanguageClientOptions = {
        documentSelector: ['cal'],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/*.*')
        }
    };

    let client = new LanguageClient(name, serverOptions, clientOptions);
    client.trace = Trace.Verbose;

    let disposable = client.start();
    context.subscriptions.push(disposable);

    context.subscriptions.push(workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('streamblocks-cal.language server.connection type', { languageId: 'cal' })
        || e.affectsConfiguration('streamblocks-cal.language server.socket address', { languageId: 'cal' })) {
            client.stop();
            context.subscriptions.splice(context.subscriptions.indexOf(disposable));

            connectionType = workspace.getConfiguration().get('streamblocks-cal.language server.connection type');
            name = 'CAL (Xtext) - ' + connectionType.charAt(0).toUpperCase() + connectionType.substr(1);
            serverOptions = getServerOptions(connectionType, context);

			client = new LanguageClient(name, serverOptions, clientOptions);
            client.trace = Trace.Verbose;

            disposable = client.start();
            context.subscriptions.push(disposable);
		}
	}));

    activateCALDebug(context);
}

function getServerOptions(connectionType, context: ExtensionContext): ServerOptions {
    switch (connectionType) {
        case "socket":
            return () => {
                let host = 'localhost';
                let port = 5008;
                let socketAddress: String = workspace.getConfiguration().get('streamblocks-cal.language server.socket address');
                if (socketAddress != null && socketAddress.split(':').length == 2) {
                    host = socketAddress.split(':')[0];
                    port = parseInt(socketAddress.split(':')[1]);
                }

                console.log(host, port);

                let socket = net.connect({
                    host: host,
                    port: port
                });
                let result: StreamInfo = {
                    writer: socket,
                    reader: socket
                };
                return Promise.resolve(result);
            };
        case "process io":
        default:
            return {
                command: getJavaExecutablePath(), 
                args: ['-jar', context.asAbsolutePath(path.join('lib', 'xtext-language-server.jar'))]
            };
    }
}

function getJavaExecutablePath(): string|null {
	let binname = os.platform() === 'win32' ? 'java.exe' : 'java';

	// First search java.home setting
    let userJavaHome = workspace.getConfiguration('java').get('home') as string;
	if (userJavaHome != null) {
        let workspaces = userJavaHome.split(path.delimiter);
        for (let i = 0; i < workspaces.length; i++) {
            let binpath = path.join(workspaces[i], 'bin', binname);
            if (fs.existsSync(binpath)) 
                return binpath;
        }
	}

	// Then search each JAVA_HOME
    let envJavaHome = process.env['JAVA_HOME'];
	if (envJavaHome) {
        let workspaces = envJavaHome.split(path.delimiter);
        for (let i = 0; i < workspaces.length; i++) {
            let binpath = path.join(workspaces[i], 'bin', binname);
            if (fs.existsSync(binpath)) 
                return binpath;
        }
	}

	// Then search PATH parts
	if (process.env['PATH']) {
		let pathparts = process.env['PATH'].split(path.delimiter);
		for (let i = 0; i < pathparts.length; i++) {
			let binpath = path.join(pathparts[i], binname);
			if (fs.existsSync(binpath)) {
				return binpath;
			}
		}
	}
    
	// Else return the binary name directly (this will likely always fail downstream) 
	return null;
}