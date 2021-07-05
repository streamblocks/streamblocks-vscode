'use strict';

import * as fs from "fs"
import * as net from 'net';
import * as path from 'path';
import * as os from 'os';

import { Trace } from 'vscode-jsonrpc';
import { workspace, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, StreamInfo } from 'vscode-languageclient';

export function activate(context: ExtensionContext) {
    let connectionType = workspace.getConfiguration().get('streamblocks-cal.language server.connection type');

    let clientOptions: LanguageClientOptions = {
        documentSelector: ['cal'],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/*.*')
        }
    };

    let client = new LanguageClient('CAL Xtext Language Server', getServerOptions(connectionType, context), clientOptions);
    client.trace = Trace.Verbose;

    let disposable = client.start();
    context.subscriptions.push(disposable);

    context.subscriptions.push(workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('streamblocks-cal.language server.connection type', { languageId: 'cal' })) {
            client.stop();
            context.subscriptions.splice(context.subscriptions.indexOf(disposable));

            connectionType = workspace.getConfiguration().get('streamblocks-cal.language server.connection type');
			client = new LanguageClient('CAL Xtext Language Server', getServerOptions(connectionType, context), clientOptions);
            client.trace = Trace.Verbose;

            disposable = client.start();
            context.subscriptions.push(disposable);
		}
	}));
}

function getServerOptions(connectionType, context: ExtensionContext): ServerOptions {
    switch (connectionType) {
        case "socket":
            return () => {
                let socket = net.connect({
                    port: 5008
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