# API Usage Guide - Solar & Satellite Simulators

## Overview

This guide provides practical examples for using the IoT Solar Farm and Satellite Imagery AI simulators integrated into the EcoBond Backend.

---

## Solar Farm IoT Simulator

### Data Structure

Each solar farm device generates readings containing:

- **output**: Current power generation in kW
- **efficiency**: Percentage of capacity being used (0-100%)
- **temperature**: Device temperature in Celsius
- **humidity**: Relative humidity percentage
- **status**: "online" or "offline"

### Endpoints

#### 1. Get All Solar Devices

```bash
curl http://localhost:5000/api/solar/devices
```

Returns list of all registered solar farm devices with their status.

#### 2. Get Current Readings from All Devices

```bash
curl http://localhost:5000/api/solar/readings
```

Obtains real-time energy output from all devices. Data simulates:

- Daily solar cycle (high at noon, low at dusk/dawn)
- Cloud cover variations (random fluctuations)
- Temperature variations

#### 3. Get Reading from Specific Device

```bash
curl http://localhost:5000/api/solar/devices/{deviceId}/reading
```

Example:

```bash
curl http://localhost:5000/api/solar/devices/SOLAR-001/reading
```

#### 4. Get Historical Data for a Device

```bash
curl "http://localhost:5000/api/solar/devices/{deviceId}/history?limit=100"
```

Example:

```bash
curl "http://localhost:5000/api/solar/devices/SOLAR-001/history?limit=50"
```

Retrieves up to 1000 historical readings (default returns 100).

#### 5. Get Device Statistics

```bash
curl http://localhost:5000/api/solar/statistics/{deviceId}
```

Example:

```bash
curl http://localhost:5000/api/solar/statistics/SOLAR-001
```

Returns statistics including:

- Average output
- Peak output (maxOutput)
- Minimum output
- Average efficiency

#### 6. Register New Solar Farm Device

```bash
curl -X POST http://localhost:5000/api/solar/devices \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "SOLAR-005",
    "farmName": "New Farm Name",
    "capacity": 500
  }'
```

All fields are required. Capacity is in kW.

#### 7. Toggle Device Status (Online/Offline)

```bash
curl -X PATCH http://localhost:5000/api/solar/devices/{deviceId}/status \
  -H "Content-Type: application/json" \
  -d '{
    "isOnline": false
  }'
```

Example:

```bash
curl -X PATCH http://localhost:5000/api/solar/devices/SOLAR-001/status \
  -H "Content-Type: application/json" \
  -d '{"isOnline": false}'
```

---

## Satellite Imagery AI Simulator

### Data Structure

Each satellite image analysis provides:

- **forestDensity**: Percentage of forest canopy (0-100%)
- **cloudCoverage**: Cloud obstruction percentage
- **confidence**: Analysis confidence based on cloud cover
- **NDVI**: Normalized Difference Vegetation Index (-1 to 1)
- **carbonSequestration**: Estimated CO2 storage in tons

### Endpoints

#### 1. Get Available Regions

```bash
curl http://localhost:5000/api/satellite/regions
```

Returns:

- List of available forest monitoring regions
- Count of captured images
- Total images processed

Default regions: Amazon Basin, Congo Basin, Southeast Asia, Boreal Forest

#### 2. Capture Satellite Image

```bash
curl -X POST http://localhost:5000/api/satellite/capture \
  -H "Content-Type: application/json" \
  -d '{
    "region": "Amazon Basin"
  }'
```

Captures a simulated satellite image. Region parameter is optional; if omitted, a random region is selected.

#### 3. Analyze Forest Density

```bash
curl "http://localhost:5000/api/satellite/analysis/forest-density?region={region}&limit=10"
```

Example:

```bash
curl "http://localhost:5000/api/satellite/analysis/forest-density?region=Amazon%20Basin&limit=5"
```

Query parameters:

- `region`: Forest region to analyze (optional)
- `limit`: Number of recent images to analyze (default: 10)

Returns average forest density and individual analyses.

#### 4. Detect Deforestation Trend

```bash
curl "http://localhost:5000/api/satellite/analysis/deforestation/{region}?days=30"
```

Example:

```bash
curl "http://localhost:5000/api/satellite/analysis/deforestation/Amazon%20Basin?days=30"
```

Analyzes vegetation changes over time. Returns:

- `deforestationDetected`: Boolean alert
- `analyses`: Recent trend data
- `overallTrend`: "reforestation", "deforestation", or "stable"

#### 5. Estimate Carbon Stock

```bash
curl http://localhost:5000/api/satellite/analysis/carbon/{region}
```

Example:

