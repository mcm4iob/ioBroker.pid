# Envertech-PV Adapter Information

## General information

This adapter provides one or more configurable pid controllers per instance. 

The general functionality of a pir controller is documented i.e. at wikipedia (https://en.wikipedia.org/wiki/PID_controller). In short a pid controller computes an output value depending on the input value and three parameters:

- proprotional conponent
- integral component
- deriative component

This ioBroker adapter allows the configuration of the pid controller by specifying several paramaters listed ... . The output value is calculated in regular intervalls specified as cylce time or on request whenever a new input value is set. In addition the calulation can be suspended and all internal values can be rest on demand. 

As an convinient feature the output value can be set to a specified value when operating in manual mode.

States used for input and set by controller output are listed in section ...


## Configuration

### TAB Cloud Configuration

This tab allows to specifiy one or mor controller instances operanting independently.

<p align=center><img src="img/pid_tab_controllers.jpg" width="600" /></p>

<!-- prettier-ignore-start -->
| Parameter          | Type    | Description                             | Comment                                                   |
| ------------------ | ------- | --------------------------------------- | --------------------------------------------------------- |
| Active             | boolean | if marked, controller will be used      | can be used to disable a controller temporary             |
| Controller-Id      | text    | Controller-Id identifying a controller  | This id must be unique among all controllers but can be selected by user |
| P Term             | number  | proportional term of controller         |                                                           |
| I Term             | number  | integral term of controller             |                                                           |
| D Term             | number  | deriative term of controller            |                                                           |
| Use min/max Limits | boolean | enable use of ,min and max paramaters   | setting this flag enables use of paramater min and max    |
| Min Out            | number  | maximum output value                    | if set output is limited to not be lower than this value  |
| Max Out            | number  | minimum output value                    | if set output is limited to not be bigger than this value |
| Cycle time (ss)    | integer | Cycle tim on ms (or 0)                  | A positive value specifies the cycle time for recurrent calulations. The cicle time is limitied to 100 - 60000ms. A value of 0 disables automatic recalculation and enables calculations whenever new data is stored |
<!-- prettier-ignore-end -->

### TAB General Options

Here you specify some general options

<p align=center><img src="img/envertech_tab_options.jpg" width="600" /></p>

-   Enable logging  <br>
    Setting this option activates logging of data calculated during regular recomputaions.

### Description of States

Every adapter instance creates a set of states per configured controller. The following table describes the contents of those states and whter the are read-onl (RO) or writeable by users (RW).

<!-- prettier-ignore-start -->
| State       | Type    | RW/RO | Description                                                                                 |
| ----------- | ------- | ----- | ------------------------------------------------------------------------------------------- |
| k_p         | number  | RO    | Proportional factor configured at config (*)                                                |
| k_i         | number  | RO    | integral term configured at config (*)                                                      |
| k_d         | number  | RO    | deriative term configured at config (*)                                                     |
| min         | number  | RO    | Minimum value for output or null as factor configured at config (*)                         |
| max         | number  | RO    | Maximum value for output or null as factor configured at config (*)                         |
| cycle       | number  | RO    | cycle time in ms as configured at config (*)                                                |
|             |         |       |                                                                                             |
| act         | number  | RW    | actual value as input to controller                                                         |
| set         | number  | RW    | setpoint value as input to controller                                                       |
| sup         | number  | RW    | suppress / hysteresis value; any 'act' data stored which has a smaller difference to current act value then specified by 'sup' is igniored |
| offs        | number  | RW    | statis coffset value to be added to output ('y')                                            |
| man_inp     | number  | RW    | manual input value output to 'y' if 'man' is set to true                                    |
| man         | boolean | RW    | flag to enable manual mode; true enables manual mode                                        |
| rst         | boolean | RW    | trigger to initialize a reset of controller (writing true resets controller)                |
| run         | boolean | RW    | set to true if controller is running. Setting 'run' to flase will suspend calcultaions      |
|             |         |       |                                                                                             |
| y           | number  | RO    | output value of controller to be used as feedback to system                                 |
| diff        | number  | RO    | difference between actual value ('act') and setpoint ('set') at last cycle                  |
| lim         | boolean | RO    | indicator set to true if controller output hit limits at last cycle                         |
| i_differr   | number  | RO    | internal difference used for calulation of D term at last cycle                             |
| i_sumerr    | number  | RO    | internal accumulated error used for calulation of P term at last cycle                      |
|             |         |       |                                                                                             |
| last_delta  | number  | RO    | time between last cylces (ms)                                                               |
| last_upd    | number  | RO    | timestamp (ms since epoch) of last iupdate cycle                                            |
| last_upd_str| number  | RO    | textual representation auf date/time of last iupdate cycle                                  |
<!-- prettier-ignore-end -->
    
