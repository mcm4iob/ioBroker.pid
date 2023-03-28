'use strict';

class PidCtrl {
    constructor(pThis, pObj) {
        this.data = {
            max: null, // maximum output value
            min: null, // minimum output value
            off: 0, // offset
            set: 0, // setpoint value
            sup: 0, // suppression (hysteresis) value
        };

        this.adapter = this;

        this.k_p = typeof pObj.k_p === 'number' ? pObj.k_p : 1;
        this.k_i = typeof pObj.k_i === 'number' ? pObj.k_i : 0;
        this.k_d = typeof pObj.k_d === 'number' ? pObj.k_d : 0;

        this.act = 0;
        this.sumErr = 0;
        this.lastErr = 0;
        this.lastTs = 0;
        this.lastDt = 0;
        this.lim = false;
    }

    /*
    set(pObj) {
        for (const key in pObj) {
            if (typeof this.data[key] === 'undefined') {
                throw new Error(`[pid.js] unexpected key ${key} encountered - report to developer`);
            }
            this.data[key] = pObj[key];
        }
    }
    */

    setMax(pMax) {
        this.data.max = pMax;
    }

    setMin(pMin) {
        this.data.min = pMin;
    }

    setOff(pOff) {
        this.data.off = pOff;
    }

    setSet(pSet) {
        this.data.set = pSet;
    }

    setSup(pSup) {
        this.data.sup = pSup;
    }

    update(pAct) {
        if (this.data.min && this.data.max && this.data.min > this.data.max)
            throw new Error(`[pid.js] Invalid arguments min/max : ${this.data.min}/${this.data.max}`);

        if (pAct !== null) this.act = pAct;

        // Calculate dt
        const now = Date.now();
        let dt; // delta time
        if (this.lastTs === 0) {
            // First time update() is called
            dt = 0;
        } else {
            dt = (now - this.lastTs) / 1000; // in seconds
        }
        if (typeof dt !== 'number' || dt === 0) dt = 1;

        this.err = this.data.set - this.act;
        this.sumErr = this.sumErr + this.err * dt;
        this.diffErr = (this.err - this.lastErr) / dt;

        // calulate output value
        this.y = this.data.off + this.k_p * this.err + this.k_i * this.sumErr + this.k_d * this.diffErr;

        // handle range limit
        this.lim = false;
        if (this.data.max && this.y > this.data.max) {
            this.sumErr = (this.data.max - this.data.off - this.k_p * this.err - this.k_d * this.diffErr) / this.k_i;
            this.y = this.data.max;
            this.lim = true;
        }
        if (this.data.min && this.y < this.data.min) {
            this.sumErr = (this.data.min - this.data.off - this.k_p * this.err - this.k_d * this.diffErr) / this.k_i;
            this.y = this.data.min;
            this.lim = true;
        }

        // prepare next cycle
        this.lastTs = now;
        this.lastErr = this.err;
        this.lastDt = dt * 1000; //ms again

        const ret = {
            ts: this.lastTs,
            act: this.act,
            set: this.data.set,
            diff: this.err,
            off: this.data.off,
            y: this.y,
            lim: this.lim,
            dt: this.lastDt,
            differr: this.diffErr,
            sumerr: this.sumErr,
        };

        return ret;
    }

    reset() {
        this.act = 0;
        this.sumErr = 0;
        this.lastErr = 0;
        this.lastTs = 0;
    }
}

module.exports = PidCtrl;
