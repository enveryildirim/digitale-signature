// Kurum İçi Dijital Bilgi Ekranı - Manifest Resolver (Firebase sürümü)
// Eski sunucu tarafı ManifestResolver mantığının saf JS karşılığı.
// TV, admin panelinin yayımladığı aday atama paketinden (bundle) o an oynayacağı
// playlist'i kendi saatine göre seçer. Node testleri için module.exports da verilir.
(function (root) {
  'use strict';

  function toMinutes(hhmm) {
    const parts = String(hhmm).split(':').map(Number);
    return parts[0] * 60 + parts[1];
  }

  // Realtime Database dizileri seyrek olduğunda {"0":..,"2":..} nesnesi olarak döndürebilir
  function toList(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    return Object.keys(value || {}).sort((a, b) => a - b).map(k => value[k]).filter(Boolean);
  }

  function isTimeMatch(a, atTime) {
    // 1. Date Range Check
    if (a.startDate && atTime < new Date(a.startDate)) return false;
    if (a.endDate && atTime > new Date(a.endDate)) return false;

    // 2. Day of Week Check (1=Pazartesi .. 7=Pazar)
    if (a.daysOfWeek && String(a.daysOfWeek).trim().length > 0) {
      const jsDay = atTime.getDay();
      const dayOfWeek = jsDay === 0 ? 7 : jsDay;
      const allowed = String(a.daysOfWeek).split(',').map(d => parseInt(d.trim(), 10));
      if (allowed.indexOf(dayOfWeek) === -1) return false;
    }

    // 3. Time Range Check (HH:mm), gece yarısını aşan aralıklar dahil
    if (a.startTime && a.endTime) {
      const now = atTime.getHours() * 60 + atTime.getMinutes();
      const start = toMinutes(a.startTime);
      const end = toMinutes(a.endTime);
      if (start <= end) {
        if (now < start || now >= end) return false;
      } else if (now < start && now >= end) {
        return false;
      }
    }
    return true;
  }

  /**
   * Priority:
   * 0. Emergency Alert Override
   * 1. Screen-specific scheduled rule
   * 2. Group-specific scheduled rule
   * 3. Screen-specific default assignment
   * 4. Group-specific default assignment
   * bundle.assignments öncelik (desc) ve oluşturulma (desc) sırasıyla gelir.
   */
  function resolveManifest(device, emergency, atTime) {
    atTime = atTime || new Date();
    const base = {
      screenId: device ? device.screenId : null,
      screenName: device ? device.name : '',
      groupName: device ? device.groupName || null : null
    };

    if (emergency && emergency.active) {
      return Object.assign(base, {
        emergency: emergency,
        playlist: null,
        hash: 'emergency-' + (emergency.activatedAt || 'active')
      });
    }

    const list = toList(device && device.bundle && device.bundle.assignments);
    const find = (target, isDefault) => list.find(a =>
      a.target === target && Boolean(a.isDefault) === isDefault && (isDefault || isTimeMatch(a, atTime))
    );

    const chosen = find('screen', false) || find('group', false) || find('screen', true) || find('group', true);

    if (!chosen || !chosen.playlist) {
      return Object.assign(base, { playlist: null, hash: 'empty' });
    }

    const items = toList(chosen.playlist.items).map(item => ({
      id: item.id,
      order: item.order,
      duration: item.duration || item.media.duration || 10,
      media: item.media
    }));

    return Object.assign(base, {
      playlist: { id: chosen.playlist.id, name: chosen.playlist.name, items: items },
      hash: JSON.stringify({
        playlistId: chosen.playlist.id,
        items: items.map(i => [i.id, i.media.url, i.duration])
      })
    });
  }

  const api = { resolveManifest: resolveManifest, isTimeMatch: isTimeMatch };
  root.SignageResolver = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis);
