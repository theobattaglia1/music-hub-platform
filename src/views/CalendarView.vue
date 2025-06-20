<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <div class="left-controls">
        <button class="nav-btn" @click="prev">←</button>
        <button class="nav-btn" @click="today">Today</button>
        <button class="nav-btn" @click="next">→</button>
        <h2 class="current-label">{{ label }}</h2>
      </div>
      <div class="right-controls">
        <select v-model="view" class="view-select">
          <option value="list">List</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
        <select v-model="artistFilter" class="artist-select">
          <option value="">All Artists</option>
          <option v-for="a in artists" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
      </div>
    </div>

    <div class="calendar-content">
      <template v-if="view==='list'">
        <ul class="list-view">
          <li v-for="ev in filteredEvents" :key="ev.id" class="event-row">
            <span class="date">{{ formatDate(ev.start) }}</span>
            <span class="time">{{ formatTime(ev.start) }}</span>
            <span class="title">{{ ev.title }}</span>
            <span class="artist">{{ getArtist(ev.artist_id)?.name }}</span>
          </li>
        </ul>
      </template>
      <div v-else-if="view==='month'" class="month-grid">
        <div class="month-cell header" v-for="d in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" :key="d">{{ d }}</div>
        <div v-for="dayObj in monthDays" :key="dayObj.date.toISOString()" class="month-cell" :class="{other:!dayObj.current}">
          <span class="day-num">{{ dayObj.date.getDate() }}</span>
          <div class="events-mini">
            <span v-for="ev in eventsByDate(dayObj.date)" :key="ev.id" class="mini-dot" :title="ev.title"></span>
          </div>
        </div>
      </div>
      <div v-else-if="view==='day'" class="day-view">
        <h3 class="day-header">{{ todayDate.toLocaleDateString(undefined,{ weekday:'long', year:'numeric', month:'long', day:'numeric'}) }}</h3>
        <ul class="list-view">
          <li v-for="ev in eventsByDate(todayDate)" :key="ev.id" class="event-row">
            <span class="time">{{ formatTime(ev.start) }} – {{ formatTime(ev.end) }}</span>
            <span class="title">{{ ev.title }}</span>
            <span class="artist">{{ getArtist(ev.artist_id)?.name }}</span>
          </li>
          <li v-if="eventsByDate(todayDate).length===0" class="placeholder small">No events</li>
        </ul>
      </div>
      <div v-else-if="view==='week'" class="week-grid">
        <div class="week-day" v-for="wd in weekDays" :key="wd.iso">
          <div class="week-day-header">{{ wd.label }}</div>
          <ul class="week-day-list">
            <li v-for="ev in eventsByDate(wd.date)" :key="ev.id" class="week-ev">{{ formatTime(ev.start) }} • {{ ev.title }}</li>
            <li v-if="eventsByDate(wd.date).length===0" class="none">—</li>
          </ul>
        </div>
      </div>
      <div v-else class="placeholder">{{ view.toUpperCase() }} view coming soon…</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCalendarStore } from '@/stores/calendar'
import { useDashboardStore } from '@/stores/dashboard'

const calendarStore = useCalendarStore()
const dashboardStore = useDashboardStore()

const todayDate = ref(new Date())
const view = ref('list')
const artistFilter = ref('')

const artists = computed(() => dashboardStore.artists)

const filteredEvents = computed(() => {
  let evs = calendarStore.filteredEvents
  if (artistFilter.value) evs = evs.filter(e => e.artist_id === artistFilter.value)
  // sort by start
  return [...evs].sort((a,b)=> new Date(a.start)-new Date(b.start))
})

const label = computed(() => {
  const d = todayDate.value
  return d.toLocaleDateString(undefined,{ year:'numeric', month:'long'})
})

const changeDate = (delta) => {
  const d = new Date(todayDate.value)
  if (view.value === 'month') d.setMonth(d.getMonth() + delta)
  else if (view.value === 'week') d.setDate(d.getDate() + delta * 7)
  else d.setDate(d.getDate() + delta)
  todayDate.value = d
}
const prev = () => changeDate(-1)
const next = () => changeDate(1)
const today = () => { todayDate.value = new Date() }

