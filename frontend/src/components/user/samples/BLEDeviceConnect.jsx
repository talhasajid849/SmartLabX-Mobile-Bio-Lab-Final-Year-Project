'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from '@/styles/user/BLEDeviceConnect.module.css';
import { server } from '@/server/servert';

export default function BLEDeviceConnect({ sampleId, onBLESessionCreated, onClose }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bleSessionId, setBleSessionId] = useState(null);
  const [showUnattachedSessions, setShowUnattachedSessions] = useState(false);
  const [unattachedSessions, setUnattachedSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  
  // Live sensor data
  const [liveData, setLiveData] = useState({
    temperature: null,
    ph: null,
    salinity: null,
    turbidity: null,
    dissolved_oxygen: null
  });

  // Available simulated devices
  const [deviceList] = useState([
    { 
      id: 1, 
      name: 'BioLab pH Meter Pro', 
      type: 'pH Sensor', 
      battery: 85,
      capabilities: ['ph']
    },
    { 
      id: 2, 
      name: 'BioLab Temp Probe X200', 
      type: 'Temperature Sensor', 
      battery: 92,
      capabilities: ['temperature']
    },
    { 
      id: 3, 
      name: 'BioLab Multi Sensor Pro', 
      type: 'Multi-parameter Sensor', 
      battery: 78,
      capabilities: ['temperature', 'ph', 'salinity', 'turbidity', 'dissolved_oxygen']
    },
    { 
      id: 4, 
      name: 'BioLab Salinity Meter', 
      type: 'Salinity Sensor', 
      battery: 95,
      capabilities: ['salinity']
    }
  ]);

  // Fetch unattached BLE sessions when component mounts
  useEffect(() => {
    if (sampleId) {
      fetchUnattachedSessions();
    }
  }, [sampleId]);

  const fetchUnattachedSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await axios.get(
        `${server}/sensors/sessions?attached=false`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setUnattachedSessions(response.data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Simulate real-time sensor readings
  const startSimulatingReadings = useCallback((device) => {
    const interval = setInterval(() => {
      setLiveData(prev => {
        const newData = { ...prev };
        
        if (device.capabilities.includes('temperature')) {
          newData.temperature = (20 + Math.random() * 15).toFixed(1);
        }
        
        if (device.capabilities.includes('ph')) {
          newData.ph = (6 + Math.random() * 3).toFixed(2);
        }
        
        if (device.capabilities.includes('salinity')) {
          newData.salinity = (30 + Math.random() * 10).toFixed(1);
        }
        
        if (device.capabilities.includes('turbidity')) {
          newData.turbidity = (0 + Math.random() * 100).toFixed(0);
        }
        
        if (device.capabilities.includes('dissolved_oxygen')) {
          newData.dissolved_oxygen = (5 + Math.random() * 5).toFixed(2);
        }
        
        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Simulate connecting to a device
  const connectToDevice = useCallback((device) => {
    setIsConnecting(true);
    
    setTimeout(() => {
      setConnectedDevice(device);
      setIsConnecting(false);
      toast.success(`Connected to ${device.name}`);
      
      startSimulatingReadings(device);
    }, 1500);
  }, [startSimulatingReadings]);

  // Disconnect from device
  const disconnectDevice = useCallback(() => {
    if (connectedDevice) {
      setConnectedDevice(null);
      setLiveData({
        temperature: null,
        ph: null,
        salinity: null,
        turbidity: null,
        dissolved_oxygen: null
      });
      toast.info('Device disconnected');
    }
  }, [connectedDevice]);

  // Create BLE session and optionally attach to sample
  const createBLESession = async () => {
    setIsSaving(true);

    try {
      // Prepare readings array
      const readings = [];
      
      if (liveData.temperature !== null) {
        readings.push({
          readingType: 'temperature',
          value: parseFloat(liveData.temperature),
          unit: '°C'
        });
      }
      
      if (liveData.ph !== null) {
        readings.push({
          readingType: 'ph',
          value: parseFloat(liveData.ph),
          unit: 'pH'
        });
      }
      
      if (liveData.salinity !== null) {
        readings.push({
          readingType: 'salinity',
          value: parseFloat(liveData.salinity),
          unit: 'ppt'
        });
      }
      
      if (liveData.turbidity !== null) {
        readings.push({
          readingType: 'turbidity',
          value: parseFloat(liveData.turbidity),
          unit: 'NTU'
        });
      }
      
      if (liveData.dissolved_oxygen !== null) {
        readings.push({
          readingType: 'dissolved_oxygen',
          value: parseFloat(liveData.dissolved_oxygen),
          unit: 'mg/L'
        });
      }

      if (readings.length === 0) {
        toast.warning('No readings to save');
        setIsSaving(false);
        return;
      }

      // Create BLE session
      const response = await axios.post(
        `${server}/sensors/`,
        {
          deviceName: connectedDevice.name,
          deviceType: connectedDevice.type,
          readings: readings
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        const sessionId = response.data.bleSessionId;
        setBleSessionId(sessionId);
        
        toast.success(`BLE session created! ID: ${sessionId}`);
        
        // If sampleId exists, attach immediately
        if (sampleId) {
          await attachSessionToSample(sessionId);
        } else {
          // Just pass back the session data
          if (onBLESessionCreated) {
            onBLESessionCreated({
              bleSessionId: sessionId,
              deviceName: connectedDevice.name,
              readings: liveData
            });
          }
          
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }

    } catch (error) {
      console.error('Error creating BLE session:', error);
      toast.error(error.response?.data?.message || 'Failed to save BLE session');
    } finally {
      setIsSaving(false);
    }
  };

  // Attach existing session to sample
  const attachSessionToSample = async (sessionId) => {
    try {
      const response = await axios.put(
        `${server}/sensors/session/${sessionId}/attach`,
        { sampleId },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('BLE session attached to sample!');
        
        if (onBLESessionCreated) {
          onBLESessionCreated({
            bleSessionId: sessionId,
            deviceName: connectedDevice?.name,
            attached: true
          });
        }
        
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Error attaching session:', error);
      toast.error(error.response?.data?.message || 'Failed to attach session');
    }
  };

  // Attach a previously created session
  const attachExistingSession = async (session) => {
    setIsSaving(true);
    await attachSessionToSample(session.ble_session_id);
    setIsSaving(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectDevice();
    };
  }, [disconnectDevice]);

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>🔬 BLE Device Manager</h2>
          <button onClick={onClose} className={styles.closeIconBtn}>×</button>
        </div>

        {/* Show existing sessions if we have a sample */}
        {sampleId && !connectedDevice && (
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowUnattachedSessions(!showUnattachedSessions)}
              style={{
                padding: '10px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                marginBottom: '10px'
              }}
            >
              {showUnattachedSessions ? '📡 Connect New Device' : '📂 Use Existing Session'}
            </button>

            {showUnattachedSessions && (
              <div style={{ 
                background: '#f9fafb', 
                padding: '16px', 
                borderRadius: '8px',
                marginTop: '10px'
              }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>
                  Previously Created Sessions
                </h3>
                {loadingSessions ? (
                  <p>Loading sessions...</p>
                ) : unattachedSessions.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>
                    No unattached sessions available
                  </p>
                ) : (
                  unattachedSessions.map(session => (
                    <div 
                      key={session.ble_session_id}
                      style={{
                        background: 'white',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong>{session.device_name}</strong>
                        <p style={{ fontSize: '13px', color: '#6b7280' }}>
                          {session.readings_count} readings • {new Date(session.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => attachExistingSession(session)}
                        disabled={isSaving}
                        style={{
                          padding: '8px 12px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        {isSaving ? '⏳' : '📎 Attach'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {!showUnattachedSessions && !connectedDevice && (
          <div>
            <div className={styles.deviceList}>
              <h3>📡 Available Devices</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                Select a simulated BLE device to start receiving sensor data
              </p>
              
              {deviceList.map(device => (
                <div key={device.id} className={styles.deviceItem}>
                  <div className={styles.deviceInfo}>
                    <strong>{device.name}</strong>
                    <p>{device.type}</p>
                    <div className={styles.capabilities}>
                      {device.capabilities.map(cap => (
                        <span key={cap} className={styles.capabilityBadge}>
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.deviceActions}>
                    <span className={styles.battery}>🔋 {device.battery}%</span>
                    <button
                      onClick={() => connectToDevice(device)}
                      disabled={isConnecting}
                      className={styles.connectBtnSmall}
                    >
                      {isConnecting ? '⏳' : '📡 Connect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.infoBox}>
              <p>
                <strong>ℹ️ Simulation Mode:</strong> This is a simulated BLE environment. 
                Real sensor values will be generated automatically once connected.
              </p>
            </div>
          </div>
        )}

        {connectedDevice && (
          <div className={styles.connectedSection}>
            <div className={styles.statusBadge}>
              ✅ Connected to {connectedDevice.name}
            </div>

            <div className={styles.deviceBatteryInfo}>
              <span>🔋 Battery: {connectedDevice.battery}%</span>
              <span>📶 Signal: Strong</span>
            </div>

            <div className={styles.liveDataSection}>
              <h3>📊 Live Sensor Data</h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                Data updates every 2 seconds
              </p>
              
              <div className={styles.dataGrid}>
                {connectedDevice.capabilities.includes('temperature') && (
                  <div className={styles.dataCard}>
                    <span className={styles.icon}>🌡️</span>
                    <span className={styles.label}>Temperature</span>
                    <span className={styles.value}>
                      {liveData.temperature ? `${liveData.temperature}°C` : '--'}
                    </span>
                  </div>
                )}

                {connectedDevice.capabilities.includes('ph') && (
                  <div className={styles.dataCard}>
                    <span className={styles.icon}>⚗️</span>
                    <span className={styles.label}>pH Level</span>
                    <span className={styles.value}>
                      {liveData.ph || '--'}
                    </span>
                  </div>
                )}

                {connectedDevice.capabilities.includes('salinity') && (
                  <div className={styles.dataCard}>
                    <span className={styles.icon}>🌊</span>
                    <span className={styles.label}>Salinity</span>
                    <span className={styles.value}>
                      {liveData.salinity ? `${liveData.salinity} ppt` : '--'}
                    </span>
                  </div>
                )}

                {connectedDevice.capabilities.includes('turbidity') && (
                  <div className={styles.dataCard}>
                    <span className={styles.icon}>💧</span>
                    <span className={styles.label}>Turbidity</span>
                    <span className={styles.value}>
                      {liveData.turbidity ? `${liveData.turbidity} NTU` : '--'}
                    </span>
                  </div>
                )}

                {connectedDevice.capabilities.includes('dissolved_oxygen') && (
                  <div className={styles.dataCard}>
                    <span className={styles.icon}>💨</span>
                    <span className={styles.label}>Dissolved O₂</span>
                    <span className={styles.value}>
                      {liveData.dissolved_oxygen ? `${liveData.dissolved_oxygen} mg/L` : '--'}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.actions}>
                <button 
                  onClick={createBLESession} 
                  className={styles.useDataBtn}
                  disabled={isSaving}
                >
                  {isSaving ? '💾 Saving...' : sampleId ? '💾 Save & Attach' : '💾 Save Session'}
                </button>
                <button 
                  onClick={disconnectDevice} 
                  className={styles.disconnectBtn}
                  disabled={isSaving}
                >
                  🔌 Disconnect
                </button>
              </div>

              {bleSessionId && (
                <p style={{ color: '#10b981', fontSize: '13px', marginTop: '10px' }}>
                  ✅ Session ID: {bleSessionId} {sampleId ? '- Attached to sample' : '- Ready to attach'}
                </p>
              )}
            </div>
          </div>
        )}

        <button 
          onClick={onClose} 
          className={styles.closeBtn}
          disabled={isSaving}
        >
          Close
        </button>
      </div>
    </div>
  );
}