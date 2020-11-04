/* eslint-disable no-underscore-dangle */

/**
 *  features:
 *  stdTTL: yes, customize, default = false,
 *  maxKeys: yes, customize, default = 1000,
 *  checkPeriod: not, no customize,
 *  deleteOnExpire: not, no customize,
 *  useClones: not, no customize,
 *
 * @class MemoryStore
 */
class MemoryStore {
    /**
     * Creates an instance of MemoryStore.
     * @param {number} [maxLength=1000]
     * @param {number} [ttlSec=false]
     * @memberof MemoryStore
     */
    constructor(maxLength = 1000, ttlSec = false) {
        this.store = new Map();
        this.maxLength = maxLength;
        this.ttlSec = ttlSec;
    }

    _getItem(key) {
        const item = this.store.get(String(key));
        return item.value || null;
    }

    smartGetItem(key) {
        const item = this.store.get(String(key));
        if (!item) {
            return null;
        }

        if (this.ttlSec) {
            if (Date.now() > item.time + this.ttlSec * 1000) {
                this.removeItem(key);
                return null;
            }
        }
        this._renewKeyPosition(key, item);
        // console.log('getItem(key) => ', String(key));
        return item.value;
    }

    isHas(key) {
        return this.store.has(String(key));
    }

    _setItem(key, value, time) {
        if (this.ttlSec) {
            this.store.set(String(key), { value, time: time || Date.now() });
        } else {
            this.store.set(String(key), { value });
        }
    }

    setItem(key, value) {
        if (this.getLength() >= this.maxLength) {
            this.removeItem(this.getOldestKey());
        }
        this._setItem(key, value);
        // console.log('setItem(key, value) => ', { key, value });
    }

    removeItem(key) {
        this.store.delete(String(key));
    }

    clear() {
        this.store.clear();
    }

    getLength() {
        return this.store.size;
    }

    getOldestKey() {
        return this.store.keys().next().value;
    }

    _renewKeyPosition(key, item) {
        this.removeItem(key);
        this._setItem(key, item.value, item.time);
    }

    setNewSettings(maxLength = this.maxLength, ttlSec = this.ttlSec) {
        this.maxLength = maxLength;
        this.ttlSec = ttlSec;
    }
}

export default MemoryStore;
