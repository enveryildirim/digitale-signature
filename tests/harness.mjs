// Test düzeneği: gerçek player/player.js + player/resolver.js dosyalarını Node vm içinde,
// sahte DOM ve Realtime Database REST/EventSource taklidi (FakeDb) ile çalıştırır.
// FakeDb, database.rules.json'daki TV'ye açık yazma kurallarını (pairing, telemetry) uygular.
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { webcrypto } from 'crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESOLVER_SRC = fs.readFileSync(path.join(ROOT, 'player/resolver.js'), 'utf8');
const PLAYER_SRC = fs.readFileSync(path.join(ROOT, 'player/player.js'), 'utf8');

export const DB_URL = 'https://signage-test-default-rtdb.firebaseio.com';

const segs = (p) => p.split('/').filter(Boolean);
const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));

function resolveServerValues(value) {
  if (value && typeof value === 'object') {
    if (value['.sv'] === 'timestamp') return Date.now();
    const out = Array.isArray(value) ? [] : {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveServerValues(v);
    return out;
  }
  return value;
}

function prune(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.length ? value.map(prune) : null;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    const p = prune(v);
    if (p !== null && p !== undefined) out[k] = p;
  }
  return Object.keys(out).length ? out : null;
}

export class FakeDb {
  constructor() {
    this.root = null;
    this.streams = new Set();
    this.online = true;
    this.writes = 0;
  }

  get(p) {
    let node = this.root;
    for (const s of segs(p)) {
      if (!node || typeof node !== 'object') return null;
      node = node[s];
    }
    return node === undefined ? null : clone(node);
  }

  _setRaw(p, value) {
    const parts = segs(p);
    if (parts.length === 0) {
      this.root = prune(clone(value));
      return;
    }
    if (!this.root || typeof this.root !== 'object') this.root = {};
    let node = this.root;
    for (const s of parts.slice(0, -1)) {
      if (!node[s] || typeof node[s] !== 'object') node[s] = {};
      node = node[s];
    }
    node[parts[parts.length - 1]] = clone(value);
    this.root = prune(this.root);
  }

  // Admin SDK karşılığı (kurallar admin için her yere yazmaya izin verir)
  set(p, value) {
    value = resolveServerValues(value);
    this._setRaw(p, value);
    this._notify(p, 'put', value);
  }

  update(p, obj) {
    obj = resolveServerValues(obj);
    for (const [k, v] of Object.entries(obj)) this._setRaw(`${p}/${k}`, v);
    this._notify(p, 'patch', obj);
  }

  _notify(p, kind, data) {
    const w = segs(p);
    for (const stream of this.streams) {
      const l = segs(stream.path);
      const writeInsideListener = l.every((s, i) => w[i] === s);
      const listenerInsideWrite = w.every((s, i) => l[i] === s);
      if (writeInsideListener) {
        stream.emit(kind, { path: '/' + w.slice(l.length).join('/'), data: clone(data) });
      } else if (listenerInsideWrite) {
        stream.emit('put', { path: '/', data: this.get(stream.path) });
      }
    }
  }

  // TV'den gelen REST istekleri: database.rules.json'daki herkese açık yazma kuralları
  _ruleAllows(p, method) {
    const [top, key] = segs(p);
    if (top === 'pairing' && segs(p).length === 2) {
      return method === 'PUT' && this.get(p) === null && /^[2-9A-HJ-NP-Z]{6}$/.test(key);
    }
    if (top === 'telemetry' && key) {
      return this.get(`devices/${key}`) !== null;
    }
    return false;
  }

  fetch = async (url, opts = {}) => {
    if (!this.online) throw new TypeError('Failed to fetch');
    if (url === '/__/firebase/init.json') {
      return response(200, { projectId: 'signage-test', databaseURL: DB_URL });
    }
    const p = url.slice(DB_URL.length).replace(/\.json$/, '');
    const method = opts.method || 'GET';
    if (method === 'GET') return response(200, this.get(p));
    if (!this._ruleAllows(p, method)) return response(401, { error: 'Permission denied' });
    this.writes++;
    const body = JSON.parse(opts.body);
    if (method === 'PUT') this.set(p, body);
    else if (method === 'PATCH') this.update(p, body);
    return response(200, body);
  };

  EventSourceClass() {
    const db = this;
    return class FakeEventSource {
      constructor(url) {
        this.path = url.slice(DB_URL.length).replace(/\.json$/, '');
        this.listeners = {};
        this.closed = false;
        db.streams.add(this);
        setTimeout(() => {
          if (!db.online || this.closed) return;
          this.emit('put', { path: '/', data: db.get(this.path) });
        }, 0);
      }
      addEventListener(type, fn) {
        (this.listeners[type] ||= []).push(fn);
      }
      emit(type, payload) {
        if (this.closed || !db.online) return;
        for (const fn of this.listeners[type] || []) fn({ data: JSON.stringify(payload) });
      }
      close() {
        this.closed = true;
        db.streams.delete(this);
      }
    };
  }
}

function response(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => clone(body) };
}

