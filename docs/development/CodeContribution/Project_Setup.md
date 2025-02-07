## Getting Started

If you want to develop FullStack locally you must follow the following instructions:

1. Clone fullstack-pro locally
```
git clone https://github.com/cdmbase/fullstack-pro
cd fullstack-pro
```

2. Install dependencies and build packages.

    a. make sure `python` version `2.7.16` or higher in `^2` version installed.

    b. install `node-gyp` globally. For installation check [this document](https://github.com/nodejs/node-gyp#installation).

    c. install `watchman` for macOS users

    d. Node version supported is `>=12.18.4` and `yarn` version is `1.22`. You can Download Node from [here](https://nodejs.org/dist/v12.18.4/)

    e. Insall and build packages using following command. Run from the root folder of this project.
```
    yarn global add lerna
    yarn bootstrap
```
    
3. Setup environment file

You need to have environemnt file before you start the project. There is a sample file exist at `config/development/dev.env.sample` which you can copy as `config/development/dev.env`.

```
cp ./config/development/dev.env.sample ./config/development/dev.env
```

You may need to set personalized values in the `dev.env` file.

4. Start server MongoDB and Redis (look for Installation Section)

> redis-server

> mongod

5. Start both client and server together
```
yarn start
```
Alternatively, if you need to run `backend` and `frontend` on its respective terminal instead of one terminal then follow [How to Start Backend and Frontend seperately](./How_to_Run_Various_Options.md#how-to-start-backend-and-frontend-seperately)

### Server Enpoints: 
The graphql server endpoints are
>http://localhost:8080/graphql

The browser server endopoint is
>http://localhost:3000


## How to run with HotReload for live changes both in the server and browser?

To run build with watch for dependent packages, for auto reloading changes into the server to be productive during development.

```
yarn watch-packages
```

If you also need to watch along with it, you can use as many scopes as required like below. 

```
yarn watch-packages -- --scope=@sample-stack/counter-module* --scope=@packageb
```

To run build with watch for all the packages. Note: This will run watch on all packages under `packages-modules` and may saturate the resources in your laptop instead run above `watch-packages` command.

```
yarn watch
```

Sometimes if we have to run `build` or `watch` you can use the `lerna` [command](https://github.com/lerna/lerna/tree/master/commands/exec#usage) for the targeted packages

```
lerna exec --scope=<package name> yarn watch
```

- here `<package name>` will be the package you working on currently. If you have multiple packages, then you need to run it multiple times for each package in its respective terminal.

## How to take changes from the branch?

Most of the changes at code level can be taken using `git` command.

But in some cases when `lerna's packages` are added or versions in `packages.json` are updated, to avoid getting installed duplicate pacakges due to monrepo architecture you need to first clean existing `node_modules` and reinstall again. This can be done with following command.

```
yarn clean:force && git pull <branch_name> && yarn install && yarn build
```
- here <branch_name> should be replaced with the branch you getting updates.

## Installation of Prerequisties servers

Install redis and setup an instance with default settings on default port,

* Install Redis on a Linux, OS X, or a similar Posix operating system

## Advance Options
### To test Production build and run
You need to run Frontend and Backend in two seperate servers. 

to start frontend server
```
lerna exec --scope=*frontend-server yarn build
lerna exec --scope=*frontend-server yarn start:dev
```
to start backend server
```
lerna exec --scope=*backend-server yarn build
lerna exec --scope=*backend-server yarn start:dev
```

Note: you can pass `:<env>` next to `start` to use env config.
- dev: to use `/config/development/dev.env`
- stage: to use `/config/staging/staging.env`



### Docker build and run

Build three docker images by following the steps:
- Frontend Server
```
lerna exec --scope=*frontend-server yarn docker:build
lerna exec --scope=*frontend-server yarn docker:run
```
- Backend Server
```
lerna exec --scope=*backend-server yarn docker:build
lerna exec --scope=*backend-server yarn docker:run
```
- moleculer-server
```
lerna exec --scope=*moleculer-server yarn docker:build
lerna exec --scope=*moleculer-server yarn docker:run
```

Note: It uses `/config/staging/staging.env` for environment variables.

### Environment settings for non-development
```
GRAPHQL_URL
CLIENT_URL
NATS_URL
NATS_USER
NATS_PW
```
## Troubleshoot
To troubleshoot webpack configuration run
```
yarn zen:watch:debug
```
