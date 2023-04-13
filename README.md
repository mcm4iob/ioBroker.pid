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

This adapter provides the functionality of a PID controller.

In practical terms, a PID controller automatically calculates a correction value for a system based on an actual value and a setpoint. The behavior is controller by parameters. An everyday example is the cruise control on a car, where ascending a hill would lower speed if constant engine power were applied. The controller's PID algorithm restores the measured speed to the desired speed with minimal delay and overshoot by increasing the power output of the engine in a controlled manner. [(c) Wikipedia]

Within one adapter instance there could be more than one controller configured. The adpter supports configuring the paramaters (P, I, D components) and the cycle time used for calculation. In addition caclulation can be suspended and resumed and the controlelr can be reset at all. As convinient server a manual mode can be switches on to directly set the output. Output can be limited to a minimum/maximum value and contain a fixes offset.

All relevant values including internal data are availbale as states for diagnose purposes.

## Documentation

[english documentation](docs/en/pid.md) is available [here](docs/en/pid.md) <br>

<!-- [german documentation](docs/de/pid.md) is available [here](docs/de/pid.md) -->

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

-   (mcm1957) changed: Translations have been updated

### 0.0.3-alpha.1 (2023-04-13)

-   (mcm1957) changed: Setting rst state does no longer trigger a recalculation
-   (mcm1957) changed: State diff now displays error value even if sup is active
-   (mcm1957) changed: Calculation of I-part has been changed, changing Tn effects future calculations only now

### 0.0.3-alpha.0 (2023-04-12)

-   (mcm1957) new: optionally use folder structure for states
-   (mcm1957) changed: reset timer at restart after pausing calculation
-   (mcm1957) changed: use values stored for ack and set when starting adapter
-   (mcm1957) changed: log state changes with unexpected ack=true
-   (mcm1957) changed: fix incorrect updates occuring whenever act is written
-   (mcm1957) changed: fix invert flag not working at all
-   (mcm1957) changed: remove error display whenever adapter is hitting the limits
-   (mcm1957) changed: fix q flag handling
-   (mcm1957) changed: fix unexpected bahavior of sup parameter
-   (mcm1957) changed: rename run state to hold

### 0.0.2-alpha.2 (2023-04-06)

-   (mcm1957) changed: values of 'kp', 'xp' and 'sup' are now verified if set using states
-   (mcm1957) changed: values of 'min' and 'max' are now verified if set using states
-   (mcm1957) changed: activation of 'man' updates output 'y' with current value of 'man_inp' now
-   (mcm1957) changed: 'min' value is now conserved when restarting the instance
-   (mcm1957) changed: conversion between and xp has been fixed at several places
-   (mcm1957) changed: 'kp' or 'xp' are writepotected now depending on 'useXp' parameter

### 0.0.2-alpha.1 (2023-04-04)

-   (mcm1957) changed: some small fixes

### 0.0.2-alpha.0 (2023-04-04)

-   (mcm1957) THIS IS AN ALPHA RELEASE ONLY
-   (mcm1957) major changes after discussion in forum
-   (mcm1957) new initial release

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
