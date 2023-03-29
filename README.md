![Logo](admin/pid.png)

# ioBroker.pid

![GitHub license](https://img.shields.io/github/license/iobroker-community-adapters/ioBroker.pid)](https://github.com/iobroker-community-adapters/ioBroker.pid/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/iobroker.pid.svg)](https://www.npmjs.com/package/iobroker.pid)
![GitHub repo size](https://img.shields.io/github/repo-size/iobroker-community-adapters/ioBroker.pid)
[![Translation status](https://weblate.iobroker.net/widgets/adapters/-/pid/svg-badge.svg)](https://weblate.iobroker.net/engage/adapters/?utm_source=widget)</br>
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/iobroker-community-adapters/ioBroker.pid)
![GitHub commits since latest release (by date)](https://img.shields.io/github/commits-since/iobroker-community-adapters/ioBroker.pid/latest)
![GitHub last commit](https://img.shields.io/github/last-commit/iobroker-community-adapters/ioBroker.pid)
![GitHub issues](https://img.shields.io/github/issues/iobroker-community-adapters/ioBroker.pid)
</br>
**Version:** </br>
[![NPM version](http://img.shields.io/npm/v/iobroker.pid.svg)](https://www.npmjs.com/package/iobroker.pid)
![Current version in stable repository](https://iobroker.live/badges/pid-stable.svg)
![Number of Installations](https://iobroker.live/badges/pid-installed.svg)
</br>
**Tests:** </br>
[![Test and Release](https://github.com/iobroker-community-adapters/ioBroker.pid/actions/workflows/test-and-release.yml/badge.svg)](https://github.com/iobroker-community-adapters/ioBroker.pid/actions/workflows/test-and-release.yml)
[![CodeQL](https://github.com/iobroker-community-adapters/ioBroker.pid/actions/workflows/codeql.yml/badge.svg)](https://github.com/iobroker-community-adapters/ioBroker.pid/actions/workflows/codeql.yml)

<!--
## Sentry
**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.**
For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.
-->

## PID Adapter for ioBroker

This adapter provides a configurable PID Controller.

# **Current state is WORK IN PROGRESS**

## General Information

This adapter provides the functionality of a pid controller. Within one instance there could be more than one controller configured. The adpter supports configuring the paramaters (P, I, D components) and the cycle time used for calculation. In addition caclulation can be suspended and resumed and the controlelr can be reset at all. As convinient server a manual mode can be switches on to directly set the output. Output can be limited to a minimum/maximum value and contain a fixes offset.

All relevant values including internal data is availbale as states for diagnose purposes.

## Documentation

[english documentation](docs/en/envertech.md) is available [here](docs/en/envertech.md) <br>
<!-- [german documentation](docs/de/envertech.md) is available [here](docs/de/envertech.md) -->

## Credits

Providing this adapter would not have been possible without the great work of @Philmod (https://github.com/Philmod) who developed node-pid-controller (https://github.com/Philmod/node-pid-controller).

## How to report issues and feature requests

Please use GitHub issues for this.

Best is to set the adapter to Debug log mode (Instances -> Expert mode -> Column Log level). Then please get the logfile from disk (subdirectory "log" in ioBroker installation directory and not from Admin because Admin cuts the lines). If you do not like providing it in GitHub issue you can also send it to me via email (mcm57@gmx.at). Please add a reference to the relevant GitHub issue AND also describe what I see in the log at which time.

## Changelog

<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### **WORK IN PROGRESS**

-   (mcm1957) initial release

## License

MIT License

Copyright (c) 2023 mcm1957 <mcm57@gmx.at>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
