import React, { useState, useEffect } from 'react';
import { Clock, MapPin, ShieldCheck, AlertTriangle, LogOut } from 'lucide-react';
import { recentAttendance } from '../services/mockData';
import { AttendanceLog, User } from '../types';

const Attendance: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  
  // Status state
  const [actionStatus, setActionStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [todayLog, setTodayLog] = useState<AttendanceLog | undefined>(undefined);
  
  // Simulated Client IP
  const simulatedIp = '203.0.113.50'; 
  const isOfficeIp = true; // Hardcoded simulation

  useEffect(() => {
    // 1. Get User
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u: User = JSON.parse(storedUser);
      setUser(u);
      
      // 2. Load Logs for this user
      const userLogs = recentAttendance.filter(log => log.employeeId === u.id);
      setLogs(userLogs);

      // 3. Check if checked in today
      const todayStr = new Date().toISOString().split('T')[0];
      const todayEntry = userLogs.find(log => log.date === todayStr);
      setTodayLog(todayEntry);
    }
  }, []);

  const handleAttendanceAction = (type: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!user) return;
    
    setActionStatus('PROCESSING');
    
    // Simulate API/Network Delay
    setTimeout(() => {
       const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
       const todayStr = new Date().toISOString().split('T')[0];

       if (type === 'CHECK_IN') {
           // Create new log
           const newLog: AttendanceLog = {
               id: Date.now().toString(),
               employeeId: user.id,
               employeeName: `${user.firstName} ${user.lastName}`,
               date: todayStr,
               clockInTime: nowTime,
               status: 'PRESENT', // Simplified status logic
               ipAddress: simulatedIp
           };
           
           // Update Shared Data (Mock DB)
           recentAttendance.unshift(newLog);
           
           // Update Local State
           setLogs(prev => [newLog, ...prev]);
           setTodayLog(newLog);
           setActionStatus('SUCCESS');

       } else if (type === 'CHECK_OUT') {
           if (todayLog) {
               // Update existing log
               todayLog.clockOutTime = nowTime;
               
               // In a real app, we'd update the array in db. 
               // Here, since objects are referenced in memory in mockData, mutation might work if ref is same,
               // but safest to find in array and update.
               const idx = recentAttendance.findIndex(l => l.id === todayLog.id);
               if (idx !== -1) {
                   recentAttendance[idx].clockOutTime = nowTime;
               }

               setTodayLog({...todayLog, clockOutTime: nowTime});
               setActionStatus('SUCCESS');
           }
       }
       
       // Reset success message after 2s
       setTimeout(() => setActionStatus('IDLE'), 2000);
    }, 1000);
  };

  const isCheckedIn = !!todayLog;
  const isCheckedOut = !!todayLog?.clockOutTime;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
          <p className="text-gray-500">Manage daily attendance and view logs.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Action Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-1">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Daily Action</h2>
          
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {/* Clock Display */}
            <div className="relative">
              <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center bg-gray-50 ${isCheckedIn && !isCheckedOut ? 'border-green-100' : 'border-gray-100'}`}>
                <div className="text-center">
                    <span className="text-3xl font-mono font-bold text-gray-700 block">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-xs text-gray-400 font-medium uppercase mt-1">Current Time</span>
                </div>
              </div>
              {isCheckedIn && !isCheckedOut && (
                <div className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full border-4 border-white animate-pulse">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="w-full space-y-3">
              {!isCheckedIn && (
                  <button
                    onClick={() => handleAttendanceAction('CHECK_IN')}
                    disabled={actionStatus === 'PROCESSING'}
                    className="w-full py-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 shadow-md transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {actionStatus === 'PROCESSING' ? 'Processing...' : <><Clock className="w-5 h-5"/> Check In</>}
                  </button>
              )}

              {isCheckedIn && !isCheckedOut && (
                  <button
                    onClick={() => handleAttendanceAction('CHECK_OUT')}
                    disabled={actionStatus === 'PROCESSING'}
                    className="w-full py-3 rounded-lg font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                     {actionStatus === 'PROCESSING' ? 'Processing...' : <><LogOut className="w-5 h-5"/> Check Out</>}
                  </button>
              )}

              {isCheckedOut && (
                  <div className="w-full py-3 rounded-lg font-bold text-gray-500 bg-gray-100 text-center border border-gray-200">
                      Day Completed
                  </div>
              )}
            </div>

            {/* Status Info */}
            <div className="text-sm text-gray-500 space-y-2 w-full">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="flex items-center gap-2 text-gray-600">
                   <MapPin className="w-4 h-4" /> Location IP
                </span>
                <span className="font-mono text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">{simulatedIp}</span>
              </div>
              
              {actionStatus === 'SUCCESS' && (
                 <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 border border-green-100 animate-fade-in">
                   <ShieldCheck className="w-4 h-4"/>
                   <span className="text-xs font-medium">Successfully updated attendance.</span>
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* My History Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
           <h2 className="text-lg font-bold text-gray-800 mb-4">My Attendance History</h2>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                   <th className="pb-3">Date</th>
                   <th className="pb-3">Check In</th>
                   <th className="pb-3">Check Out</th>
                   <th className="pb-3">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {logs.map((log) => (
                   <tr key={log.id} className="text-sm hover:bg-gray-50">
                     <td className="py-3 text-gray-900 font-medium">{log.date}</td>
                     <td className="py-3 text-gray-600 flex items-center gap-2">
                       <Clock className="w-3 h-3 text-green-500" />
                       {log.clockInTime || '--:--'}
                     </td>
                     <td className="py-3 text-gray-600">
                        {log.clockOutTime || '--:--'}
                     </td>
                     <td className="py-3">
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                         log.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                         log.status === 'LATE' ? 'bg-yellow-100 text-yellow-700' :
                         'bg-red-100 text-red-700'
                       }`}>
                         {log.status}
                       </span>
                     </td>
                   </tr>
                 ))}
                 {logs.length === 0 && (
                    <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-400">No history available</td>
                    </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;