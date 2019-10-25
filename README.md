# polymer-ctrl-dependencies
Creates dependencies tree (in JSON) for specific ctrl in the project. Can be used for tracking possible affected areas.

## How to run

- git clone
- install packages 'npm i'
- run command by template 'node deps <projectPath> <PathToRootPolymerElement> <PolymerElementId>'
  Example: node deps c:\\my-project src\\app.html paper-button
- Output result may be visualized in https://vanya.jp.net/vtree/ .
