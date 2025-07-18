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
        <button class="create-event-btn" @click="showCreateEvent = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Event</span>
        </button>
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

    <!-- Create Event Modal -->
    <div v-if="showCreateEvent" class="modal-overlay" @click="showCreateEvent = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Create New Event</h3>
          <button class="modal-close" @click="showCreateEvent = false">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <form @submit.prevent="createEvent" class="modal-form">
          <div class="form-group">
            <label class="form-label">Event Title</label>
            <input 
              v-model="newEvent.title" 
              type="text" 
              class="form-input" 
              placeholder="Enter event title"
              required
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input 
                v-model="newEvent.startDate" 
                type="date" 
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Start Time</label>
              <input 
                v-model="newEvent.startTime" 
                type="time" 
                class="form-input"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">End Date</label>
              <input 
                v-model="newEvent.endDate" 
                type="date" 
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">End Time</label>
              <input 
                v-model="newEvent.endTime" 
                type="time" 
                class="form-input"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Artist</label>
            <select v-model="newEvent.artist_id" class="form-select">
              <option value="">Select an artist</option>
              <option v-for="artist in artists" :key="artist.id" :value="artist.id">
                {{ artist.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea 
              v-model="newEvent.description" 
              class="form-textarea" 
              placeholder="Event description (optional)"
              rows="3"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="showCreateEvent = false">
              Cancel
            </button>
            <button type="submit" class="btn-create">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, inject } from 'vue'
import { useCalendarStore } from '@/stores/calendar'
import { useDashboardStore } from '@/stores/dashboard'
import { apiService } from '@/shared/services/api'

const calendarStore = useCalendarStore()
const dashboardStore = useDashboardStore()
const showToast = inject('showToast', () => {})

const todayDate = ref(new Date())
const view = ref('list')
const artistFilter = ref('')
const showCreateEvent = ref(false)

const newEvent = reactive({
  title: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  artist_id: '',
  description: ''
})

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

const createEvent = async () => {
  try {
    const startDateTime = new Date(`${newEvent.startDate}T${newEvent.startTime}`)
    const endDateTime = new Date(`${newEvent.endDate}T${newEvent.endTime}`)
    
    if (endDateTime <= startDateTime) {
      showToast({ message: 'End time must be after start time', type: 'error' })
      return
    }

    const eventData = {
      title: newEvent.title,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      artist_id: newEvent.artist_id || null,
      description: newEvent.description,
      created_at: new Date().toISOString()
    }

    const result = await apiService.create('calendar_events', eventData)
    if (result.data) {
      calendarStore.events.push(result.data)
      showToast({ message: 'Event created successfully', type: 'success' })
      showCreateEvent.value = false
      resetEventForm()
    }
  } catch (error) {
    console.error('Failed to create event:', error)
    showToast({ message: 'Failed to create event', type: 'error' })
  }
}

const resetEventForm = () => {
  Object.assign(newEvent, {
    title: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    artist_id: '',
    description: ''
  })
}

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
.create-event-btn{display:flex;align-items:center;gap:8px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);color:#22c55e;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;margin-right:12px;}
.create-event-btn:hover{background:rgba(34,197,94,0.2);}
.create-event-btn svg{width:16px;height:16px;}
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-close svg {
  width: 18px;
  height: 18px;
}

.modal-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-cancel,
.btn-create {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.btn-create {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.btn-create:hover {
  background: rgba(34, 197, 94, 0.2);
}

.btn-create svg {
  width: 16px;
  height: 16px;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>
