/**
 *
 * pid adapter,
 *		copyright McM1957 2023, MIT
 *
 */

// @ts-nocheck

/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
'use strict';

const utils = require('@iobroker/adapter-core');
const { iobInit, iobStates, iobTranslator } = require('@mcm1957/iobroker.library');
//const { iobInit, iobStates, iobTranslator } = require('e:/github/mcm1957/iobroker.library/library.js');

const PidCtrl = require('./lib/pid.js');

/* prettier-ignore */
const STATES_CFG = {
    /* parameters */
    k_p:      { type: 'number',  name: 'proportional term', desc: 'descKp',     role: 'value',         unit: '', acc: 'RO', init: null },
    k_i:      { type: 'number',  name: 'integrative term',  desc: 'descKi',     role: 'value',         unit: '', acc: 'RO', init: null },
    k_d:      { type: 'number',  name: 'derivative term',   desc: 'descKd',     role: 'value',         unit: '', acc: 'RO', init: null },
    min:      { type: 'number',  name: 'minimum value',     desc: 'descMin',    role: 'value',         unit: '', acc: 'RO', init: null },
    max:      { type: 'number',  name: 'maximum value',     desc: 'descMax',    role: 'value',         unit: '', acc: 'RO', init: null },

    /* input states */
    act:      { type: 'number',  name: 'actual value',      desc: 'descAct',    role: 'value',         unit: '', acc: 'RW', init: 0 },
    set:      { type: 'number',  name: 'set point',         desc: 'descSet',    role: 'value',         unit: '', acc: 'RW', init: 0 },
    sup:      { type: 'number',  name: 'suppress value',    desc: 'descSup',    role: 'value',         unit: '', acc: 'RW', init: 0 },
    offs:     { type: 'number',  name: 'offset value',      desc: 'descOff',    role: 'value',         unit: '', acc: 'RW', init: 0 },
    man_inp:  { type: 'number',  name: 'manual input',      desc: 'descManInp', role: 'value',         unit: '', acc: 'RW', init: 0 },
    man:      { type: 'boolean', name: 'manual mode',       desc: 'descMan',    role: 'switch.enable', unit: '', acc: 'RW', init: false },
    rst:      { type: 'boolean', name: 'reset controller',  desc: 'descRst',    role: 'button',        unit: '', acc: 'WO', init: false },
    hold:     { type: 'boolean', name: 'hold controller',   desc: 'descHold',   role: 'switch.enable', unit: '', acc: 'RW', init: false },

    /* output states */
    y:        { type: 'number',  name: 'output value',      desc: 'descY',      role: 'value',         unit: '', acc: 'RO', init: null },
    diff:     { type: 'number',  name: 'error value',       desc: 'descDiff',   role: 'value',         unit: '', acc: 'RO', init: null },
    lim:      { type: 'boolean', name: 'controler limited', desc: 'descLim',    role: 'switch.enable', unit: '', acc: 'RO', init: null },

    /* utility */
    last_upd:     { type: 'number', name: 'last update ts', desc: 'descLast',   role: 'value',         unit: '', acc: 'RO', init: null },
    last_upd_str: { type: 'text',   name: 'last update',    desc: 'descLast',   role: 'value',         unit: '', acc: 'RO', init: null },
    log:          { type: 'number', name: 'log interval',   desc: 'descLog',    role: 'value',         unit: '', acc: 'RW', init: 0 },
};

/**
 * main adapter class
 */