class FakeElement {
  constructor(tagName, id = null) {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.children = [];
    this.attributes = {};
    this.textContent = '';
    this._classes = new Set();
    this.classList = {
      add: (c) => this._classes.add(c),
      remove: (c) => this._classes.delete(c),
      contains: (c) => this._classes.has(c)
    };
  }
  set innerHTML(_v) {
    this.children = [];
  }
  get innerHTML() {
    return '';
  }
  set src(v) {
    this._src = v;
    // Medya "yüklenir": img/video/iframe olaylarını bir sonraki tick'te tetikle
    setTimeout(() => {
      if (this.tagName === 'VIDEO') this.onloadeddata?.();
      else this.onload?.();
    }, 0);
  }
  get src() {
    return this._src;
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  setAttribute(k, v) {
    this.attributes[k] = v;
  }
  querySelector(tag) {
    return this.children.find((c) => c.tagName === tag.toUpperCase()) || null;
  }
  play() {
    return Promise.resolve();
  }
}

const PLAYER_ELEMENT_IDS = [
  'player-container', 'slot-a', 'slot-b', 'idle-screen', 'idle-clock', 'idle-date', 'idle-screen-info',
  'pairing-screen', 'pairing-code-display', 'pairing-status-text', 'status-pill',
  'emergency-screen', 'emergency-title', 'emergency-message'
];

// Tek bir TV (veya önizleme iframe'i) başlatır. storage verilirse aynı TV'nin yeniden açılışı taklit edilir.
export function startPlayer(db, { search = '', storage = new Map() } = {}) {
  const timers = new Set();
  const windowListeners = {};
  const elements = {};
  for (const id of PLAYER_ELEMENT_IDS) {
    elements[id] = new FakeElement('div', id);
    if (['idle-screen', 'pairing-screen', 'emergency-screen', 'status-pill'].includes(id)) {
      elements[id].classList.add('hidden');
    }
  }

  let disposed = false;
  const track = (setFn, clearFn) => [
    (fn, ms, ...args) => {
      if (disposed) return null;
      const h = setFn(() => {
        if (setFn === setTimeout) timers.delete(h);
        fn(...args);
      }, ms);
      timers.add(h);
      return h;
    },
    (h) => {
      timers.delete(h);
      clearFn(h);
    }
  ];
  const [sTimeout, cTimeout] = track(setTimeout, clearTimeout);
  const [sInterval, cInterval] = track(setInterval, clearInterval);

  const player = {
    reloads: 0,
    writes: 0,
    elements,
    storage,
    isVisible: (id) => !elements[id].classList.contains('hidden'),
    activeMediaUrl() {
      const slot = elements['slot-a'].classList.contains('active') ? elements['slot-a'] : elements['slot-b'];
      return slot.children[0]?.src || null;
    },
    dispatch(type) {
      for (const fn of windowListeners[type] || []) fn();
    },
    dispose() {
      disposed = true;
      for (const h of timers) {
        clearTimeout(h);
        clearInterval(h);
      }
      timers.clear();
      for (const s of [...db.streams]) if (s.owner === player) s.close();
    }
  };

  const EventSourceBase = db.EventSourceClass();
  class OwnedEventSource extends EventSourceBase {
    constructor(url) {
      super(url);
      this.owner = player;
    }
  }

  const context = {
    console: { log() {}, warn() {}, error: console.error },
    crypto: webcrypto,
    URLSearchParams,
    Date,
    JSON,
    Math,
    Promise,
    Uint8Array,
    Array,
    Object,
    String,
    Number,
    Boolean,
    setTimeout: sTimeout,
    clearTimeout: cTimeout,
    setInterval: sInterval,
    clearInterval: cInterval,
    fetch: (url, opts = {}) => {
      if (opts.method && opts.method !== 'GET') player.writes++;
      return db.fetch(url, opts);
    },
    EventSource: OwnedEventSource,
    Image: class extends FakeElement {
      constructor() {
        super('img');
      }
    },
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k)
    },
    navigator: { userAgent: 'FakeTV/1.0' },
    document: {
      visibilityState: 'visible',
      getElementById: (id) => elements[id] || null,
      createElement: (tag) => new FakeElement(tag),
      addEventListener() {}
    }
  };
  context.window = context;
  context.self = context;
  context.window.screen = { width: 1920, height: 1080 };
  context.window.location = {
    search,
    reload: () => {
      player.reloads++;
    }
  };
  context.window.addEventListener = (type, fn) => {
    (windowListeners[type] ||= []).push(fn);
  };

  vm.createContext(context);
  vm.runInContext(RESOLVER_SRC, context, { filename: 'resolver.js' });
  vm.runInContext(PLAYER_SRC, context, { filename: 'player.js' });
  player.dispatch('DOMContentLoaded');
  return player;
}

export async function until(cond, { timeout = 3000, label = 'koşul' } = {}) {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > timeout) throw new Error(`Zaman aşımı: ${label}`);
    await new Promise((r) => setTimeout(r, 5));
  }
  return Date.now() - start;
}