```bash
curl http://localhost:5000/api/satellite/analysis/carbon/Congo%20Basin
```

Provides carbon sequestration estimates:

- Per-hectare biomass (AGB)
- Total region carbon stock
- Equivalent CO2 tons

#### 6. Get NDVI Vegetation Trend

```bash
curl "http://localhost:5000/api/satellite/analysis/ndvi/{region}?limit=10"
```

Example:

```bash
curl "http://localhost:5000/api/satellite/analysis/ndvi/Southeast%20Asia?limit=5"
```

NDVI values:

- **> 0.6**: Dense vegetation
- **0.4-0.6**: Moderate vegetation
- **< 0.4**: Low vegetation

#### 7. Get Image Metadata

```bash
curl http://localhost:5000/api/satellite/metadata/{imageId}
```

Example:

```bash
curl http://localhost:5000/api/satellite/metadata/SAT-1771520823830-x0lgbn3rv
```

---

## Complete Workflow Example

### Scenario: Monitor Amazon Basin Deforestation

```bash
# 1. Capture several satellite images
curl -X POST http://localhost:5000/api/satellite/capture \
  -H "Content-Type: application/json" \
  -d '{"region":"Amazon Basin"}'

# Repeat 3-5 times to get multiple data points...

# 2. Analyze current forest density
curl "http://localhost:5000/api/satellite/analysis/forest-density?region=Amazon%20Basin"

# 3. Check for deforestation trends over 30 days
curl "http://localhost:5000/api/satellite/analysis/deforestation/Amazon%20Basin?days=30"

# 4. Estimate carbon stock
curl "http://localhost:5000/api/satellite/analysis/carbon/Amazon%20Basin"

# 5. Get vegetation health (NDVI)
curl "http://localhost:5000/api/satellite/analysis/ndvi/Amazon%20Basin"
```

### Scenario: Monitor Solar Farm Performance

```bash
# 1. Check all devices
curl http://localhost:5000/api/solar/devices

# 2. Get current power generation
curl http://localhost:5000/api/solar/readings

# 3. Get device-specific reading
curl http://localhost:5000/api/solar/devices/SOLAR-001/reading

# 4. Generate some data points (simulate time passing)
for i in {1..10}; do
  curl http://localhost:5000/api/solar/readings > /dev/null
  sleep 1
done

# 5. Analyze device statistics
curl http://localhost:5000/api/solar/statistics/SOLAR-001

# 6. View historical data
curl "http://localhost:5000/api/solar/devices/SOLAR-001/history?limit=100"

# 7. Toggle offline for maintenance
curl -X PATCH http://localhost:5000/api/solar/devices/SOLAR-001/status \
  -H "Content-Type: application/json" \
  -d '{"isOnline": false}'

# 8. Bring device back online
curl -X PATCH http://localhost:5000/api/solar/devices/SOLAR-001/status \
  -H "Content-Type: application/json" \
  -d '{"isOnline": true}'
```

---

## Data Simulation Details

### Solar Farm Simulator

- **Output Pattern**: Follows daily solar cycle with random cloud variations
- **History**: Keeps 1000 most recent readings per device
- **Temperature/Humidity**: Randomly generated on each reading
- **Default Devices**:
  - SOLAR-001: California Solar Farm (500 kW)
  - SOLAR-002: Texas Solar Farm (750 kW)
  - SOLAR-003: Arizona Solar Farm (600 kW)

### Satellite Imagery AI

- **Regions**: Amazon Basin, Congo Basin, Southeast Asia, Boreal Forest
- **Forest Density**: 60-90% baseline with cloud impact
- **Cloud Coverage**: 0-50% random variance
- **NDVI**: 0.5-0.8 for healthy forests
- **Carbon Estimation**: Based on forest density (up to 300 tons/hectare biomass)
- **Analysis Cache**: Maintains last 1000 image analyses

---

## Response Format

All endpoints return JSON responses:

### Success Response

```json
{
  "success": true,
  "data": {
    /* endpoint-specific data */
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message describing the issue"
}
```

---

## HTTP Status Codes

- **200**: Success
- **201**: Created (device registration)
- **400**: Bad request (missing/invalid parameters)
- **404**: Not found (device/region/image not found)
- **500**: Server error

---

## Tips for Testing

1. **Generate multiple readings** before analyzing statistics
2. **Capture multiple satellite images** in same region for trend analysis
3. **Use `limit` parameter** to control response size
4. **Check logs** in `logs/combined.log` for debugging
5. **Use `jq`** to parse JSON responses:
   ```bash
   curl -s http://localhost:5000/api/solar/readings | jq '.data[0]'
   ```
