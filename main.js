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
    cycle:      { type: 'number',  name: 'cycle time',          desc: 'descCycle',   role: 'value',         unit: 'ms', acc: 'RO', init: null },
    useXp:      { type: 'boolean',  name: 'use Xp mode',        desc: 'descUseXp',   role: 'value',         unit: '',   acc: 'RO', init: false },
    dao:        { type: 'boolean',  name: 'deriative act only', desc: 'descDao',   role: 'value',         unit: '',   acc: 'RO', init: false },

    /* changeable params */
    xp:         { type: 'number',  name: 'prop factor',         desc: 'descXp',       role: 'value',         unit: '',  acc: 'RW', init: 50 },
    kp:         { type: 'number',  name: 'prop term',           desc: 'descKp',       role: 'value',         unit: '',   acc: 'RW', init: 1 },
    tn:         { type: 'number',  name: 'reset time',          desc: 'descKi',       role: 'value',         unit: 's',  acc: 'RW', init: 0 },
    tv:         { type: 'number',  name: 'derivative time',     desc: 'descKd',       role: 'value',         unit: 's',  acc: 'RW', init: 0 },
    min:        { type: 'number',  name: 'minimum value',       desc: 'descMin',      role: 'value',         unit: '',   acc: 'RW', init: 0 },
    max:        { type: 'number',  name: 'maximum value',       desc: 'descMax',      role: 'value',         unit: '',   acc: 'RW', init: 100 },
    off:        { type: 'number',  name: 'offset value',        desc: 'descOff',      role: 'value',         unit: '',   acc: 'RW', init: 0 },
    sup:        { type: 'number',  name: 'suppress value',      desc: 'descSup',      role: 'value',         unit: '',   acc: 'RW', init: 0 },

    /* input states */
    act:        { type: 'number',  name: 'actual value',        desc: 'descAct',      role: 'value',         unit: '',   acc: 'RW', init: 0 },
    set:        { type: 'number',  name: 'set point',           desc: 'descSet',      role: 'value',         unit: '',   acc: 'RW', init: 0 },
    man_inp:    { type: 'number',  name: 'manual input',        desc: 'descManInp',   role: 'value',         unit: '',   acc: 'RW', init: 0 },
    man:        { type: 'boolean', name: 'manual mode',         desc: 'descMan',      role: 'switch.enable', unit: '',   acc: 'RW', init: false },
    rst:        { type: 'boolean', name: 'reset controller',    desc: 'descRst',      role: 'button',        unit: '',   acc: 'WO', init: false },
    run:        { type: 'boolean', name: 'controller running',  desc: 'descRun',      role: 'switch.enable', unit: '',   acc: 'RW', init: null },

    /* output states */
    y:          { type: 'number',  name: 'output value',        desc: 'descY',        role: 'value',         unit: '',   acc: 'RO', init: null },
    diff:       { type: 'number',  name: 'error value',         desc: 'descDiff',     role: 'value',         unit: '',   acc: 'RO', init: null },
    lim:        { type: 'boolean', name: 'controler limited',   desc: 'descLim',      role: 'switch.enable', unit: '',   acc: 'RO', init: null },
    i_differr:  { type: 'number',  name: 'int diff error',      desc: 'descIDiffErr', role: 'value',         unit: '',   acc: 'RO', init: null },
    i_sumerr:   { type: 'number',  name: 'int sum error',       desc: 'descISumErr',  role: 'value',         unit: '',   acc: 'RO', init: null },

    /* utility */
    last_delta:   { type: 'number',  name: 'last delta time',   desc: 'descLastDelta',   role: 'value',      unit: 'ms', acc: 'RO', init: null },
    last_upd:     { type: 'number',  name: 'last update ts',    desc: 'descLastUpd',     role: 'value',      unit: '',   acc: 'RO', init: null },
    last_upd_str: { type: 'string',  name: 'last update',       desc: 'descLastUpdStr',  role: 'value',      unit: '',   acc: 'RO', init: null },
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
            xp:         this.chgXp.bind(this),
            kp:         this.chgKp.bind(this),
            useXp:      null,
            dao:        null,
            tn:         this.chgTn.bind(this),
            tv:         this.chgTv.bind(this),
            min:        this.chgMin.bind(this),
            max:        this.chgMax.bind(this),
            off:        this.chgOff.bind(this),
            sup:        this.chgSup.bind(this),

            cycle:      null,

            /* input states */
            act:        this.chgAct.bind(this),
            set:        this.chgSet.bind(this),
            man_inp:    this.chgManInp.bind(this),
            man:        this.chgMan.bind(this),
            rst:        this.chgRst.bind(this),
            run:        this.chgRun.bind(this),

            /* output states */
            y:          null,
            diff:       null,
            lim:        null,
            i_differr:  null,
            i_sumerr:   null,

            /* utility */
            last_delta:     null,
            last_upd:       null,
            last_upd_str:   null,
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

        // validate config
        // TODO if (! await this.validateConfig()) ...Pid;

        // reset and cleanup states
        await this.resetStateObjects();

        // init state objects
        await this.initStateObjects();

        // start scanning loop(s)
        let instanceCnt = 0;
        if (this.config.controllers) {
            for (const controller of this.config.controllers) {
                if (!controller.ctrlAct) continue;

                this.log.info(`[start] start instance with id ${controller.ctrlId}`);

                const ctrlIdTxt = `C-${controller.ctrlId}`.replace(this.FORBIDDEN_CHARS, '_');

                let _KpXp;
                let _tn;
                let _min;
                let _max;
                let _tv;
                let _off;
                let _sup;
                const useXp = this.config.ctrlMode === 1;
                if (controller.ctrlUseStateCfg) {
                    _KpXp = useXp
                        ? (await this.getStateAsync(`${ctrlIdTxt}.xp`))?.val
                        : (await this.getStateAsync(`${ctrlIdTxt}.kp`))?.val;
                    _tn = (await this.getStateAsync(`${ctrlIdTxt}.tn`))?.val;
                    _max = (await this.getStateAsync(`${ctrlIdTxt}.max`))?.val;
                    _tv = (await this.getStateAsync(`${ctrlIdTxt}.tv`))?.val;
                    _off = (await this.getStateAsync(`${ctrlIdTxt}.off`))?.val;
                    _sup = (await this.getStateAsync(`${ctrlIdTxt}.sup`))?.val;
                } else {
                    _KpXp = controller.ctrlKpXp;
                    _tn = controller.ctrlTn;
                    _min = controller.ctrlMin;
                    _max = controller.ctrlMax;
                    _tv = controller.ctrlTv;
                    _off = controller.ctrlOff;
                    _sup = controller.ctrlSup;
                }

                const KpXp = this.getNumParam(ctrlIdTxt, 'xpkp', _KpXp, 1);
                const tn = this.getNumParam(ctrlIdTxt, 'tn', _tn, 0);
                let min = this.getNumParam(ctrlIdTxt, 'min', _min, 0);
                let max = this.getNumParam(ctrlIdTxt, 'max', _max, 100);
                const tv = this.getNumParam(ctrlIdTxt, 'tv', _tv, 0);
                const off = this.getNumParam(ctrlIdTxt, 'off', _off, 0);
                const sup = this.getNumParam(ctrlIdTxt, 'sup', _sup, 0);

                if (min >= max) {
                    this.log.warn(`[C-${controller.ctrlId}] - ${min} >= ${min}, using min=0, max=100 instead`);
                    min = 0;
                    max = 100;
                }

                const kp = useXp ? (max - min) * KpXp : KpXp;

                let ctrlCycle = controller.ctrlCycle;
                if (ctrlCycle !== 0 && ctrlCycle < 100) {
                    ctrlCycle = 100;
                    this.log.warn(`[C-${controller.ctrlId}] - invalid cycle time, set to 100ms`);
                }
                if (ctrlCycle > 3600 * 1000) {
                    ctrlCycle = 3600 * 1000;
                    this.log.warn(`[C-${controller.ctrlId}] - invalid cycle time, set to 3600s`);
                }

                const pidCtrl = new PidCtrl(this, {
                    kp: kp,
                    tn: tn,
                    tv: tv,
                    min: min,
                    max: max,
                    off: off,
                    sup: sup,
                    dao: this.config.ctrlActDiff,
                    useXp: useXp,
                });

                this.controllers[controller.ctrlId] = {
                    ctrlIdTxt: ctrlIdTxt,
                    pidCtrl: pidCtrl,
                    cycle: ctrlCycle,
                    running: false,
                    timer: null,
                    manual: controller.man || false,
                };

                const params = pidCtrl.getParams();
                this.log.info(`[${ctrlIdTxt}] controller initialized (${JSON.stringify(params)})`);
                await this.updParamStates(controller.ctrlId);

                await this.setStateAsync(`${ctrlIdTxt}.cycle`, { val: ctrlCycle, ack: true, q: 0x00 });

                this.controllers[controller.ctrlId].pidCtrl.reset();
                await this.setStateAsync(`${ctrlIdTxt}.rst`, { val: false, ack: true, q: 0x00 });

                const manual = await this.getStateAsync(`${ctrlIdTxt}.man`);
                this.controllers[controller.ctrlId].manual = manual.val;
                if (manual && manual.val) {
                    const manInp = await this.getStateAsync(`${ctrlIdTxt}.man_inp`);
                    await this.setStateAsync(`${ctrlIdTxt}.y`, { val: manInp?.val, ack: true, q: 0x00 });
                    this.log.debug(`[${ctrlIdTxt}] manual value ${manInp?.val} used to set output`);
                }

                controller.running = controller.ctrlAutoStart;
                if (controller.running && ctrlCycle) {
                    await this.doUpdate(controller.ctrlId);
                    this.controllers[controller.ctrlId].timer = setInterval(
                        this.doUpdate.bind(this),
                        ctrlCycle,
                        controller.ctrlId,
                    );
                }
                await this.setStateAsync(`${ctrlIdTxt}.run`, { val: controller.running, ack: true, q: 0x00 });
                instanceCnt++;
            }
        }
        if (instanceCnt) {
            this.log.info(`processing started for ${instanceCnt} controller(s)`);
            await this.setStateAsync('info.connection', { val: true, ack: true, q: 0x00 });
        } else {
            this.log.warn(`no active controllers(s) detected - check config`);
        }

        // subscribe to all states as most states are writeable anyway
        this.subscribeStates('*');

        return;
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
     * getNumParam - ensure that a paramater is numeric and use default if not
     *
     * @return
     *
     */
    getNumParam(pId, pName, pVal, pDef) {
        let ret = Number(pVal || pDef);
        if (isNaN(ret)) {
            this.log.warn(`[${pId}] - ${pVal} is invalid for parameter '${pName}'; set to ${pDef}`);
            ret = pDef;
        }
        return ret;
    }

    /**
     * resetStateObjects - reset existing state objects
     *
     * @return
     *
     */
    async resetStateObjects() {
        this.log.debug(`resetStateobjects`);

        await iobStates.setStatesAsync('*', { ack: true, q: 0x02 });
    }

    /**
     * initStateObjects - initialize state objects
     *
     * @return
     *
     */
    async initStateObjects() {
        this.log.debug(`initStateobjects`);

        if (this.config.controllers) {
            for (const controller of this.config.controllers) {
                if (!controller.ctrlAct) continue;

                const ctrlIdTxt = `C-${controller.ctrlId}`.replace(this.FORBIDDEN_CHARS, '_');
                await this.initObject({
                    _id: ctrlIdTxt,
                    type: 'device',
                    common: {
                        name: `controller ${controller.ctrlId}`,
                        statusStates: {
                            onlineId: `${this.name}.${this.instance}.${ctrlIdTxt}.run`,
                            errorId: `${this.name}.${this.instance}.${ctrlIdTxt}.lim`,
                        },
                    },
                    native: {},
                });

                for (const key in STATES_CFG) {
                    await this.initStateObject(`${ctrlIdTxt}.${key}`, STATES_CFG[key]);

                    const fullId = `${this.name}.${this.instance}.${ctrlIdTxt}.${key}`;
                    this.stateMap[fullId] = {
                        key: key,
                        ctrlId: `${controller.ctrlId}`,
                        ctrlIdTxt: ctrlIdTxt,
                    };
                }
            }
        }
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

        const exists = !!(await this.getObjectAsync(pObj._id));

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
     * doUpdate - update controller and states
     *
     * @return  nothing
     *
     */
    async doUpdate(pCtrlId) {
        this.log.debug(`doUpdate triggered (${pCtrlId})`);

        const controller = this.controllers[pCtrlId];
        const ctrlIdTxt = controller.ctrlIdTxt;

        const ret = controller.pidCtrl.update();
        this.log.debug(`[${ctrlIdTxt}] update() - ${JSON.stringify(ret)}`);
        if (this.config.optLogChg) this.log.info(`[${ctrlIdTxt}] update() - ${JSON.stringify(ret)}`);

        if (!controller.manual) {
            const nowStr = new Date(ret.ts).toLocaleString();
            await this.setStateAsync(`${ctrlIdTxt}.last_delta`, { val: ret.dt, ack: true, q: 0x00 });
            await this.setStateAsync(`${ctrlIdTxt}.last_upd`, { val: ret.ts, ack: true, q: 0x00 });
            await this.setStateAsync(`${ctrlIdTxt}.last_upd_str`, { val: nowStr, ack: true, q: 0x00 });
            await this.setStateAsync(`${ctrlIdTxt}.y`, { val: ret.y, ack: true, q: 0x00 });
            await this.setStateAsync(`${ctrlIdTxt}.diff`, { val: ret.diff, ack: true, q: 0x00 });
            await this.setStateAsync(`${ctrlIdTxt}.lim`, { val: ret.lim, ack: true, q: 0x00 });
            await this.setStateAsync(`${ctrlIdTxt}.i_differr`, { val: ret.differr, ack: true, q: 0x00 });
            await this.setStateAsync(`${ctrlIdTxt}.i_sumerr`, { val: ret.sumerr, ack: true, q: 0x00 });
        }
    }

    /**
     * updParamStates - update parameter states
     *
     * @return  nothing
     *
     */
    async updParamStates(pCtrlId) {
        this.log.debug(`updParamStates triggered (${pCtrlId})`);

        const controller = this.controllers[pCtrlId];
        const params = controller.pidCtrl.getParams();
        const ctrlIdTxt = controller.ctrlIdTxt;

        await this.setStateAsync(`${ctrlIdTxt}.kp`, { val: params.kp, ack: true, q: 0x00 });
        await this.setStateAsync(`${ctrlIdTxt}.xp`, { val: params.xp, ack: true, q: 0x00 });
        await this.setStateAsync(`${ctrlIdTxt}.useXp`, { val: params.useXp, ack: true, q: 0x00 });
        await this.setStateAsync(`${ctrlIdTxt}.dao`, { val: params.dao, ack: true, q: 0x00 });

        await this.setStateAsync(`${ctrlIdTxt}.tn`, { val: params.tn, ack: true, q: 0x00 });
        await this.setStateAsync(`${ctrlIdTxt}.tv`, { val: params.tv, ack: true, q: 0x00 });
        await this.setStateAsync(`${ctrlIdTxt}.min`, { val: params.min, ack: true, q: 0x00 });
        await this.setStateAsync(`${ctrlIdTxt}.max`, { val: params.max, ack: true, q: 0x00 });
        await this.setStateAsync(`${ctrlIdTxt}.off`, { val: params.off, ack: true, q: 0x00 });
        await this.setStateAsync(`${ctrlIdTxt}.sup`, { val: params.sup, ack: true, q: 0x00 });
    }

    /**
     * chgXxx - callback called if state Xxx changes
     *
     * @return  nothing
     *
     */
    async chgAct(pId, pCtrlId, pVal) {
        this.log.debug(`chgAct called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        const newval = await controller.pidCtrl.setAct(pVal);
        if (controller.running && !controller.ctrlCycle && newval) await this.doUpdate(pCtrlId);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
    }

    async chgMin(pId, pCtrlId, pVal) {
        this.log.debug(`chgMin called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setMin(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgMax(pId, pCtrlId, pVal) {
        this.log.debug(`chgMax called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setMax(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgOff(pId, pCtrlId, pVal) {
        this.log.debug(`chgOff called (${pCtrlId}, ${pVal})`);
        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setOff(pVal);
        if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
    }

    async chgSet(pId, pCtrlId, pVal) {
        this.log.debug(`chgSet called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setSet(pVal);
        if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
    }

    async chgSup(pId, pCtrlId, pVal) {
        this.log.debug(`chgSup called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setSup(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
    }

    async chgKp(pId, pCtrlId, pVal) {
        this.log.debug(`chgKp called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setKp(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgXp(pId, pCtrlId, pVal) {
        this.log.debug(`chgXp called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setXp(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgTn(pId, pCtrlId, pVal) {
        this.log.debug(`chgTn called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setTn(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgTv(pId, pCtrlId, pVal) {
        this.log.debug(`chgTv called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setTv(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgManInp(pId, pCtrlId, pVal) {
        this.log.debug(`chgManInp called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        if (controller.manual) {
            const ts = Date.now();
            const nowStr = new Date(ts).toLocaleString();
            await this.setStateAsync(`${controller.ctrlId}.last_delta`, { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.last_upd`, { val: ts, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.last_upd_str`, { val: nowStr, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.y`, { val: pVal, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.diff`, { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.lim`, { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.i_differr`, { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.i_sumerr`, { val: null, ack: true, q: 0x00 });
        }
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
    }

    async chgMan(pId, pCtrlId, pVal) {
        this.log.debug(`chgMan called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        controller.manual = pVal;
        if (controller.manual) {
            const ts = Date.now();
            const nowStr = new Date(ts).toLocaleString();
            const manInp = await this.getStateAsync(`${controller.ctrlId}.man_inp`);
            await this.setStateAsync(`${controller.ctrlId}.last_delta`, { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.last_upd`, { val: ts, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.last_upd_str`, { val: nowStr, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.y`, { val: manInp?.val, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.diff`, { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.lim`, { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.i_differr`, { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(`${controller.ctrlId}.i_sumerr`, { val: null, ack: true, q: 0x00 });
        } else {
            await this.doUpdate(pCtrlId);
        }
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
    }

    async chgRst(pId, pCtrlId, pVal) {
        this.log.debug(`chgRst called (${pCtrlId}, ${pVal})`);

        await this.setStateAsync(pId, { val: false, ack: true, q: 0x00 });
        const controller = this.controllers[pCtrlId];
        if (pVal) await controller.pidCtrl.reset();
        await this.doUpdate(pCtrlId);
    }

    async chgRun(pId, pCtrlId, pVal) {
        this.log.debug(`chgRun called (${pCtrlId}, ${pVal})`);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        const controller = this.controllers[pCtrlId];
        controller.running = pVal;
        if (controller.running) {
            this.clearInterval(controller.timer);
            controller.timer = setInterval(this.doUpdate.bind(this), controller.cycle, pCtrlId);
        } else {
            this.clearInterval(controller.timer);
        }
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
