import {createStore} from './store.js';
import {createApp} from './app.js';
const store=createStore();
const {app,startJobs,stopJobs}=createApp({store});
const server=app.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>{console.log('Lijn & Laag website listening');startJobs();});
process.on('SIGTERM',()=>{stopJobs();server.close(async()=>{await store?.close();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();});
