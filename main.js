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

/* eslint-disable */
/* prettier-ignore */
const STATES_CFG = {
    /* parameters */
    cycle:        { folder: 'cfg',  type: 'number',  name: 'cycle time',          desc: 'descCycle',   role: 'time.interval',
                    unit: 'ms',     acc: 'RO',       init: null,  warnAck: false },
    useXp:        { folder: 'cfg',  type: 'boolean', name: 'use Xp mode',         desc: 'descUseXp',   role: 'value',
                    unit: '',       acc: 'RO',       init: false, warnAck: false },
    dao:          { folder: 'cfg',  type: 'boolean', name: 'derivative act only', desc: 'descDao',     role: 'value',
                    unit: '',       acc: 'RO',       init: false, warnAck: false },
    inv:          { folder: 'cfg',  type: 'boolean', name: 'invert output',       desc: 'descInv',     role: 'value',
                    unit: '',       acc: 'RW',       init: false, warnAck: true },

    /* changeable params */
    xp:           { folder: 'para', type: 'number',  name: 'prop factor',         desc: 'descXp',       role: 'level',
                    unit:   '',     acc:  'RW',      init: 50,    warnAck: true },
    kp:           { folder: 'para', type: 'number',  name: 'prop term',           desc: 'descKp',       role: 'level',
                    unit:   '',     acc:  'RW',      init: 1,     warnAck: true },
    tn:           { folder: 'para', type: 'number',  name: 'reset time',          desc: 'descKi',       role: 'level',
                    unit:   's',    acc:  'RW',      init: 0,     warnAck: true },
    tv:           { folder: 'para', type: 'number',  name: 'derivative time',     desc: 'descKd',       role: 'level',
                    unit:   's',    acc:  'RW',      init: 0,     warnAck: true },
    min:          { folder: 'para', type: 'number',  name: 'minimum value',       desc: 'descMin',      role: 'level.min',
                    unit:   '',     acc:  'RW',      init: 0,     warnAck: true },
    max:          { folder: 'para', type: 'number',  name: 'maximum value',       desc: 'descMax',      role: 'level.max',
                    unit:   '',     acc:  'RW',      init: 100,   warnAck: true },
    off:          { folder: 'para', type: 'number',  name: 'offset value',        desc: 'descOff',      role: 'level',
                    unit:   '',     acc:  'RW',      init: 0,     warnAck: true },
    sup:          { folder: 'para', type: 'number',  name: 'suppress value',      desc: 'descSup',      role: 'level',
                    unit:   '',     acc:  'RW',      init: 0,     warnAck: true },

    /* input states */
    act:          { folder: 'in',   type: 'number',  name: 'actual value',        desc: 'descAct',      role: 'level',
                    unit:   '',     acc:  'RW',      init: 0,     warnAck: true  },
    set:          { folder: 'in',   type: 'number',  name: 'set point',           desc: 'descSet',      role: 'level',
                    unit:   '',     acc:  'RW',      init: 0,     warnAck: true  },
    man_inp:      { folder: 'in',   type: 'number',  name: 'manual input',        desc: 'descManInp',   role: 'level',
                    unit:   '',     acc:  'RW',      init: 0,     warnAck: true  },
    man:          { folder: 'in',   type: 'boolean', name: 'manual mode',         desc: 'descMan',      role: 'switch.enable',
                    unit:   '',     acc:  'RW',      init: false, warnAck: true  },
    rst:          { folder: 'in',   type: 'boolean', name: 'reset controller',    desc: 'descRst',      role: 'button',
                    unit:   '',     acc:  'WO',      init: false, warnAck: true  },
    hold:         { folder: 'in',   type: 'boolean', name: 'controller suspend',  desc: 'descHold',     role: 'switch.enable',
                    unit:   '',     acc:  'RW',      init: false, warnAck: true },

    /* output states */
    y:            { folder: 'out',  type: 'number',  name: 'output value',        desc: 'descY',        role: 'value',
                    unit:   '',     acc:  'RO',      init: null,  warnAck: false },
    diff:         { folder: 'out',  type: 'number',  name: 'error value',         desc: 'descDiff',     role: 'value',
                    unit:   '',     acc:  'RO',      init: null,  warnAck: false },
    lim:          { folder: 'out',  type: 'boolean', name: 'controler limited',   desc: 'descLim',      role: 'indicator.alarm',
                    unit:   '',     acc:  'RO',      init: null,  warnAck: false },
    supr:         { folder: 'out',  type: 'boolean', name: 'supression active',   desc: 'descSupr',     role: 'indicator.alarm',
                    unit:   '',     acc:  'RO',      init: null,  warnAck: false },

    /* utility */
    i_differr:    { folder: 'xtra', type: 'number',  name: 'int diff error',      desc: 'descIDiffErr', role: 'value',
                    unit:   '',     acc:  'RO',      init: null,  warnAck: false },
    i_sumerr:     { folder: 'xtra', type: 'number',  name: 'int sum error',       desc: 'descISumErr',  role: 'value',
                    unit:   '',     acc:  'RO',      init: null,  warnAck: false },
    last_delta:   { folder: 'xtra', type: 'number',  name: 'last delta time',   desc: 'descLastDelta',  role: 'value',
                    unit:   'ms',   acc:  'RO',      init: null,  warnAck: false },
    last_upd:     { folder: 'xtra', type: 'number',  name: 'last update ts',    desc: 'descLastUpd',    role: 'date',
                    unit:   '',     acc:  'RO',      init: null,  warnAck: false },
    run:          { folder: 'xtra', type: 'boolean', name: 'controller running',  desc: 'descRun',      role: 'indicator.working',
                    unit:   '',     acc:  'RO',      init: null,  warnAck: false },

};
/* eslint-enable */

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
            inv:        this.chgInv.bind(this),
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
            hold:       this.chgHold.bind(this),

            /* output states */
            y:          null,
            diff:       null,
            lim:        null,
            supr:       null,

            /* utility */
            i_differr:      null,
            i_sumerr:       null,
            last_delta:     null,
            last_upd:       null,
            run:            this.chgRun.bind(this),
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
let ii=blabla.toString();
        await this.setStateAsync('info.connection', { val: false, ack: true, q: 0x00 });

        /* set global config */
        this.useFolders = !(this.config.optNoFolders || false);

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
                let _inv;
                const useXp = this.config.ctrlMode === 1;
                if (controller.ctrlUseStateCfg) {
                    _KpXp = useXp
                        ? (await this.getStateAsync(this.getExtId(ctrlIdTxt, 'xp')))?.val
                        : (await this.getStateAsync(this.getExtId(ctrlIdTxt, 'kp')))?.val;
                    _tn = (await this.getStateAsync(this.getExtId(ctrlIdTxt, 'tn')))?.val;
                    _max = (await this.getStateAsync(this.getExtId(ctrlIdTxt, 'max')))?.val;
                    _min = (await this.getStateAsync(this.getExtId(ctrlIdTxt, 'min')))?.val;
                    _tv = (await this.getStateAsync(this.getExtId(ctrlIdTxt, 'tv')))?.val;
                    _off = (await this.getStateAsync(this.getExtId(ctrlIdTxt, 'off')))?.val;
                    _sup = (await this.getStateAsync(this.getExtId(ctrlIdTxt, 'sup')))?.val;
                    _inv = (await this.getStateAsync(this.getExtId(ctrlIdTxt, 'inv')))?.val;
                } else {
                    _KpXp = controller.ctrlKpXp;
                    _tn = controller.ctrlTn;
                    _min = controller.ctrlMin;
                    _max = controller.ctrlMax;
                    _tv = controller.ctrlTv;
                    _off = controller.ctrlOff;
                    _sup = controller.ctrlSup;
                    _inv = controller.ctrlInvert;
                }

                const KpXp = this.getNumParam(ctrlIdTxt, 'kpxp', _KpXp, 1);
                const tn = this.getNumParam(ctrlIdTxt, 'tn', _tn, 0);
                let min = this.getNumParam(ctrlIdTxt, 'min', _min, 0);
                let max = this.getNumParam(ctrlIdTxt, 'max', _max, 100);
                const tv = this.getNumParam(ctrlIdTxt, 'tv', _tv, 0);
                const off = this.getNumParam(ctrlIdTxt, 'off', _off, 0);
                const sup = this.getNumParam(ctrlIdTxt, 'sup', _sup, 0);
                const inv = _inv;

                if (min >= max) {
                    this.log.warn(`[C-${controller.ctrlId}] - ${min} >= ${min}, using min=0, max=100 instead`);
                    min = 0;
                    max = 100;
                }

                const kp = useXp ? (max - min) / KpXp : KpXp;

                let ctrlCycle = controller.ctrlCycle;
                if (ctrlCycle < 100) {
                    ctrlCycle = 100;
                    this.log.warn(`[${ctrlIdTxt}] - invalid cycle time, set to 100ms`);
                }
                if (ctrlCycle > 3600 * 1000) {
                    ctrlCycle = 3600 * 1000;
                    this.log.warn(`[${ctrlIdTxt}] - invalid cycle time, set to 3600s`);
                }

                if (useXp) {
                    await this.extendObjectAsync(this.getExtId(ctrlIdTxt, 'kp'), { common: { write: false } });
                } else {
                    await this.extendObjectAsync(this.getExtId(ctrlIdTxt, 'xp'), { common: { write: false } });
                }

                const pidCtrl = new PidCtrl(this, {
                    kp: kp,
                    tn: tn,
                    tv: tv,
                    min: min,
                    max: max,
                    off: off,
                    sup: sup,
                    dao: this.config.ctrlActDiff || false,
                    useXp: useXp,
                    inv: inv || false,
                });

                this.controllers[controller.ctrlId] = {
                    ctrlIdTxt: ctrlIdTxt,
                    pidCtrl: pidCtrl,
                    cycle: ctrlCycle,
                    man: false, // set below
                    hold: false, // set below
                    running: false,
                    timer: null,
                };

                const params = pidCtrl.getParams();
                this.log.info(`[${ctrlIdTxt}] controller initialized (${JSON.stringify(params)})`);
                await this.updParamStates(controller.ctrlId);

                await this.setStateAsync(this.getExtId(ctrlIdTxt, 'cycle'), { val: ctrlCycle, ack: true, q: 0x00 });

                const _act = (await this.getStateAsync(this.getExtId(ctrlIdTxt, 'act')))?.val;
                const act = this.getNumParam(ctrlIdTxt, 'act', _act, 0);
                this.controllers[controller.ctrlId].pidCtrl.setAct(act);
                await this.setStateAsync(this.getExtId(ctrlIdTxt, 'act'), { val: act, ack: true, q: 0x00 });

                const _set = (await this.getStateAsync(this.getExtId(ctrlIdTxt, 'set')))?.val;
                const set = this.getNumParam(ctrlIdTxt, 'set', _set, 0);
                this.controllers[controller.ctrlId].pidCtrl.setSet(set);
                await this.setStateAsync(this.getExtId(ctrlIdTxt, 'set'), { val: set, ack: true, q: 0x00 });

                this.controllers[controller.ctrlId].pidCtrl.reset();
                await this.setStateAsync(this.getExtId(ctrlIdTxt, 'rst'), { val: false, ack: true, q: 0x00 });

                const man = !!(await this.getStateAsync(this.getExtId(ctrlIdTxt, 'man'))?.val);
                this.controllers[controller.ctrlId].man = man;
                await this.setStateAsync(this.getExtId(ctrlIdTxt, 'man'), { val: man, ack: true, q: 0x00 });

                const manInp = await this.getStateAsync(this.getExtId(ctrlIdTxt, 'man_inp'));
                await this.setStateAsync(this.getExtId(ctrlIdTxt, 'man_inp'), { val: manInp?.val, ack: true, q: 0x00 });

                if (man) {
                    await this.setStateAsync(this.getExtId(ctrlIdTxt, 'y'), { val: manInp?.val, ack: true, q: 0x00 });
                    this.log.debug(`[${ctrlIdTxt}] manual value ${manInp?.val} used to set output`);
                    this.controllers[controller.ctrlId].man = true;
                } else {
                    this.controllers[controller.ctrlId].man = false;
                }

                const hold = !controller.ctrlAutoStart;
                this.controllers[controller.ctrlId].hold = hold;
                await this.setStateAsync(this.getExtId(ctrlIdTxt, 'hold'), { val: hold, ack: true, q: 0x00 });

                const run = !(hold || man);
                controller.running = run;
                await this.setStateAsync(this.getExtId(ctrlIdTxt, 'run'), { val: run, ack: true, q: 0x00 });

                if (controller.running && ctrlCycle) {
                    await pidCtrl.restart(); // reset dt
                    await this.doUpdate(controller.ctrlId);
                    this.controllers[controller.ctrlId].timer = setInterval(
                        this.doUpdate.bind(this),
                        ctrlCycle,
                        controller.ctrlId,
                    );
                }
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

        if (!pState) return;

        const stateMap = this.stateMap[pId];

        if (stateMap) {
            // well known own states
            const ctrlId = stateMap.ctrlId;
            const ctrlIdTxt = stateMap.ctrlIdTxt;
            const key = stateMap.key;

            // ignore write with ack=true
            if (pState.ack) {
                //if (STATES_CFG[key].warnAck)
                if (pState.from !== `system.adapter.${this.name}.${this.instance}`)
                    this.log.warn(`[${ctrlIdTxt}] state ${key} changed with ack=true; ignoring change`);
                return;
            }

            if (typeof this.STATECHG_CFG[key] !== 'function') return;

            // ensure valid data
            const controller = this.controllers[ctrlId];
            if (!controller) {
                this.log.debug (`this.controllers[${ctrlId}] is undefined`);
                return;
            }
            if (!controller.pidCtrl) {
                this.log.debug (`this.controllers[${ctrlId}].pidCtrl is undefined`);
                return;
            }
            this.STATECHG_CFG[key](pId, ctrlId, pState.val);
        } else {
            // foreign states
        }
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

        if (this.useFolders) {
            await this.delObjects('C-\\w+\\.\\w+', 'state');
        } else {
            await this.delObjects('C-\\w+\\.\\w+', 'folder');
        }

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
                // if (!controller.ctrlAct) continue;

                const ctrlIdTxt = `C-${controller.ctrlId}`.replace(this.FORBIDDEN_CHARS, '_');
                await this.initObject({
                    _id: ctrlIdTxt,
                    type: 'device',
                    common: {
                        name: `controller ${controller.ctrlId}`,
                        statusStates: {
                            onlineId: `${this.name}.${this.instance}.${ctrlIdTxt}.run`,
                        },
                    },
                    native: {},
                });

                for (const key in STATES_CFG) {
                    if (this.useFolders) {
                        const folder = STATES_CFG[key].folder || '';
                        if (folder) {
                            await this.initObject({
                                _id: `${ctrlIdTxt}.${folder}`,
                                type: 'folder',
                                common: {
                                    name: '',
                                },
                                native: {},
                            });
                        }
                    }

                    const extId = this.getExtId(ctrlIdTxt, key);
                    await this.initStateObject(extId, STATES_CFG[key]);

                    const fullId = `${this.name}.${this.instance}.${extId}`;
                    this.stateMap[fullId] = {
                        key: key,
                        ctrlId: `${controller.ctrlId}`,
                        ctrlIdTxt: ctrlIdTxt,
                        extId: extId,
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
     * getExtId - return real object id dependin g on useFolder and id values
     *
     * @param   {string}    pCtrlId     id prefix based on controller
     * @param   {string}    pStateId    id part baded on state
     *
     * @return  extended Id (folder.id or simply id)
     *
     */
    getExtId(pCtrlId, pStateId) {
        this.log.debug(`getExtId (${pCtrlId}, ${pStateId})`);

        let id = pStateId;

        if (this.useFolders) {
            const folder = STATES_CFG[pStateId].folder || '';
            if (folder) id = `${folder}.${pStateId}`;
        }
        return `${pCtrlId}.${id}`;
    }

    /**
     * delObjects - delete objects specified by pattern
     *
     * @param   {string}    pPattern    pattern to select object for deletion
     * @param   {string}    pType       type oj obecjts to select for deletion
     * @return  nothing
     *
     */
    async delObjects(pPattern, pType) {
        this.log.debug(`delObjects (${pPattern}, ${pType})`);

        const re = new RegExp(`^${this.name}.${this.instance}.${pPattern}$`);
        const objs = await this.getForeignObjectsAsync(`${this.name}.${this.instance}.*`, pType);
        let logflag = false;

        if (objs) {
            for (const obj of Object.values(objs)) {
                if (re.test(obj._id)) {
                    if (!logflag) this.log.info(`removing old states ...`);
                    logflag = true;

                    this.log.debug(`removing object ${obj._id}...`);
                    await this.delForeignObjectAsync(obj._id, { recursive: true });
                }
            }
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
        if (this.config.optLogCalc) this.log.info(`[${ctrlIdTxt}] update() - ${JSON.stringify(ret)}`);

        if (!controller.man) {
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'last_delta'), { val: ret.dt, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'last_upd'), { val: ret.ts, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'y'), { val: ret.y, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'diff'), { val: ret.diff, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'lim'), { val: ret.lim, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'supr'), { val: ret.supr, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'i_differr'), { val: ret.differr, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'i_sumerr'), { val: ret.sumerr, ack: true, q: 0x00 });
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

        await this.setStateAsync(this.getExtId(ctrlIdTxt, 'kp'), { val: params.kp, ack: true, q: 0x00 });
        await this.setStateAsync(this.getExtId(ctrlIdTxt, 'xp'), { val: params.xp, ack: true, q: 0x00 });
        await this.setStateAsync(this.getExtId(ctrlIdTxt, 'useXp'), { val: params.useXp, ack: true, q: 0x00 });
        await this.setStateAsync(this.getExtId(ctrlIdTxt, 'dao'), { val: params.dao, ack: true, q: 0x00 });
        await this.setStateAsync(this.getExtId(ctrlIdTxt, 'inv'), { val: params.inv, ack: true, q: 0x00 });

        await this.setStateAsync(this.getExtId(ctrlIdTxt, 'tn'), { val: params.tn, ack: true, q: 0x00 });
        await this.setStateAsync(this.getExtId(ctrlIdTxt, 'tv'), { val: params.tv, ack: true, q: 0x00 });
        await this.setStateAsync(this.getExtId(ctrlIdTxt, 'min'), { val: params.min, ack: true, q: 0x00 });
        await this.setStateAsync(this.getExtId(ctrlIdTxt, 'max'), { val: params.max, ack: true, q: 0x00 });
        await this.setStateAsync(this.getExtId(ctrlIdTxt, 'off'), { val: params.off, ack: true, q: 0x00 });
        await this.setStateAsync(this.getExtId(ctrlIdTxt, 'sup'), { val: params.sup, ack: true, q: 0x00 });
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
        await controller.pidCtrl.setAct(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        //if (controller.running && !controller.cycle) await this.doUpdate(pCtrlId);
    }

    async chgInv(pId, pCtrlId, pVal) {
        this.log.debug(`chgInv called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setInv(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        //if (controller.running && !controller.cycle) await this.doUpdate(pCtrlId);
    }

    async chgMin(pId, pCtrlId, pVal) {
        this.log.debug(`chgMin called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        const params = await controller.pidCtrl.getParams();

        if (typeof pVal !== 'number' || pVal >= params.max) {
            this.log.warn(
                `[${controller.ctrlIdTxt}] invalid value (${pVal}) for min ignored, must be less than ${params.max}`,
            );
            await this.setStateAsync(pId, { val: params.min, ack: true, q: 0x00 });
            return;
        }

        await controller.pidCtrl.setMin(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        //if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgMax(pId, pCtrlId, pVal) {
        this.log.debug(`chgMax called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        const params = await controller.pidCtrl.getParams();

        if (typeof pVal !== 'number' || pVal <= params.min) {
            this.log.warn(
                `[${controller.ctrlIdTxt}] invalid value (${pVal}) for max ignored, must be greater than ${params.min}`,
            );
            await this.setStateAsync(pId, { val: params.max, ack: true, q: 0x00 });
            return;
        }

        await controller.pidCtrl.setMax(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        //if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgOff(pId, pCtrlId, pVal) {
        this.log.debug(`chgOff called (${pCtrlId}, ${pVal})`);
        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setOff(pVal);

        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        //if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgSet(pId, pCtrlId, pVal) {
        this.log.debug(`chgSet called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setSet(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        //if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgSup(pId, pCtrlId, pVal) {
        this.log.debug(`chgSup called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];

        if (typeof pVal !== 'number' || pVal < 0) {
            this.log.warn(`[${controller.ctrlIdTxt}] invalid value (${pVal}) for sup ignored`);
            const params = await controller.pidCtrl.getParams();
            await this.setStateAsync(pId, { val: params.sup, ack: true, q: 0x00 });
            return;
        }

        await controller.pidCtrl.setSup(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
    }

    async chgKp(pId, pCtrlId, pVal) {
        this.log.debug(`chgKp called (${pCtrlId}, ${pVal})`);

        if (this.config.ctrlMode === 1) return; // xp mode

        const controller = this.controllers[pCtrlId];

        if (typeof pVal !== 'number' || pVal <= 0) {
            this.log.warn(`[${controller.ctrlIdTxt}] invalid value (${pVal}) for kp ignored`);
            const params = await controller.pidCtrl.getParams();
            await this.setStateAsync(pId, { val: params.kp, ack: true, q: 0x00 });
            return;
        }

        await controller.pidCtrl.setKp(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        //if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgXp(pId, pCtrlId, pVal) {
        this.log.debug(`chgXp called (${pCtrlId}, ${pVal})`);

        if (this.config.ctrlMode !== 1) return; // kp mode

        const controller = this.controllers[pCtrlId];

        if (typeof pVal !== 'number' || pVal <= 0) {
            this.log.warn(`[${controller.ctrlIdTxt}] invalid value (${pVal}) for xp ignored`);
            const params = await controller.pidCtrl.getParams();
            await this.setStateAsync(pId, { val: params.xp, ack: true, q: 0x00 });
            return;
        }

        await controller.pidCtrl.setXp(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        //if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgTn(pId, pCtrlId, pVal) {
        this.log.debug(`chgTn called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setTn(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        //if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgTv(pId, pCtrlId, pVal) {
        this.log.debug(`chgTv called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        await controller.pidCtrl.setTv(pVal);
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
        await this.updParamStates(pCtrlId);
        //if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgHold(pId, pCtrlId, pVal) {
        this.log.debug(`chgHold called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        controller.hold = pVal;
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });

        const run = !(controller.hold || controller.man);
        //await this.setStateAsync(this.getExtId(controller.ctrlIdTxt, 'run'), { val: run, ack: false, q: 0x00 }); //ack=false to trigger action
        await this.chgRun(this.getExtId(controller.ctrlIdTxt, 'run'), pCtrlId, run);
    }

    async chgMan(pId, pCtrlId, pVal) {
        this.log.debug(`chgMan called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        controller.man = pVal;
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });

        if (controller.man) {
            const ctrlIdTxt = controller.ctrlIdTxt;
            const ts = Date.now();
            const manInp = await this.getStateAsync(this.getExtId(ctrlIdTxt, 'man_inp'));
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'last_delta'), { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'last_upd'), { val: ts, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'y'), { val: manInp?.val, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'diff'), { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'lim'), { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'supr'), { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'i_differr'), { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'i_sumerr'), { val: null, ack: true, q: 0x00 });
        }

        const run = !(controller.hold || controller.man);
        //await this.setStateAsync(this.getExtId(controller.ctrlIdTxt, 'run'), { val: run, ack: false, q: 0x00 }); //ack=false to trigger action
        await this.chgRun(this.getExtId(controller.ctrlIdTxt, 'run'), pCtrlId, run);
    }

    async chgManInp(pId, pCtrlId, pVal) {
        this.log.debug(`chgManInp called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        const ctrlIdTxt = controller.ctrlIdTxt;

        if (controller.man) {
            const ts = Date.now();
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'last_delta'), { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'last_upd'), { val: ts, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'y'), { val: pVal, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'diff'), { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'lim'), { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'supr'), { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'i_differr'), { val: null, ack: true, q: 0x00 });
            await this.setStateAsync(this.getExtId(ctrlIdTxt, 'i_sumerr'), { val: null, ack: true, q: 0x00 });
        }
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
    }

    async chgRst(pId, pCtrlId, pVal) {
        this.log.debug(`chgRst called (${pCtrlId}, ${pVal})`);

        await this.setStateAsync(pId, { val: false, ack: true, q: 0x00 });
        const controller = this.controllers[pCtrlId];
        if (pVal) await controller.pidCtrl.reset();
        //if (controller.running && !controller.ctrlCycle) await this.doUpdate(pCtrlId);
    }

    async chgRun(pId, pCtrlId, pVal) {
        this.log.debug(`chgHold called (${pCtrlId}, ${pVal})`);

        const controller = this.controllers[pCtrlId];
        const ctrlIdTxt = controller.ctrlIdTxt;
        const isRunning = controller.running;
        controller.running = pVal;

        if (controller.running) {
            if (!isRunning) {
                // (re)start only if not already running
                if (controller.timer) this.clearInterval(controller.timer);
                if (this.config.optLogCalc) this.log.info(`[${ctrlIdTxt}] controller starting`);
                await controller.pidCtrl.restart(); // reset dt
                await this.doUpdate(pCtrlId);
                controller.timer = setInterval(this.doUpdate.bind(this), controller.cycle, pCtrlId);
            }
        } else {
            if (controller.timer) {
                this.clearInterval(controller.timer);
                controller.timer = null;
                if (this.config.optLogCalc) this.log.info(`[${ctrlIdTxt}] controller stopped`);
            }
        }
        await this.setStateAsync(pId, { val: pVal, ack: true, q: 0x00 });
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
