import { defineStore } from "pinia";
import { ref } from "vue";

export const useAlarmStore = defineStore("alarms", () => {
  const unreadCount = ref(0);
  const latestAlarm = ref<any>(null);

  function incrementUnread() {
    unreadCount.value++;
  }

  function clearUnread() {
    unreadCount.value = 0;
  }

  function setLatestAlarm(alarm: any) {
    latestAlarm.value = alarm;
    incrementUnread();
  }

  function dismissAlarm() {
    latestAlarm.value = null;
  }

  return {
    unreadCount,
    latestAlarm,
    incrementUnread,
    clearUnread,
    setLatestAlarm,
    dismissAlarm,
  };
});
