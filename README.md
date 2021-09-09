
<img src="https://github.com/streamblocks/streamblocks-vscode/blob/master/doc/streamblocks-logo.png" align="right"
     alt="StreamBlocks Logo" width="80">
# CAL Actor Language LSP extensions

This reposiotry bundles a [Xtext][1]-based Language Server for CAL Actor language and multiple extensions to support various code editors ([Visual Studio Code][2], [Eclipse Theia][3], [Eclipse IDE][4] at the moment).

All extensions communicate with the server via Microsoft [Language Server Protocol][5] (LSP).

## Repository Structure

The repository contains multiple projects:
- `xtext-language-server/` - Xtext Language Server multi-project that consists of:
    - `streamblocks.cal` - a sub-project that defines CAL language *syntax* and *semantics*
    - `streamblocks.cal.ide` - a sub-project that contains specific *customizations* for Language Server
- `extensions/`
    - `vscode` - an extension project for *VS Code*
    - `theia` - an extension project for *Eclipse Theia*
    - `eclipse` - a plug-in project for *Eclipse IDE*

Also there is a `workspace/` directory that contains code samples written in CAL and is used as a editor's starting point.

## Building

Before we can go into details how to build each project, it is important to specify dependencies needed for successful project build.

### Dependencies
- `Java` - installed Java 11+ JDK
- `code` - installed Visual Studio Code (and on path for automated Gradle IDE launch task - *more on that later*)
- `eclipse` - installed Eclipse IDE (only for its plugin)

### Xtext Language Server

To build the language server, just run *default* Gradle task for building the project:

#### For Linux

```
$ ./gradlew build
```

#### For Windows

```
> ./gradlew.bat build
```

The build consist of compiling Xtext project, packing the project as Uber JAR (Gradle [Shadow][6] Plug-in) and transfering the library to extensions (to be used in *standalone* case).

Alternative way is to start language server as a remote *socket* server. It can be easily done by running customized Grade task:

#### For Linux

```
$ ./gradlew run [--args="[-host «host address»][-port «port number»]"]
```

#### For Windows

```
> ./gradlew.bat run [--args="[-host «host address»][-port «port number»]"]
```

Task starts server application from built-in Xtext launcher class *SocketServerLauncher*. The connection can be configured via command line arguments (passed to Gradle task by `--args` option), namely `-host` for host address and `-port` for specific port (*0.0.0.0:5008* by default).

### VS Code Extension

To just build and package the extension, you can run dedicated Gradle task:

#### For Linux

```
$ ./gradlew packageExtension
```

#### For Windows

```
> ./gradlew.bat packageExtension
```

It is also possible to automatically launch pre-configured Visual Studio Code editor with installed plug-in via another Gradle task:

> *Note: Make sure that `code` command is registerd on **path***

#### For Linux

```
$ ./gradlew launchCode
```

#### For Windows

```
> ./gradlew.bat launchCode
```
 
The launched editor starts in `workspace/` directory and automatically boots the language server in backgroud ready to be used.

There is also a pre-defined configuration ***CAL Graal DAP*** for attaching to a remote debug server via DAP (attaches to *localhost:4711* by default).

#### Extension configuration

All configuration options for this extention can be found in the *Settings* section **Extensions / CAL**.

To specify the path to compiler binary use ***Compiler: Path*** setting. If the compiler path is set correctly, the extension will compile source code into corresponding executable. The default path value is null (which results in omitting code compilation).

To specify type of the connection with the language server use ***Language Server: Connection type*** setting. The default type is *Process IO* which runs the server as backgroud process and directly communicates with the editor. Other option is *Socket* which enables the editor to connect to remote server via socket.

If *Socket* option is chosen, ***Language Server: Socket Address*** settting can be used to customize the address of the remote language server (*localhost:5008* by default).

<!-- To specify type of the connection with the debug server use ***Debug Server: Connection type*** setting. The only option for now is *Socket* which enables the editor to connect to remote server via socket.

#If *Socket* option is chosen, ***Debug Server: Socket Address*** settting can be used to customize the address of the remote debug server (*localhost:4711* by default). -->

### Eclipse Theia

To build and launch local Theia server use the dedicated launch script in `extensions/theia` directory:

> *Note: Make sure that `launch.sh` has permission to be executed*

#### For Linux only

```
$ ./launch.sh
```

It copies Visual Studio Code extension and starts the server in `workspace/` directory at `localhost:8080`.

### Eclipse IDE

*TO-DO: Add the description for building Eclipse IDE plug-in*


[1]: https://www.eclipse.org/Xtext/index.html
[2]: https://code.visualstudio.com/
[3]: https://theia-ide.org/
[4]: https://www.eclipse.org/eclipseide/
[5]: https://microsoft.github.io/language-server-protocol/
[6]: https://imperceptiblethoughts.com/shadow/