class Pid extends utils.Adapter {
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'pid',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));

        this.controllers = {};
        this.stateMap = {};

        /* prettier-ignore */
        this.STATECHG_CFG = {
            /* parameters */
            k_p:        null,
            k_i:        null,
            k_d:        null,
            min:        null,
            max:        null,

            /* input states */
            act:        this.chgAct.bind(this),
            set:        this.chgSet.bind(this),
            sup:        this.chgSup.bind(this),
            offs:       this.chkOff.bind(this),
            man_inp:    this.chkManInp.bind(this),
            man:        this.chkMan.bind(this),
            rst:        this.chgRst.bind(this),
            hold:       this.chgHold.bind(this),

            /* output states */
            y:          null,
            diff:       null,
            lim:        null,

            /* utility */
            last_upd:       null,
            last_upd_str:   null,
            log:            this.chkLog.bind(this)
        };

        iobInit(this);
    }

    /**
     * onReady - will be called as soon as adapter is ready
     *
     * @param
     * @return
     *
     */
    async onReady() {
        this.log.debug('onReady triggered');

        await this.setStateAsync('info.connection', { val: false, ack: true, q: 0x00 });

        // reset and cleanup states
        // await this.resetStateObjects() *** TODO ***;

        // init state objects
        if (this.config.controllers) {
            for (const controller of this.config.controllers) {
                if (!controller.ctrlAct) continue;

                const ctrlId = `C-${controller.ctrlId}`;
                await this.initObject({
                    _id: ctrlId,
                    type: 'device',
                    common: {
                        name: `controller ${controller.ctrlId}`,
                        statusStates: {
                            onlineId: `${this.name}.${this.instance}.${ctrlId}.hold`,
                            errorId: `${this.name}.${this.instance}.${ctrlId}.lim`,
                        },
                    },
                    native: {},
                });

                for (const key in STATES_CFG) {
                    await this.initStateObject(`${ctrlId}.${key}`, STATES_CFG[key]);

                    const fullId = `${this.name}.${this.instance}.${ctrlId}.${key}`;
                    this.stateMap[fullId] = {
                        key: key,
                        ctrlId: `${controller.ctrlId}`,
                    };
                }
            }
        }

        // subscribe to all states as most states are writeable anyway
        this.subscribeStates('*');

        // start scanning loop
        let instanceCnt = 0;
        if (this.config.controllers) {
            for (const controller of this.config.controllers) {
                if (!controller.ctrlAct) continue;

                this.log.info(`[start] start instance with id ${controller.ctrlId}`);

                let ctrlCycle = controller.ctrlCycle;
                if (ctrlCycle < 500) {
                    ctrlCycle = 500;
                    this.log.warn(`[C-${controller.ctrlId}] - invalid cycle time, set to 500ms`);
                }
                if (ctrlCycle > 3600 * 1000) {
                    ctrlCycle = 3600 * 1000;
                    this.log.warn(`[C-${controller.ctrlId}] - invalid cycle time, set to 3600s`);
                }
                let min = null;
                let max = null;
                if (controller.ctrlMinMax) {
                    min = Number(controller.ctrlMin || 0);
                    if (isNaN(min)) {
                        this.log.warn(
                            `[C-${controller.ctrlId}] - ${this.config.ctrlMin} is invalid for 'min out' parameter; will be ignored`,
                        );
                        min = null;
                    }
                    min = Number(controller.ctrlMax || 0);
                    if (isNaN(max)) {
                        this.log.warn(
                            `[C-${controller.ctrlId}] - ${this.config.ctrlMax} is invalid for 'max out' parameter; will be ignored`,
                        );
                        max = null;
                    }
                    if (min !== null && max == null && min >= min) {
                        this.log.warn(
                            `[C-${controller.ctrlId}] - ${max} is not bigger than ${min} is invalid for 'max out' parameter; will be ignored`,
                        );
                        min = null;
                        max = null;
                    }
                }

                this.controllers[controller.ctrlId] = {
                    ctrlId: `C-${controller.ctrlId}`,
                    pidCtrl: new PidCtrl(this, {
                        k_p: controller.ctrlP,
                        k_i: controller.ctrlI,
                        k_d: controller.ctrlD,
                        min: min,
                        max: max,
                    }),
                    cycle: ctrlCycle,
                    timer: null,
                };
                await this.setStateAsync(`C-${controller.ctrlId}.k_p`, { val: controller.ctrlP, ack: true, q: 0x00 });
                await this.setStateAsync(`C-${controller.ctrlId}.k_i`, { val: controller.ctrlI, ack: true, q: 0x00 });
                await this.setStateAsync(`C-${controller.ctrlId}.k_d`, { val: controller.ctrlD, ack: true, q: 0x00 });
                await this.setStateAsync(`C-${controller.ctrlId}.min`, { val: min, ack: true, q: 0x00 });
                await this.setStateAsync(`C-${controller.ctrlId}.max`, { val: max, ack: true, q: 0x00 });

                this.controllers[controller.ctrlId].pidCtrl.reset();
                await this.setStateAsync(`C-${controller.ctrlId}.rst`, { val: false, ack: true, q: 0x00 });

                if (controller.ctrlAutoStart)
                    this.controllers[controller.ctrlId].timer = setInterval(
                        this.doProcess.bind(this),
                        ctrlCycle,
                        controller.ctrlId,
                    );
                instanceCnt++;
            }
        }
        if (instanceCnt) {
            this.log.info(`processing started for ${instanceCnt} controller(s)`);
            await this.setStateAsync('info.connection', { val: true, ack: true, q: 0x00 });
        } else {
            this.log.warn(`no active controllers(s) detected - check config`);
        }
        return;

        // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
        // this.subscribeStates('testVariable');
        // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
        // this.subscribeStates('lights.*');
        // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
        // this.subscribeStates('*');
    }

    /**
     * onUnload - called for adapter shuts down
     *
     * @param {callback} callback 	callback function
     * @return
     *
     */
    onUnload(callback) {
        this.log.debug('onUnload triggered');

        this.setState('info.connection', { val: false, ack: true, q: 0x00 });

        try {
            for (const controller of this.controllers) {
                if (controller.timeout) this.clearTimeout(controller.timeout);
                controller.pidCtrl = null;
            }
            callback();
        } catch (e) {
            callback();
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(pId, pState) {
        this.log.debug(`[statechange] ${pId} changed: ${pState?.val} (ack = ${pState?.ack})`);

        // ignore statechanges with ack flag set and unknown states
        if (!pState || pState.ack) return;
        if (!this.stateMap[pId]) return; // ignore unknown states

        // get ctrlId from map
        const ctrlId = this.stateMap[pId].ctrlId;
        const key = this.stateMap[pId].key;

        if (typeof this.STATECHG_CFG[key] !== 'function') return;
        this.STATECHG_CFG[key](pId, ctrlId, pState.val);
    }

    /**
     * initObject - create or reconfigure single object
     *
     *		creates object if it does not exist
     *		overrides object data otherwise
     *
     * @param {obj}     pObj    objectstructure
     * @return
     *
     */
    async initObject(pObj) {
        this.log.debug(`initobject [${pObj._id}]`);

        const exists = !!(await this.getObject(pObj._id));

        if (!exists) {
            this.log.debug('creating obj "' + pObj._id + '" with type ' + pObj.type);
            await this.setObjectNotExistsAsync(pObj._id, pObj);
        }

        await this.extendObjectAsync(pObj._id, pObj);

        return !exists;
    }

    /**
     * initStateObject - create or reconfigure single state object
     *
     *		creates object if it does not exist
     *		overrides object data otherwise
     *
     * @param   {string}    pId    object id
     * @param   {obj}       pObj   configuration object
     * @return  {boolean}   true if new object created
     *
     */
    async initStateObject(pId, pObj) {
        this.log.debug(`initStateobject (${pId})`);

        if (!pObj.type) return;

        const newObj = await this.initObject({
            _id: pId,
            type: 'state',
            common: {
                name: pObj.name,
                desc: iobTranslator.getTranslations(pObj.desc),
                write: pObj.acc === 'RW' || pObj.acc === 'WO',
                read: pObj.acc === 'RW' || pObj.acc === 'RO',
                type: pObj.type,
                role: pObj.role,
                unit: pObj.unit,
            },
            native: {},
        });

        if (newObj) {
            await this.setStateAsync(pId, { val: pObj.init, ack: pObj.acc !== 'WO', q: 0x00 });
        }
    }

    /**
     * doProcess - process station data
     *
     * @return  nothing
     *
     */
    async doProcess(pCtrlId) {
        this.log.debug(`doProcess triggered (${pCtrlId})`);
        await this.doUpdate(pCtrlId, null);
    }

    /**
     * doUpdate - update controller and states
     *
     * @return  nothing
     *
     */
    async doUpdate(pCtrlId, pAct) {
        this.log.debug(`doUpdate triggered (${pCtrlId}, ${pAct})`);

        const controller = this.controllers[pCtrlId];

        const ret = controller.pidCtrl.update(pAct);
        this.log.debug(`[${controller.ctrlId}] update(${pAct}) - ${JSON.stringify(ret)}`);

        const now = Date.now();
        const nowStr = new Date().toLocaleString();
        await this.setStateAsync(`${controller.ctrlId}.last_upd`, { val: now, ack: true, q: 0x00 });
        await this.setStateAsync(`${controller.ctrlId}.last_upd_str`, { val: nowStr, ack: true, q: 0x00 });
        await this.setStateAsync(`${controller.ctrlId}.y`, { val: ret.y, ack: true, q: 0x00 });
        await this.setStateAsync(`${controller.ctrlId}.diff`, { val: ret.diff, ack: true, q: 0x00 });
        await this.setStateAsync(`${controller.ctrlId}.lim`, { val: ret.lim, ack: true, q: 0x00 });
    }

    async chgAct(pId, pCtrlId, pVal) {
        this.log.debug(`chgAct called (${pCtrlId}, ${pVal})`);

        await this.doUpdate(pCtrlId, pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
    }

    async chgSet(pId, pCtrlId, pVal) {
        this.log.debug(`chgSet called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setSet(pVal);
        await this.doUpdate(pCtrlId, null);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
    }

    async chgSup(pId, pCtrlId, pVal) {
        this.log.debug(`chgSup called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setSup(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
    }

    async chkOff(pId, pCtrlId, pVal) {
        this.log.debug(`chgOff called (${pCtrlId}, ${pVal})`);
        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setOff(pVal);
        await this.doUpdate(pCtrlId, pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
    }

    async chkManInp(pId, pCtrlId, pVal) {
        this.log.debug(`chgManInp called (${pCtrlId}, ${pVal})`);
        // *** TODO ***
    }

    async chkMan(pId, pCtrlId, pVal) {
        this.log.debug(`chgMan called (${pCtrlId}, ${pVal})`);
        // *** TODO ***
    }

    async chgRst(pId, pCtrlId, pVal) {
        this.log.debug(`chgRst called (${pCtrlId}, ${pVal})`);

        await this.setStateAsync(pId, { val: false, ack: true, q: 0x00 });
        const controller = this.controllers[pCtrlId];
        if (pVal) await controller.pidCtrl.reset();
        await this.doUpdate(pCtrlId, pVal);
    }

    async chgHold(pId, pCtrlId, pVal) {
        this.log.debug(`chgHold called (${pCtrlId}, ${pVal})`);
        //await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        // *** TODO ***
    }

    async chkLog(pId, pCtrlId, pVal) {
        this.log.debug(`chgLog called (${pCtrlId}, ${pVal})`);
        // await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        // *** TODO ***
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Pid(options);
} else {
    // otherwise start the instance directly
    new Pid();
}
