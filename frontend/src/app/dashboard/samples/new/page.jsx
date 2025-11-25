'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import QRScanner from '@/components/user/samples/QRScanner';
import BLEDeviceConnect from '@/components/user/samples/BLEDeviceConnect';
import styles from '@/styles/user/SAmpleNew.module.css';
import axios from 'axios';
import { server } from '@/server/servert';

export default function NewSamplePage() {
  const router = useRouter();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBLEConnect, setShowBLEConnect] = useState(false);
  const [showBLEModeSelect, setShowBLEModeSelect] = useState(false);
  const [bleMode, setBLEMode] = useState(null); // 'simulation' or 'real'
  const [createdSampleId, setCreatedSampleId] = useState(null);
  
  const [formData, setFormData] = useState({
    sample_identifier: '',
    sample_type: 'water',
    collection_datetime: new Date().toISOString().slice(0, 16),
    geolocation: '',
    latitude: '',
    longitude: '',
    ph: '',
    temperature: '',
    salinity: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.sample_identifier.trim()) {
      newErrors.sample_identifier = 'Sample ID is required';
    } else if (formData.sample_identifier.length < 3) {
      newErrors.sample_identifier = 'Sample ID must be at least 3 characters';
    }
    
    if (!formData.collection_datetime) {
      newErrors.collection_datetime = 'Collection date is required';
    } else if (new Date(formData.collection_datetime) > new Date()) {
      newErrors.collection_datetime = 'Date cannot be in the future';
    }
    
    if (formData.ph && (formData.ph < 0 || formData.ph > 14)) {
      newErrors.ph = 'pH must be between 0 and 14';
    }
    
    if (formData.temperature && formData.temperature < -100) {
      newErrors.temperature = 'Invalid temperature';
    }
    
    if (formData.latitude && (formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    
    if (formData.longitude && (formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleQRScanSuccess = (sampleData) => {
    setFormData({
      ...formData,
      sample_identifier: sampleData.sample_identifier || '',
      sample_type: sampleData.sample_type || formData.sample_type,
      geolocation: sampleData.geolocation || '',
    });
  };

  const handleBLEDataReceived = (bleData) => {
    setFormData({
      ...formData,
      temperature: bleData.temperature || formData.temperature,
      ph: bleData.ph || formData.ph,
      salinity: bleData.salinity || formData.salinity,
    });
    
    // Close BLE modal after data received
    setShowBLEConnect(false);
    toast.success('BLE data applied to form!');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    setUseCurrentLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          // Free reverse geocoding using OpenStreetMap Nominatim
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse`,
            {
              params: {
                lat,
                lon,
                format: 'json'
              },
              headers: {
                'Accept-Language': 'en'
              }
            }
          );

          const address = res.data.display_name || '';

          setFormData({
            ...formData,
            latitude: lat.toString(),
            longitude: lon.toString(),
            geolocation: address,
          });

          toast.success('Location captured!');
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          toast.error('Failed to get address from coordinates');
          setFormData({
            ...formData,
            latitude: lat.toString(),
            longitude: lon.toString(),
          });
        } finally {
          setUseCurrentLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get location');
        setUseCurrentLocation(false);
      }
    );
  };

  // Open BLE mode selection modal
  const handleBLEButtonClick = () => {
    setShowBLEModeSelect(true);
  };

  // Select BLE mode and open appropriate connection
  const selectBLEMode = (mode) => {
    setBLEMode(mode);
    setShowBLEModeSelect(false);
    
    if (mode === 'simulation') {
      // If sample already created, use simulation with sample ID
      if (createdSampleId) {
        setShowBLEConnect(true);
      } else {
        // Just update form data without sample ID
        setShowBLEConnect(true);
      }
    } else if (mode === 'real') {
      connectRealBLEDevice();
    }
  };

  // Connect to real BLE device using Web Bluetooth API
  const connectRealBLEDevice = async () => {
    if (!navigator.bluetooth) {
      toast.error('Bluetooth not supported on this browser. Use Chrome or Edge on desktop.');
      return;
    }

    try {
      toast.info('Requesting Bluetooth device...');
      
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'generic_access']
      });

      toast.success(`Connected to ${device.name || 'Unknown Device'}`);
      
      const server = await device.gatt.connect();
      
      // Here you would implement actual BLE communication
      // This is a placeholder for real BLE implementation
      toast.info('Real BLE device connected. Implement sensor reading logic here.');
      
    } catch (error) {
      console.error('BLE connection error:', error);
      toast.error('Failed to connect to BLE device');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${server}/samples`, formData, {
        withCredentials: true
      });
      
      const newSampleId = response.data.sample?.samples_id;
      // console.log(response)
      if (newSampleId) {
        setCreatedSampleId(newSampleId);
        toast.success('Sample added successfully!');
        
        // Ask if user wants to add sensor readings
        const addReadings = window.confirm(
          'Sample created! Would you like to add sensor readings via BLE device?'
        );
        
        if (addReadings) {
          setShowBLEModeSelect(true);
        } else {
          router.push('/dashboard/samples');
        }
      } else {
        toast.success('Sample added successfully!');
        router.push('/dashboard/samples');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to add sample');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.newSamplePage}>
      <h1 style={{color: '#fff'}}>Add New Sample</h1>

      <div className={styles.quickActions}>
        <button 
          onClick={() => setShowQRScanner(true)}
          className={styles.actionBtn}
          type="button"
        >
          📷 Scan QR/Barcode
        </button>
        <button 
          onClick={handleBLEButtonClick}
          className={styles.actionBtn}
          type="button"
        >
          📡 Connect BLE Device
        </button>
        <button 
          onClick={getCurrentLocation}
          disabled={useCurrentLocation}
          className={styles.actionBtn}
          type="button"
        >
          {useCurrentLocation ? '⏳ Getting Location...' : '📍 Use Current Location'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.group}>
            <label>Sample ID *</label>
            <input
              type="text"
              value={formData.sample_identifier}
              onChange={(e) => setFormData({...formData, sample_identifier: e.target.value})}
              required
              placeholder="e.g., SAMPLE-001"
              style={errors.sample_identifier ? { borderColor: '#ef4444' } : {}}
            />
            {errors.sample_identifier && (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>
                {errors.sample_identifier}
              </span>
            )}
          </div>
          <div className={styles.group}>
            <label>Sample Type *</label>
            <select
              value={formData.sample_type}
              onChange={(e) => setFormData({...formData, sample_type: e.target.value})}
            >
              <option value="water">Water</option>
              <option value="soil">Soil</option>
              <option value="plant">Plant</option>
              <option value="biological_fluid">Biological Fluid</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className={styles.group}>
          <label>Collection Date & Time *</label>
          <input
            type="datetime-local"
            value={formData.collection_datetime}
            onChange={(e) => setFormData({...formData, collection_datetime: e.target.value})}
            required
            style={errors.collection_datetime ? { borderColor: '#ef4444' } : {}}
          />
          {errors.collection_datetime && (
            <span style={{ color: '#ef4444', fontSize: '12px' }}>
              {errors.collection_datetime}
            </span>
          )}
        </div>

        <div className={styles.group}>
          <label>Location</label>
          <input
            type="text"
            value={formData.geolocation}
            onChange={(e) => setFormData({...formData, geolocation: e.target.value})}
            placeholder="e.g., Marine Research Center"
          />
        </div>

        <div className={styles.row}>
          <div className={styles.group}>
            <label>Latitude</label>
            <input
              type="number"
              step="0.000001"
              value={formData.latitude}
              onChange={(e) => setFormData({...formData, latitude: e.target.value})}
              placeholder="33.6844"
              style={errors.latitude ? { borderColor: '#ef4444' } : {}}
            />
          </div>
          <div className={styles.group}>
            <label>Longitude</label>
            <input
              type="number"
              step="0.000001"
              value={formData.longitude}
              onChange={(e) => setFormData({...formData, longitude: e.target.value})}
              placeholder="73.0479"
              style={errors.longitude ? { borderColor: '#ef4444' } : {}}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.group}>
            <label>pH Level</label>
            <input
              type="number"
              step="0.01"
              value={formData.ph}
              onChange={(e) => setFormData({...formData, ph: e.target.value})}
              placeholder="7.0"
              style={errors.ph ? { borderColor: '#ef4444' } : {}}
            />
          </div>
          <div className={styles.group}>
            <label>Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({...formData, temperature: e.target.value})}
              placeholder="25.0"
              style={errors.temperature ? { borderColor: '#ef4444' } : {}}
            />
          </div>
          <div className={styles.group}>
            <label>Salinity (ppt)</label>
            <input
              type="number"
              step="0.1"
              value={formData.salinity}
              onChange={(e) => setFormData({...formData, salinity: e.target.value})}
              placeholder="35.0"
            />
          </div>
        </div>

        <div className={styles.group}>
          <label>Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Additional observations..."
            rows="4"
          />
        </div>

        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={() => router.back()}
            className={styles.cancelBtn}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? '⏳ Saving...' : '✅ Add Sample'}
          </button>
        </div>
      </form>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner 
          onScanSuccess={handleQRScanSuccess}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* BLE Mode Selection Modal */}
      {showBLEModeSelect && (
        <div className={styles.modal}>
          <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h2>Select BLE Connection Mode</h2>
              <button 
                onClick={() => setShowBLEModeSelect(false)}
                className={styles.closeIconBtn}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px 0' }}>
              <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
                Choose how you want to connect to your BLE device:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button
                  onClick={() => selectBLEMode('simulation')}
                  className={styles.modeSelectBtn}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '32px' }}>🎮</span>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                        Simulation Mode
                      </h3>
                      <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
                        Test with simulated BLE devices and realistic sensor data. 
                        Perfect for testing and demonstrations.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => selectBLEMode('real')}
                  className={styles.modeSelectBtn}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '32px' }}>📡</span>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                        Real Device Mode
                      </h3>
                      <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
                        Connect to actual BLE devices using Web Bluetooth API. 
                        Requires Chrome or Edge browser.
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div style={{ 
                marginTop: '20px', 
                padding: '12px', 
                background: '#fef3c7', 
                borderRadius: '8px',
                fontSize: '13px',
                color: '#92400e'
              }}>
                <strong>💡 Tip:</strong> Use Simulation Mode for mobile testing and 
                Real Device Mode when you have physical BLE sensors.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BLE Connect Modal (Simulation Mode) */}
      {showBLEConnect && bleMode === 'simulation' && (
        <BLEDeviceConnect 
          sampleId={createdSampleId}
          onDataReceived={handleBLEDataReceived}
          onClose={() => {
            setShowBLEConnect(false);
            if (createdSampleId) {
              router.push('/dashboard/samples');
            }
          }}
        />
      )}
    </div>
  );
}