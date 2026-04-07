import { useState } from 'react'
import './App.css'

const fallbackApiKey = 'tQRoVFhUbocMX70xu1PGXWzDQRxbF4jF'

function maskApiKey(apiKey) {
  if (!apiKey) {
    return 'Not set'
  }

  if (apiKey.length <= 8) {
    return '********'
  }

  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

function formatLatLng(point) {
  if (!point || point.lat === undefined || point.lng === undefined) {
    return '-'
  }

  return `${point.lat}, ${point.lng}`
}

function compactLocation(location) {
  const parts = [
    location?.street,
    location?.adminArea5,
    location?.adminArea3,
    location?.adminArea1,
  ].filter(Boolean)

  const place = parts.length > 0 ? parts.join(', ') : 'Unknown location'
  return `${place} | ${formatLatLng(location?.displayLatLng)}`
}

function buildResponseRows(data) {
  const info = data?.info || {}
  const route = data?.route || {}
  const options = route.options || {}
  const locations = Array.isArray(route.locations) ? route.locations : []
  const legs = Array.isArray(route.legs) ? route.legs : []
  const maneuvers = Array.isArray(legs[0]?.maneuvers) ? legs[0].maneuvers : []

  const rows = [
    { field: 'info.statuscode', value: info.statuscode ?? '-' },
    { field: 'info.messages', value: (info.messages || []).join(' | ') || 'None' },
    { field: 'route.distance_miles', value: route.distance ?? '-' },
    { field: 'route.formattedTime', value: route.formattedTime ?? '-' },
    { field: 'route.time_seconds', value: route.time ?? '-' },
    { field: 'route.realTime_seconds', value: route.realTime ?? '-' },
    { field: 'route.routeType', value: options.routeType ?? '-' },
    { field: 'route.startLatLng', value: formatLatLng(locations[0]?.displayLatLng) },
    {
      field: 'route.endLatLng',
      value: formatLatLng(locations[locations.length > 0 ? locations.length - 1 : 0]?.displayLatLng),
    },
    { field: 'route.hasHighway', value: route.hasHighway ?? '-' },
    { field: 'route.hasTollRoad', value: route.hasTollRoad ?? '-' },
    { field: 'route.hasBridge', value: route.hasBridge ?? '-' },
    { field: 'route.hasTunnel', value: route.hasTunnel ?? '-' },
    { field: 'route.locations_count', value: locations.length },
    { field: 'route.maneuvers_count', value: maneuvers.length },
  ]

  locations.forEach((location, index) => {
    rows.push({
      field: `location[${index + 1}]`,
      value: compactLocation(location),
    })
  })

  maneuvers.forEach((maneuver, index) => {
    rows.push({
      field: `maneuver[${index + 1}]`,
      value: `${maneuver.directionName || 'Move'} | ${maneuver.distance ?? 0} mi | ${maneuver.formattedTime || '00:00:00'} | ${maneuver.narrative || '-'}`,
    })
  })

  return rows.map((row) => ({ field: row.field, value: String(row.value) }))
}

function App() {
  const [startLocation, setStartLocation] = useState('')
  const [destination, setDestination] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [requestRows, setRequestRows] = useState([])
  const [responseRows, setResponseRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [screenshotMode, setScreenshotMode] = useState(true)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const apiKey = import.meta.env.VITE_MAPQUEST_API_KEY || fallbackApiKey
    const maskedApiKey = maskApiKey(apiKey)
    const params = new URLSearchParams({
      key: apiKey,
      from: startLocation,
      to: destination,
      outFormat: 'json',
      ambiguities: 'ignore',
      routeType: 'fastest',
      doReverseGeocode: 'false',
      enhancedNarrative: 'false',
      avoidTimedConditions: 'false',
    })

    const requestUrl = `https://www.mapquestapi.com/directions/v2/route?${params.toString()}`
    const safeRequestUrl = requestUrl.replace(apiKey, maskedApiKey)

    const requestData = [
      { field: 'endpoint', value: 'https://www.mapquestapi.com/directions/v2/route' },
      { field: 'key', value: maskedApiKey },
      { field: 'from', value: startLocation },
      { field: 'to', value: destination },
      { field: 'outFormat', value: 'json' },
      { field: 'ambiguities', value: 'ignore' },
      { field: 'routeType', value: 'fastest' },
      { field: 'doReverseGeocode', value: 'false' },
      { field: 'enhancedNarrative', value: 'false' },
      { field: 'avoidTimedConditions', value: 'false' },
      { field: 'fullRequestUrl', value: safeRequestUrl },
    ]

    setIsLoading(true)
    setErrorMessage('')
    setRequestRows(requestData)
    setResponseRows([])
    setSummary(null)

    try {
      const response = await fetch(requestUrl)
      const data = await response.json()

      const outputRows = buildResponseRows(data)
      setResponseRows(outputRows)

      if (data.info?.statuscode !== 0) {
        const messages = (data.info?.messages || []).join(' | ') || 'MapQuest returned an error.'
        setErrorMessage(messages)
      }

      if (data.route?.distance !== undefined && data.route?.time !== undefined) {
        setSummary({
          distanceMiles: data.route.distance,
          duration: formatTime(data.route.time),
          narrative: data.route.formattedTime,
        })
      }
    } catch (error) {
      setErrorMessage('Unable to contact MapQuest API. Check your internet connection and API key.')
      setResponseRows([
        { field: 'response.error.name', value: error.name || 'Error' },
        { field: 'response.error.message', value: error.message || 'Unknown error' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={`app-shell ${screenshotMode ? 'screenshot-mode' : ''}`}>
      <header className="hero-panel">
        <p className="eyebrow">MapQuest API Integration</p>
        <h1>Route Planner Dashboard</h1>
        <p className="subtitle">
          Enter a starting location and destination to request route data, then review every
          request input and API output in table format.
        </p>
        <div className="toolbar">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setScreenshotMode((value) => !value)}
          >
            {screenshotMode ? 'Exit Screenshot Mode' : 'Enable Screenshot Mode'}
          </button>
          <p>Screenshot mode compresses spacing so both tables can be captured in one shot.</p>
        </div>
      </header>

      <section className="panel">
        <h2>Route Request Form</h2>
        <form className="route-form" onSubmit={handleSubmit}>
          <label>
            Starting Location
            <input
              type="text"
              value={startLocation}
              onChange={(event) => setStartLocation(event.target.value)}
              placeholder="e.g., Manila, PH"
              required
            />
          </label>

          <label>
            Destination
            <input
              type="text"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="e.g., Quezon City, PH"
              required
            />
          </label>

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Requesting Route...' : 'Get Route'}
          </button>
        </form>

        {summary && (
          <div className="summary">
            <div>
              <span>Distance</span>
              <strong>{summary.distanceMiles} mi</strong>
            </div>
            <div>
              <span>Estimated Time</span>
              <strong>{summary.duration}</strong>
            </div>
            <div>
              <span>Formatted Time</span>
              <strong>{summary.narrative}</strong>
            </div>
          </div>
        )}

        {errorMessage && <p className="error-banner">{errorMessage}</p>}
      </section>

      <div className="tables-grid">
        <section className="panel">
          <h2>API Request Inputs (Table)</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Input Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {requestRows.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="empty-cell">
                      Submit the form to show request inputs.
                    </td>
                  </tr>
                ) : (
                  requestRows.map((row) => (
                    <tr key={row.field}>
                      <td>{row.field}</td>
                      <td>{row.value}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <h2>API Response Outputs (Table)</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Output Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {responseRows.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="empty-cell">
                      API response fields will appear here after a request.
                    </td>
                  </tr>
                ) : (
                  responseRows.map((row, index) => (
                    <tr key={`${row.field}-${index}`}>
                      <td>{row.field}</td>
                      <td>{row.value}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
