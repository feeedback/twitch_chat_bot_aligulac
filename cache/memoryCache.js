/* eslint-disable no-underscore-dangle */
class MemoryStore {
    constructor(maxLength = 500) {
        this.store = new Map();
        this.maxLength = maxLength;
    }

    getItem(key) {
        const itemValue = this.store.get(String(key)) || null;
        // console.log('getItem(key) => ', String(key));
        return itemValue;
    }

    isHas(key) {
        return this.store.has(String(key));
    }

    _setItem(key, value) {
        this.store.set(String(key), value);
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

    renewItem(key) {
        const strKey = String(key);
        const itemValue = this.getItem(strKey);
        this.removeItem(strKey);
        this._setItem(strKey, itemValue);
    }
}

module.exports = MemoryStore;
