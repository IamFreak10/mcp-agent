// syncService.js — with markReady() + Stale Check
import { getUrl, API_ENDPOINTS } from '@/config/apiConfig';
import { APP_MEMORY } from '../cache/globalCache';

export async function syncContacts() {
  // Stale নয় এবং data আছে → skip করো
  if (!APP_MEMORY.isStale('contacts') && APP_MEMORY.has('contacts')) {
    console.log('[Sync] Contacts cache is fresh, skipping fetch.');
    return;
  }
  try {
    const res = await fetch(getUrl(API_ENDPOINTS.CONTACTS));
    const result = await res.json();
    if (result.success) {
      APP_MEMORY.update('contacts', result.data);
    }
  } catch (error) {
    console.error('[Sync] Contacts sync failed:', error);
  }
}

export async function syncMeetings() {
  if (!APP_MEMORY.isStale('meetings') && APP_MEMORY.has('meetings')) {
    console.log('[Sync] Meetings cache is fresh, skipping fetch.');
    return;
  }
  try {
    const res = await fetch(getUrl(API_ENDPOINTS.MEETINGS));
    const result = await res.json();
    if (result.success) APP_MEMORY.update('meetings', result.data);
  } catch (error) {
    console.error('[Sync] Meetings sync failed:', error);
  }
}

export async function syncTasks() {
  if (!APP_MEMORY.isStale('tasks') && APP_MEMORY.has('tasks')) {
    console.log('[Sync] Tasks cache is fresh, skipping fetch.');
    return;
  }
  try {
    const res = await fetch(getUrl(API_ENDPOINTS.TASKS));
    const result = await res.json();
    if (result.success) APP_MEMORY.update('tasks', result.data);
  } catch (error) {
    console.error('[Sync] Tasks sync failed:', error);
  }
}

export async function syncAllData() {
  console.log('[Sync] Starting full sync...');
  await Promise.all([syncContacts(), syncMeetings(), syncTasks()]);
  APP_MEMORY.markReady(); // ← এটাই key — sync শেষে ready mark করো
  console.log('[Sync] All data synced and cache is READY.');
}