const formatTime = (iso) => new Date(iso).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
const formatDate = (iso) => new Date(iso).toLocaleDateString()
const getArtist = (id)=> artists.value.find(a=>a.id===id)
const eventsByDate = (date)=> calendarStore.eventsOnDate(date)

// Month grid generation
const monthDays = computed(() => {
  if (view.value !== 'month') return []
  const start = new Date(todayDate.value.getFullYear(), todayDate.value.getMonth(), 1)
  const end = new Date(todayDate.value.getFullYear(), todayDate.value.getMonth()+1, 0)
  const days = []
  // prepend days from previous month to start on Sunday
  const prevDays = (start.getDay()+7)%7
  for (let i=prevDays;i>0;i--){
    const d=new Date(start);d.setDate(d.getDate()-i);days.push({date:d, current:false})
  }
  for(let d=1;d<=end.getDate();d++){
    days.push({date:new Date(start.getFullYear(),start.getMonth(),d),current:true})
  }
  // fill to complete 6 weeks (42 cells)
  while(days.length%7!==0||days.length<42){
    const d=new Date(end);d.setDate(end.getDate()+ (days.length- (prevDays+end.getDate()) ) +1);days.push({date:d,current:false})
  }
  return days
})

// Week days array
const weekDays = computed(()=>{
  if(view.value!=='week') return []
  const start = new Date(todayDate.value)
  const dayIdx = (start.getDay()+7)%7
  start.setDate(start.getDate()-dayIdx)
  const arr=[]
  for(let i=0;i<7;i++){
    const d=new Date(start);d.setDate(start.getDate()+i)
    arr.push({date:d,label:d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}),iso:d.toISOString()})
  }
  return arr
})

onMounted(()=>{
  if (!calendarStore.events.length) calendarStore.loadEvents()
  if (dashboardStore.artists.length===0) dashboardStore.loadArtists()
})
</script>

<style scoped>
.calendar-view{height:100%;display:flex;flex-direction:column;background:#000;color:white;padding:24px;}
.calendar-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;}
.nav-btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:white;padding:6px 12px;margin-right:8px;border-radius:6px;cursor:pointer;}
.nav-btn:hover{background:rgba(255,255,255,0.08);}
.current-label{font-size:20px;font-weight:600;}
.view-select,.artist-select{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:white;padding:6px 12px;border-radius:6px;margin-left:8px;}
.list-view{display:flex;flex-direction:column;gap:12px;}
.event-row{display:grid;grid-template-columns:120px 80px 1fr 160px;gap:12px;padding:12px;border:1px solid rgba(255,255,255,0.05);border-radius:8px;background:rgba(255,255,255,0.03);}
.event-row:hover{background:rgba(255,255,255,0.05);}
.date{color:rgba(255,255,255,0.7);} .time{color:rgba(255,255,255,0.6);} .artist{color:rgba(255,255,255,0.7);}
.placeholder{padding:60px;text-align:center;color:rgba(255,255,255,0.6);}
.month-grid{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:100px;border:1px solid rgba(255,255,255,0.08);}
.month-cell{border:1px solid rgba(255,255,255,0.05);padding:4px;position:relative;}
.month-cell.other{background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.4);}
.month-cell.header{background:rgba(255,255,255,0.08);font-weight:600;text-align:center;height:32px;display:flex;align-items:center;justify-content:center;color:white;}
.day-num{font-size:12px;}
.events-mini{position:absolute;bottom:4px;left:4px;display:flex;gap:2px;flex-wrap:wrap;}
.mini-dot{width:6px;height:6px;border-radius:50%;background:#4ecdc4;}
/* Week grid */
.week-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;}
.week-day{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:6px;display:flex;flex-direction:column;min-height:120px;}
.week-day-header{font-size:12px;font-weight:600;margin-bottom:4px;}
.week-day-list{flex:1;display:flex;flex-direction:column;gap:4px;font-size:12px;}
.week-ev{color:#4ecdc4;}
.none{color:rgba(255,255,255,0.4);}
</style>
