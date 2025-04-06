import React, { useState, useEffect } from "react";
import { Briefcase, List, Bell, RefreshCw } from "lucide-react";
import { Sidebar } from './Sidebar';

const CareerPlanning = () => {
  const [competitions, setCompetitions] = useState([
    { 
      name: "Khelo India Winter Games", 
      date: "23-27 Jan 2025", 
      location: "Leh Ladakh", 
      status: "Completed" 
    }
  ]);
  const [websocket, setWebsocket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [notificationPermission, setNotificationPermission] = useState(
    Notification.permission
  );

  // WebSocket connection
  useEffect(() => {
    let reconnectInterval;
    let ws;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 5000;

    const connect = () => {
      ws = new WebSocket('ws://localhost:5000/ws');

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttempts = 0;
        clearInterval(reconnectInterval);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'competitions') {
            setCompetitions(data.payload);
            // Add notification for new competitions
            if (data.payload.length !== competitions.length) {
              sendCompetitionNotification({
                name: "New Competitions Available",
                body: `${data.payload.length} competitions loaded`
              });
            }
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(`Reconnecting attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
          reconnectInterval = setTimeout(connect, reconnectDelay);
        }
      };

      setWebsocket(ws);
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearInterval(reconnectInterval);
    };
  }, [competitions.length]); // Added dependency

  // Manually refresh competitions
  const manuallyUpdateCompetitions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/competitions');
      if (!response.ok) throw new Error('Network response was not ok');
      
      const newCompetitions = await response.json();
      setCompetitions(newCompetitions.length > 0 ? newCompetitions : [{
        name: "Khelo India Winter Games (Fallback)",
        date: "Coming Soon",
        location: "India",
        status: "Upcoming"
      }]);
      
      sendCompetitionNotification({
        name: "Competitions Updated",
        body: newCompetitions.length > 0 
          ? `${newCompetitions.length} competitions loaded` 
          : 'Using fallback data'
      });
    } catch (error) {
      console.error('Failed to update competitions:', error);
      setCompetitions([{
        name: "Khelo India Winter Games (Error)",
        date: "Try again later",
        location: "India",
        status: "Error"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Notification methods
  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const sendCompetitionNotification = (notification) => {
    if (notificationPermission === "granted") {
      new Notification(notification.name, {
        body: notification.body,
        icon: "/athlete-icon.png"
      });
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      <div className="w-64">
        <Sidebar />
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Career Planning</h2>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${
              connectionStatus === 'connected' ? 'text-green-500' : 
              connectionStatus === 'error' ? 'text-red-500' : 'text-yellow-500'
            }`}>
              <span className={`h-3 w-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></span>
              {connectionStatus}
            </div>
            <button 
              onClick={manuallyUpdateCompetitions}
              disabled={isLoading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 
                text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Competitions
            </button>
          </div>
        </div>

        {/* Competitions Section */}
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <List className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-medium text-white">
              Upcoming Competitions
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitions.map((comp, index) => (
              <div 
                key={index} 
                className="bg-slate-700 p-4 rounded-md hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-semibold">
                    {comp.name}
                  </span>
                  <span 
                    className={`
                      px-3 py-1 rounded-full text-xs 
                      ${comp.status === 'Completed' ? 'bg-green-600' : 
                        comp.status === 'Upcoming' ? 'bg-blue-600' : 'bg-yellow-600'}
                    `}
                  >
                    {comp.status}
                  </span>
                </div>
                <div className="text-slate-400">
                  <p>📅 {comp.date}</p>
                  <p>📍 {comp.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerPlanning;