import { getUrl, API_ENDPOINTS } from '@/config/apiConfig';
import { APP_MEMORY } from '../cache/globalCache';
export async function syncContacts() {
  try {
    const res = await fetch(getUrl(API_ENDPOINTS.CONTACTS));
    console.log('inside syncService.js:', res);
    const result = await res.json();
    if (result.success) {
      APP_MEMORY.update('contacts', result.data);
    }
  } catch (error) {
    console.error('[SyncService] Error syncing contacts:', error);
  }
}

export async function syncMeetings() {
  /* ক্যালেন্ডার/মিটিং লজিক */
}
export async function syncTasks() {
  /* টাস্ক লজিক */
}

export async function syncAllData() {
  console.log('[SyncService] Synchronizing entire user memory...');
  // প্যারালাল সিনক্রোনাইজেশন (সবগুলো একসাথে কল হবে)
  await Promise.all([syncContacts(), syncMeetings(), syncTasks()]);
  console.log('[SyncService] Global memory sync complete.');
}
