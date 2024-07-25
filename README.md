# spfx-multi-serve

## TL;DR

1. Generate certificates
    ```sh
    npx spfx-multi-serve certificates
    ```
1. Serve manifest
    ```sh
    npx spfx-multi-serve serve -t 1234,2345 -p 4321
    ```

## Description

The spfx-multi-serve is a CLI tool designed to serve multiple SPFx manifest files as one. It can be used if you want to debug several SPFx webparts or extensions on the same page, but each of them is in a separate project.

## How to use

1. First of all you have to install the CLI on your local machine
    ```sh
    npm i -g spfx-multi-serve
    ```
2. Then you are able to generate certificates needed to host the combined manifest file over HTTPS protocol.
    ```sh
    spfx-multi-serve certificates
    ```
3. Now you can host the manifest
    ```sh
    spfx-multi-serve serve -t 1234,2345 -p 4321
    ```

## Features

-   `serve`: command combined multiple SPFx manifest files to one and host it over the HTTPS protocol.
-   `certificates`: command generates the necessary certificate files to host the combined manifest over the HTTPS protocol.

### serve options

| option         | type    | defaults | description                                                                          |
| -------------- | ------- | -------- | ------------------------------------------------------------------------------------ |
| `-p --port`    | integer | 9876     | HTTPS port to use for serving the manifest.                                          |
| `-t --targets` | string  | -        | Separate the original HTTP SPFx ports with a comma. For example: `-t 1234,2345,3456` |

## Important Notice

The spfx-multi-serve solution does not redistribute the SPFx framework. Instead, spfx-multi-serve takes output files from the framework, copies them, modifies them, and hosts them in a manner similar to the original solution. It does not reverse engineer, decompile, or disassemble the SPFx software.

Note from License:

> FOR THE AVOIDANCE OF DOUBT, You may use the SPFx software to build or create solutions that may be for commercial, non-profit, or revenue generating activities, You can not resell or profit off of SPFx alone

## License

This project is licensed under the MIT License.
